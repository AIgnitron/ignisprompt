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

unsafe_phrases=(
  "CO2 saved"
  "CO₂ saved"
  "carbon saved"
  "actual emissions"
  "actual carbon accounting"
  "ESG certified"
  "ESG certification"
  "production compliance"
  "zero emissions"
  "certified sustainability reporting"
)

unsafe_regex='CO2 saved|CO₂ saved|carbon saved|actual emissions|actual carbon accounting|ESG certified|ESG certification|production compliance|zero emissions|certified sustainability reporting'

tmp_matches="$(mktemp "${TMPDIR:-/tmp}/ignisprompt-sustainability-language.XXXXXX")"
trap 'rm -f "$tmp_matches"' EXIT

contains_case_insensitive() {
  local haystack
  local needle
  haystack="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  needle="$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')"
  [[ "$haystack" == *"$needle"* ]]
}

claim_is_allowed() {
  local line="$1"
  local phrase="$2"

  case "$phrase" in
    "actual carbon accounting")
      contains_case_insensitive "$line" "not actual carbon accounting"
      ;;
    "ESG certification")
      contains_case_insensitive "$line" "not ESG certification"
      ;;
    "production compliance")
      contains_case_insensitive "$line" "not production compliance evidence"
      ;;
    "certified sustainability reporting")
      contains_case_insensitive "$line" "not certified sustainability reporting" ||
        contains_case_insensitive "$line" "no certified sustainability reporting"
      ;;
    *)
      return 1
      ;;
  esac
}

while IFS= read -r match; do
  line="${match#*:*:}"
  for phrase in "${unsafe_phrases[@]}"; do
    if contains_case_insensitive "$line" "$phrase" &&
      ! claim_is_allowed "$line" "$phrase"; then
      printf '%s [unsafe phrase: %s]\n' "$match" "$phrase" >>"$tmp_matches"
    fi
  done
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
  sort -u "$tmp_matches"
  echo
  echo "[sustainability-language] use estimated/proxy/counterfactual/methodology-dependent language instead."
  exit 1
fi

echo "[sustainability-language] ok"
