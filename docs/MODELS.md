# Models

IgnisPrompt uses JSON model manifests to describe local model candidates. The repository does not include model weights.

## Model storage policy

- Keep local model files under `./models/` or another ignored local path.
- Do not commit model weights.
- Keep `./models/**` ignored by git.
- Do not add model download artifacts to commits.
- Keep local bakeoff and demo output under `./local-evidence/`, which is also ignored by git.

## Current manifest

The repository includes:

```text
config/models/legal-qwen2_5-0_5b-instruct-q4.json
```

It points to:

```text
./models/qwen2.5-0.5b-instruct-q4_k_m.gguf
```

Qwen2.5 0.5B is a pipe/demo baseline for validating the local GGUF path. It is not the settled legal-quality model, and passing smoke tests with it should not be described as legal accuracy solved.

## Manifest fields

- `modelId`: stable id used in route decisions.
- `displayName`: human-readable model name.
- `tier`: routing tier, currently legal domain models use Tier 3.
- `domains`: domains for route matching, such as `legal`, `contracts`, and `compliance`.
- `format`: model format, currently `gguf` for the local spike.
- `quantization`: optional quantization label.
- `contextWindow`: optional context size.
- `localPath`: local file path for the model weights.
- `promptPack`: optional prompt-pack file under `config/prompts`.
- `responseFormat`: optional runner format hint, currently `none`, `json`, or `schema`.
- `sha256`: expected local file hash for operator verification.
- `version`: model or adapter version label.
- `installed`: route eligibility flag used by the scaffold registry.
- `source`: local source label.

In the current scaffold, `installed: true` means the manifest is eligible for routing. The default daemon can still complete through `StubLegalRunner` even if the `localPath` file is absent. The feature-gated `GgufRunner` only runs when the local file and runner binary both exist.

## GGUF runner baseline

The optional runner contract is:

```text
--model <localPath> --prompt-file <temp file> --max-tokens <n>
```

The runner writes assistant text to stdout and exits `0`. Non-zero exit status, empty stdout, unreadable prompt packs, missing model files, or missing runner binaries cause fallback to the next legal runner.

The current `scripts/ollama-gguf-runner.sh` wrapper creates a local Ollama model from a local GGUF file, sends `/api/generate` to the configured local `OLLAMA_HOST`, and returns `.response`.

## Candidate bakeoff

`./scripts/run-alpha-legal-bakeoff-v0.1.sh` knows about these local candidate paths:

- `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
- `./models/qwen2.5-7b-instruct-q4_k_m.gguf`
- `./models/saul-instruct-v1.q4_k_m.gguf`
- `./models/Phi-3.5-mini-instruct.q5_k_m.gguf`

Missing candidate files are recorded as skipped instead of being downloaded or committed.

## Model selection status

No model is currently certified or declared production legal-quality. Model choice remains an open local bakeoff question. Docs, demos, PR descriptions, and release notes must not claim legal advice quality, legal accuracy solved, enterprise compliance certification, or enterprise attestation.
