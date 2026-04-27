#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_ROOT="${IGNISPROMPT_GOLDEN_EVIDENCE_DIR:-$ROOT_DIR/local-evidence/golden-legal-v0.3/$(date -u +%Y%m%dT%H%M%SZ)}"
GGUF_RUNNER_BIN="${IGNISPROMPT_GGUF_RUNNER_BIN:-$ROOT_DIR/scripts/ollama-gguf-runner.sh}"
GGUF_MAX_TOKENS="${IGNISPROMPT_GGUF_MAX_TOKENS:-96}"
OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"
OLLAMA_NO_CLOUD="${OLLAMA_NO_CLOUD:-true}"
MODEL_PATH="${IGNISPROMPT_GGUF_MODEL_PATH:-$ROOT_DIR/models/qwen2.5-0.5b-instruct-q4_k_m.gguf}"
LEGAL_MODEL_DIR="${IGNISPROMPT_GOLDEN_MODEL_DIR:-$ROOT_DIR/config/models}"
BASE_PORT="${IGNISPROMPT_GOLDEN_BASE_PORT:-8871}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

wait_for_health() {
  local base_url="$1"
  local attempt

  for attempt in $(seq 1 60); do
    if curl -fsS "$base_url/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "daemon did not become healthy at $base_url" >&2
  return 1
}

run_json_post() {
  local url="$1"
  local request_file="$2"
  local output_file="$3"
  local latency_file="${4:-}"

  if [ -n "$latency_file" ]; then
    curl -fsS -o "$output_file" -w '%{time_total}\n' -X POST "$url" \
      -H 'content-type: application/json' \
      --data-binary "@$request_file" >"$latency_file"
  else
    curl -fsS -X POST "$url" \
      -H 'content-type: application/json' \
      --data-binary "@$request_file" >"$output_file"
  fi
}

write_summary_entry() {
  local case_name="$1"
  local status="$2"
  local note="$3"

  jq -n \
    --arg case "$case_name" \
    --arg status "$status" \
    --arg note "$note" \
    '{case: $case, status: $status, note: $note}' >>"$EVIDENCE_ROOT/summary.jsonl"
}

start_daemon() {
  local label="$1"
  local port="$2"
  local model_dir="$3"
  local audit_log="$4"
  shift 4

  local case_dir="$EVIDENCE_ROOT/$label"
  local log_file="$case_dir/daemon.log"

  mkdir -p "$case_dir"

  IGNISPROMPT_GGUF_RUNNER_BIN="$GGUF_RUNNER_BIN" \
  IGNISPROMPT_GGUF_MAX_TOKENS="$GGUF_MAX_TOKENS" \
  OLLAMA_HOST="$OLLAMA_HOST" \
  OLLAMA_NO_CLOUD="$OLLAMA_NO_CLOUD" \
  cargo run -p ignispromptd --features gguf-runner-spike -- \
    --bind "127.0.0.1:$port" \
    --model-dir "$model_dir" \
    --audit-log "$audit_log" \
    --local-only \
    "$@" >"$log_file" 2>&1 &

  DAEMON_PID=$!
  DAEMON_URL="http://127.0.0.1:$port"
  wait_for_health "$DAEMON_URL"
}

stop_daemon() {
  if [ -n "${DAEMON_PID:-}" ] && kill -0 "$DAEMON_PID" >/dev/null 2>&1; then
    kill "$DAEMON_PID" >/dev/null 2>&1 || true
    wait "$DAEMON_PID" >/dev/null 2>&1 || true
  fi
  DAEMON_PID=""
  DAEMON_URL=""
}

run_success_case() {
  local label="01-tier3-success"
  local case_dir="$EVIDENCE_ROOT/$label"
  local audit_log="$case_dir/audit.jsonl"

  start_daemon "$label" "$((BASE_PORT + 0))" "$LEGAL_MODEL_DIR" "$audit_log"
  run_json_post "$DAEMON_URL/v1/route/explain" "$ROOT_DIR/tests/golden-legal/smoke-legal-request.json" "$case_dir/route_explain.json" "$case_dir/route_explain.latency_seconds"
  run_json_post "$DAEMON_URL/v1/chat/completions" "$ROOT_DIR/tests/golden-legal/smoke-legal-request.json" "$case_dir/chat_completion.json" "$case_dir/chat_completion.latency_seconds"
  curl -fsS "$DAEMON_URL/v1/audit/events" >"$case_dir/audit_events.json"

  jq -e '.decision.tier == "TIER_3" and .decision.route_code == "DOMAIN_MODEL_SELECTED"' "$case_dir/route_explain.json" >/dev/null
  jq -e '(.choices[0].message.content | length) > 40' "$case_dir/chat_completion.json" >/dev/null
  jq -e '(.choices[0].message.content | contains("StubLegalRunner handled")) | not' "$case_dir/chat_completion.json" >/dev/null
  jq -e '(.choices[0].message.content | fromjson | type) == "object"' "$case_dir/chat_completion.json" >/dev/null
  jq -e '.local_output.legal_json.raw_model_output | length > 0' "$case_dir/chat_completion.json" >/dev/null
  jq -e 'length >= 2' "$case_dir/audit_events.json" >/dev/null

  write_summary_entry "$label" "pass" "real GGUF completion returned through Tier 3 legal route"
  stop_daemon
}

