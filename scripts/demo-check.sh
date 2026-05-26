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
    echo "missing expected demo-check content in $label: $pattern" >&2
    exit 1
  fi
}

reject_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Eiq -- "$pattern" "$file"; then
    echo "unsafe demo-check content in $label: $pattern" >&2
    exit 1
  fi
}

require_file_contains() {
  local file="$1"
  local pattern="$2"

  if ! grep -Eiq -- "$pattern" "$file"; then
    echo "missing expected demo alignment in $file: $pattern" >&2
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

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-demo-check.XXXXXX")"
PACKAGE_DIR="local-evidence/demo-studio/demo-check-$$"
trap 'rm -rf "$TMP_DIR" "$PACKAGE_DIR"' EXIT

bash -n scripts/demo-check.sh
bash -n scripts/demo-local-evidence-workflow.sh
bash -n scripts/policy-check.sh
bash -n scripts/operator-check.sh
bash -n scripts/readiness-check.sh
bash -n scripts/evidence-check.sh

cargo run --quiet -p ignispromptctl -- demo-summary --help >"$TMP_DIR/demo-help.txt"
require_contains "$TMP_DIR/demo-help.txt" 'Summarize the local preview demo story' "demo help"
require_contains "$TMP_DIR/demo-help.txt" '--json' "demo help"
require_contains "$TMP_DIR/demo-help.txt" '--report' "demo help"
require_contains "$TMP_DIR/demo-help.txt" '--package-output' "demo help"
require_contains "$TMP_DIR/demo-help.txt" '--package-list' "demo help"
require_contains "$TMP_DIR/demo-help.txt" '--package-validate' "demo help"

cargo run --quiet -p ignispromptctl -- demo-summary >"$TMP_DIR/demo-summary.txt"
require_contains "$TMP_DIR/demo-summary.txt" 'IgnisPrompt Local Demo Summary' "demo summary"
require_contains "$TMP_DIR/demo-summary.txt" 'local preview demo only' "demo summary"
require_contains "$TMP_DIR/demo-summary.txt" 'route/status/package values are hints, not guarantees' "demo summary"
require_contains "$TMP_DIR/demo-summary.txt" 'local helper checks, not certification' "demo summary"
require_contains "$TMP_DIR/demo-summary.txt" 'Local readiness' "demo summary"
require_contains "$TMP_DIR/demo-summary.txt" 'Policy scenarios' "demo summary"
require_contains "$TMP_DIR/demo-summary.txt" 'make demo-check' "demo summary"
scan_safe_output "$TMP_DIR/demo-summary.txt" "demo summary"

cargo run --quiet -p ignispromptctl -- demo-summary --json >"$TMP_DIR/demo.json"
require_contains "$TMP_DIR/demo.json" '"demo_summary_schema_version"' "demo json"
require_contains "$TMP_DIR/demo.json" '"mode": "local-preview"' "demo json"
require_contains "$TMP_DIR/demo.json" '"local_preview_demo_only": true' "demo json"
require_contains "$TMP_DIR/demo.json" '"story_steps"' "demo json"
require_contains "$TMP_DIR/demo.json" '"make demo-check"' "demo json"
reject_contains "$TMP_DIR/demo.json" '"string"' "demo json"
scan_safe_output "$TMP_DIR/demo.json" "demo json"

cargo run --quiet -p ignispromptctl -- demo-summary --report >"$TMP_DIR/demo-report.md"
require_contains "$TMP_DIR/demo-report.md" 'IgnisPrompt Local Demo Summary Report' "demo report"
require_contains "$TMP_DIR/demo-report.md" 'local preview demo guidance only' "demo report"
require_contains "$TMP_DIR/demo-report.md" 'Demo Story' "demo report"
scan_safe_output "$TMP_DIR/demo-report.md" "demo report"

cargo run --quiet -p ignispromptctl -- demo-summary --package-output "$PACKAGE_DIR" --json >"$TMP_DIR/demo-package-summary.json"
require_contains "$TMP_DIR/demo-package-summary.json" '"demo_package_schema_version"' "demo package summary json"
require_contains "$TMP_DIR/demo-package-summary.json" '"package_mode": "local-preview"' "demo package summary json"
require_contains "$TMP_DIR/demo-package-summary.json" '"local_only": true' "demo package summary json"
require_contains "$TMP_DIR/demo-package-summary.json" '"demo_status": "demo_guidance"' "demo package summary json"
test -f "$PACKAGE_DIR/README.md"
test -f "$PACKAGE_DIR/manifest.json"
test -f "$PACKAGE_DIR/demo-summary.json"
test -f "$PACKAGE_DIR/demo-report.json"
test -f "$PACKAGE_DIR/demo-report.md"
require_contains "$PACKAGE_DIR/README.md" 'local preview demo only' "demo package README"
require_contains "$PACKAGE_DIR/README.md" 'package validation is structural/local only' "demo package README"
require_contains "$PACKAGE_DIR/README.md" 'not signed' "demo package README"
scan_safe_output "$TMP_DIR/demo-package-summary.json" "demo package summary json"
scan_safe_output "$PACKAGE_DIR/README.md" "demo package README"
scan_safe_output "$PACKAGE_DIR/demo-report.md" "demo package report markdown"

cargo run --quiet -p ignispromptctl -- demo-summary --package-list "$PACKAGE_DIR" --json >"$TMP_DIR/demo-package-list.json"
require_contains "$TMP_DIR/demo-package-list.json" '"status": "ok"' "demo package list json"
require_contains "$TMP_DIR/demo-package-list.json" 'demo-report.md' "demo package list json"
scan_safe_output "$TMP_DIR/demo-package-list.json" "demo package list json"

cargo run --quiet -p ignispromptctl -- demo-summary --package-validate "$PACKAGE_DIR" --json >"$TMP_DIR/demo-package-validate.json"
require_contains "$TMP_DIR/demo-package-validate.json" '"status": "ok"' "demo package validate json"
require_contains "$TMP_DIR/demo-package-validate.json" 'demo_package_schema_version' "demo package validate json"
scan_safe_output "$TMP_DIR/demo-package-validate.json" "demo package validate json"

./scripts/demo-local-evidence-workflow.sh --self-test >/dev/null
make -n demo-check >/dev/null
make -n policy-check >/dev/null
make -n operator-check >/dev/null
make -n readiness-check >/dev/null
make -n evidence-check >/dev/null

require_file_contains "Makefile" 'demo-check'
require_file_contains "scripts/dev-check.sh" 'make demo-check'
require_file_contains "scripts/demo-local-evidence-workflow.sh" 'demo-summary --package-output'
require_file_contains "apps/aethra/src/App.tsx" 'Local demo studio'
require_file_contains "apps/aethra/src/routes/LocalDemoStudio.tsx" 'Aethra local demo studio'
require_file_contains "apps/aethra/src/routes/demoStudioSummary.ts" 'local-evidence/demo-studio/demo'
require_file_contains "apps/aethra/src/routes/LocalDemoStudio.test.tsx" 'demo-summary.json'
require_file_contains "docs/TESTING.md" 'demo-check'
require_file_contains "docs/CODEX_HANDOFF.md" 'local demo studio'
require_file_contains "docs/ROADMAP.md" 'local demo studio'
require_file_contains "docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md" 'demo-check'
require_file_contains "docs/AETHRA_DEMO_PACKAGE.md" 'Local Demo Studio'

echo "[OK] local demo studio checks passed"
