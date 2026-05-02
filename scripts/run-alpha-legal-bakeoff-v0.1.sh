#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GOLDEN_SCRIPT="$ROOT_DIR/scripts/run-golden-legal-v0.3.sh"
GGUF_RUNNER_BIN="${IGNISPROMPT_GGUF_RUNNER_BIN:-$ROOT_DIR/scripts/ollama-gguf-runner.sh}"
OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"
OLLAMA_NO_CLOUD="${OLLAMA_NO_CLOUD:-true}"
EVIDENCE_ROOT="${IGNISPROMPT_BAKEOFF_EVIDENCE_DIR:-$ROOT_DIR/local-evidence/alpha-legal-bakeoff-v0.1/$(date -u +%Y%m%dT%H%M%SZ)}"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-bakeoff-XXXXXX")"
SUMMARY_JSONL="$EVIDENCE_ROOT/summary.jsonl"
SUMMARY_MARKDOWN="$EVIDENCE_ROOT/summary.md"

BASELINE_MODEL_PATH="${IGNISPROMPT_QWEN_0_5B_MODEL_PATH:-$ROOT_DIR/models/qwen2.5-0.5b-instruct-q4_k_m.gguf}"
QWEN_7B_MODEL_PATH="${IGNISPROMPT_QWEN_7B_MODEL_PATH:-$ROOT_DIR/models/qwen2.5-7b-instruct-q4_k_m.gguf}"
SAUL_7B_MODEL_PATH="${IGNISPROMPT_SAUL_7B_MODEL_PATH:-$ROOT_DIR/models/saul-instruct-v1.q4_k_m.gguf}"
PHI_SMALL_MODEL_PATH="${IGNISPROMPT_PHI_SMALL_MODEL_PATH:-$ROOT_DIR/models/Phi-3.5-mini-instruct.q5_k_m.gguf}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

file_size_bytes() {
  local path="$1"

  if stat -f%z "$path" >/dev/null 2>&1; then
    stat -f%z "$path"
  else
    stat -c%s "$path"
  fi
}

system_total_ram_bytes() {
  if sysctl -n hw.memsize >/dev/null 2>&1; then
    sysctl -n hw.memsize
    return 0
  fi

  if [ -r /proc/meminfo ]; then
    awk '/MemTotal:/ { print $2 * 1024 }' /proc/meminfo
    return 0
  fi

  echo ""
}

system_free_disk_kb() {
  df -Pk "$ROOT_DIR" | awk 'NR == 2 { print $4 }'
}

append_summary_json() {
  local result_file="$1"
  cat "$result_file" >>"$SUMMARY_JSONL"
  printf '\n' >>"$SUMMARY_JSONL"
}

append_summary_markdown() {
  local candidate_id="$1"
  local status="$2"
  local latency="$3"
  local note="$4"
  local evidence_dir="$5"

  printf '| `%s` | %s | %s | %s | `%s` |\n' \
    "$candidate_id" \
    "$status" \
    "$latency" \
    "$note" \
    "$evidence_dir" >>"$SUMMARY_MARKDOWN"
}

write_candidate_manifest() {
  local manifest_path="$1"
  local model_id="$2"
  local display_name="$3"
  local quantization="$4"
  local context_window="$5"
  local local_path="$6"
  local sha256_value="$7"
  local version="$8"
  local source="$9"
  local prompt_pack="${10}"
  local response_format="${11}"

  jq -n \
    --arg model_id "$model_id" \
    --arg display_name "$display_name" \
    --arg quantization "$quantization" \
    --argjson context_window "$context_window" \
    --arg local_path "$local_path" \
    --arg sha256_value "$sha256_value" \
    --arg version "$version" \
    --arg source "$source" \
    --arg prompt_pack "$prompt_pack" \
    --arg response_format "$response_format" \
    '{
      modelId: $model_id,
      displayName: $display_name,
      tier: 3,
      domains: ["legal", "contracts", "compliance"],
      format: "gguf",
      quantization: $quantization,
      contextWindow: $context_window,
      localPath: $local_path,
      promptPack: $prompt_pack,
      responseFormat: $response_format,
      sha256: $sha256_value,
      version: $version,
      installed: true,
      source: $source
    }' >"$manifest_path"
}

record_skip() {
  local candidate_dir="$1"
  local candidate_id="$2"
  local display_name="$3"
  local license="$4"
  local source_url="$5"
  local model_path="$6"
  local note="$7"

  local result_file="$candidate_dir/result.json"
  mkdir -p "$candidate_dir"

  jq -n \
    --arg candidate_id "$candidate_id" \
    --arg display_name "$display_name" \
    --arg license "$license" \
    --arg source_url "$source_url" \
    --arg model_path "$model_path" \
    --arg note "$note" \
    --arg evidence_dir "$candidate_dir" \
    '{
      candidate_id: $candidate_id,
      display_name: $display_name,
      status: "skipped",
      license: $license,
      source_url: $source_url,
      model_path: $model_path,
      note: $note,
      evidence_dir: $evidence_dir
    }' >"$result_file"

  append_summary_json "$result_file"
  append_summary_markdown "$candidate_id" "skipped" "n/a" "$note" "$candidate_dir"
}

