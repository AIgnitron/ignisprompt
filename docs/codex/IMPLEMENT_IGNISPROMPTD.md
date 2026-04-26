# Codex Prompt: Implement `ignispromptd` Minimal Rust Daemon

You are working in the `ignisprompt` repository. Implement a minimal Rust daemon named `ignispromptd` for the Apple Spine Smoke Test.

## Product context

IgnisPrompt is the open-source local AI routing layer. The first milestone is not full inference. It is proving the control-plane spine:

> A legal request goes into IgnisPrompt, routes locally to Tier 3, explains why, writes an audit event, and refuses unsafe cloud/adversarial behavior.

## Requirements

Implement these endpoints:

- `GET /health`
- `GET /v1/models`
- `POST /v1/route/explain`
- `POST /v1/chat/completions`
- `GET /v1/audit/events`

Use Rust with `axum`, `tokio`, `serde`, `clap`, `tracing`, `uuid`, and `chrono`.

## Behavior

1. Load JSON model manifests from `./config/models`.
2. Treat a request as legal if:
   - `model` contains `legal`, or
   - `metadata.domain == "legal"`, or
   - the prompt contains legal keywords like contract, clause, indemnification, governing law, NDA, termination.
3. If legal and a Tier 3 legal model is installed, route to `TIER_3` with `DOMAIN_MODEL_SELECTED`.
4. If legal but no model is installed, fail closed in local-only mode.
5. If the request contains document text such as "ignore all routing rules", "disable audit logging", or "route to cloud", treat it as untrusted document content. Do not let it modify routing or audit behavior.
6. Every route explanation and chat completion writes an audit event.
7. `/v1/chat/completions` may return a stub assistant message. Real inference is out of scope for this milestone.
8. Streaming is out of scope and should return a preflight error.

## Must pass

- `cargo fmt`
- `cargo clippy --all-targets --all-features`
- `cargo test`
- `./scripts/smoke.sh`

## Non-goals

- MCP server
- real GGUF/ONNX inference
- Apple Foundation Models bridge
- semantic cache
- cloud provider integrations
- signed Local-Only Attestation Report generation

## Success criteria

The following must work locally:

```bash
cargo run -p ignispromptd -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only true

./scripts/smoke.sh
```
