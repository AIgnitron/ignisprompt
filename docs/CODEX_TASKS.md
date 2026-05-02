# Codex Tasks

This file records safe task boundaries for Codex work in this repository.

## Default task posture

- Read the existing code and docs before editing.
- Keep changes small and testable.
- Prefer docs and tests with behavior changes.
- Preserve local-only behavior.
- Do not add cloud calls unless the user explicitly asks for a cloud BYOK feature.
- Do not commit model weights or local evidence.
- Do not claim unimplemented features are complete.

## Safe starter tasks

- Improve README and docs links.
- Add focused tests for route explanations, audit events, and adversarial document-instruction handling.
- Clarify model manifest semantics.
- Improve smoke fixture readability.
- Add docs for new scripts.
- Tighten release checklist checks.
- Improve error messages while keeping route explanations intact.

## Higher-risk tasks

These need explicit scope, tests, and docs before implementation:

- changing routing policy
- changing `StubLegalRunner` fallback behavior
- changing audit event schema
- changing model manifest schema
- expanding the GGUF subprocess contract
- adding any networked or cloud behavior
- adding authentication or API exposure beyond local development

## Out-of-scope unless explicitly requested

- MCP server implementation.
- Dashboard implementation.
- Tier 2 platform bridge implementation.
- Tier 4 edge routing.
- Tier 5 cloud routing.
- Enterprise attestation.
- Compliance certification.
- Production legal advice claims.

## Required verification for code changes

At minimum:

```bash
cargo build
cargo test
```

For route or daemon behavior:

```bash
./scripts/start-dev.sh
./scripts/smoke.sh
```

Feature-gated GGUF work must keep the default path green without Ollama, GGUF files, or local model weights.

## Wording guardrails

Use precise status labels:

- "implemented" only when code and tests exist
- "optional spike" for `gguf-runner-spike`
- "pipe/demo baseline" for Qwen2.5 0.5B
- "template only" for attestation report docs
- "planned" or "not implemented" for MCP, dashboard, Tier 4, Tier 5, and enterprise features