record_fail() {
  local candidate_dir="$1"
  local candidate_id="$2"
  local display_name="$3"
  local license="$4"
  local source_url="$5"
  local model_path="$6"
  local note="$7"
  local evidence_dir="$8"

  local result_file="$candidate_dir/result.json"
  mkdir -p "$candidate_dir"

  jq -n \
    --arg candidate_id "$candidate_id" \
    --arg display_name "$display_name" \
    --arg license "$license" \
    --arg source_url "$source_url" \
    --arg model_path "$model_path" \
    --arg note "$note" \
    --arg evidence_dir "$evidence_dir" \
    '{
      candidate_id: $candidate_id,
      display_name: $display_name,
      status: "fail",
      license: $license,
      source_url: $source_url,
      model_path: $model_path,
      note: $note,
      evidence_dir: $evidence_dir
    }' >"$result_file"

  append_summary_json "$result_file"
  append_summary_markdown "$candidate_id" "fail" "n/a" "$note" "$evidence_dir"
}

record_pass() {
  local candidate_dir="$1"
  local candidate_id="$2"
  local display_name="$3"
  local license="$4"
  local source_url="$5"
  local model_path="$6"
  local file_size="$7"
  local sha256_value="$8"
  local note="$9"
  local run_dir="${10}"
  local suite_elapsed_seconds="${11}"

  local success_completion_latency
  local success_route_latency
  local explanation_latency
  local explanation_length
  local completion_excerpt
  local adversarial_warning
  local legal_json_status
  local legal_json_source
  local legal_json_schema_valid
  local route_code
  local unavailable_route_code
  local no_cloud_route_code
  local pass_count
  local case_count

  success_completion_latency="$(tr -d '\n' <"$run_dir/01-tier3-success/chat_completion.latency_seconds")"
  success_route_latency="$(tr -d '\n' <"$run_dir/01-tier3-success/route_explain.latency_seconds")"
  explanation_latency="$(tr -d '\n' <"$run_dir/05-explanation-quality/route_explain.latency_seconds")"
  explanation_length="$(jq -r '.explanation | length' "$run_dir/05-explanation-quality/route_explain.json")"
  completion_excerpt="$(jq -r '.choices[0].message.content | gsub("\\s+"; " ") | .[0:220]' "$run_dir/01-tier3-success/chat_completion.json")"
  adversarial_warning="$(jq -r '.warnings[0]' "$run_dir/04-adversarial-instruction/route_explain.json")"
  legal_json_status="$(jq -r '.local_output.legal_json.status // "missing"' "$run_dir/01-tier3-success/chat_completion.json")"
  legal_json_source="$(jq -r '.local_output.legal_json.source // "missing"' "$run_dir/01-tier3-success/chat_completion.json")"
  legal_json_schema_valid="$(jq -r '.local_output.legal_json.schema_valid // false' "$run_dir/01-tier3-success/chat_completion.json")"
  route_code="$(jq -r '.decision.route_code' "$run_dir/01-tier3-success/route_explain.json")"
  unavailable_route_code="$(jq -r '.decision.route_code' "$run_dir/02-unavailable-model/route_explain.json")"
  no_cloud_route_code="$(jq -r '.decision.route_code' "$run_dir/03-no-cloud-without-consent/route_explain.json")"
  pass_count="$(jq -s 'map(select(.status == "pass")) | length' "$run_dir/summary.jsonl")"
  case_count="$(jq -s 'length' "$run_dir/summary.jsonl")"

  jq -n \
    --arg candidate_id "$candidate_id" \
    --arg display_name "$display_name" \
    --arg license "$license" \
    --arg source_url "$source_url" \
    --arg model_path "$model_path" \
    --argjson file_size_bytes "$file_size" \
    --arg sha256_value "$sha256_value" \
    --argjson suite_elapsed_seconds "$suite_elapsed_seconds" \
    --argjson success_completion_latency_seconds "$success_completion_latency" \
    --argjson success_route_latency_seconds "$success_route_latency" \
    --argjson explanation_latency_seconds "$explanation_latency" \
    --argjson explanation_length "$explanation_length" \
    --arg completion_excerpt "$completion_excerpt" \
    --arg adversarial_warning "$adversarial_warning" \
    --arg legal_json_status "$legal_json_status" \
    --arg legal_json_source "$legal_json_source" \
    --argjson legal_json_schema_valid "$legal_json_schema_valid" \
    --arg route_code "$route_code" \
    --arg unavailable_route_code "$unavailable_route_code" \
    --arg no_cloud_route_code "$no_cloud_route_code" \
    --argjson pass_count "$pass_count" \
    --argjson case_count "$case_count" \
    --arg note "$note" \
    --arg evidence_dir "$run_dir" \
    '{
      candidate_id: $candidate_id,
      display_name: $display_name,
      status: "pass",
      license: $license,
      source_url: $source_url,
      model_path: $model_path,
      file_size_bytes: $file_size_bytes,
      sha256: $sha256_value,
      suite_elapsed_seconds: $suite_elapsed_seconds,
      success_completion_latency_seconds: $success_completion_latency_seconds,
      success_route_latency_seconds: $success_route_latency_seconds,
      explanation_latency_seconds: $explanation_latency_seconds,
      explanation_length: $explanation_length,
      legal_json_status: $legal_json_status,
      legal_json_source: $legal_json_source,
      legal_json_schema_valid: $legal_json_schema_valid,
      route_correctness: ($route_code == "DOMAIN_MODEL_SELECTED"),
      explanation_quality: ($explanation_length > 120),
      json_schema_reliability: ($legal_json_status == "ok" and $legal_json_schema_valid == true),
      adversarial_handling: ($adversarial_warning | contains("treated as untrusted content")),
      unavailable_model_case: ($unavailable_route_code == "LOCAL_MODEL_UNAVAILABLE_RAM_PRESSURE"),
      no_cloud_case: ($no_cloud_route_code == "LEGAL_MODEL_NOT_INSTALLED"),
      completion_excerpt: $completion_excerpt,
      note: $note,
      evidence_dir: $evidence_dir
    }' >"$candidate_dir/result.json"

  append_summary_json "$candidate_dir/result.json"
  append_summary_markdown "$candidate_id" "pass" "${success_completion_latency}s" "$note" "$run_dir"
}

