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

check_help_terms() {
  local help_output="$1"
  shift

  for term in "$@"; do
    rg -q -F -- "$term" "$help_output" || {
      echo "help surface is missing: $term" >&2
      echo "help output: $help_output" >&2
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
    "docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md"
    "apps/aethra/src/routes/LocalReadiness.tsx"
    "apps/aethra/src/routes/readinessReport.ts"
    "apps/aethra/src/routes/readinessReport.test.ts"
    "apps/aethra/src/routes/localReadinessSummary.ts"
    "apps/aethra/src/routes/localReadiness.test.ts"
  )
  local required_terms=(
    "local preview readiness"
    "status hints, not controls"
    "local helper checks"
    "not certification"
    "manual live-local loading"
    "no telemetry"
    "no cloud calls by default"
  )

  for term in "${required_terms[@]}"; do
    rg -q -F -- "$term" "${files[@]}" || {
      echo "readiness alignment term missing: $term" >&2
      exit 1
    }
  done
}

require_cmd bash
require_cmd cargo
require_cmd git
require_cmd rg

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-readiness-check.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

bash -n scripts/evidence-check.sh
bash -n scripts/demo-local-evidence-workflow.sh
bash -n scripts/readiness-check.sh

./scripts/demo-local-evidence-workflow.sh --dry-run >/dev/null
./scripts/demo-local-evidence-workflow.sh --self-test >/dev/null

cargo run --quiet -p ignispromptctl -- doctor --help >"$tmp_dir/doctor-help.txt"
check_help_terms \
  "$tmp_dir/doctor-help.txt" \
  "Check local daemon readiness for local preview" \
  "--json"

cargo run --quiet -p ignispromptctl -- readiness --help >"$tmp_dir/readiness-help.txt"
check_help_terms \
  "$tmp_dir/readiness-help.txt" \
  "Summarize local preview readiness from existing daemon checks" \
  "--json" \
  "--markdown"

cargo test --quiet -p ignispromptctl readiness_ >/dev/null

cargo run --quiet -p ignispromptctl -- health --help >"$tmp_dir/health-help.txt"
check_help_terms "$tmp_dir/health-help.txt" "Check daemon health"

cargo run --quiet -p ignispromptctl -- route-explain --help >"$tmp_dir/route-help.txt"
check_help_terms \
  "$tmp_dir/route-help.txt" \
  "Explain routing for synthetic or non-sensitive local preview text/request JSON" \
  "--text" \
  "--input" \
  "--json"

cargo run --quiet -p ignispromptctl -- audit-events --help >"$tmp_dir/audit-events-help.txt"
check_help_terms \
  "$tmp_dir/audit-events-help.txt" \
  "Inspect local audit events from the daemon" \
  "--json"

cargo run --quiet -p ignispromptctl -- evidence-bundle --help >"$tmp_dir/evidence-help.txt"
check_help_terms \
  "$tmp_dir/evidence-help.txt" \
  "--output" \
  "--validate" \
  "--archive" \
  "--verify-archive" \
  "--print-manifest"

./scripts/evidence-check.sh >/dev/null
check_alignment_terms

echo "[OK] local readiness quality gate passed"
