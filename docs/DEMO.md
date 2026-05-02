# Demo

IgnisPrompt has two practical demo paths today: the default scaffold smoke demo and an optional local GGUF/Ollama legal-review demo.

## Default smoke demo

This path requires Rust, Cargo, `curl`, and `jq`. It does not require Ollama, GGUF tooling, network access, or model weights.

Terminal 1:

```bash
./scripts/start-dev.sh
```

Terminal 2:

```bash
./scripts/smoke.sh
```

The smoke script checks:

- `GET /health`
- `GET /v1/models`
- legal route explanation
- OpenAI-compatible chat completions
- adversarial document instruction handling
- audit event retrieval

The expected Tier 3 legal completion in the default path comes from `StubLegalRunner`.

## Optional GGUF local smoke

This path is opt-in and requires a local runner, a local model file, and the `gguf-runner-spike` feature. The repository does not include model weights.

Expected local baseline path:

```text
./models/qwen2.5-0.5b-instruct-q4_k_m.gguf
```

Run the daemon with the feature and runner configured:

```bash
IGNISPROMPT_GGUF_RUNNER_BIN=./scripts/ollama-gguf-runner.sh \
IGNISPROMPT_GGUF_MAX_TOKENS=96 \
OLLAMA_HOST=http://127.0.0.1:11434 \
OLLAMA_NO_CLOUD=true \
cargo run -p ignispromptd --features gguf-runner-spike -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only
```

Then run:

```bash
./scripts/smoke-gguf-local.sh
```

Qwen2.5 0.5B is only a pipe/demo baseline for this flow. Passing this smoke test does not prove legal accuracy, production readiness, or that the model is the final legal-quality choice.

## Local legal review demo

The convenience script starts a feature-gated daemon, sends the contract-review fixture, and writes local evidence:

```bash
./scripts/demo-local-legal-review.sh
```

Requirements:

- local Ollama server reachable at `OLLAMA_HOST`, usually `http://127.0.0.1:11434`
- `OLLAMA_NO_CLOUD=true`
- executable `scripts/ollama-gguf-runner.sh`
- local GGUF file at `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`, or `IGNISPROMPT_GGUF_MODEL_PATH` pointing to another local file

Evidence is written under `./local-evidence/demo-local-legal-review/`. Do not commit it.

## Golden and bakeoff demos

`./scripts/run-golden-legal-v0.3.sh` runs a five-case local subset against the live GGUF path. It writes evidence under `./local-evidence/golden-legal-v0.3/`.

`./scripts/run-alpha-legal-bakeoff-v0.1.sh` runs that subset across locally staged candidate model files and writes comparison output under `./local-evidence/alpha-legal-bakeoff-v0.1/`.

These scripts are local evaluation aids. They do not establish enterprise attestation, legal advice quality, or compliance certification.