run_candidate() {
  local ordinal="$1"
  local slug="$2"
  local candidate_id="$3"
  local display_name="$4"
  local quantization="$5"
  local context_window="$6"
  local model_path="$7"
  local license="$8"
  local source_url="$9"
  local note="${10}"
  local skip_note="${11}"
  local prompt_pack="${12}"
  local response_format="${13}"

  local candidate_dir="$EVIDENCE_ROOT/${ordinal}-${slug}"
  local run_dir="$candidate_dir/golden-legal-v0.3"
  local manifest_dir="$TMP_ROOT/${slug}-model-dir"
  local manifest_path="$manifest_dir/${slug}.json"
  local sha256_value
  local file_size
  local start_seconds
  local end_seconds
  local suite_elapsed_seconds

  mkdir -p "$candidate_dir"

  if [ ! -f "$model_path" ]; then
    record_skip "$candidate_dir" "$candidate_id" "$display_name" "$license" "$source_url" "$model_path" "$skip_note"
    return 0
  fi

  mkdir -p "$manifest_dir"
  sha256_value="$(shasum -a 256 "$model_path" | awk '{print $1}')"
  file_size="$(file_size_bytes "$model_path")"
  write_candidate_manifest "$manifest_path" "$candidate_id" "$display_name" "$quantization" "$context_window" "$model_path" "$sha256_value" "$slug" "local-gguf" "$prompt_pack" "$response_format"

  start_seconds="$(date +%s)"
  if IGNISPROMPT_GGUF_RUNNER_BIN="$GGUF_RUNNER_BIN" \
    IGNISPROMPT_GGUF_MODEL_PATH="$model_path" \
    IGNISPROMPT_GOLDEN_MODEL_DIR="$manifest_dir" \
    IGNISPROMPT_GOLDEN_EVIDENCE_DIR="$run_dir" \
    OLLAMA_HOST="$OLLAMA_HOST" \
    OLLAMA_NO_CLOUD="$OLLAMA_NO_CLOUD" \
    "$GOLDEN_SCRIPT"; then
    end_seconds="$(date +%s)"
    suite_elapsed_seconds="$((end_seconds - start_seconds))"

    record_pass \
      "$candidate_dir" \
      "$candidate_id" \
      "$display_name" \
      "$license" \
      "$source_url" \
      "$model_path" \
      "$file_size" \
      "$sha256_value" \
      "$note" \
      "$run_dir" \
      "$suite_elapsed_seconds"
  else
    record_fail \
      "$candidate_dir" \
      "$candidate_id" \
      "$display_name" \
      "$license" \
      "$source_url" \
      "$model_path" \
      "Golden Legal subset failed for this candidate. Inspect the saved evidence bundle for the failing case." \
      "$run_dir"
  fi
}

