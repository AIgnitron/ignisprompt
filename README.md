# IgnisPrompt

**IgnisPrompt is the open-source local AI routing layer.**

This repository contains a minimal `ignispromptd` Rust daemon scaffold for the Apple Spine Smoke Test. It is intentionally small: it validates the control-plane shape before real model inference is wired in.

## What this scaffold includes

- `GET /health`
- `GET /v1/models`
- `POST /v1/route/explain`
- `POST /v1/chat/completions` using an OpenAI-compatible request shape
- `GET /v1/audit/events`
- JSON model manifest loading
- local audit event logging
- local-only fail-closed behavior
- adversarial contract-instruction detection as untrusted document content
- smoke fixtures for legal routing

## What this scaffold does not include yet

- real GGUF/ONNX inference
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

## Example request

```bash
curl -s -X POST http://127.0.0.1:8765/v1/route/explain \
  -H 'content-type: application/json' \
  --data-binary @tests/golden-legal/smoke-legal-request.json | jq .
```

## Smoke-test goal

The first milestone is not full inference. It is proving that a legal request can enter IgnisPrompt, route locally to Tier 3, explain why, write an audit event, and reject unsafe cloud/adversarial behavior.

## License

Apache-2.0.
