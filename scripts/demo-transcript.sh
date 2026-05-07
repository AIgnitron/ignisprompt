#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_BASE="${IGNISPROMPT_DEMO_EVIDENCE_BASE:-$ROOT_DIR/local-evidence/demo-local-legal-review}"
REQUEST_FILE="${IGNISPROMPT_DEMO_REQUEST_FILE:-$ROOT_DIR/tests/golden-legal/demo-synthetic-contract-request.json}"
LEGACY_REQUEST_FILE="$ROOT_DIR/tests/golden-legal/smoke-legal-request.json"
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

  before="$(latest_bundle 2>/dev/null || true)"
  "$ROOT_DIR/scripts/demo-local-legal-review.sh" >/dev/null
  after="$(latest_bundle)"

  if [ -n "$before" ] && [ "$before" = "$after" ]; then
    echo "demo run did not create a new complete evidence bundle under $EVIDENCE_BASE" >&2
    exit 1
  fi

  printf '%s\n' "$after"
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
  TRANSCRIPT_REQUEST_FILE="$LEGACY_REQUEST_FILE"
fi
AUDIT_PATH="$EVIDENCE_DIR/audit_events.json"
if [ -f "$EVIDENCE_DIR/demo-summary.json" ]; then
  AUDIT_PATH="$(jq -r --arg fallback "$AUDIT_PATH" '.audit_event_location // $fallback' "$EVIDENCE_DIR/demo-summary.json")"
fi

{
  printf '# Local Legal Review Demo Transcript\n\n'
  printf '%s\n' "- evidence bundle: \`$EVIDENCE_DIR\`"
  printf '%s\n' "- request fixture: \`$TRANSCRIPT_REQUEST_FILE\`"
  printf '%s\n\n' "- audit evidence path: \`$AUDIT_PATH\`"

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
    "- source: `\(.local_output.legal_json.source // "missing")`"
  ' "$EVIDENCE_DIR/chat_completion.json"
  printf '\n'

  printf '## Parsed JSON Excerpt\n\n'
  printf '```json\n'
  jq '
    .choices[0].message.content
    | fromjson
    | {
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
  ' "$EVIDENCE_DIR/chat_completion.json"
  printf '```\n\n'

  printf '## Audit Evidence\n\n'
  printf '%s\n' "- audit evidence path: \`$AUDIT_PATH\`"
  printf '%s\n' "- audit events captured: \`$(jq 'length' "$EVIDENCE_DIR/audit_events.json")\`"
} | tee "$TRANSCRIPT_PATH"

echo
echo "Saved transcript to $TRANSCRIPT_PATH"
