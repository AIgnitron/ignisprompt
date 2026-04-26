#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${IGNISPROMPT_BASE_URL:-http://127.0.0.1:8765}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

response="$(curl -fsS -X POST "$BASE_URL/v1/chat/completions" \
  -H 'content-type: application/json' \
  --data-binary "@$ROOT_DIR/tests/golden-legal/smoke-legal-request.json")"

echo "$response" | jq .
echo "$response" | jq -e '.route.tier == "TIER_3"' >/dev/null
echo "$response" | jq -e '(.choices[0].message.content | length) > 40' >/dev/null
echo "$response" | jq -e '(.choices[0].message.content | contains("StubLegalRunner handled")) | not' >/dev/null

echo "[OK] GGUF local smoke completed"
