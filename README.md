# IgnisPrompt

**IgnisPrompt is the open-source local AI routing layer.**

This repository contains a minimal `ignispromptd` Rust daemon scaffold for the Apple Spine Smoke Test. It is intentionally small: it validates the control-plane shape before real model inference is wired in.

## Current smoke-test status

`./scripts/dev-check.sh` is the recommended one-command developer path. `./scripts/start-dev.sh` plus `./scripts/smoke.sh` remains available as the lower-level manual debugging path when you want to inspect a running daemon directly.

- `/health`, `/v1/models`, `/v1/route/explain`, `/v1/chat/completions`, and `/v1/audit/events` respond locally
- legal requests route to Tier 3 with a human-readable explanation
- adversarial document instructions are detected and treated as untrusted content
- audit events are written locally
- legal chat completions default to `StubLegalRunner`
- `stream: false` or a missing `stream` field keeps the current JSON completion shape, while `stream: true` returns a basic SSE-compatible scaffold
- an opt-in `GgufRunner` spike can invoke a local GGUF runner binary when both the runner executable and the configured `.gguf` model file are present
- an experimental stdio MCP stub can expose the existing local `route_explain` logic without changing the default HTTP daemon path
- a developer local-only evidence script can capture health, route, audit, binary-hash, and ignore-safety evidence under ignored `./local-evidence/attestation/`

## CI status

The repository now includes a default GitHub Actions workflow at `.github/workflows/ci.yml` for the no-model daemon path on `main`. It runs `cargo build`, `cargo test`, and `./scripts/smoke.sh` against the default local scaffold without requiring Ollama, GGUF model weights, or any cloud access.

## Documentation

The docs set under `docs/` describes the current scaffold and clearly separates implemented behavior from planned work:

- [Docs index](docs/README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Runner providers](docs/RUNNER_PROVIDERS.md)
- [Demo flows](docs/DEMO.md)
- [Testing](docs/TESTING.md)
- [Models](docs/MODELS.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Developer contributing notes](docs/CONTRIBUTING_DEV.md)
- [Enterprise notes](docs/ENTERPRISE.md)
- [Attestation report template](docs/ATTESTATION_REPORT_TEMPLATE.md)
- [Compliance notes](docs/COMPLIANCE_NOTES.md)

## What this scaffold includes

- `GET /health`
- `GET /v1/models`
- `POST /v1/route/explain`
- `POST /v1/chat/completions` using an OpenAI-compatible request shape
- basic SSE-compatible chat-completion scaffolding when `stream: true`
- experimental stdio MCP stub with one `route_explain` tool
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
- production-grade MCP server surface beyond the experimental stdio `route_explain` stub
- production-grade token-by-token streaming
- real hardware RAM/thermal telemetry
- signed Local-Only Attestation Report generation

## Quick start

Requires Rust and Cargo.

Run the default developer check:

```bash
./scripts/dev-check.sh
```

This runs `cargo build`, `cargo test`, starts the local-only daemon, waits for `/health`, runs `./scripts/smoke.sh`, and stops the daemon on exit. It uses the default no-model path and does not require Ollama, GGUF tooling, local model weights, cloud access, or cloud credentials.

If you prefer a repo-level command runner, the new `Makefile` wraps the same local flows:

```bash
make help
make build
make test
make smoke
make dev-check
```

The default safe targets stay on the no-model local path. Optional local-prerequisite targets are also available for the existing GGUF and evidence scripts:

```bash
make gguf-build
make gguf-test
make gguf-smoke
make golden
make bakeoff
make demo
make attestation
make clean-local-evidence
```

The `gguf-*`, `golden`, `bakeoff`, and `demo` targets still require the same local Ollama and model-file prerequisites as the underlying scripts. `make clean-local-evidence` only removes generated content under ignored `./local-evidence/` and does not delete model weights under `./models/`.

For low-level manual debugging, start the daemon directly:

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

While the daemon is running, `ignispromptctl` provides a local CLI for inspecting its state:

```bash
cargo run -p ignispromptctl -- health
cargo run -p ignispromptctl -- models
cargo run -p ignispromptctl -- route-explain --file ./tests/golden-legal/smoke-legal-request.json
cargo run -p ignispromptctl -- audit tail
```

`route-explain` reads a JSON request file. For a legal route example, use a file that already carries legal context such as `./tests/golden-legal/smoke-legal-request.json`, which sets `model` to `ignisprompt/legal`.