run_unavailable_case() {
  local label="02-unavailable-model"
  local case_dir="$EVIDENCE_ROOT/$label"
  local audit_log="$case_dir/audit.jsonl"

  start_daemon "$label" "$((BASE_PORT + 1))" "$LEGAL_MODEL_DIR" "$audit_log" --force-ram-pressure
  run_json_post "$DAEMON_URL/v1/route/explain" "$ROOT_DIR/tests/golden-legal/unavailable-model-request.json" "$case_dir/route_explain.json" "$case_dir/route_explain.latency_seconds"
  run_json_post "$DAEMON_URL/v1/chat/completions" "$ROOT_DIR/tests/golden-legal/unavailable-model-request.json" "$case_dir/chat_completion.json" "$case_dir/chat_completion.latency_seconds"
  curl -fsS "$DAEMON_URL/v1/audit/events" >"$case_dir/audit_events.json"

  jq -e '.decision.route_code == "LOCAL_MODEL_UNAVAILABLE_RAM_PRESSURE"' "$case_dir/route_explain.json" >/dev/null
  jq -e '.route.route_code == "LOCAL_MODEL_UNAVAILABLE_RAM_PRESSURE"' "$case_dir/chat_completion.json" >/dev/null
  jq -e '.explanation | contains("fails closed")' "$case_dir/route_explain.json" >/dev/null

  write_summary_entry "$label" "pass" "simulated local model pressure fails closed without cloud fallback"
  stop_daemon
}

run_no_cloud_case() {
  local label="03-no-cloud-without-consent"
  local case_dir="$EVIDENCE_ROOT/$label"
  local audit_log="$case_dir/audit.jsonl"
  local empty_model_dir="$TMP_ROOT/empty-model-dir"

  mkdir -p "$empty_model_dir"
  start_daemon "$label" "$((BASE_PORT + 2))" "$empty_model_dir" "$audit_log"
  run_json_post "$DAEMON_URL/v1/route/explain" "$ROOT_DIR/tests/golden-legal/no-cloud-without-consent-request.json" "$case_dir/route_explain.json" "$case_dir/route_explain.latency_seconds"
  run_json_post "$DAEMON_URL/v1/chat/completions" "$ROOT_DIR/tests/golden-legal/no-cloud-without-consent-request.json" "$case_dir/chat_completion.json" "$case_dir/chat_completion.latency_seconds"
  curl -fsS "$DAEMON_URL/v1/audit/events" >"$case_dir/audit_events.json"

  jq -e '.decision.route_code == "LEGAL_MODEL_NOT_INSTALLED"' "$case_dir/route_explain.json" >/dev/null
  jq -e '.decision.cloud_allowed == false and .decision.data_left_device == false' "$case_dir/route_explain.json" >/dev/null
  jq -e '.explanation | contains("fails closed")' "$case_dir/route_explain.json" >/dev/null

  write_summary_entry "$label" "pass" "no installed legal model still fails closed under local-only policy"
  stop_daemon
}

run_adversarial_case() {
  local label="04-adversarial-instruction"
  local case_dir="$EVIDENCE_ROOT/$label"
  local audit_log="$case_dir/audit.jsonl"

  start_daemon "$label" "$((BASE_PORT + 3))" "$LEGAL_MODEL_DIR" "$audit_log"
  run_json_post "$DAEMON_URL/v1/route/explain" "$ROOT_DIR/tests/golden-legal/adversarial-contract-instruction.json" "$case_dir/route_explain.json" "$case_dir/route_explain.latency_seconds"
  curl -fsS "$DAEMON_URL/v1/audit/events" >"$case_dir/audit_events.json"

  jq -e '(.warnings | length) >= 1' "$case_dir/route_explain.json" >/dev/null
  jq -e '.warnings[0] | contains("treated as untrusted content")' "$case_dir/route_explain.json" >/dev/null
  jq -e 'length >= 1' "$case_dir/audit_events.json" >/dev/null

  write_summary_entry "$label" "pass" "adversarial document instruction was flagged and ignored"
  stop_daemon
}

run_explanation_case() {
  local label="05-explanation-quality"
  local case_dir="$EVIDENCE_ROOT/$label"
  local audit_log="$case_dir/audit.jsonl"

  start_daemon "$label" "$((BASE_PORT + 4))" "$LEGAL_MODEL_DIR" "$audit_log"
  run_json_post "$DAEMON_URL/v1/route/explain" "$ROOT_DIR/tests/golden-legal/explanation-quality-request.json" "$case_dir/route_explain.json" "$case_dir/route_explain.latency_seconds"
  curl -fsS "$DAEMON_URL/v1/audit/events" >"$case_dir/audit_events.json"

  jq -e '.decision.tier == "TIER_3"' "$case_dir/route_explain.json" >/dev/null
  jq -e '(.explanation | length) > 120' "$case_dir/route_explain.json" >/dev/null
  jq -e '.explanation | contains("routed to Tier 3") and contains("No cloud route was considered")' "$case_dir/route_explain.json" >/dev/null

  write_summary_entry "$label" "pass" "explanation remained human-readable and policy-specific"
  stop_daemon
}

require_cmd cargo
require_cmd curl
require_cmd jq

[ -x "$GGUF_RUNNER_BIN" ] || {
  echo "GGUF runner wrapper is not executable: $GGUF_RUNNER_BIN" >&2
  exit 1
}

[ -f "$MODEL_PATH" ] || {
  echo "local GGUF model is missing: $MODEL_PATH" >&2
  exit 1
}

curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1 || {
  echo "local Ollama server is not reachable at $OLLAMA_HOST" >&2
  exit 1
}

mkdir -p "$EVIDENCE_ROOT"
: >"$EVIDENCE_ROOT/summary.jsonl"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-golden-XXXXXX")"
DAEMON_PID=""
DAEMON_URL=""

cleanup() {
  stop_daemon
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

run_success_case
run_unavailable_case
run_no_cloud_case
run_adversarial_case
run_explanation_case

echo "Saved Golden Legal v0.3 evidence to $EVIDENCE_ROOT"
echo "[OK] 5 Golden Legal v0.3 cases passed"
