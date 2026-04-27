#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_ROOT="${IGNISPROMPT_DEMO_EVIDENCE_DIR:-$ROOT_DIR/local-evidence/demo-local-legal-review/$(date -u +%Y%m%dT%H%M%SZ)}"
GGUF_RUNNER_BIN="${IGNISPROMPT_GGUF_RUNNER_BIN:-$ROOT_DIR/scripts/ollama-gguf-runner.sh}"
GGUF_MAX_TOKENS="${IGNISPROMPT_GGUF_MAX_TOKENS:-96}"
OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"
OLLAMA_NO_CLOUD="${OLLAMA_NO_CLOUD:-true}"
MODEL_PATH="${IGNISPROMPT_GGUF_MODEL_PATH:-$ROOT_DIR/models/qwen2.5-0.5b-instruct-q4_k_m.gguf}"
LEGAL_MODEL_DIR="${IGNISPROMPT_DEMO_MODEL_DIR:-$ROOT_DIR/config/models}"
REQUEST_FILE="${IGNISPROMPT_DEMO_REQUEST_FILE:-$ROOT_DIR/tests/golden-legal/smoke-legal-request.json}"
DEMO_PORT="${IGNISPROMPT_DEMO_PORT:-8886}"

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

start_daemon() {
  local audit_log="$1"
  local log_file="$2"

  IGNISPROMPT_GGUF_RUNNER_BIN="$GGUF_RUNNER_BIN" \
  IGNISPROMPT_GGUF_MAX_TOKENS="$GGUF_MAX_TOKENS" \
  OLLAMA_HOST="$OLLAMA_HOST" \
  OLLAMA_NO_CLOUD="$OLLAMA_NO_CLOUD" \
  cargo run -p ignispromptd --features gguf-runner-spike -- \
    --bind "127.0.0.1:$DEMO_PORT" \
    --model-dir "$LEGAL_MODEL_DIR" \
    --audit-log "$audit_log" \
    --local-only >"$log_file" 2>&1 &

  DAEMON_PID=$!
  BASE_URL="http://127.0.0.1:$DEMO_PORT"
  wait_for_health "$BASE_URL"
}

stop_daemon() {
  if [ -n "${DAEMON_PID:-}" ] && kill -0 "$DAEMON_PID" >/dev/null 2>&1; then
    kill "$DAEMON_PID" >/dev/null 2>&1 || true
    wait "$DAEMON_PID" >/dev/null 2>&1 || true
  fi
  DAEMON_PID=""
  BASE_URL=""
}

run_json_post() {
  local url="$1"
  local request_file="$2"
  local output_file="$3"
  local latency_file="$4"

  curl -fsS -o "$output_file" -w '%{time_total}\n' -X POST "$url" \
    -H 'content-type: application/json' \
    --data-binary "@$request_file" >"$latency_file"
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

[ -f "$REQUEST_FILE" ] || {
  echo "demo request file is missing: $REQUEST_FILE" >&2
  exit 1
}

curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1 || {
  echo "local Ollama server is not reachable at $OLLAMA_HOST" >&2
  exit 1
}

mkdir -p "$EVIDENCE_ROOT"
AUDIT_LOG="$EVIDENCE_ROOT/audit.jsonl"
DAEMON_LOG="$EVIDENCE_ROOT/daemon.log"
DAEMON_PID=""
BASE_URL=""

cleanup() {
  stop_daemon
}
trap cleanup EXIT

start_daemon "$AUDIT_LOG" "$DAEMON_LOG"

run_json_post "$BASE_URL/v1/route/explain" "$REQUEST_FILE" "$EVIDENCE_ROOT/route_explain.json" "$EVIDENCE_ROOT/route_explain.latency_seconds"
run_json_post "$BASE_URL/v1/chat/completions" "$REQUEST_FILE" "$EVIDENCE_ROOT/chat_completion.json" "$EVIDENCE_ROOT/chat_completion.latency_seconds"
curl -fsS "$BASE_URL/v1/audit/events" >"$EVIDENCE_ROOT/audit_events.json"

jq -e '.decision.tier == "TIER_3" and .decision.route_code == "DOMAIN_MODEL_SELECTED"' "$EVIDENCE_ROOT/route_explain.json" >/dev/null
jq -e '(.choices[0].message.content | fromjson | type) == "object"' "$EVIDENCE_ROOT/chat_completion.json" >/dev/null
jq -e '.local_output.legal_json.status == "ok"' "$EVIDENCE_ROOT/chat_completion.json" >/dev/null
jq -e '.local_output.legal_json.schema_valid == true' "$EVIDENCE_ROOT/chat_completion.json" >/dev/null

jq -n \
  --slurpfile route "$EVIDENCE_ROOT/route_explain.json" \
  --slurpfile completion "$EVIDENCE_ROOT/chat_completion.json" \
  --arg evidence_root "$EVIDENCE_ROOT" \
  --arg audit_path "$EVIDENCE_ROOT/audit_events.json" \
  '{
    route_decision: $route[0].decision,
    explanation: $route[0].explanation,
    legal_json_status: $completion[0].local_output.legal_json.status,
    schema_valid: $completion[0].local_output.legal_json.schema_valid,
    parsed_legal_json: ($completion[0].choices[0].message.content | fromjson),
    audit_event_location: $audit_path,
    evidence_root: $evidence_root
  }' >"$EVIDENCE_ROOT/demo-summary.json"

echo "Route decision:"
jq '.route_decision' "$EVIDENCE_ROOT/demo-summary.json"
echo
echo "Human-readable explanation:"
jq -r '.explanation' "$EVIDENCE_ROOT/demo-summary.json"
echo
echo "legal_json.status:"
jq -r '.legal_json_status' "$EVIDENCE_ROOT/demo-summary.json"
echo
echo "schema_valid:"
jq -r '.schema_valid' "$EVIDENCE_ROOT/demo-summary.json"
echo
echo "Parsed legal JSON:"
jq '.parsed_legal_json' "$EVIDENCE_ROOT/demo-summary.json"
echo
echo "Audit event location:"
jq -r '.audit_event_location' "$EVIDENCE_ROOT/demo-summary.json"
echo
echo "Saved demo evidence to $EVIDENCE_ROOT"
