# Demo Readiness Checklist

Use this before every public or stakeholder demo. Keep generated output under `./local-evidence/` and do not commit it.

## Required default checks

- [ ] `cargo build` passes.
- [ ] `cargo test` passes.
- [ ] `make dev-check` passes on the default no-model local path.
- [ ] No model weights are staged: `git status --short --ignored models`.
- [ ] No local evidence, generated transcripts, audit logs, or `data/audit/*.jsonl` files are staged.
- [ ] The demo request is synthetic: `tests/golden-legal/demo-synthetic-contract-request.json`.
- [ ] No real customer contracts, confidential legal text, personal data, or production matter materials are used.
- [ ] Demo language avoids legal advice, legal accuracy, production readiness, enterprise readiness, attestation, compliance, or certification claims.

## Optional local GGUF checks

Run these only when the local prerequisites are intentionally present: local Ollama, `OLLAMA_NO_CLOUD=true`, executable GGUF runner wrapper, and local model files under ignored `./models/`.

- [ ] `make gguf-smoke` passes, or missing prerequisites are recorded.
- [ ] `make golden` passes, or missing prerequisites are recorded.
- [ ] `make bakeoff` runs with at least one local candidate, or missing prerequisites are recorded.
- [ ] `make demo` writes evidence under `./local-evidence/demo-local-legal-review/`.
- [ ] `make demo-transcript` writes `transcript.md` into the ignored demo evidence bundle.

## Local-only and evidence checks

- [ ] Local-only guard is enabled for daemon runs.
- [ ] `OLLAMA_NO_CLOUD=true` is set when using the Ollama wrapper.
- [ ] Route explanation is captured in the evidence bundle.
- [ ] Audit events are captured in the evidence bundle.
- [ ] `git status --short --ignored models local-evidence` shows generated models/evidence only as ignored files.

This checklist is an operational aid only. It is not a production readiness, legal advice, compliance certification, or formal attestation checklist.