For the real local GGUF path, start Ollama locally and then run:

```bash
./scripts/smoke-gguf-local.sh
```

## Experimental MCP Stub

The repo now includes an experimental stdio MCP stub inside `ignispromptd`. It does not change default daemon startup, default CI, or the fallback to `StubLegalRunner`.

Current scope:

- transport: newline-delimited stdio JSON-RPC 2.0
- handshake methods: `initialize`, `notifications/initialized`, and `ping`
- tool methods: `tools/list` and `tools/call`
- tools exposed: `route_explain` only
- behavior reused: existing local route classification, human-readable explanation text, adversarial warning handling, and local audit appends

Manual example:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0.1.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"route_explain","arguments":{"model":"ignisprompt/legal","messages":[{"role":"user","content":"Review this indemnification clause in a vendor services agreement and return the key risks."}],"metadata":{"domain":"legal"}}}}' \
  | cargo run -p ignispromptd -- --experimental-mcp-stdio
```

Limitations:

- experimental and manual-only
- no MCP HTTP transport
- no prompts, resources, sampling, or completions
- no cloud calls
- intended for local tool-surface validation, not broad MCP client compatibility claims

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
- `IGNISPROMPT_PROMPT_DIR`: directory containing prompt-pack markdown files, defaults to `./config/prompts`
- `IGNISPROMPT_GGUF_MAX_TOKENS`: max tokens requested from the runner, defaults to `256`

This is a spike, not a production inference stack. Prompt shaping is naive, the `stream: true` path is only an SSE compatibility scaffold rather than a full incremental streaming engine, and no built-in llama.cpp or ONNX bridge ships in the daemon yet.

For legal Tier 3 requests, the GGUF path prepends a prompt pack before serializing the request messages into the subprocess contract. By default it uses `config/prompts/legal-contract-review-v0.1.md`, but a manifest can override this with `promptPack`, for example `legal-contract-review-compact-v0.1.md` for smaller local models.

For local Tier 3 legal completions, the daemon also runs a lightweight JSON shim over the runner stdout. It extracts schema-valid JSON from raw output, fenced ```json blocks, explanatory preambles, or common local response/content wrappers. It validates the required top-level fields, nested `risks` objects, enum values, and disallows additional schema fields. If validation fails, the daemon returns a structured local parse-error wrapper instead of hiding the failure. Raw runner text and parse status are exposed under `local_output.legal_json` in the chat completion response and mirrored into local chat-completion audit events.

When a local runner supports constrained output, a manifest can also opt into `responseFormat`. The current Ollama-backed wrapper supports:

- `responseFormat: "none"`: no structured output hint
- `responseFormat: "json"`: JSON-mode output hint
- `responseFormat: "schema"`: JSON schema constraint for the contract-review shape

If that prompt-pack file is missing or unreadable, the daemon emits a warning with the configured prompt-pack path, treats the GGUF spike as unavailable, and falls back to `StubLegalRunner`. This keeps the default smoke path working without local prompt assets or model weights.

### Local model placement

The placeholder legal manifest already shows the intended reference shape:

