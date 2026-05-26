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

require_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if ! grep -Eiq -- "$pattern" "$file"; then
    echo "missing expected policy-check content in $label: $pattern" >&2
    exit 1
  fi
}

reject_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Eiq -- "$pattern" "$file"; then
    echo "unsafe policy-check content in $label: $pattern" >&2
    exit 1
  fi
}

require_file_contains() {
  local file="$1"
  local pattern="$2"

  if ! grep -Eiq -- "$pattern" "$file"; then
    echo "missing expected policy alignment in $file: $pattern" >&2
    exit 1
  fi
}

scan_safe_output() {
  local file="$1"
  local label="$2"

  reject_contains "$file" 'production readiness|production deployment|legal accuracy|legal advice' "$label"
  reject_contains "$file" 'compliance certification|security certification|signed attestation' "$label"
  reject_contains "$file" 'tamper-evident|cryptographic verification|model controls|runner controls' "$label"
  reject_contains "$file" 'prompt:|real prompt|raw user text|raw audit|api[_ -]?key|secret|token' "$label"
  reject_contains "$file" 'localhost|127\.0\.0\.1|hostname|username|machine identifier' "$label"
  reject_contains "$file" '/Users/|/home/|/private/|/var/|C:\\' "$label"
}

require_cmd cargo
require_cmd grep
require_cmd make

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-policy-check.XXXXXX")"
PACKAGE_DIR="local-evidence/policy/policy-check-$$"
trap 'rm -rf "$TMP_DIR" "$PACKAGE_DIR"' EXIT

bash -n scripts/policy-check.sh
bash -n scripts/operator-check.sh
bash -n scripts/readiness-check.sh
bash -n scripts/evidence-check.sh

cargo run --quiet -p ignispromptctl -- policy-scenarios --help >"$TMP_DIR/policy-help.txt"
require_contains "$TMP_DIR/policy-help.txt" 'Inspect synthetic local preview policy scenarios' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--json' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--report' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--package-output' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--package-list' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--package-validate' "policy help"

cargo run --quiet -p ignispromptctl -- policy-scenarios >"$TMP_DIR/policy-summary.txt"
require_contains "$TMP_DIR/policy-summary.txt" 'IgnisPrompt Local Policy Scenarios' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'policy preview only' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'synthetic scenarios only' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'route hints, not guarantees' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'local helper checks, not certification' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'local helper request: 4' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'policy package request' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'ambiguous request' "policy summary"
require_contains "$TMP_DIR/policy-summary.txt" 'make policy-check' "policy summary"
scan_safe_output "$TMP_DIR/policy-summary.txt" "policy summary"

cargo run --quiet -p ignispromptctl -- policy-scenarios --json >"$TMP_DIR/policy.json"
require_contains "$TMP_DIR/policy.json" '"policy_scenario_schema_version"' "policy json"
require_contains "$TMP_DIR/policy.json" '"mode": "local-preview"' "policy json"
require_contains "$TMP_DIR/policy.json" '"synthetic_scenarios_only": true' "policy json"
require_contains "$TMP_DIR/policy.json" '"expected_local_only": true' "policy json"
require_contains "$TMP_DIR/policy.json" '"fail_closed_expected": true' "policy json"
require_contains "$TMP_DIR/policy.json" '"local_only_expected_count": 10' "policy json"
require_contains "$TMP_DIR/policy.json" '"fail_closed_expected_count": 2' "policy json"
require_contains "$TMP_DIR/policy.json" '"policy-package-request"' "policy json"
require_contains "$TMP_DIR/policy.json" '"unsupported-cloud-required-request"' "policy json"
reject_contains "$TMP_DIR/policy.json" '"string"' "policy json"
scan_safe_output "$TMP_DIR/policy.json" "policy json"

cargo run --quiet -p ignispromptctl -- policy-scenarios --report >"$TMP_DIR/policy-report.md"
require_contains "$TMP_DIR/policy-report.md" 'IgnisPrompt Local Policy Scenario Report' "policy report"
require_contains "$TMP_DIR/policy-report.md" 'route hints, not guarantees' "policy report"
require_contains "$TMP_DIR/policy-report.md" 'synthetic scenarios only' "policy report"
require_contains "$TMP_DIR/policy-report.md" 'Scenario Groups' "policy report"
require_contains "$TMP_DIR/policy-report.md" 'expected_tier helper: 4' "policy report"
scan_safe_output "$TMP_DIR/policy-report.md" "policy report"

