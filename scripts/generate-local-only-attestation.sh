#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUILD_MODE="${IGNISPROMPT_ATTESTATION_BUILD_MODE:-debug}"
MODE="${1:-}"
ATTESTATION_PORT="${IGNISPROMPT_ATTESTATION_PORT:-8765}"
MODEL_DIR="${IGNISPROMPT_ATTESTATION_MODEL_DIR:-./config/models}"
REQUEST_FILE="${IGNISPROMPT_ATTESTATION_REQUEST_FILE:-$ROOT_DIR/tests/golden-legal/smoke-legal-request.json}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVIDENCE_ROOT="${IGNISPROMPT_ATTESTATION_EVIDENCE_DIR:-$ROOT_DIR/local-evidence/attestation/$TIMESTAMP}"
AUDIT_LOG="$EVIDENCE_ROOT/audit.events.jsonl"
AUDIT_SNAPSHOT="$EVIDENCE_ROOT/audit-events.json"
DAEMON_LOG="$EVIDENCE_ROOT/daemon.log"
IGNORE_CHECKS="$EVIDENCE_ROOT/ignore-checks.txt"
IGNORED_STATUS="$EVIDENCE_ROOT/git-status-ignored.txt"
SUMMARY_JSON="$EVIDENCE_ROOT/summary.json"
SUMMARY_README="$EVIDENCE_ROOT/README.md"
GIT_SHA_FILE="$EVIDENCE_ROOT/git-sha.txt"
HEALTH_JSON="$EVIDENCE_ROOT/health.json"
ROUTE_JSON="$EVIDENCE_ROOT/route-explain.json"
BINARY_INFO_JSON="$EVIDENCE_ROOT/binary-info.json"
BUILD_MODE_FILE="$EVIDENCE_ROOT/build-mode.txt"
DAEMON_AUDIT_LOG="./data/audit/attestation-$TIMESTAMP.events.jsonl"

case "$BUILD_MODE" in
  debug)
    BINARY_PATH="$ROOT_DIR/target/debug/ignispromptd"
    ;;
  release)
    BINARY_PATH="$ROOT_DIR/target/release/ignispromptd"
    ;;
  *)
    echo "unsupported build mode: $BUILD_MODE" >&2
    echo "supported build modes: debug, release" >&2
    exit 1
    ;;
esac

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

usage() {
  cat <<EOF
Usage: ./scripts/generate-local-only-attestation.sh [--self-test]

Generates a developer local-only evidence bundle under ignored local-evidence/.

Modes:
  --self-test    Verify ignored-path and placeholder-value validation without starting the daemon.
EOF
}

