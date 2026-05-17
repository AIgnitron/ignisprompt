#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

scan_paths=(
  "README.md"
  "docs"
  "apps/aethra/src"
  "crates/ignispromptd/src"
  "scripts"
)

unsafe_regex='CO2 saved|CO₂ saved|carbon saved|actual emissions|actual carbon accounting|ESG certified|ESG certification|production compliance|zero emissions|certified sustainability reporting'
safe_regex='not actual carbon accounting|not ESG certification|not production compliance evidence|not certified sustainability reporting|no certified sustainability reporting|not measured energy use, not actual carbon accounting|estimated CO₂ avoided|counterfactual proxy estimates|methodology-dependent'

tmp_matches="$(mktemp "${TMPDIR:-/tmp}/ignisprompt-sustainability-language.XXXXXX")"
trap 'rm -f "$tmp_matches"' EXIT

while IFS= read -r match; do
  if ! printf '%s\n' "$match" | rg -i --quiet "$safe_regex"; then
    printf '%s\n' "$match" >>"$tmp_matches"
  fi
done < <(
  rg -n -i \
    --glob '*.md' \
    --glob '*.rs' \
    --glob '*.ts' \
    --glob '*.tsx' \
    --glob '*.js' \
    --glob '*.mjs' \
    --glob '*.sh' \
    --glob '!apps/aethra/dist/**' \
    --glob '!target/**' \
    --glob '!local-evidence/**' \
    --glob '!models/**' \
    --glob '!data/audit/**' \
    --glob '!scripts/check-sustainability-language.sh' \
    "$unsafe_regex" \
    "${scan_paths[@]}" || true
)

if [[ -s "$tmp_matches" ]]; then
  echo "[sustainability-language] unsafe sustainability claim language found:"
  cat "$tmp_matches"
  echo
  echo "[sustainability-language] use estimated/proxy/counterfactual/methodology-dependent language instead."
  exit 1
fi

echo "[sustainability-language] ok"
