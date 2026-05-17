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

echo "[S01c] model and runner status hints"
curl -fsS "$BASE_URL/v1/status/models" | jq -e '
  (.schemaVersion | type == "string") and
  (.generatedAt | type == "string") and
  (.source == "local-daemon") and
  (.statusHints | type == "array") and
  all(.statusHints[]?; (.availability as $availability | ["configured", "staged", "runner-missing", "model-file-missing", "unavailable", "unknown"] | index($availability) != null))
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

echo "[S07] sustainability metrics"
curl -fsS "$BASE_URL/v1/metrics/sustainability?period=30d" | jq -e '
  (.period == "30d") and
  (.requests_total | type == "number") and
  (.local_request_rate | type == "number") and
  (.tier_breakdown | type == "object") and
  (.estimated_cloud_cost_avoided_usd | type == "number") and
  (.estimated_carbon_avoided_kgco2e | type == "number") and
  (.estimated_data_kept_local_gb | type == "number") and
  (.baseline_provider == "openai") and
  (.baseline_model == "gpt-4.1-mini") and
  (.methodology_version == "aethra-impact-0.1") and
  (.confidence == "low") and
  (.disclaimer | type == "string")
'

echo "[OK] smoke script completed"
