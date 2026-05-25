#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEFAULT_WORKFLOW_ROOT="$ROOT_DIR/local-evidence/demo-local-evidence-workflow/$TIMESTAMP"
EVIDENCE_ROOT="${IGNISPROMPT_DEMO_EVIDENCE_DIR:-$DEFAULT_WORKFLOW_ROOT}"
WORKFLOW_BUNDLE_DIR="$EVIDENCE_ROOT/demo-bundle"
WORKFLOW_ARCHIVE_PATH="${IGNISPROMPT_DEMO_ARCHIVE_PATH:-$ROOT_DIR/local-evidence/archives/demo-bundle-$TIMESTAMP.tar.gz}"
READINESS_PACKAGE_DIR="${IGNISPROMPT_DEMO_READINESS_PACKAGE_DIR:-$ROOT_DIR/local-evidence/readiness/demo-readiness-$TIMESTAMP}"
OPERATOR_PACKAGE_DIR="${IGNISPROMPT_DEMO_OPERATOR_PACKAGE_DIR:-$ROOT_DIR/local-evidence/operator/demo-operator-$TIMESTAMP}"
WORKFLOW_BUNDLE_DIR_REL="${WORKFLOW_BUNDLE_DIR#$ROOT_DIR/}"
WORKFLOW_ARCHIVE_PATH_REL="${WORKFLOW_ARCHIVE_PATH#$ROOT_DIR/}"
READINESS_PACKAGE_DIR_REL="${READINESS_PACKAGE_DIR#$ROOT_DIR/}"
OPERATOR_PACKAGE_DIR_REL="${OPERATOR_PACKAGE_DIR#$ROOT_DIR/}"
REQUEST_FILE="${IGNISPROMPT_DEMO_REQUEST_FILE:-$ROOT_DIR/tests/golden-legal/smoke-legal-request.json}"
DAEMON_PORT="${IGNISPROMPT_DEMO_PORT:-8765}"
BASE_URL="${IGNISPROMPT_BASE_URL:-http://127.0.0.1:$DAEMON_PORT}"
DAEMON_LOG="$EVIDENCE_ROOT/daemon.log"
AUDIT_LOG="$EVIDENCE_ROOT/audit.jsonl"
ROUTE_JSON="$EVIDENCE_ROOT/route-explain.json"
AUDIT_EVENTS_JSON="$EVIDENCE_ROOT/audit-events.json"
EVIDENCE_BUNDLE_SUMMARY_JSON="$EVIDENCE_ROOT/evidence-bundle-summary.json"
EVIDENCE_BUNDLE_LIST_JSON="$EVIDENCE_ROOT/evidence-bundle-list.json"
EVIDENCE_BUNDLE_VALIDATE_JSON="$EVIDENCE_ROOT/evidence-bundle-validate.json"
EVIDENCE_BUNDLE_ARCHIVE_JSON="$EVIDENCE_ROOT/evidence-bundle-archive.json"
EVIDENCE_BUNDLE_VERIFY_JSON="$EVIDENCE_ROOT/evidence-bundle-verify-archive.json"
EVIDENCE_BUNDLE_MANIFEST_JSON="$EVIDENCE_ROOT/evidence-bundle-manifest.json"
READINESS_PACKAGE_SUMMARY_JSON="$EVIDENCE_ROOT/readiness-package-summary.json"
READINESS_PACKAGE_LIST_JSON="$EVIDENCE_ROOT/readiness-package-list.json"
READINESS_PACKAGE_VALIDATE_JSON="$EVIDENCE_ROOT/readiness-package-validate.json"
OPERATOR_PACKAGE_SUMMARY_JSON="$EVIDENCE_ROOT/operator-package-summary.json"
OPERATOR_PACKAGE_LIST_JSON="$EVIDENCE_ROOT/operator-package-list.json"
OPERATOR_PACKAGE_VALIDATE_JSON="$EVIDENCE_ROOT/operator-package-validate.json"
DAEMON_PID=""

usage() {
  cat <<EOF
Usage: ./scripts/demo-local-evidence-workflow.sh [--dry-run|--self-test]

Runs a repeatable local evidence demo workflow.

Modes:
  --dry-run    Print the planned local workflow without starting the daemon.
  --self-test  Verify ignored-path checks and command construction without a live daemon.
EOF
}

MODE=""
if [ "$#" -gt 0 ]; then
  MODE="$1"
  shift
fi

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
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

