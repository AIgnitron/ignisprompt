# IgnisPrompt

**IgnisPrompt is the open-source local AI routing layer.**

This repository contains a minimal `ignispromptd` Rust daemon scaffold for the Apple Spine Smoke Test. It is intentionally small: it validates the control-plane shape before real model inference is wired in.

## Current smoke-test status

As of April 25, 2026, the local scaffold is intended to pass `./scripts/start-dev.sh` followed by `./scripts/smoke.sh` with the current control-plane scope intact:

- `/health`, `/v1/models`, `/v1/route/explain`, `/v1/chat/completions`, and `/v1/audit/events` respond locally
- legal requests route to Tier 3 with a human-readable explanation
- adversarial document instructions are detected and treated as untrusted content
- audit events are written locally
- legal chat completions default to `StubLegalRunner`
- an opt-in `GgufRunner` spike can invoke a local GGUF runner binary when both the runner executable and the configured `.gguf` model file are present

## What this scaffold includes

- `GET /health`
- `GET /v1/models`
- `POST /v1/route/explain`
- `POST /v1/chat/completions` using an OpenAI-compatible request shape
- optional feature-gated Tier 3 legal GGUF runner spike via a local subprocess contract
- Tier 3 legal chat completion dispatch through `StubLegalRunner`
- `GET /v1/audit/events`
- JSON model manifest loading
- local audit event logging
- local-only fail-closed behavior
- adversarial contract-instruction detection as untrusted document content
- smoke fixtures for legal routing

## What this scaffold does not include yet

- built-in SaulLM/Qwen/Phi inference
- production-grade GGUF/ONNX inference
- Apple Foundation Models bridge
- semantic cache
- MCP server
- streaming responses
- real hardware RAM/thermal telemetry
- signed Local-Only Attestation Report generation

## Quick start

Requires Rust and Cargo.

```bash
cargo run -p ignispromptd -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only true
```

In another terminal:

```bash
./scripts/smoke.sh
```

## GGUF Runner Spike

The default daemon build does not require GGUF tooling or model weights. `StubLegalRunner` remains the active Tier 3 path unless you explicitly compile the spike:

```bash
cargo run -p ignispromptd --features gguf-runner-spike -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only true
```

The Tier 3 legal path supports an opt-in GGUF subprocess spike behind the `gguf-runner-spike` Cargo feature. If `IGNISPROMPT_GGUF_RUNNER_BIN` points to a local executable and the selected legal manifest's `localPath` exists, `ignispromptd` will invoke that executable before falling back to `StubLegalRunner`.

The runner contract is intentionally minimal:

- `ignispromptd` invokes the binary with `--model <localPath> --prompt-file <temp file> --max-tokens <n>`
- the binary should write the assistant completion text to stdout and exit `0`
- stderr and non-zero exit status are treated as runner failure and the daemon falls back to `StubLegalRunner`

Environment variables:

- `IGNISPROMPT_GGUF_RUNNER_BIN`: path to the local GGUF runner executable
- `IGNISPROMPT_GGUF_MAX_TOKENS`: max tokens requested from the runner, defaults to `256`

This is a spike, not a production inference stack. Prompt shaping is naive, no streaming is implemented, and no built-in llama.cpp or ONNX bridge ships in the daemon yet.

### Local model placement

The placeholder legal manifest already shows the intended reference shape:

- manifest: `config/models/legal-saul-placeholder.json`
- current `localPath`: `./models/saullm-7b-instruct-q4.gguf`

Place a local GGUF file at that path, or update `localPath` in the manifest to wherever you keep the file on disk. Model weights must stay local and are intentionally not committed; the repo ignores `./models/**`.

### Integration options evaluated

The current spike stays subprocess-based on purpose. Two realistic next-step integrations are:

- `llama.cpp` CLI or `llama-server` as a local process boundary. The official project documents both `llama-cli -m model.gguf` and `llama-server -m model.gguf` for GGUF inference and an OpenAI-compatible local server surface.
- `llama-cpp-2` for direct Rust bindings to `llama.cpp`. Its docs describe the crate as safe wrappers around near-direct bindings and note that API stability is intentionally secondary to tracking upstream `llama.cpp`.

The subprocess contract is the lower-risk spike because it keeps `ignispromptd` free of native binding churn while the `ModelRunner` interface settles.

## Example request

```bash
curl -s -X POST http://127.0.0.1:8765/v1/route/explain \
  -H 'content-type: application/json' \
  --data-binary @tests/golden-legal/smoke-legal-request.json | jq .
```

## Smoke-test goal

The first milestone is still proving the control-plane spine: a legal request enters IgnisPrompt, routes locally to Tier 3, explains why, writes an audit event, and rejects unsafe cloud/adversarial behavior. The GGUF runner path is an early local execution spike layered on top of that control plane, not a finished inference backend.

## License

Apache-2.0.
