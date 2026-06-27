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
- Aethra live-local dashboard for observing manually refreshed local daemon metadata, grouped endpoint state, suggested review flow, explicit non-goals, and proxy sustainability indicators. It is not a production dashboard.
- Aethra Help page for detailed local-preview, data source, troubleshooting, and safety/product-limit guidance, with main product pages kept focused on concise status, cards, tables, actions, and empty states.
- Aethra demo smoke and review-readiness coverage for the main dashboard route set, unsafe-control regressions, live-local/offline-fixture separation, and manual screenshot/reviewer checklist.
- Aethra fixture-backed evidence bundle viewer with validation summary and archive metadata preview for local preview review.
- Aethra suggested review flow and clearer navigation labels for the safe local preview walkthrough.
- Aethra local readiness surface with fixture-backed status hints, copy-only daemon guidance, and a local-preview checklist.
- Aethra local command center with safe CLI recipes, an evidence workflow checklist, and demo readiness notes.
- Local readiness quality gate for CLI help surfaces, Aethra readiness wording alignment, and evidence workflow regression integration.
- Copy-safe local readiness report export parity across CLI Markdown output, Aethra Local Readiness, and readiness quality gates.
- Safe local readiness diagnostics across CLI JSON output, Aethra read-only drilldown hints, and readiness quality gates.
- Local readiness package workflow for ignored local-evidence/readiness output, CLI list/validate behavior, demo workflow integration, and Aethra read-only package preview.
- v0.1.5 local preview release-readiness record for the post-v0.1.4 local readiness arc.
- Local operator console workflow with Aethra read-only operator summary cards, copy-only command recipes, `ignispromptctl operator-summary`, and `make operator-check`.
- Local operator package workflow for ignored local-evidence/operator output, CLI list/validate behavior, demo workflow integration, and Aethra read-only operator package preview.
- v0.1.6 local preview release-readiness record for the post-v0.1.5 local operator workflow arc.
- Local policy workbench workflow with expanded synthetic policy scenarios, grouping helpers, `ignispromptctl policy-scenarios`, copy-safe policy reports, ignored local-evidence/policy package output, stricter CLI list/validate behavior, `make policy-check`, demo workflow integration, and Aethra read-only policy package preview.
- v0.1.7 local preview release record for the post-v0.1.6 local policy workbench arc.
- Local Demo Studio workflow with Aethra Local Demo Studio, `ignispromptctl demo-summary`, copy-safe demo reports, demo packages under ignored `local-evidence/demo-studio/`, stricter shared package path/list/validate behavior, `make demo-check`, demo workflow integration, and `make preview-release-check`.
- v0.1.8 local preview release record for the Local Demo Studio arc and PR #188 hardening work.
- Local-preview connector and capability status foundation with `GET /v1/capabilities` and `ignispromptctl capabilities`, reporting sanitized status metadata only with cloud disabled by default.
- Read-only local model inventory foundation with `GET /v1/models/inventory`, `ignispromptctl model-inventory`, and Aethra manual live-local display.
- Read-only local model readiness foundation with `GET /v1/models/readiness`, `ignispromptctl model-readiness`, and Aethra manual live-local display.
- Read-only local operations summary foundation with `GET /v1/operations/summary`, `ignispromptctl operations-summary`, and Aethra manual live-local display for aggregate daemon activity and endpoint availability.
- Read-only local routing policy summary foundation with `GET /v1/routing/policy-summary`, `ignispromptctl routing-policy`, and Aethra manual live-local display for descriptive route categories, decision inputs, model selection hints, connector policy hints, audit policy hints, and safety boundaries.
- Read-only local evidence package index foundation with `GET /v1/evidence/packages`, `ignispromptctl evidence-packages`, and Aethra manual live-local display for safe package metadata, package type guesses, artifact indicators, and scan warnings.
- Read-only local runner process status foundation with `GET /v1/runners/status` and `ignispromptctl runners status`, reporting conservative local runner status metadata only with no start/stop/restart controls.
- Guarded local runner lifecycle command surfaces with disabled-by-default daemon start/stop endpoints and `ignispromptctl runners start|stop --confirm-local-runner-control`. Current built-in runners remain unmanaged and fail closed; confirmed attempts are audited, but no process manager, process spawn, unmanaged kill, model execution, route execution, model download, cloud call, telemetry, or Aethra control is added.
- Aethra runner process status and guarded Operator Mode panel for live-local Model / Runner Status review. Operator Mode is off by default, session-only, unavailable in fixture mode, source-URL scoped, and requires a final per-action confirmation. Current daemon v0.1 lifecycle responses are rejected-only; Aethra treats accepted lifecycle bodies as contract drift until a future daemon schema adds a valid accepted result. Aethra does not update runner process status optimistically after receipts or unknown transport outcomes; operators must manually refresh runner process status and audit events. This adds no polling, browser persistence, startup request, real process manager, model execution, route execution, downloads, cloud calls, or telemetry.
- Local evidence demo workflow automation script for route-explain, audit-events, evidence-bundle generation, listing, validation, archiving, archive verification, and manifest inspection.
- Adversarial document-instruction detection for known instruction strings.
- OpenAI-compatible chat completion request shape, including a `stream: true` compatibility scaffold that frames an already-produced local completion as SSE chunks.
- `StubLegalRunner` as the default Tier 3 legal fallback.
- Optional `gguf-runner-spike` feature that can call a local subprocess runner when configured and when the local `.gguf` file exists, with a deterministic subprocess timeout.
- Local JSON extraction and validation shim for the GGUF legal spike.
- Default CI path that does not need Ollama, GGUF files, or model weights, plus separate Aethra fixture-backed test/build coverage.
- Local daemon HTTP bind/CORS guardrails, serialized audit JSONL writes, fail-closed required audit persistence, bounded MCP stdio messages, private GGUF temporary files, GGUF blocking-task isolation, and audit append durability ordering for local-preview runtime hardening.
- Local security review helper checks for hidden Unicode markers and conservative accidental secret patterns.

