#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OUTPUT_PATH="${IGNISPROMPT_SBOM_OUTPUT:-local-evidence/sbom/ignisprompt.cdx.json}"

usage() {
  cat <<'EOF'
Usage: ./scripts/generate-sbom-local.sh [--dry-run|--help]

Optionally generates a local CycloneDX SBOM with cargo-cyclonedx when installed.

Install locally with:
  cargo install cargo-cyclonedx --locked

Default output:
  local-evidence/sbom/ignisprompt.cdx.json

The output path is under ignored local-evidence by default. Review any SBOM
artifact before intentionally tracking it. This helper does not upload data and
does not claim SBOM completeness, certification, or compliance.
EOF
}

case "${1:-}" in
  --help|-h)
    usage
    exit 0
    ;;
  --dry-run)
    echo "[sbom] would write CycloneDX SBOM to $OUTPUT_PATH"
    if command -v cargo-cyclonedx >/dev/null 2>&1; then
      echo "[sbom] cargo-cyclonedx is installed"
    else
      echo "[sbom] cargo-cyclonedx is not installed; install with: cargo install cargo-cyclonedx --locked"
    fi
    exit 0
    ;;
  "")
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

if ! command -v cargo-cyclonedx >/dev/null 2>&1; then
  cat >&2 <<'EOF'
[sbom] cargo-cyclonedx is not installed.

Install locally with:
  cargo install cargo-cyclonedx --locked

Or inspect the planned command with:
  ./scripts/generate-sbom-local.sh --dry-run
EOF
  exit 127
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"
echo "[sbom] generating CycloneDX SBOM at $OUTPUT_PATH"
cargo cyclonedx --format json --output-file "$OUTPUT_PATH"