relative_to_root() {
  local path="$1"

  case "$path" in
    "$ROOT_DIR"/*)
      printf '%s\n' "${path#$ROOT_DIR/}"
      ;;
    *)
      printf '%s\n' "$path"
      ;;
  esac
}

require_ignored_path() {
  local path="$1"
  local relative

  relative="$(relative_to_root "$path")"
  git check-ignore -q "$relative" || {
    echo "expected path to be git-ignored: $relative" >&2
    exit 1
  }
}

validate_evidence_root() {
  case "$EVIDENCE_ROOT" in
    "$ROOT_DIR/local-evidence"/*)
      ;;
    *)
      echo "evidence root must stay under ignored local-evidence/: $EVIDENCE_ROOT" >&2
      exit 1
      ;;
  esac

  require_ignored_path "$EVIDENCE_ROOT"
}

validate_summary_json() {
  local summary_path="$1"

  jq -e '.developer_evidence_only == true' "$summary_path" >/dev/null
  jq -e '[.. | strings] | all(. != "string")' "$summary_path" >/dev/null || {
    echo "summary contains placeholder-like literal string values: $summary_path" >&2
    return 1
  }
  jq -e '.notes | any(. == "Not a signed attestation report.")' "$summary_path" >/dev/null
}

self_test() {
  require_cmd git
  require_cmd jq

  local test_root="$ROOT_DIR/local-evidence/attestation/self-test-$(date -u +%Y%m%dT%H%M%SZ)-$$"
  local valid_summary="$test_root/summary-valid.json"
  local placeholder_summary="$test_root/summary-placeholder.json"

  mkdir -p "$test_root"
  require_ignored_path "$test_root/summary-valid.json"
  require_ignored_path "$ROOT_DIR/local-evidence/demo-local-legal-review/example/transcript.md"
  require_ignored_path "$ROOT_DIR/local-evidence/golden-legal-v0.3/example/summary.jsonl"
  require_ignored_path "$ROOT_DIR/data/audit/example.events.jsonl"
  require_ignored_path "$ROOT_DIR/models/example.gguf"
  require_ignored_path "$ROOT_DIR/target/debug/ignispromptd"
  require_ignored_path "$ROOT_DIR/apps/aethra/dist/example.js"

  jq -n \
    --arg evidence_root "$test_root" \
    '{
      developer_evidence_only: true,
      evidence_root: $evidence_root,
      git_sha: "self-test",
      local_only: true,
      route_decision: {
        tier: "TIER_3",
        route_code: "DOMAIN_MODEL_SELECTED",
        domain: "legal",
        data_left_device: false
      },
      notes: [
        "Developer-generated local-only evidence only.",
        "Not a signed attestation report.",
        "Not formal certification or compliance certification."
      ]
    }' >"$valid_summary"
  validate_summary_json "$valid_summary"

  jq '.route_decision.domain = "string"' "$valid_summary" >"$placeholder_summary"
  if validate_summary_json "$placeholder_summary" >/dev/null 2>&1; then
    echo "self-test expected placeholder-like summary values to be rejected" >&2
    exit 1
  fi

  echo "[OK] local-only attestation validation self-test passed"
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

sha256_file() {
  local path="$1"

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
    return 0
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
    return 0
  fi

  echo "missing required command: shasum or sha256sum" >&2
  return 1
}

run_json_post() {
  local url="$1"
  local request_file="$2"
  local output_file="$3"

  curl -fsS -X POST "$url" \
    -H 'content-type: application/json' \
    --data-binary "@$request_file" >"$output_file"
}

start_daemon() {
  echo "launching attested daemon binary: $BINARY_PATH" >"$DAEMON_LOG"

  RUST_LOG="${RUST_LOG:-ignispromptd=info,tower_http=info}" \
  "$BINARY_PATH" \
    --bind "127.0.0.1:$ATTESTATION_PORT" \
    --model-dir "$MODEL_DIR" \
    --audit-log "$DAEMON_AUDIT_LOG" \
    --local-only >>"$DAEMON_LOG" 2>&1 &

  DAEMON_PID=$!
  BASE_URL="http://127.0.0.1:$ATTESTATION_PORT"
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

case "$MODE" in
  "")
    ;;
  --self-test)
    self_test
    exit 0
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac

require_cmd cargo
require_cmd curl
require_cmd git
require_cmd jq

[ -f "$REQUEST_FILE" ] || {
  echo "attestation request file is missing: $REQUEST_FILE" >&2
  exit 1
}

validate_evidence_root
mkdir -p "$EVIDENCE_ROOT"
mkdir -p "$ROOT_DIR/data/audit"
DAEMON_PID=""
BASE_URL=""

cleanup() {
  stop_daemon
  if [ -n "$DAEMON_AUDIT_LOG" ] && [ -f "$DAEMON_AUDIT_LOG" ]; then
    rm -f "$DAEMON_AUDIT_LOG"
  fi
}
trap cleanup EXIT

printf '%s\n' "$BUILD_MODE" >"$BUILD_MODE_FILE"
git rev-parse HEAD >"$GIT_SHA_FILE"

if [ "$BUILD_MODE" = "release" ]; then
  cargo build --release
else
  cargo build
fi

[ -x "$BINARY_PATH" ] || {
  echo "built daemon binary is not executable: $BINARY_PATH" >&2
  exit 1
}

BINARY_SHA="$(sha256_file "$BINARY_PATH")"
jq -n \
  --arg build_mode "$BUILD_MODE" \
  --arg binary_path "$BINARY_PATH" \
  --arg binary_sha256 "$BINARY_SHA" \
  '{
    build_mode: $build_mode,
    binary_path: $binary_path,
    binary_sha256: $binary_sha256
  }' >"$BINARY_INFO_JSON"

git check-ignore -v \
  "models/example.gguf" \
  "local-evidence/attestation/example/evidence.json" \
  "local-evidence/demo-local-legal-review/example/transcript.md" \
  "local-evidence/golden-legal-v0.3/example/summary.jsonl" \
  "data/audit/example.events.jsonl" \
  "target/debug/ignispromptd" \
  "apps/aethra/dist/example.js" >"$IGNORE_CHECKS"
git check-ignore -q "models/example.gguf"
git check-ignore -q "local-evidence/attestation/example/evidence.json"
git check-ignore -q "local-evidence/demo-local-legal-review/example/transcript.md"
git check-ignore -q "local-evidence/golden-legal-v0.3/example/summary.jsonl"
git check-ignore -q "data/audit/example.events.jsonl"
git check-ignore -q "target/debug/ignispromptd"
git check-ignore -q "apps/aethra/dist/example.js"

start_daemon

curl -fsS "$BASE_URL/health" >"$HEALTH_JSON"
run_json_post "$BASE_URL/v1/route/explain" "$REQUEST_FILE" "$ROUTE_JSON"
curl -fsS "$BASE_URL/v1/audit/events" >"$AUDIT_SNAPSHOT"
cp "$DAEMON_AUDIT_LOG" "$AUDIT_LOG"

jq -e '.local_only == true' "$HEALTH_JSON" >/dev/null
jq -e '.decision.tier == "TIER_3" and .decision.route_code == "DOMAIN_MODEL_SELECTED"' "$ROUTE_JSON" >/dev/null
jq -e '.decision.data_left_device == false' "$ROUTE_JSON" >/dev/null
jq -e 'length >= 1' "$AUDIT_SNAPSHOT" >/dev/null
jq -e 'any(.[]; .event_type == "route_explain" and .data_left_device == false)' "$AUDIT_SNAPSHOT" >/dev/null

git status --short --ignored models local-evidence >"$IGNORED_STATUS"

jq -n \
  --rawfile git_sha "$GIT_SHA_FILE" \
  --slurpfile binary_info "$BINARY_INFO_JSON" \
  --slurpfile health "$HEALTH_JSON" \
  --slurpfile route "$ROUTE_JSON" \
  --slurpfile audit "$AUDIT_SNAPSHOT" \
  --arg evidence_root "$EVIDENCE_ROOT" \
  --arg ignore_checks_path "$IGNORE_CHECKS" \
  --arg ignored_status_path "$IGNORED_STATUS" \
  '{
    developer_evidence_only: true,
    evidence_root: $evidence_root,
    git_sha: ($git_sha | split("\n")[0]),
    build_mode: $binary_info[0].build_mode,
    binary_path: $binary_info[0].binary_path,
    binary_sha256: $binary_info[0].binary_sha256,
    local_only: $health[0].local_only,
    route_decision: $route[0].decision,
    route_explanation: $route[0].explanation,
    route_warnings: $route[0].warnings,
    data_left_device: $route[0].decision.data_left_device,
    audit_event_count: ($audit[0] | length),
    audit_snapshot_path: ($evidence_root + "/audit-events.json"),
    ignore_checks_path: $ignore_checks_path,
    ignored_status_path: $ignored_status_path,
    notes: [
      "Developer-generated local-only evidence only.",
      "Not a signed attestation report.",
      "Not formal certification or compliance certification."
    ]
  }' >"$SUMMARY_JSON"

validate_summary_json "$SUMMARY_JSON"

cat >"$SUMMARY_README" <<EOF
# Local-Only Attestation Evidence

This bundle was generated by \`./scripts/generate-local-only-attestation.sh\`.

- evidence root: \`$EVIDENCE_ROOT\`
- git SHA: \`$(cat "$GIT_SHA_FILE")\`
- build mode: \`$BUILD_MODE\`
- binary path: \`$BINARY_PATH\`
- binary sha256: \`$BINARY_SHA\`
- local_only: \`$(jq -r '.local_only' "$HEALTH_JSON")\`
- route tier: \`$(jq -r '.decision.tier' "$ROUTE_JSON")\`
- route code: \`$(jq -r '.decision.route_code' "$ROUTE_JSON")\`
- data_left_device: \`$(jq -r '.decision.data_left_device' "$ROUTE_JSON")\`

This is developer-generated local-only evidence only. It is not a signed attestation report, formal certification, enterprise compliance certification, or production attestation.
EOF

echo "Saved developer local-only evidence to $EVIDENCE_ROOT"
echo "Summary:"
jq . "$SUMMARY_JSON"