- manifest: `config/models/legal-qwen2_5-0_5b-instruct-q4.json`
- current `localPath`: `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
- current `promptPack`: `legal-contract-review-compact-v0.1.md`
- current `responseFormat`: `schema`

Place a local GGUF file at that path, or update `localPath` in the manifest to wherever you keep the file on disk. Model weights must stay local and are intentionally not committed; the repo ignores `./models/**`.

### Integration options evaluated

The current spike stays subprocess-based on purpose. Two realistic next-step integrations are:

- `llama.cpp` CLI or `llama-server` as a local process boundary. The official project documents both `llama-cli -m model.gguf` and `llama-server -m model.gguf` for GGUF inference and an OpenAI-compatible local server surface.
- `llama-cpp-2` for direct Rust bindings to `llama.cpp`. Its docs describe the crate as safe wrappers around near-direct bindings and note that API stability is intentionally secondary to tracking upstream `llama.cpp`.

The subprocess contract is the lower-risk spike because it keeps `ignispromptd` free of native binding churn while the `ModelRunner` interface settles.

## Golden Legal v0.3 Subset

The repo now includes a small Golden Legal Routing Test Set v0.3 runner for the live GGUF path:

```bash
./scripts/run-golden-legal-v0.3.sh
```

It executes six cases:

- legal Tier 3 success
- local model unavailable under simulated RAM pressure
- no cloud fallback without consent when no legal model is installed
- adversarial contract instruction handling
- human-readable explanation quality
- subtle legal-language routing instruction handling

The script expects:

- a local Ollama server at `OLLAMA_HOST`, typically `http://127.0.0.1:11434`
- `OLLAMA_NO_CLOUD=true`
- the local GGUF file at the manifest `localPath`

Evidence is written under `./local-evidence/golden-legal-v0.3/` and stays out of git.

Current local reliability note as of May 2, 2026: the latest local Golden Legal v0.3 evidence available in this workspace records all six control-plane cases as passing with the Qwen2.5 0.5B pipe baseline. The Tier 3 success case records `legal_json.status = "ok"` and `schema_valid = true`. This is a local schema and routing reliability signal only; it is not legal advice, a legal-accuracy result, production readiness, or compliance certification.

## Alpha Legal Bakeoff v0.1

The repo also includes an alpha bakeoff driver that runs the Golden Legal v0.3 subset against a small set of candidate local legal models and records a local comparison summary:

```bash
./scripts/run-alpha-legal-bakeoff-v0.1.sh
```

The bakeoff currently knows about these local candidate paths:

- baseline: `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
- larger general candidate: `./models/qwen2.5-7b-instruct-q4_k_m.gguf`
- legal-domain candidate: `./models/saul-instruct-v1.q4_k_m.gguf`
- smaller fallback candidate: `./models/Phi-3.5-mini-instruct.q5_k_m.gguf`

If a candidate file is missing, the bakeoff records that candidate as skipped with a local note instead of failing the whole run. The summary is written under `./local-evidence/alpha-legal-bakeoff-v0.1/` and includes per-candidate latency, route correctness, explanation quality, JSON/schema reliability, adversarial handling, and evidence locations.

Current quality caveat: `qwen2.5-0.5b-instruct-q4_k_m` is the fastest pipe-validation baseline on this host, not a settled legal-quality winner. The prompt packs, constrained runner output, and local JSON extraction/validation shim make the Tier 3 path more reliably parseable and stricter about schema failures, but legal usefulness still depends on model quality and remains an open bakeoff question.

## Example request

```bash
curl -s -X POST http://127.0.0.1:8765/v1/route/explain \
  -H 'content-type: application/json' \
  --data-binary @tests/golden-legal/smoke-legal-request.json | jq .
```

## Public demo: local legal review

For a public-facing local demo, run the convenience legal-review flow. It shows the local Tier 3 routing path, structured JSON parsing, schema validation, route explanation, and local audit evidence without sending request data to a cloud service. See [Demo flows](docs/DEMO.md) for the default smoke demo and optional GGUF setup details.

```bash
./scripts/demo-local-legal-review.sh
```

A healthy demo run should show these signals:

- route tier = `TIER_3`
- route_code = `DOMAIN_MODEL_SELECTED`
- data_left_device = `false`
- legal_json.status = `ok`
- schema_valid = `true`
- audit evidence saved under `./local-evidence/`

The demo script expects:

- a local Ollama server at `OLLAMA_HOST`, typically `http://127.0.0.1:11434`
- `OLLAMA_NO_CLOUD=true`
- the local GGUF file at `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`

It starts `ignispromptd` with `--features gguf-runner-spike`, sends the existing contract-review fixture, prints the route decision, explanation, `legal_json.status`, `schema_valid`, parsed legal JSON, and saved audit-event path, then writes the evidence bundle under `./local-evidence/demo-local-legal-review/`.

Demo caveats:

- this is not legal advice
- this is not production compliance certification
- Qwen2.5 0.5B is the pipe/demo baseline, not a settled legal model winner

For the default no-model scaffold path, the recommended check is still:

```bash
./scripts/dev-check.sh
```

If you need the lower-level manual debugging path instead, run:

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
./scripts/smoke.sh
```

## Smoke-test goal

The first milestone is still proving the control-plane spine: a legal request enters IgnisPrompt, routes locally to Tier 3, explains why, writes an audit event, and rejects unsafe cloud/adversarial behavior. The GGUF runner path is an early local execution spike layered on top of that control plane, not a finished inference backend.

## License

Apache-2.0.