cargo run --quiet -p ignispromptctl -- policy-scenarios --package-output "$PACKAGE_DIR" --json >"$TMP_DIR/policy-package-summary.json"
require_contains "$TMP_DIR/policy-package-summary.json" '"policy_package_schema_version"' "policy package summary json"
require_contains "$TMP_DIR/policy-package-summary.json" '"package_mode": "local-preview"' "policy package summary json"
require_contains "$TMP_DIR/policy-package-summary.json" '"local_only": true' "policy package summary json"
require_contains "$TMP_DIR/policy-package-summary.json" '"policy_status": "policy_preview"' "policy package summary json"
require_contains "$TMP_DIR/policy-package-summary.json" '"policy-package-request"' "policy package summary json"
test -f "$PACKAGE_DIR/README.md"
test -f "$PACKAGE_DIR/manifest.json"
test -f "$PACKAGE_DIR/policy-scenarios.json"
test -f "$PACKAGE_DIR/policy-report.json"
test -f "$PACKAGE_DIR/policy-report.md"
require_contains "$PACKAGE_DIR/README.md" 'policy preview only' "policy package README"
require_contains "$PACKAGE_DIR/README.md" 'package validation is structural/local only' "policy package README"
require_contains "$PACKAGE_DIR/README.md" 'not signed' "policy package README"
scan_safe_output "$TMP_DIR/policy-package-summary.json" "policy package summary json"
scan_safe_output "$PACKAGE_DIR/README.md" "policy package README"
scan_safe_output "$PACKAGE_DIR/policy-report.md" "policy package report markdown"

cargo run --quiet -p ignispromptctl -- policy-scenarios --package-list "$PACKAGE_DIR" --json >"$TMP_DIR/policy-package-list.json"
require_contains "$TMP_DIR/policy-package-list.json" '"status": "ok"' "policy package list json"
require_contains "$TMP_DIR/policy-package-list.json" 'policy-report.md' "policy package list json"
scan_safe_output "$TMP_DIR/policy-package-list.json" "policy package list json"

cargo run --quiet -p ignispromptctl -- policy-scenarios --package-validate "$PACKAGE_DIR" --json >"$TMP_DIR/policy-package-validate.json"
require_contains "$TMP_DIR/policy-package-validate.json" '"status": "ok"' "policy package validate json"
require_contains "$TMP_DIR/policy-package-validate.json" 'route hints, not guarantees' "policy package validate json"
require_contains "$TMP_DIR/policy-package-validate.json" 'policy_package_schema_version' "policy package validate json"
scan_safe_output "$TMP_DIR/policy-package-validate.json" "policy package validate json"

make -n policy-check >/dev/null
make -n operator-check >/dev/null
make -n readiness-check >/dev/null
make -n evidence-check >/dev/null

require_file_contains "Makefile" 'policy-check'
require_file_contains "apps/aethra/src/App.tsx" 'Local policy workbench'
require_file_contains "apps/aethra/src/routes/LocalPolicyWorkbench.tsx" 'Aethra local policy workbench'
require_file_contains "apps/aethra/src/routes/policyWorkbenchSummary.ts" 'route hints, not guarantees'
require_file_contains "apps/aethra/src/routes/policyWorkbenchSummary.ts" 'policy-package-request'
require_file_contains "apps/aethra/src/routes/policyWorkbenchSummary.ts" 'groupPolicyScenariosByCategory'
require_file_contains "apps/aethra/src/routes/policyWorkbenchSummary.ts" 'local-evidence/policy/demo'
require_file_contains "apps/aethra/src/routes/LocalPolicyWorkbench.test.tsx" 'policy-scenarios.json'
require_file_contains "apps/aethra/src/routes/LocalPolicyWorkbench.test.tsx" 'Scenario grouping helpers'
require_file_contains "apps/aethra/src/routes/policyWorkbenchSummary.test.ts" 'synthetic scenarios only'
require_file_contains "apps/aethra/src/routes/policyWorkbenchSummary.test.ts" 'filterPolicyScenariosByExpectedTier'
require_file_contains "docs/TESTING.md" 'policy-check'
require_file_contains "docs/CODEX_HANDOFF.md" 'local policy workbench'
require_file_contains "docs/ROADMAP.md" 'local policy workbench'
require_file_contains "docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md" 'policy-check'
require_file_contains "docs/AETHRA_DEMO_PACKAGE.md" 'Local Policy Workbench'

echo "[OK] local policy workbench checks passed"
