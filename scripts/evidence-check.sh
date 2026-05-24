#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

check_help_surface() {
  local help_output="$1"
  local required_terms=(
    "--output"
    "--list"
    "--validate"
    "--archive"
    "--archive-output"
    "--verify-archive"
    "--print-manifest"
    "--include-audit-events"
    "--json"
  )

  for term in "${required_terms[@]}"; do
    rg -q -F -- "$term" "$help_output" || {
      echo "ignispromptctl evidence-bundle help is missing: $term" >&2
      exit 1
    }
  done
}

check_alignment_terms() {
  local files=(
    "README.md"
    "docs/DEMO.md"
    "docs/TESTING.md"
    "docs/CODEX_HANDOFF.md"
    "apps/aethra/src/api/fixtures.ts"
    "apps/aethra/src/routes/EvidenceBundleViewer.tsx"
    "apps/aethra/src/routes/evidenceBundleReport.ts"
  )
  local required_terms=(
    "local-preview"
    "local-only"
    "non-certified"
    "not signed"
    "not production attestation"
    "local validation helper"
    "structural local validation only"
  )

  for term in "${required_terms[@]}"; do
    rg -q -F -- "$term" "${files[@]}" || {
      echo "evidence workflow alignment term missing: $term" >&2
      exit 1
    }
  done
}

require_cmd bash
require_cmd cargo
require_cmd rg
require_cmd git

bash -n scripts/demo-local-evidence-workflow.sh
./scripts/demo-local-evidence-workflow.sh --dry-run >/dev/null
./scripts/demo-local-evidence-workflow.sh --self-test

help_output="$(mktemp "${TMPDIR:-/tmp}/ignispromptctl-evidence-help.XXXXXX")"
trap 'rm -f "$help_output"' EXIT
cargo run --quiet -p ignispromptctl -- evidence-bundle --help >"$help_output"
check_help_surface "$help_output"
check_alignment_terms

echo "[OK] local evidence workflow regression checks passed"
