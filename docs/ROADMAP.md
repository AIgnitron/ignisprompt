# Roadmap

This roadmap describes intended direction, not completed functionality. Any item not listed under "Implemented now" should be treated as planned, experimental, or out of scope until code and tests land.

## Implemented now

- Minimal `ignispromptd` Rust daemon.
- Local-only default behavior.
- Manifest loading from `config/models`.
- Route explanations for legal and general requests.
- Local audit events for route explanations and chat completions.
- Aethra v0.1 local-only sustainability metrics endpoint with counterfactual proxy estimates derived from local audit events.
- Aethra fixture-backed, local-first MVP scaffold for observing local preview metadata and proxy sustainability indicators. It is not a production dashboard.
- Adversarial document-instruction detection for known instruction strings.
- OpenAI-compatible chat completion request shape, including a `stream: true` compatibility scaffold that frames an already-produced local completion as SSE chunks.
- `StubLegalRunner` as the default Tier 3 legal fallback.
- Optional `gguf-runner-spike` feature that can call a local subprocess runner when configured and when the local `.gguf` file exists.
- Local JSON extraction and validation shim for the GGUF legal spike.
- Default CI path that does not need Ollama, GGUF files, or model weights.

## Near-term work

- v0.1.3 planning: polish contributor MCP usage docs, prepare an Aethra public/demo package, and keep LiteLLM-style local gateway work in planning only. Do not implement LiteLLM in this planning pass. DreamServer work is out of scope.
- Keep default CI green without local model weights.
- Improve legal route tests and explanation-quality tests.
- Expand adversarial document-instruction fixtures.
- Make model manifest semantics clearer, especially the difference between route eligibility and actual local weight availability.
- Continue local legal model bakeoffs with evidence stored under `./local-evidence/`.
- Improve the GGUF subprocess contract while keeping it feature-gated.
- Explore documented adapter concepts for local LiteLLM-style stacks without claiming implemented support or compatibility.
- Use the local adapter implementation checklist before any adapter code is proposed.
- Refine the LiteLLM-style OpenAI-compatible local gateway plan before any implementation work begins.

## Candidate model work

Qwen2.5 0.5B is the current pipe/demo baseline. It is useful for validating that the local runner, prompt pack, JSON normalization, audit events, and smoke scripts connect end to end. It is not the settled legal-quality model.

Future model selection should compare larger general models and legal-domain candidates with repeatable local evidence. Any model weights must remain outside git under `./models/` or another ignored local path.

## Planned but not implemented

- Production-grade MCP server surface beyond the experimental stdio stub.
- Production dashboard beyond the current Aethra fixture-backed, local-first MVP scaffold.
- Production-grade incremental token streaming.
- Tier 2 Apple Foundation Models or OS-native bridge.
- Tier 4 edge routing.
- Tier 5 cloud routing.
- Cloud BYOK provider integrations.
- LiteLLM-style or DreamServer-style adapters for local model stacks.
- Signed Local-Only Attestation Report generation.
- Tamper-evident audit log storage.
- Production legal-quality evaluation.
- Enterprise compliance certification or enterprise attestation.
- No certified sustainability reporting, not ESG certification, not measured energy reporting, and not actual carbon accounting.

## Guardrails

- Preserve local-only behavior.
- Do not add cloud calls unless a task explicitly requires a cloud BYOK feature.
- Preserve route explanations and audit events.
- Preserve adversarial document-instruction handling.
- Keep `StubLegalRunner` as the default fallback unless explicitly changed.
- Keep `./models/**` and `./local-evidence/**` ignored by git.
