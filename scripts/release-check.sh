#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[release-check] sustainability language"
./scripts/check-sustainability-language.sh

echo "[release-check] cargo test"
cargo test

echo "[release-check] default dev-check"
./scripts/dev-check.sh

echo "[release-check] Aethra npm test"
(
  cd apps/aethra
  npm test
)

echo "[release-check] Aethra npm build"
(
  cd apps/aethra
  npm run build
)

echo "[release-check] git diff --check"
git diff --check

echo "[release-check] completed"
