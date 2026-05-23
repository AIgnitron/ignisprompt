#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/cargo-audit-local.sh

Runs cargo-audit against Cargo.lock when cargo-audit is installed.

Install locally with:
  cargo install cargo-audit --locked

This helper performs a local dependency advisory check. It does not upload
dependency data, call project telemetry, or claim supply-chain certification.
EOF
  exit 0
fi

if ! command -v cargo-audit >/dev/null 2>&1; then
  cat >&2 <<'EOF'
[cargo-audit] cargo-audit is not installed.

Install locally with:
  cargo install cargo-audit --locked

Then rerun:
  ./scripts/cargo-audit-local.sh

This optional helper is not part of default CI unless the workflow installs the
tool deterministically.
EOF
  exit 127
fi

echo "[cargo-audit] cargo audit"
cargo audit
