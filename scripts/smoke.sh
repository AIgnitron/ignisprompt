#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${IGNISPROMPT_BASE_URL:-http://127.0.0.1:8765}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[S01] health"
curl -fsS "$BASE_URL/health" | jq .

echo "[S01b] models"
curl -fsS "$BASE_URL/v1/models" | jq -e '
  (.models | type == "array") and
  ([.models[]? | select((.tier == 3) and ((.domains // []) | map(ascii_downcase) | index("legal")))] | length >= 1)
'

echo "[S02/S04/S05] legal route explain"
curl -fsS -X POST "$BASE_URL/v1/route/explain" \
  -H 'content-type: application/json' \
  --data-binary "@$ROOT_DIR/tests/golden-legal/smoke-legal-request.json" | jq .

echo "[S02] OpenAI-compatible chat completions"
curl -fsS -X POST "$BASE_URL/v1/chat/completions" \
  -H 'content-type: application/json' \
  --data-binary "@$ROOT_DIR/tests/golden-legal/smoke-legal-request.json" | jq .

echo "[S09] adversarial document instruction must not alter routing or audit"
curl -fsS -X POST "$BASE_URL/v1/route/explain" \
  -H 'content-type: application/json' \
  --data-binary "@$ROOT_DIR/tests/golden-legal/adversarial-contract-instruction.json" | jq .

echo "[S06] audit events"
curl -fsS "$BASE_URL/v1/audit/events" | jq .

echo "[OK] smoke script completed"
