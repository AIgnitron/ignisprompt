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
    echo "missing expected operator-check content in $label: $pattern" >&2
    exit 1
  fi
}

reject_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Eiq -- "$pattern" "$file"; then
    echo "unsafe operator-check content in $label: $pattern" >&2
    exit 1
  fi
}

require_file_contains() {
  local file="$1"
  local pattern="$2"

  if ! grep -Eiq -- "$pattern" "$file"; then
    echo "missing expected operator alignment in $file: $pattern" >&2
    exit 1
  fi
}

scan_safe_output() {
  local file="$1"
  local label="$2"

  reject_contains "$file" 'production readiness|production deployment|legal accuracy' "$label"
  reject_contains "$file" 'compliance certification|security certification|signed attestation' "$label"
  reject_contains "$file" 'tamper-evident|cryptographic verification|model controls|runner controls' "$label"
  reject_contains "$file" 'prompt:|raw user text|raw audit|api[_ -]?key|secret|token' "$label"
  reject_contains "$file" 'localhost|127\.0\.0\.1|hostname|username|machine identifier' "$label"
  reject_contains "$file" '/Users/|/home/|/private/|/var/|C:\\' "$label"
}

require_cmd cargo
require_cmd git
require_cmd grep
require_cmd make

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-operator-check.XXXXXX")"
PACKAGE_DIR="local-evidence/operator/operator-check-$$"
trap 'rm -rf "$TMP_DIR" "$PACKAGE_DIR"' EXIT

bash -n scripts/operator-check.sh
bash -n scripts/readiness-check.sh
bash -n scripts/evidence-check.sh
bash -n scripts/demo-local-evidence-workflow.sh

cargo run --quiet -p ignispromptctl -- operator-summary --help >"$TMP_DIR/operator-help.txt"
require_contains "$TMP_DIR/operator-help.txt" 'Summarize the local preview operator workflow' "operator-summary help"
require_contains "$TMP_DIR/operator-help.txt" '--json' "operator-summary help"
require_contains "$TMP_DIR/operator-help.txt" '--package-output' "operator-summary help"
require_contains "$TMP_DIR/operator-help.txt" '--package-list' "operator-summary help"
require_contains "$TMP_DIR/operator-help.txt" '--package-validate' "operator-summary help"

cargo run --quiet -p ignispromptctl -- operator-summary >"$TMP_DIR/operator-summary.txt"
require_contains "$TMP_DIR/operator-summary.txt" 'IgnisPrompt Local Operator Summary' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'local preview operator workflow only' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'status hints, not controls' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'local helper checks, not certification' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'package validation is structural/local only' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'archives and packages are not signed' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'cargo run -p ignispromptctl -- readiness --json' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'cargo run -p ignispromptctl -- policy-scenarios' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'make policy-check' "operator summary"
require_contains "$TMP_DIR/operator-summary.txt" 'make evidence-check' "operator summary"
scan_safe_output "$TMP_DIR/operator-summary.txt" "operator summary"

cargo run --quiet -p ignispromptctl -- operator-summary --json >"$TMP_DIR/operator-summary.json"
require_contains "$TMP_DIR/operator-summary.json" '"operator_summary_schema_version"' "operator summary json"
require_contains "$TMP_DIR/operator-summary.json" '"mode": "local-preview"' "operator summary json"
require_contains "$TMP_DIR/operator-summary.json" '"execution_mode": "copy_only"' "operator summary json"
require_contains "$TMP_DIR/operator-summary.json" 'local-evidence/readiness/demo' "operator summary json"
require_contains "$TMP_DIR/operator-summary.json" 'local-evidence/policy/demo' "operator summary json"
reject_contains "$TMP_DIR/operator-summary.json" '"string"' "operator summary json"
scan_safe_output "$TMP_DIR/operator-summary.json" "operator summary json"

