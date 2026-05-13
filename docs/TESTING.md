# Testing

The default test path must pass without Ollama, GGUF tooling, local model weights, network access, or cloud credentials.

## Required default checks

For the default one-command developer check:

```bash
./scripts/dev-check.sh
```

This wrapper runs `cargo build`, `cargo test`, starts `./scripts/start-dev.sh` in the background, waits for `/health`, runs `./scripts/smoke.sh`, and stops the daemon on exit, including failure paths. It intentionally uses the default local-only scaffold and does not require Ollama, GGUF tooling, local model weights, network access, cloud access, or cloud credentials.

The same checks can still be run separately:

```bash
cargo build
cargo test
```

For the lower-level manual daemon smoke path:

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
./scripts/smoke.sh
```

`./scripts/smoke.sh` assumes the daemon is already listening at `IGNISPROMPT_BASE_URL`, defaulting to `http://127.0.0.1:8765`.

## ignispromptctl smoke

With the daemon already running, `ignispromptctl` can be used for quick local inspection:

```bash
cargo run -p ignispromptctl -- health
cargo run -p ignispromptctl -- models
cargo run -p ignispromptctl -- route-explain --file ./tests/golden-legal/smoke-legal-request.json
cargo run -p ignispromptctl -- audit tail
```

The `route-explain` command reads a JSON request file. For a legal route example, use a request file that already carries legal context such as `./tests/golden-legal/smoke-legal-request.json`, which sets `model` to `ignisprompt/legal`.

## CI path

`.github/workflows/ci.yml` runs:

- `cargo build`
- `cargo test`
- `./scripts/smoke.sh` against `./scripts/start-dev.sh`

This default path intentionally avoids Ollama, GGUF model weights, and cloud access.

## Aethra scaffold checks

The planned Aethra dashboard scaffold lives under `apps/aethra/` and is isolated from the default Rust daemon path. It uses synthetic fixtures only in the first scaffold and does not require a running `ignispromptd`, Ollama, GGUF tooling, model weights, cloud access, or cloud credentials.

When changing Aethra files, run its local checks from the app directory:

```bash
cd apps/aethra
npm ci
npm run build
```

Do not make `make dev-check` depend on Node tooling unless a future task explicitly changes the repository-wide verification policy.

## Experimental MCP stub

The experimental MCP path is manual-only and is not part of default CI. It can be exercised locally with newline-delimited JSON-RPC over stdio:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0.1.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"route_explain","arguments":{"model":"ignisprompt/legal","messages":[{"role":"user","content":"Review this indemnification clause in a vendor services agreement and return the key risks."}],"metadata":{"domain":"legal"}}}}' \
  | cargo run -p ignispromptd -- --experimental-mcp-stdio
```

Current scope:

- `initialize`, `notifications/initialized`, and `ping`
- `tools/list` and `tools/call`
- one experimental tool: `route_explain`

This path must stay local-only and must not require Ollama, GGUF tooling, model weights, network access, or cloud access.

## Feature-gated GGUF checks

The `gguf-runner-spike` feature is optional. Feature-gated tests can be run with:

```bash
cargo build --features gguf-runner-spike
cargo test --features gguf-runner-spike
cargo test --all-features
```

Live GGUF smoke requires a local model file and local runner configuration:

```bash
make gguf-smoke
```

The `make gguf-smoke` target starts a feature-gated local daemon, waits for `/health`, runs `./scripts/smoke-gguf-local.sh`, and stops the daemon. If you run `./scripts/smoke-gguf-local.sh` directly, it expects the daemon to already be running with `--features gguf-runner-spike`, a configured `IGNISPROMPT_GGUF_RUNNER_BIN`, and a local manifest `localPath` that exists.

## Local evidence scripts

This repo includes one default-path developer evidence script that does not require Ollama, GGUF tooling, or local model weights:

- `./scripts/generate-local-only-attestation.sh`

These scripts require local Ollama and local model files:

- `./scripts/demo-local-legal-review.sh`
- `./scripts/run-golden-legal-v0.3.sh`
- `./scripts/run-alpha-legal-bakeoff-v0.1.sh`

They write evidence under `./local-evidence/`. Do not commit evidence bundles.

`./scripts/generate-local-only-attestation.sh` writes a developer-generated evidence bundle under `./local-evidence/attestation/<timestamp>/`. It captures git SHA, build mode, built binary path and hash, `/health`, legal route explanation, audit snapshot, `data_left_device=false` evidence, and git-ignore safety for `models/**` and `local-evidence/**`. It is not a signed attestation report or compliance certification.

Current local reliability note as of May 2, 2026: the latest local Golden Legal v0.3 evidence available in this workspace records all six control-plane cases as passing with the Qwen2.5 0.5B pipe baseline. The Tier 3 success case records `legal_json.status = "ok"` and `schema_valid = true`. This does not prove legal accuracy, production readiness, enterprise attestation, or compliance certification.

## What tests assert today

- Legal requests route to Tier 3 when a legal manifest is installed.
- Legal requests fail closed when a local legal model is unavailable.
- Cloud fallback is not allowed without explicit consent.
- Adversarial document instructions are treated as untrusted content.
- Route explanations remain human-readable.
- Chat completions append audit events.
- `stream: false` and missing `stream` preserve the current JSON chat-completion shape.
- `stream: true` returns a basic SSE-compatible chat-completion scaffold ending in `data: [DONE]`.
- Safe identical chat completions can reuse a local in-memory exact-match cache entry.
- The exact-match cache stays bounded and evicts old entries when its local entry limit is exceeded.
- Adversarial, rejected, and fail-closed chat completions are not cached.
- The default Tier 3 path uses `StubLegalRunner` unless the feature-gated GGUF runner is explicitly available.
- The feature-gated GGUF tests require an explicit local runner path and reject bare executable names.
- The legal JSON normalizer accepts realistic local noisy output forms and records schema failures as structured local failures.
- The experimental MCP stub can initialize, list tools, and call `route_explain` while reusing the existing local route and audit behavior.

## What tests do not prove

- Production legal accuracy.
- Enterprise compliance certification.
- Signed attestation.
- Tamper-evident audit storage.
- Broad MCP client compatibility beyond the experimental stdio `route_explain` stub.
- Dashboard behavior.
- Tier 4 or Tier 5 routing.
