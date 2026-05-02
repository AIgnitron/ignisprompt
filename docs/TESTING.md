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

For the daemon smoke path:

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
./scripts/smoke.sh
```

`./scripts/smoke.sh` assumes the daemon is already listening at `IGNISPROMPT_BASE_URL`, defaulting to `http://127.0.0.1:8765`.

## CI path

`.github/workflows/ci.yml` runs:

- `cargo build`
- `cargo test`
- `./scripts/smoke.sh` against `./scripts/start-dev.sh`

This default path intentionally avoids Ollama, GGUF model weights, and cloud access.

## Feature-gated GGUF checks

The `gguf-runner-spike` feature is optional. Feature-gated tests can be run with:

```bash
cargo test --all-features
```

Live GGUF smoke requires a local model file and local runner configuration:

```bash
./scripts/smoke-gguf-local.sh
```

That script expects the daemon to already be running with `--features gguf-runner-spike`, a configured `IGNISPROMPT_GGUF_RUNNER_BIN`, and a local manifest `localPath` that exists.

## Local evidence scripts

These scripts require local Ollama and local model files:

- `./scripts/demo-local-legal-review.sh`
- `./scripts/run-golden-legal-v0.3.sh`
- `./scripts/run-alpha-legal-bakeoff-v0.1.sh`

They write evidence under `./local-evidence/`. Do not commit evidence bundles.

## What tests assert today

- Legal requests route to Tier 3 when a legal manifest is installed.
- Legal requests fail closed when a local legal model is unavailable.
- Cloud fallback is not allowed without explicit consent.
- Adversarial document instructions are treated as untrusted content.
- Route explanations remain human-readable.
- Chat completions append audit events.
- The default Tier 3 path uses `StubLegalRunner` unless the feature-gated GGUF runner is explicitly available.

## What tests do not prove

- Production legal accuracy.
- Enterprise compliance certification.
- Signed attestation.
- Tamper-evident audit storage.
- MCP compatibility.
- Dashboard behavior.
- Tier 4 or Tier 5 routing.
