#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p data/audit
export RUST_LOG="${RUST_LOG:-ignispromptd=info,tower_http=info}"

cargo run -p ignispromptd -- \
  --bind "${IGNISPROMPT_BIND:-127.0.0.1:8765}" \
  --model-dir "${IGNISPROMPT_MODEL_DIR:-./config/models}" \
  --audit-log "${IGNISPROMPT_AUDIT_LOG:-./data/audit/events.jsonl}" \
  --local-only
