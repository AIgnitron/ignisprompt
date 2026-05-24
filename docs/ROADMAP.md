# Roadmap

This roadmap describes intended direction, not completed functionality. Any item not listed under "Implemented now" should be treated as planned, experimental, or out of scope until code and tests land.

## Implemented now

- Minimal `ignispromptd` Rust daemon.
- Local-only default behavior.
- Manifest loading from `config/models`.
- Route explanations for legal and general requests.
- Local audit events for route explanations and chat completions.
- Audit integrity regression coverage for route-explain and chat-completion audit event shape, local route signals, timestamps, warnings, and optional proxy estimate fields.
- Aethra v0.1 local-only sustainability metrics endpoint with counterfactual proxy estimates derived from local audit events.
- Aethra fixture-backed, local-first MVP scaffold for observing local preview metadata and proxy sustainability indicators. It is not a production dashboard.
- Aethra fixture-backed evidence bundle viewer with validation summary and archive metadata preview for local preview review.
- Aethra guided demo path and clearer navigation labels for the safe local preview walkthrough.
- Aethra local command center with safe CLI recipes, an evidence workflow checklist, and demo readiness notes.
- Local evidence demo workflow automation script for route-explain, audit-events, evidence-bundle generation, listing, validation, archiving, archive verification, and manifest inspection.
- Adversarial document-instruction detection for known instruction strings.
- OpenAI-compatible chat completion request shape, including a `stream: true` compatibility scaffold that frames an already-produced local completion as SSE chunks.
- `StubLegalRunner` as the default Tier 3 legal fallback.
- Optional `gguf-runner-spike` feature that can call a local subprocess runner when configured and when the local `.gguf` file exists, with a deterministic subprocess timeout.
- Local JSON extraction and validation shim for the GGUF legal spike.
- Default CI path that does not need Ollama, GGUF files, or model weights.
- Local security review helper checks for hidden Unicode markers and conservative accidental secret patterns.

## Near-term work

- v0.1.4 release prep: use the contributor MCP usage docs, the Aethra public/demo package, the local command center guidance, and the v0.1.4 release-readiness record as review material.
- v0.1.4 release readiness: keep the local evidence workflow regression check, the demo script self-test, and the Aethra boundary-language alignment check passing.
- Keep default CI green without local model weights.
- Keep route-policy regression coverage current for legal Tier 3 routing, general local routing, adversarial document-instruction handling, conservative explanations, and local audit emission.
- Keep model availability semantics explicit: route eligibility, manifest configuration, local file presence, runner hints, and executable local inference are separate states.
- Keep the Golden Legal adversarial fixture matrix small, synthetic, deterministic, and local-only.
- Keep local evidence validation strict while avoiding signed attestation or tamper-evident storage claims until those features are explicitly implemented.
- Keep dependency advisory and SBOM review helpers optional unless CI installs their tools deterministically.
- Continue local legal model bakeoffs with evidence stored under `./local-evidence/`.
- Continue improving GGUF subprocess diagnostics while keeping the path feature-gated and local-only.

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
- Signed Local-Only Attestation Report generation.
- Tamper-evident audit log storage.
- Required dependency advisory gate or complete supply-chain assurance.
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