cargo run --quiet -p ignispromptctl -- operator-summary --package-output "$PACKAGE_DIR" --json >"$TMP_DIR/operator-package-summary.json"
require_contains "$TMP_DIR/operator-package-summary.json" '"operator_package_schema_version"' "operator package summary json"
require_contains "$TMP_DIR/operator-package-summary.json" '"package_mode": "local-preview"' "operator package summary json"
require_contains "$TMP_DIR/operator-package-summary.json" '"local_only": true' "operator package summary json"
test -f "$PACKAGE_DIR/README.md"
test -f "$PACKAGE_DIR/manifest.json"
test -f "$PACKAGE_DIR/operator-summary.json"
test -f "$PACKAGE_DIR/operator-report.json"
test -f "$PACKAGE_DIR/operator-report.md"
require_contains "$PACKAGE_DIR/README.md" 'local preview operator workflow only' "operator package README"
require_contains "$PACKAGE_DIR/README.md" 'package validation is structural/local only' "operator package README"
require_contains "$PACKAGE_DIR/README.md" 'not signed' "operator package README"
scan_safe_output "$TMP_DIR/operator-package-summary.json" "operator package summary json"
scan_safe_output "$PACKAGE_DIR/README.md" "operator package README"
scan_safe_output "$PACKAGE_DIR/operator-report.md" "operator package report markdown"

cargo run --quiet -p ignispromptctl -- operator-summary --package-list "$PACKAGE_DIR" --json >"$TMP_DIR/operator-package-list.json"
require_contains "$TMP_DIR/operator-package-list.json" '"status": "ok"' "operator package list json"
require_contains "$TMP_DIR/operator-package-list.json" 'operator-report.md' "operator package list json"
scan_safe_output "$TMP_DIR/operator-package-list.json" "operator package list json"

cargo run --quiet -p ignispromptctl -- operator-summary --package-validate "$PACKAGE_DIR" --json >"$TMP_DIR/operator-package-validate.json"
require_contains "$TMP_DIR/operator-package-validate.json" '"status": "ok"' "operator package validate json"
require_contains "$TMP_DIR/operator-package-validate.json" 'local helper checks, not certification' "operator package validate json"
scan_safe_output "$TMP_DIR/operator-package-validate.json" "operator package validate json"

cargo run --quiet -p ignispromptctl -- readiness --help >"$TMP_DIR/readiness-help.txt"
require_contains "$TMP_DIR/readiness-help.txt" '--package-output' "readiness help"
require_contains "$TMP_DIR/readiness-help.txt" '--package-list' "readiness help"
require_contains "$TMP_DIR/readiness-help.txt" '--package-validate' "readiness help"

cargo run --quiet -p ignispromptctl -- policy-scenarios --help >"$TMP_DIR/policy-help.txt"
require_contains "$TMP_DIR/policy-help.txt" '--package-output' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--package-list' "policy help"
require_contains "$TMP_DIR/policy-help.txt" '--package-validate' "policy help"

make -n readiness-check >/dev/null
make -n policy-check >/dev/null
make -n evidence-check >/dev/null
make -n operator-check >/dev/null

./scripts/demo-local-evidence-workflow.sh --self-test >/dev/null

require_file_contains "Makefile" 'operator-check'
require_file_contains "apps/aethra/src/App.tsx" 'Local operator console'
require_file_contains "apps/aethra/src/routes/LocalOperatorConsole.tsx" 'Copy-only operator command recipes'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.ts" 'status hints, not controls'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.ts" 'local helper checks, not certification'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.ts" 'structural/local package validation only'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.ts" 'local-evidence/operator/demo'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.ts" 'local-evidence/policy/demo'
require_file_contains "apps/aethra/src/routes/LocalOperatorConsole.tsx" 'Operator package preview'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.test.ts" 'local-evidence/readiness/demo'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.test.ts" 'local-evidence/policy/demo'
require_file_contains "apps/aethra/src/routes/operatorConsoleSummary.test.ts" 'operator-report.md'
require_file_contains "apps/aethra/src/routes/LocalOperatorConsole.test.tsx" 'Aethra local operator console'
require_file_contains "README.md" 'operator-check'
require_file_contains "docs/DEMO.md" 'Local Operator Console'
require_file_contains "docs/TESTING.md" 'operator-check'
require_file_contains "docs/CODEX_HANDOFF.md" 'local operator console'
require_file_contains "docs/ROADMAP.md" 'local operator console'
require_file_contains "docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md" 'operator-check'
require_file_contains "docs/AETHRA_DEMO_PACKAGE.md" 'Local Operator Console'

echo "[OK] local operator console checks passed"
