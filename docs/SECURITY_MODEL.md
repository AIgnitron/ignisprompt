# Security Model

This document describes the current scaffold security posture. It is not a certification, audit report, or enterprise attestation.

## Security goals

- Keep the default daemon local-only.
- Prevent silent cloud fallback.
- Preserve human-readable route explanations.
- Preserve local audit events for route explanations and chat completions.
- Treat document-contained routing override attempts as untrusted content.
- Keep model weights and local evidence out of git.

## Local-only boundary

The daemon has no default cloud provider calls. Current route decisions report `data_left_device: false`. Legal requests either route to a local Tier 3 path or fail closed.

Optional GGUF flows are local operator-controlled integrations. The included Ollama wrapper targets `OLLAMA_HOST`, which should be a local host such as `http://127.0.0.1:11434`, and sets `OLLAMA_NO_CLOUD=true` by default.

Cloud BYOK routing is not implemented. Tier 5 cloud routing is not implemented.

## Prompt and document handling

The daemon scans combined message text for known adversarial document instructions, including attempts to ignore routing rules, disable audit logging, or route to cloud. When detected, it returns a warning and keeps routing and audit behavior unchanged.

This is a lightweight scaffold control, not a complete prompt-injection defense.

## Audit behavior

Route explanations and chat completions append local audit events. Events include route code, tier, domain, model id, explanation, warnings, and `data_left_device`.

Current limitations:

- audit events are not signed
- audit events are not tamper-evident
- audit events are not encrypted by the daemon
- `GET /v1/audit/events` returns events accumulated in the current process memory
- the JSONL audit file location is controlled by local config

## Model and evidence handling

Model weights belong outside git. Local model files are expected under `./models/`, which is ignored.

Demo, golden, and bakeoff outputs belong under `./local-evidence/`, which is ignored. Evidence may contain request text, route decisions, model output, logs, and local paths. Treat it as sensitive.

## Current security gaps

- No authentication or authorization on the local HTTP API.
- No TLS termination in the daemon.
- No signed attestation report generation.
- No tamper-evident audit log chain.
- No complete prompt-injection defense.
- No sandbox around the optional GGUF subprocess.
- No enterprise policy engine.
- No production secrets manager integration.

Run the daemon only in a trusted local development environment unless these gaps are explicitly addressed.