validate_local_evidence_path() {
  local path="$1"
  local label="$2"

  case "$path" in
    "$ROOT_DIR/local-evidence"/*)
      ;;
    *)
      echo "$label must stay under ignored local-evidence/: $path" >&2
      exit 1
      ;;
  esac

  require_ignored_path "$path"
}

planned_route_output() {
  printf '%s\n' "${ROUTE_JSON#$ROOT_DIR/}"
}

planned_audit_output() {
  printf '%s\n' "${AUDIT_EVENTS_JSON#$ROOT_DIR/}"
}

planned_bundle_dir() {
  printf '%s\n' "$WORKFLOW_BUNDLE_DIR_REL"
}

planned_archive_output() {
  printf '%s\n' "$WORKFLOW_ARCHIVE_PATH_REL"
}

print_plan() {
  cat <<EOF
[plan] route-explain --json --input tests/golden-legal/smoke-legal-request.json > $(planned_route_output)
[plan] audit-events --json > $(planned_audit_output)
[plan] evidence-bundle --output $(planned_bundle_dir) --include-audit-events --json > $(printf '%s\n' "${EVIDENCE_BUNDLE_SUMMARY_JSON#$ROOT_DIR/}")
[plan] evidence-bundle --list $(planned_bundle_dir) --json > $(printf '%s\n' "${EVIDENCE_BUNDLE_LIST_JSON#$ROOT_DIR/}")
[plan] evidence-bundle --validate $(planned_bundle_dir) --json > $(printf '%s\n' "${EVIDENCE_BUNDLE_VALIDATE_JSON#$ROOT_DIR/}")
[plan] evidence-bundle --archive $(planned_bundle_dir) --archive-output $(planned_archive_output) --json > $(printf '%s\n' "${EVIDENCE_BUNDLE_ARCHIVE_JSON#$ROOT_DIR/}")
[plan] evidence-bundle --verify-archive $(planned_archive_output) --json > $(printf '%s\n' "${EVIDENCE_BUNDLE_VERIFY_JSON#$ROOT_DIR/}")
[plan] evidence-bundle --print-manifest $(planned_bundle_dir) --json > $(printf '%s\n' "${EVIDENCE_BUNDLE_MANIFEST_JSON#$ROOT_DIR/}")
[plan] readiness --package-output $READINESS_PACKAGE_DIR_REL --json > $(printf '%s\n' "${READINESS_PACKAGE_SUMMARY_JSON#$ROOT_DIR/}")
[plan] readiness --package-list $READINESS_PACKAGE_DIR_REL --json > $(printf '%s\n' "${READINESS_PACKAGE_LIST_JSON#$ROOT_DIR/}")
[plan] readiness --package-validate $READINESS_PACKAGE_DIR_REL --json > $(printf '%s\n' "${READINESS_PACKAGE_VALIDATE_JSON#$ROOT_DIR/}")
[plan] operator-summary --package-output $OPERATOR_PACKAGE_DIR_REL --json > $(printf '%s\n' "${OPERATOR_PACKAGE_SUMMARY_JSON#$ROOT_DIR/}")
[plan] operator-summary --package-list $OPERATOR_PACKAGE_DIR_REL --json > $(printf '%s\n' "${OPERATOR_PACKAGE_LIST_JSON#$ROOT_DIR/}")
[plan] operator-summary --package-validate $OPERATOR_PACKAGE_DIR_REL --json > $(printf '%s\n' "${OPERATOR_PACKAGE_VALIDATE_JSON#$ROOT_DIR/}")
EOF
}

wait_for_health() {
  local attempt

  for attempt in $(seq 1 60); do
    if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "daemon did not become healthy at $BASE_URL" >&2
  echo "try ./scripts/start-dev.sh in another terminal, then rerun this workflow" >&2
  return 1
}

start_daemon() {
  mkdir -p "$EVIDENCE_ROOT"

  RUST_LOG="${RUST_LOG:-ignispromptd=info,tower_http=info}" \
  cargo run -p ignispromptd -- \
    --bind "127.0.0.1:$DAEMON_PORT" \
    --model-dir "${IGNISPROMPT_MODEL_DIR:-./config/models}" \
    --audit-log "$AUDIT_LOG" \
    --local-only >"$DAEMON_LOG" 2>&1 &

  DAEMON_PID=$!
  wait_for_health
}

stop_daemon() {
  if [ -n "${DAEMON_PID:-}" ] && kill -0 "$DAEMON_PID" >/dev/null 2>&1; then
    kill "$DAEMON_PID" >/dev/null 2>&1 || true
    wait "$DAEMON_PID" >/dev/null 2>&1 || true
  fi
  DAEMON_PID=""
}

run_ignispromptctl() {
  cargo run -p ignispromptctl -- --daemon-url "$BASE_URL" "$@"
}

self_test() {
  require_cmd git
  validate_local_evidence_path "$EVIDENCE_ROOT" "workflow evidence root"
  validate_local_evidence_path "$WORKFLOW_BUNDLE_DIR" "bundle output"
  validate_local_evidence_path "$WORKFLOW_ARCHIVE_PATH" "archive output"
  validate_local_evidence_path "$READINESS_PACKAGE_DIR" "readiness package output"
  validate_local_evidence_path "$OPERATOR_PACKAGE_DIR" "operator package output"

  local plan_output="$EVIDENCE_ROOT/self-test-plan.txt"
  mkdir -p "$EVIDENCE_ROOT"
  print_plan >"$plan_output"

  grep -q "route-explain --json --input tests/golden-legal/smoke-legal-request.json" "$plan_output"
  grep -q "audit-events --json" "$plan_output"
  grep -q "evidence-bundle --output" "$plan_output"
  grep -q "evidence-bundle --list" "$plan_output"
  grep -q "evidence-bundle --validate" "$plan_output"
  grep -q "evidence-bundle --archive" "$plan_output"
  grep -q "evidence-bundle --verify-archive" "$plan_output"
  grep -q "evidence-bundle --print-manifest" "$plan_output"
  grep -q "readiness --package-output" "$plan_output"
  grep -q "readiness --package-list" "$plan_output"
  grep -q "readiness --package-validate" "$plan_output"
  grep -q "operator-summary --package-output" "$plan_output"
  grep -q "operator-summary --package-list" "$plan_output"
  grep -q "operator-summary --package-validate" "$plan_output"

  echo "[OK] local evidence demo workflow self-test passed"
}

case "$MODE" in
  "")
    ;;
  --dry-run)
    require_cmd git
    validate_local_evidence_path "$EVIDENCE_ROOT" "workflow evidence root"
    validate_local_evidence_path "$WORKFLOW_BUNDLE_DIR" "bundle output"
    validate_local_evidence_path "$WORKFLOW_ARCHIVE_PATH" "archive output"
    validate_local_evidence_path "$READINESS_PACKAGE_DIR" "readiness package output"
    validate_local_evidence_path "$OPERATOR_PACKAGE_DIR" "operator package output"
    if [ ! -f "$REQUEST_FILE" ]; then
      echo "demo request file is missing: $REQUEST_FILE" >&2
      exit 1
    fi
    print_plan
    exit 0
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

if [ "$#" -ne 0 ]; then
  usage >&2
  exit 1
fi

require_cmd cargo
require_cmd curl
require_cmd git
require_cmd jq

validate_local_evidence_path "$EVIDENCE_ROOT" "workflow evidence root"
validate_local_evidence_path "$WORKFLOW_BUNDLE_DIR" "bundle output"
validate_local_evidence_path "$WORKFLOW_ARCHIVE_PATH" "archive output"
validate_local_evidence_path "$READINESS_PACKAGE_DIR" "readiness package output"
validate_local_evidence_path "$OPERATOR_PACKAGE_DIR" "operator package output"

if [ -f "$REQUEST_FILE" ]; then
  :
else
  echo "demo request file is missing: $REQUEST_FILE" >&2
  exit 1
fi

mkdir -p "$EVIDENCE_ROOT"

cleanup() {
  stop_daemon
}
trap cleanup EXIT

start_daemon

run_ignispromptctl route-explain --json --input "$REQUEST_FILE" >"$ROUTE_JSON"
run_ignispromptctl audit-events --json >"$AUDIT_EVENTS_JSON"
run_ignispromptctl evidence-bundle --output "$WORKFLOW_BUNDLE_DIR_REL" --include-audit-events --json >"$EVIDENCE_BUNDLE_SUMMARY_JSON"
run_ignispromptctl evidence-bundle --list "$WORKFLOW_BUNDLE_DIR_REL" --json >"$EVIDENCE_BUNDLE_LIST_JSON"
run_ignispromptctl evidence-bundle --validate "$WORKFLOW_BUNDLE_DIR_REL" --json >"$EVIDENCE_BUNDLE_VALIDATE_JSON"
run_ignispromptctl evidence-bundle --archive "$WORKFLOW_BUNDLE_DIR_REL" --archive-output "$WORKFLOW_ARCHIVE_PATH_REL" --json >"$EVIDENCE_BUNDLE_ARCHIVE_JSON"
run_ignispromptctl evidence-bundle --verify-archive "$WORKFLOW_ARCHIVE_PATH_REL" --json >"$EVIDENCE_BUNDLE_VERIFY_JSON"
run_ignispromptctl evidence-bundle --print-manifest "$WORKFLOW_BUNDLE_DIR_REL" --json >"$EVIDENCE_BUNDLE_MANIFEST_JSON"
run_ignispromptctl readiness --package-output "$READINESS_PACKAGE_DIR_REL" --json >"$READINESS_PACKAGE_SUMMARY_JSON"
run_ignispromptctl readiness --package-list "$READINESS_PACKAGE_DIR_REL" --json >"$READINESS_PACKAGE_LIST_JSON"
run_ignispromptctl readiness --package-validate "$READINESS_PACKAGE_DIR_REL" --json >"$READINESS_PACKAGE_VALIDATE_JSON"
run_ignispromptctl operator-summary --package-output "$OPERATOR_PACKAGE_DIR_REL" --json >"$OPERATOR_PACKAGE_SUMMARY_JSON"
run_ignispromptctl operator-summary --package-list "$OPERATOR_PACKAGE_DIR_REL" --json >"$OPERATOR_PACKAGE_LIST_JSON"
run_ignispromptctl operator-summary --package-validate "$OPERATOR_PACKAGE_DIR_REL" --json >"$OPERATOR_PACKAGE_VALIDATE_JSON"

jq -e '.decision.tier == "TIER_3" and .decision.route_code == "DOMAIN_MODEL_SELECTED"' "$ROUTE_JSON" >/dev/null
jq -e 'type == "array" and length >= 1' "$AUDIT_EVENTS_JSON" >/dev/null
jq -e '.local_only == true and .non_certified == true and .signed == false and .production_attestation == false and .include_audit_events == true and (.captured_endpoints | type == "array") and (.generated_file_names | type == "array")' "$EVIDENCE_BUNDLE_SUMMARY_JSON" >/dev/null
jq -e '.metadata.include_audit_events == true and (.files | type == "array")' "$EVIDENCE_BUNDLE_LIST_JSON" >/dev/null
jq -e '.status == "ok" and .metadata.include_audit_events == true' "$EVIDENCE_BUNDLE_VALIDATE_JSON" >/dev/null
jq -e '.archive_size_bytes > 0 and .metadata.include_audit_events == true' "$EVIDENCE_BUNDLE_ARCHIVE_JSON" >/dev/null
jq -e '.status == "ok" and .metadata.include_audit_events == true' "$EVIDENCE_BUNDLE_VERIFY_JSON" >/dev/null
jq -e '.include_audit_events == true and (.files | type == "array") and (.generated_file_names | type == "array")' "$EVIDENCE_BUNDLE_MANIFEST_JSON" >/dev/null
jq -e '.local_only == true and .readiness_status == "local_preview_ready" and (.generated_file_names | type == "array")' "$READINESS_PACKAGE_SUMMARY_JSON" >/dev/null
jq -e '.status == "ok" and (.files | type == "array")' "$READINESS_PACKAGE_LIST_JSON" >/dev/null
jq -e '.status == "ok" and (.files | type == "array")' "$READINESS_PACKAGE_VALIDATE_JSON" >/dev/null
jq -e '.local_only == true and .operator_status == "operator_guidance" and (.generated_file_names | type == "array")' "$OPERATOR_PACKAGE_SUMMARY_JSON" >/dev/null
jq -e '.status == "ok" and (.files | type == "array")' "$OPERATOR_PACKAGE_LIST_JSON" >/dev/null
jq -e '.status == "ok" and (.files | type == "array")' "$OPERATOR_PACKAGE_VALIDATE_JSON" >/dev/null

echo "Route decision:"
jq -r '.decision.route_code + " / " + .decision.tier' "$ROUTE_JSON"
echo
echo "Audit event count:"
jq -r 'length' "$AUDIT_EVENTS_JSON"
echo
echo "Evidence bundle:"
echo "  bundle dir: $(relative_to_root "$WORKFLOW_BUNDLE_DIR")"
echo "  archive:    $(relative_to_root "$WORKFLOW_ARCHIVE_PATH")"
echo "  outputs:    $(relative_to_root "$EVIDENCE_ROOT")"
echo "  readiness:  $(relative_to_root "$READINESS_PACKAGE_DIR")"
echo "  operator:   $(relative_to_root "$OPERATOR_PACKAGE_DIR")"
echo
echo "Workflow complete."
