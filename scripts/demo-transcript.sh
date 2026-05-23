#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_BASE="${IGNISPROMPT_DEMO_EVIDENCE_BASE:-$ROOT_DIR/local-evidence/demo-local-legal-review}"
REQUEST_FILE="${IGNISPROMPT_DEMO_REQUEST_FILE:-$ROOT_DIR/tests/golden-legal/demo-synthetic-contract-request.json}"
MODE="${1:-}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

usage() {
  cat <<EOF
Usage: ./scripts/demo-transcript.sh [--latest|--generate|<evidence-dir>]

Creates transcript.md from a local legal-review demo evidence bundle.

Modes:
  --latest       Read the latest complete bundle under local-evidence/demo-local-legal-review. This is the default.
  --generate    Run ./scripts/demo-local-legal-review.sh first, then read the generated bundle.
  --self-test    Create a tiny ignored fixture bundle and verify transcript safety checks.
  <evidence-dir> Read a specific demo evidence directory.
EOF
}

is_complete_bundle() {
  local dir="$1"

  [ -f "$dir/route_explain.json" ] &&
    [ -f "$dir/chat_completion.json" ] &&
    [ -f "$dir/audit_events.json" ]
}

latest_bundle() {
  local candidate
  local latest=""

  [ -d "$EVIDENCE_BASE" ] || return 1

  for candidate in "$EVIDENCE_BASE"/*; do
    [ -d "$candidate" ] || continue
    is_complete_bundle "$candidate" || continue
    latest="$candidate"
  done

  [ -n "$latest" ] || return 1
  printf '%s\n' "$latest"
}

run_demo() {
  local before=""
  local after=""
  local generated_dir=""

  before="$(latest_bundle 2>/dev/null || true)"
  generated_dir="$EVIDENCE_BASE/$(date -u +%Y%m%dT%H%M%SZ)"
  if ! IGNISPROMPT_DEMO_EVIDENCE_DIR="$generated_dir" "$ROOT_DIR/scripts/demo-local-legal-review.sh" >/dev/null; then
    echo "demo run failed before creating a complete evidence bundle under $EVIDENCE_BASE" >&2
    exit 1
  fi
  if ! after="$(latest_bundle)"; then
    echo "demo run did not create a complete evidence bundle under $EVIDENCE_BASE" >&2
    exit 1
  fi

  if [ -n "$before" ] && [ "$before" = "$after" ]; then
    echo "demo run did not create a new complete evidence bundle under $EVIDENCE_BASE" >&2
    exit 1
  fi

  printf '%s\n' "$after"
}

self_test() {
  require_cmd git

  local test_dir="$ROOT_DIR/local-evidence/demo-local-legal-review/self-test-$(date -u +%Y%m%dT%H%M%SZ)-$$"
  local transcript_output="$test_dir/transcript.out"
  local placeholder_dir="$test_dir-placeholder"
  local placeholder_output="$placeholder_dir/transcript.out"

  mkdir -p "$test_dir" "$placeholder_dir"

  cat >"$test_dir/request.json" <<'JSON'
{
  "model": "ignisprompt/legal",
  "messages": [
    {
      "role": "user",
      "content": "Review this fully synthetic demo clause and identify one local-preview risk."
    }
  ],
  "stream": false,
  "metadata": {
    "domain": "legal",
    "fixture": "synthetic_public_demo"
  }
}
JSON

  cat >"$test_dir/route_explain.json" <<'JSON'
{
  "request_id": "self-test-route",
  "decision": {
    "tier": "TIER_3",
    "route_code": "DOMAIN_MODEL_SELECTED",
    "domain": "legal",
    "model_id": "self-test-model",
    "cloud_considered": false,
    "cloud_allowed": false,
    "data_left_device": false
  },
  "explanation": "The request was routed to Tier 3 for local preview review. No cloud route was considered.",
  "warnings": []
}
JSON

  cat >"$test_dir/chat_completion.json" <<'JSON'
{
  "id": "self-test-completion",
  "object": "chat.completion",
  "created": 0,
  "model": "ignisprompt/legal",
  "route": {
    "tier": "TIER_3",
    "route_code": "DOMAIN_MODEL_SELECTED",
    "domain": "legal",
    "model_id": "self-test-model",
    "cloud_considered": false,
    "cloud_allowed": false,
    "data_left_device": false
  },
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"clause_type\":\"service suspension\",\"jurisdiction\":\"not specified\",\"key_obligations\":[\"review prepaid fee handling\"],\"risks\":[{\"risk_type\":\"commercial\",\"severity\":\"medium\",\"finding\":\"The clause may let the vendor retain prepaid fees after suspension.\",\"supporting_text\":\"may retain prepaid fees after suspension\",\"recommended_review\":\"Confirm refund language before relying on the clause.\"}],\"missing_information\":[],\"confidence\":\"medium\"}"
      },
      "finish_reason": "stop"
    }
  ],
  "local_output": {
    "runner": "self-test",
    "legal_json": {
      "status": "ok",
      "source": "raw_json",
      "schema_valid": true,
      "raw_model_output": "{\"clause_type\":\"service suspension\"}"
    }
  }
}
JSON

  cat >"$test_dir/audit_events.json" <<'JSON'
[
  {
    "request_id": "self-test-route",
    "timestamp": "2026-01-01T00:00:00Z",
    "event_type": "route_explain",
    "route_code": "DOMAIN_MODEL_SELECTED",
    "tier": "TIER_3",
    "domain": "legal",
    "model_id": "self-test-model",
    "data_left_device": false,
    "explanation": "The request was routed to Tier 3 for local preview review.",
    "warnings": []
  }
]
JSON

  IGNISPROMPT_DEMO_REQUEST_FILE="$test_dir/request.json" "$0" "$test_dir" >"$transcript_output"
  [ -f "$test_dir/transcript.md" ] || {
    echo "self-test did not write transcript under $test_dir" >&2
    exit 1
  }
  git -C "$ROOT_DIR" check-ignore -q "${test_dir#$ROOT_DIR/}/transcript.md" || {
    echo "self-test transcript path is not ignored: $test_dir/transcript.md" >&2
    exit 1
  }
  grep -q "not legal advice" "$test_dir/transcript.md"
  grep -q "not production legal quality" "$test_dir/transcript.md"
  grep -q "not compliance certification" "$test_dir/transcript.md"

  cp "$test_dir/request.json" "$placeholder_dir/request.json"
  cp "$test_dir/route_explain.json" "$placeholder_dir/route_explain.json"
  cp "$test_dir/audit_events.json" "$placeholder_dir/audit_events.json"
  jq '.choices[0].message.content = "{\"clause_type\":\"string\",\"jurisdiction\":\"not specified\",\"key_obligations\":[\"string\"],\"risks\":[],\"missing_information\":[],\"confidence\":\"medium\"}"' \
    "$test_dir/chat_completion.json" >"$placeholder_dir/chat_completion.json"

  if IGNISPROMPT_DEMO_REQUEST_FILE="$placeholder_dir/request.json" "$0" "$placeholder_dir" >"$placeholder_output" 2>&1; then
    echo "self-test expected placeholder-like successful output to be rejected" >&2
    exit 1
  fi
  grep -q "placeholder string values" "$placeholder_output"

  echo "[OK] demo transcript self-test passed"
}

require_cmd jq

case "$MODE" in
  ""|--latest)
    if ! EVIDENCE_DIR="$(latest_bundle)"; then
      echo "no complete demo evidence bundle found under $EVIDENCE_BASE" >&2
      echo "run ./scripts/demo-local-legal-review.sh first, or run ./scripts/demo-transcript.sh --generate if local GGUF prerequisites are available" >&2
      exit 1
    fi
    ;;
  --generate)
    EVIDENCE_DIR="$(run_demo)"
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
    EVIDENCE_DIR="$MODE"
    is_complete_bundle "$EVIDENCE_DIR" || {
      echo "not a complete demo evidence bundle: $EVIDENCE_DIR" >&2
      echo "expected route_explain.json, chat_completion.json, and audit_events.json" >&2
      exit 1
    }
    ;;
esac

[ -f "$REQUEST_FILE" ] || {
  echo "demo request file is missing: $REQUEST_FILE" >&2
  exit 1
}

TRANSCRIPT_PATH="$EVIDENCE_DIR/transcript.md"
if [ -f "$EVIDENCE_DIR/request.json" ]; then
  TRANSCRIPT_REQUEST_FILE="$EVIDENCE_DIR/request.json"
else
  TRANSCRIPT_REQUEST_FILE="$REQUEST_FILE"
fi
AUDIT_PATH="$EVIDENCE_DIR/audit_events.json"
if [ -f "$EVIDENCE_DIR/demo-summary.json" ]; then
  AUDIT_PATH="$(jq -r --arg fallback "$AUDIT_PATH" '.audit_event_location // $fallback' "$EVIDENCE_DIR/demo-summary.json")"
fi

if jq -e '(.local_output.legal_json.status == "ok" and .local_output.legal_json.schema_valid == true) and ([.choices[0].message.content | fromjson | .. | strings | ascii_downcase] | any(. == "string"))' "$EVIDENCE_DIR/chat_completion.json" >/dev/null; then
  echo "Transcript source has schema-valid legal JSON, but it still contains placeholder string values." >&2
  echo "Refusing to present placeholder-like output as a successful demo transcript." >&2
  exit 1
fi

{
  printf '# Local Legal Review Demo Transcript\n\n'
  printf '%s\n' "- evidence bundle: \`$EVIDENCE_DIR\`"
  printf '%s\n' "- request fixture: \`$TRANSCRIPT_REQUEST_FILE\`"
  printf '%s\n\n' "- audit evidence path: \`$AUDIT_PATH\`"

  printf '## Safety Boundary\n\n'
  printf '%s\n' "This transcript is local preview evidence from synthetic demo data only. It is not legal advice, not production legal quality, and not compliance certification."
  printf '%s\n\n' "Keep generated transcripts and evidence under ignored local-evidence paths; do not commit them."

  printf '## Request Summary\n\n'
  jq -r '
    "- model: `\(.model)`",
    "- stream: `\(.stream // false)`",
    "- declared domain: `\(.metadata.domain // "unspecified")`",
    "- user prompt excerpt: \((.messages[] | select(.role == "user") | .content)[0:220] | @json)"
  ' "$TRANSCRIPT_REQUEST_FILE"
  printf '\n'

  printf '## Route Decision\n\n'
  printf '```json\n'
  jq '.decision' "$EVIDENCE_DIR/route_explain.json"
  printf '```\n\n'

  printf '## Explanation\n\n'
  jq -r '.explanation' "$EVIDENCE_DIR/route_explain.json"
  printf '\n\n'

  printf '## legal_json Status\n\n'
  jq -r '
    "- status: `\(.local_output.legal_json.status // "missing")`",
    "- schema_valid: `\(.local_output.legal_json.schema_valid // false)`",
    "- source: `\(.local_output.legal_json.source // "missing")`",
    if ((.local_output.legal_json.status // "missing") != "ok" or (.local_output.legal_json.schema_valid // false) != true) then
      "- error_code: `\(.local_output.legal_json.error_code // "missing")`",
      "- error_message: \(.local_output.legal_json.error_message // "missing" | @json)"
    else empty end
  ' "$EVIDENCE_DIR/chat_completion.json"
  printf '\n'

  printf '## Parsed JSON Excerpt\n\n'
  printf '```json\n'
  jq '
    . as $completion
    | (.choices[0].message.content | fromjson) as $parsed
    | if (($completion.local_output.legal_json.status // "missing") == "ok" and ($completion.local_output.legal_json.schema_valid // false) == true) then $parsed | {
        clause_type,
        confidence,
        jurisdiction,
        key_obligations: (.key_obligations // [])[0:3],
        missing_information: (.missing_information // [])[0:3],
        risks: ((.risks // [])[0:2] | map({
          risk_type,
          severity,
          finding,
          supporting_text,
          recommended_review
        }))
      }
    else {
        parse_status: ($parsed.parse_status // "error"),
        error_code: ($parsed.error_code // $completion.local_output.legal_json.error_code // "missing"),
        error_message: ($parsed.error_message // $completion.local_output.legal_json.error_message // "missing"),
        source: ($parsed.source // $completion.local_output.legal_json.source // "missing"),
        missing_fields: ($parsed.missing_fields // $completion.local_output.legal_json.missing_fields // []),
        invalid_fields: ($parsed.invalid_fields // $completion.local_output.legal_json.invalid_fields // [])
      }
    end
  ' "$EVIDENCE_DIR/chat_completion.json"
  printf '```\n\n'

  printf '## Audit Evidence\n\n'
  printf '%s\n' "- audit evidence path: \`$AUDIT_PATH\`"
  printf '%s\n' "- audit events captured: \`$(jq 'length' "$EVIDENCE_DIR/audit_events.json")\`"
} | tee "$TRANSCRIPT_PATH"

echo
echo "Saved transcript to $TRANSCRIPT_PATH"
