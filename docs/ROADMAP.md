# Roadmap

This roadmap describes intended direction, not completed functionality. Any item not listed under "Implemented now" should be treated as planned, experimental, or out of scope until code and tests land.

## Implemented now

- Minimal `ignispromptd` Rust daemon.
- Local-only default behavior.
- Manifest loading from `config/models`.
- Route explanations for legal and general requests.
- Local audit events for route explanations and chat completions.
- Adversarial document-instruction detection for known instruction strings.
- OpenAI-compatible non-streaming chat completion request shape.
- `StubLegalRunner` as the default Tier 3 legal fallback.
- Optional `gguf-runner-spike` feature that can call a local subprocess runner when configured and when the local `.gguf` file exists.
- Local JSON extraction and validation shim for the GGUF legal spike.
- Default CI path that does not need Ollama, GGUF files, or model weights.

## Near-term work

- Keep default CI green without local model weights.
- Improve legal route tests and explanation-quality tests.
- Expand adversarial document-instruction fixtures.
- Make model manifest semantics clearer, especially the difference between route eligibility and actual local weight availability.
- Continue local legal model bakeoffs with evidence stored under `./local-evidence/`.
- Improve the GGUF subprocess contract while keeping it feature-gated.

## Candidate model work

Qwen2.5 0.5B is the current pipe/demo baseline. It is useful for validating that the local runner, prompt pack, JSON normalization, audit events, and smoke scripts connect end to end. It is not the settled legal-quality model.

Future model selection should compare larger general models and legal-domain candidates with repeatable local evidence. Any model weights must remain outside git under `./models/` or another ignored local path.

## Planned but not implemented

- MCP server.
- Desktop or web dashboard.
- Streaming chat completions.
- Tier 2 Apple Foundation Models or OS-native bridge.
- Tier 4 edge routing.
- Tier 5 cloud routing.
- Cloud BYOK provider integrations.
- Signed Local-Only Attestation Report generation.
- Tamper-evident audit log storage.
- Production legal-quality evaluation.
- Enterprise compliance certification or enterprise attestation.

## Guardrails

- Preserve local-only behavior.
- Do not add cloud calls unless a task explicitly requires a cloud BYOK feature.
- Preserve route explanations and audit events.
- Preserve adversarial document-instruction handling.
- Keep `StubLegalRunner` as the default fallback unless explicitly changed.
- Keep `./models/**` and `./local-evidence/**` ignored by git.
