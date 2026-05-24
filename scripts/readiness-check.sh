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

check_safe_output() {
  local output_file="$1"

  if rg -q -F '"string"' "$output_file"; then
    echo "readiness output contains placeholder-like literal string: $output_file" >&2
    exit 1
  fi

  if rg -q -i 'prompt:|raw user text|raw audit text|api_key|api key|sk-|ghp_|hostname|username|machine identifier|/Users/|/home/|/private/|localhost|127\.0\.0\.1|production readiness|legal accuracy|ESG cert[[:alpha:]]+|compliance certification|supply-chain certification|production-grade inference|production-grade security|tamper-evident|cryptographic verification|signed attestation' "$output_file"; then
    echo "readiness output contains unsafe report content: $output_file" >&2
    exit 1
  fi
}

capture_readiness_output() {
  local output_file="$1"
  shift
  local exit_code

  set +e
  cargo run --quiet -p ignispromptctl -- --daemon-url http://127.0.0.1:9 readiness "$@" >"$output_file" 2>"$output_file.stderr"
  exit_code="$?"
  set -e

  if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 1 ]; then
    echo "readiness command failed unexpectedly with exit code $exit_code: $*" >&2
    cat "$output_file.stderr" >&2
    exit 1
  fi
}

require_cmd bash
require_cmd cargo
require_cmd git
require_cmd rg

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-readiness-check.XXXXXX")"
package_dir="local-evidence/readiness/readiness-check-$$"
trap 'rm -rf "$tmp_dir" "$package_dir"' EXIT

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
  "--markdown" \
  "--package-output" \
  "--package-validate" \
  "--package-list"

cargo test --quiet -p ignispromptctl readiness_ >/dev/null
cargo test --quiet -p ignispromptctl readiness_package_ >/dev/null

capture_readiness_output "$tmp_dir/readiness-human.txt"
check_safe_output "$tmp_dir/readiness-human.txt"

capture_readiness_output "$tmp_dir/readiness-json.txt" --json
check_safe_output "$tmp_dir/readiness-json.txt"
rg -q -F '"readiness_schema_version"' "$tmp_dir/readiness-json.txt"
rg -q -F '"local_next_step"' "$tmp_dir/readiness-json.txt"

capture_readiness_output "$tmp_dir/readiness-markdown.md" --markdown
check_safe_output "$tmp_dir/readiness-markdown.md"
rg -q -F '# IgnisPrompt Local Readiness Report' "$tmp_dir/readiness-markdown.md"

capture_readiness_output "$tmp_dir/readiness-package-summary.json" --package-output "$package_dir" --json
check_safe_output "$tmp_dir/readiness-package-summary.json"
test -f "$package_dir/README.md"
test -f "$package_dir/manifest.json"
test -f "$package_dir/readiness-summary.json"
test -f "$package_dir/readiness-report.json"
test -f "$package_dir/readiness-report.md"
check_safe_output "$package_dir/README.md"
check_safe_output "$package_dir/readiness-report.md"

cargo run --quiet -p ignispromptctl -- readiness --package-list "$package_dir" --json >"$tmp_dir/readiness-package-list.json"
check_safe_output "$tmp_dir/readiness-package-list.json"
rg -q -F '"status": "ok"' "$tmp_dir/readiness-package-list.json"

cargo run --quiet -p ignispromptctl -- readiness --package-validate "$package_dir" --json >"$tmp_dir/readiness-package-validate.json"
check_safe_output "$tmp_dir/readiness-package-validate.json"
rg -q -F '"status": "ok"' "$tmp_dir/readiness-package-validate.json"

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