## Near-term work

- Keep Aethra local readiness, the local operator console, the local policy workbench, `ignispromptctl readiness`, `ignispromptctl operator-summary`, `ignispromptctl policy-scenarios`, copy-safe readiness and policy reports, readiness packages, operator packages, policy packages, diagnostic drilldowns, command guidance, evidence workflow, and boundary-language checks conservative and fixture-backed by default while planning future local preview work.
- Keep default CI green without local model weights.
- Keep route-policy regression coverage current for legal Tier 3 routing, general local routing, adversarial document-instruction handling, conservative explanations, and local audit emission.
- Keep model availability semantics explicit: route eligibility, manifest configuration, local file presence, runner hints, and executable local inference are separate states.
- Keep local model inventory observational: filename/path metadata does not imply model execution, quality, readiness, compliance, or legal accuracy.
- Keep local model readiness advisory: manifest/inventory/runner hints do not imply executable inference, model quality, production readiness, compliance, certification, or legal accuracy.
- Keep local operations metadata aggregate and read-only: endpoint availability, audit counts, and recent event type names do not imply telemetry, production monitoring, certification, signed evidence, or access to raw prompts/request bodies.
- Keep local routing policy summary descriptive and read-only: route categories, decision inputs, and policy hints do not imply route execution, prompt submission, model execution, policy mutation, production readiness, legal accuracy, compliance, certification, or attestation.
- Keep Aethra live-local dashboard behavior explicit: no startup auto-loading, no polling, no live response persistence, and no silent fixture fallback for failed or unavailable daemon surfaces.
- Keep Aethra product surfaces clean: Overview owns the full live-local dashboard, detail pages do not duplicate it, and long local-preview/status/safety explanations belong in Help rather than large repeated product-page boxes.
- Keep Aethra demo-readiness polish UI-only: grouped cards, review flow, and copy cleanup must not add endpoints, route execution, prompt submission, model execution, mutation, upload/download/delete controls, telemetry, cloud calls, or production/compliance/certification claims.
- Keep Aethra review-readiness checks lightweight: tests and manual checklist only unless browser automation is explicitly scoped; do not commit generated screenshots.
- Use `docs/LOCAL_SLM_RUNNER_CONTROL_DESIGN.md` as the design source for local SLM runner guarded operator controls. Runner lifecycle work remains phased: read-only status is implemented, guarded daemon/CLI lifecycle request surfaces are implemented as fail-closed contracts, and Aethra Operator Mode remains a guarded UI request surface rather than real process management.
- Keep local evidence package indexing read-only and metadata-only: package names, validation-like filenames, reports, and attestation-like filenames do not imply package correctness, signed attestation, certification, compliance, legal accuracy, or production readiness.
- Keep the Golden Legal adversarial fixture matrix small, synthetic, deterministic, and local-only.
- Keep local evidence validation strict while avoiding signed attestation or tamper-evident storage claims until those features are explicitly implemented.
- Keep dependency advisory and SBOM review helpers optional unless CI installs their tools deterministically.
- Continue local legal model bakeoffs with evidence stored under `./local-evidence/`.
- Continue improving GGUF subprocess diagnostics while keeping the path feature-gated and local-only.

## Candidate model work

Qwen2.5 0.5B is the current pipe/demo baseline. It is useful for validating that the local runner, prompt pack, JSON normalization, audit events, and smoke scripts connect end to end. It is not the settled legal-quality model.

Future model selection should compare larger general models and legal-domain candidates with repeatable local evidence. Any model weights must remain outside git under `./models/` or another ignored local path.

## Planned but not implemented

- Production authentication, authorization, TLS termination, and production origin policy. Loopback-only binding remains the safe local-preview default; the explicit non-loopback override is not a production security boundary.
- Production-grade MCP server surface beyond the experimental stdio stub.
- Production dashboard beyond the current Aethra live-local-first, local-preview scaffold.
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

Post-v0.1.7: the v0.1.8 Local Demo Studio arc is implemented, hardened, and published as a local preview release, combining CLI demo-summary, Aethra Local Demo Studio, demo packages, demo-check, package validation hardening, preview-release-check, and guided local-preview demo workflow validation without production, certification, signed attestation, cryptographic verification, or tamper-evident claims. Optional post-release follow-ups remain separate unless explicitly scoped.
