#!/usr/bin/env bash
set -euo pipefail

model=""
prompt_file=""
max_tokens=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --model)
      model="${2:-}"
      shift 2
      ;;
    --prompt-file)
      prompt_file="${2:-}"
      shift 2
      ;;
    --max-tokens)
      max_tokens="${2:-}"
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [ -z "$model" ] || [ ! -f "$model" ]; then
  echo "model file is missing: $model" >&2
  exit 1
fi

model="$(cd "$(dirname "$model")" && pwd)/$(basename "$model")"

if [ -z "$prompt_file" ] || [ ! -f "$prompt_file" ]; then
  echo "prompt file is missing: $prompt_file" >&2
  exit 1
fi

if [ -z "$max_tokens" ]; then
  max_tokens="256"
fi

export OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"
export OLLAMA_NO_CLOUD="${OLLAMA_NO_CLOUD:-true}"

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/ignisprompt-ollama-XXXXXX")"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

model_name="ignisprompt-legal-local"
cat >"$tmp_dir/Modelfile" <<EOF
FROM $model
SYSTEM You are a careful legal analysis assistant. Answer directly and cite concrete contract risks when they are present.
PARAMETER num_predict $max_tokens
PARAMETER temperature 0
EOF

ollama create "$model_name" -f "$tmp_dir/Modelfile" >/dev/null
jq -Rn \
  --arg model "$model_name" \
  --rawfile prompt "$prompt_file" \
  --argjson max_tokens "$max_tokens" \
  '{
    model: $model,
    prompt: $prompt,
    stream: false,
    options: {
      num_predict: $max_tokens,
      temperature: 0
    }
  }' \
  | curl -fsS "$OLLAMA_HOST/api/generate" \
      -H 'content-type: application/json' \
      --data-binary @- \
  | jq -r '.response'