require_cmd cargo
require_cmd curl
require_cmd jq
require_cmd shasum

[ -x "$GGUF_RUNNER_BIN" ] || {
  echo "GGUF runner wrapper is not executable: $GGUF_RUNNER_BIN" >&2
  exit 1
}

[ -x "$GOLDEN_SCRIPT" ] || {
  echo "golden runner is not executable: $GOLDEN_SCRIPT" >&2
  exit 1
}

curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1 || {
  echo "local Ollama server is not reachable at $OLLAMA_HOST" >&2
  exit 1
}

mkdir -p "$EVIDENCE_ROOT"
: >"$SUMMARY_JSONL"

cat >"$SUMMARY_MARKDOWN" <<EOF
# Alpha Legal Model Bakeoff v0.1

- Generated at: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Evidence root: \`$EVIDENCE_ROOT\`
- Ollama host: \`$OLLAMA_HOST\`
- Local-only hint: \`OLLAMA_NO_CLOUD=$OLLAMA_NO_CLOUD\`
- System RAM bytes: \`$(system_total_ram_bytes)\`
- Free disk KB: \`$(system_free_disk_kb)\`

| Candidate | Status | Tier 3 completion latency | Note | Evidence |
| --- | --- | --- | --- | --- |
EOF

run_candidate \
  "01" \
  "qwen2_5-0_5b-instruct-q4_k_m" \
  "legal-qwen2.5-0.5b-instruct-q4-k-m-local" \
  "Qwen2.5 0.5B Instruct Q4_K_M Local Legal Adapter" \
  "q4_k_m" \
  "8192" \
  "$BASELINE_MODEL_PATH" \
  "apache-2.0" \
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF" \
  "Pipe baseline for the current local legal path." \
  "baseline model is missing at $BASELINE_MODEL_PATH." \
  "legal-contract-review-compact-v0.1.md" \
  "schema"

run_candidate \
  "02" \
  "qwen2_5-7b-instruct-q4_k_m" \
  "legal-qwen2.5-7b-instruct-q4-k-m-local" \
  "Qwen2.5 7B Instruct Q4_K_M Local Legal Adapter" \
  "q4_k_m" \
  "32768" \
  "$QWEN_7B_MODEL_PATH" \
  "apache-2.0" \
  "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF" \
  "Larger general instruct candidate for the alpha legal path." \
  "candidate file is missing at $QWEN_7B_MODEL_PATH. Official Qwen2.5 7B GGUF lists Q4_K_M at 4.68 GB, which is marginal on this 8 GB host, so this candidate was not auto-downloaded." \
  "legal-contract-review-v0.1.md" \
  "schema"

run_candidate \
  "03" \
  "saul-7b-instruct-q4_k_m" \
  "legal-saul-7b-instruct-q4-k-m-local" \
  "Saul 7B Instruct Q4_K_M Local Legal Adapter" \
  "q4_k_m" \
  "4096" \
  "$SAUL_7B_MODEL_PATH" \
  "mit" \
  "https://huggingface.co/koesn/Saul-Instruct-v1-GGUF" \
  "Domain-specific legal candidate when a reviewed GGUF conversion is available locally." \
  "candidate file is missing at $SAUL_7B_MODEL_PATH. The upstream Saul instruct model is MIT-licensed, but the available GGUF path here is a third-party conversion and its Q4_K_M file is 4.37 GB, so this candidate was left skipped until a reviewed local copy is staged." \
  "legal-contract-review-v0.1.md" \
  "schema"

run_candidate \
  "04" \
  "phi-3_5-mini-instruct-q5_k_m" \
  "legal-phi-3.5-mini-instruct-q5-k-m-local" \
  "Phi-3.5 Mini Instruct Q5_K_M Local Legal Adapter" \
  "q5_k_m" \
  "131072" \
  "$PHI_SMALL_MODEL_PATH" \
  "mit" \
  "https://huggingface.co/AI-Engine/Phi-3.5-mini-instruct-GGUF" \
  "Smaller fallback candidate chosen because the selected public GGUF repo exposes a 2.82 GB Q5_K_M quant." \
  "candidate file is missing at $PHI_SMALL_MODEL_PATH. The selected public GGUF repo exposes a 2.82 GB Q5_K_M quant, so this candidate can be added locally for a second bakeoff pass on this host." \
  "legal-contract-review-compact-v0.1.md" \
  "schema"

echo "Saved alpha legal model bakeoff evidence to $EVIDENCE_ROOT"
echo "Summary files:"
echo "  - $SUMMARY_JSONL"
echo "  - $SUMMARY_MARKDOWN"

jq -s 'map(select(.status == "pass")) | length > 0' "$SUMMARY_JSONL" >/dev/null
