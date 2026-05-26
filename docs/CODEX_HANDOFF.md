# Codex Handoff

This file records the current IgnisPrompt and Aethra state so future prompts can simply say: "Follow `AGENTS.md` and `docs/CODEX_HANDOFF.md`."

## Current MVP State

- Repo: https://github.com/AIgnitron/ignisprompt
- Local path: `~/Downloads/Aignitron/IgnisPrompt/Code/ignisprompt`
- MVP tag: `v0.1.0-mvp`
- Final readiness result: **PASS WITH GAPS**
- Public feedback issue: https://github.com/AIgnitron/ignisprompt/issues/56
- Latest known main commit: `281e94d test: harden local policy workbench (#184)`
- Open PRs at this handoff: none
- Open issues at this handoff: #56 only

## Recent Completed Work

- PR #78: added the Aethra MVP checkpoint.
- PR #79: documented Saul 7B local bakeoff status and evidence summary.
- PR #80: documented Qwen2.5 7B local bakeoff status and evidence summary.
- PR #81: fixed `ignispromptctl models` so it reads current `/v1/models` manifest fields such as `modelId`, with a legacy `model_id` fallback.
- PR #84: added the Aethra live read-only mode design.
- PR #85: added explicit Aethra data source state for fixture vs live local mode.
- PR #86: added manual read-only live local `/health` metadata loading.
- PR #87: added manual read-only live local `/v1/models` metadata loading.
- PR #88: added manual read-only live local `/v1/audit/events` metadata loading.
- PR #89: updated Aethra live metadata rollout docs.
- PR #90: added explicit confirmation before live local `POST /v1/route/explain`.
- PR #91: addressed Aethra live mode review findings for route-explain confirmation reset and trailing-slash loopback URL normalization.
- PR #92: updated Aethra live rollout docs through the review fixes.
- PR #93: strengthened Aethra local API smoke coverage for read-only `/health`, `/v1/models`, and `/v1/audit/events`; route-explain remains opt-in only.
- PR #95: added the model and runner status endpoint design for `GET /v1/status/models`.
- PR #96: implemented local read-only `GET /v1/status/models` with conservative model and runner status hints.
- PR #97: added smoke coverage for `GET /v1/status/models` in repo and Aethra local API smoke paths.
- PR #98: updated the Codex handoff for the model status endpoint work.
- PR #99: wired Aethra to manually consume `GET /v1/status/models` as model and runner status hints.
- Post-v0.1.0 hardening branch `feat/local-version-status-endpoint` adds `GET /v1/status/version` for local preview support/debugging metadata and `ignispromptctl status-version`.
- Post-v0.1.0 hardening branch `feat/aethra-version-status` wires Aethra Overview to show `GET /v1/status/version` in live-local mode with fixture fallback.
- Post-v0.1.0 hardening branch `feat/aethra-live-local-diagnostics` improves Aethra Overview live-local connection diagnostics without backend changes.
- Post-v0.1.0 hardening branch `feat/aethra-copyable-local-commands` adds an Aethra Overview Local Commands panel with copyable terminal commands for local preview verification/debugging.
- Aethra local preview polish adds a concise local preview banner and clearer manual live-local refresh grouping without backend or API changes.
- The v0.1.1 local preview release-readiness package is documented in `docs/releases/v0.1.1-local-preview.md`. `v0.1.1-local-preview` was tagged and published from #140 and must not be moved or recreated during post-release cleanup.
- PR #141 landed after v0.1.1 and fixed MCP `audit_events` compatibility by returning object-shaped MCP tool-call `structuredContent` as `{ "events": [...] }`. The HTTP `GET /v1/audit/events` array response remains preserved. This is included in `v0.1.2-local-preview`.
- PR #142 landed after v0.1.1 and tightened post-release guardrail/release documentation. It documented sustainability language guardrail wiring, added a demo safety warning, reinforced v0.1.1 tag immutability and future v0.1.2 planning, and kept release workflows on `git pull --ff-only origin main`.
- `v0.1.2-local-preview` is published from #143 and is the current latest local-preview release. It includes #141, #142, and the #143 patch release package. Do not move or recreate `v0.1.1-local-preview`.
- PR #144 added contributor MCP usage docs and conservative v0.1.3 planning notes.
- PR #145 added `docs/AETHRA_DEMO_PACKAGE.md` for a public-safe, text-only Aethra demo package. It did not add screenshots, generated images, Aethra behavior, telemetry, cloud calls, model controls, or API changes.
- PR #146 hardened route-policy regression coverage for legal Tier 3 routing, general local routing, adversarial document-instruction handling, conservative explanations, and local audit emission.
- PR #147 hardened model availability semantics, model/runner status hints, and the feature-gated GGUF subprocess contract. `StubLegalRunner` remains the default fallback and GGUF remains opt-in.
- PR #148 hardened the Golden Legal adversarial demo path, expanded Golden Legal v0.3 from 6 to 9 cases, added demo transcript self-test behavior, and strengthened local-only evidence guardrails.
- PR #149 hardened audit evidence validation and added `generate-local-only-attestation.sh --self-test`. The normal script still generates local-only developer evidence only; it does not implement signed attestation reports or tamper-evident audit storage.
- PR #150 added feature-gated GGUF subprocess timeout handling and local runner preflight hardening while keeping `StubLegalRunner` as the default fallback.
- PR #151 hardened Aethra live-local contracts with fixture/schema contract tests, optional-field tolerance, model/runner status hint summaries, audit proxy estimate coverage, sustainability report redaction, and minimal current-state docs cleanup.
- PR #152 added reproducible local security review checks: hidden Unicode scanning, conservative local secret scanning, optional `cargo-audit`, optional CycloneDX SBOM dry-run/generation under ignored local evidence, and docs that avoid certification or complete supply-chain assurance claims.
- PR #153 added `ignispromptctl` local audit and route inspection commands.
- PR #154 added `ignispromptctl` evidence bundle generation from local endpoints.
- PR #155 added `ignispromptctl` evidence bundle list and validate commands plus bundle metadata hardening.
- PR #156 aligned the README and docs landing pages with `v0.1.3-local-preview`.
- PR #159 added the `ignispromptctl` evidence bundle archive workflow.
- PR #160 added the Aethra local evidence workflow.
- PR #165 added the local evidence workflow regression check.
- PR #166 added the Aethra Local Command Center.
- Post-v0.1.4 development adds an Aethra Local Readiness page for fixture-backed local preview readiness cards, copy-only daemon guidance, and a conservative checklist. It is read-only, uses manual live-local data only when already loaded, adds no endpoints, no polling, no telemetry, no cloud calls, and no model or runner controls.
- Post-v0.1.4 development adds a local readiness quality gate and `ignispromptctl readiness` presentation over the existing doctor checks. The readiness command and `make readiness-check` are local-preview only, conservative, and aligned with Aethra Local Readiness wording.
- Post-v0.1.4 development adds copy-safe local readiness report export parity across `ignispromptctl readiness --markdown`, Aethra Local Readiness, and `make readiness-check`. Reports are local helper outputs for issue or demo notes, not uploads, not persisted browser state, and not certification.
- Post-v0.1.4 development improves local readiness diagnostics with safe `readiness --json` category/severity/result/next-step fields and Aethra read-only diagnostic drilldown hints. The diagnostics omit daemon URLs, local machine details, raw audit text, generated evidence contents, and private credentials.
- Post-v0.1.4 development adds a local readiness package workflow under `local-evidence/readiness/` with CLI generation, list, validate, JSON and Markdown summary files, demo workflow integration, and Aethra read-only package preview. The package is local preview readiness only and remains ignored output.
- `v0.1.5-local-preview` was published after the post-v0.1.4 local readiness arc. It includes the local readiness dashboard, quality gate, report export, diagnostics, package workflow, and release-readiness docs.
- Post-v0.1.5 development adds a local operator console arc with Aethra Local Operator Console, `ignispromptctl operator-summary`, and `make operator-check`. The arc aligns readiness, readiness package, evidence workflow, demo next steps, and copy-only command recipes without daemon runtime changes or backend endpoints.
- Post-v0.1.5 development adds a local operator package workflow under `local-evidence/operator/` with CLI generation, list, validate, JSON and Markdown summary files, demo workflow integration, and Aethra read-only package preview. The package is local preview operator workflow guidance only and remains ignored output.
- `v0.1.6-local-preview` is published and is the latest local preview release. It includes the local operator console, `ignispromptctl operator-summary`, local operator package workflow, operator package validation/listing, Aethra read-only operator package preview, `scripts/operator-check.sh`, `make operator-check`, and release-readiness docs.
- Post-v0.1.6 hardening focuses on package workflow test isolation so readiness, operator, evidence bundle, and archive tests use unique ignored local-evidence paths and do not delete shared local-evidence roots during parallel `cargo test`.
- Post-v0.1.6 development adds a local policy workbench arc with `ignispromptctl policy-scenarios`, expanded synthetic policy scenarios, grouping helpers, copy-safe policy reports, stricter local policy package validation under `local-evidence/policy/`, `make policy-check`, demo workflow integration, and Aethra Local Policy Workbench. The policy surface is local-preview only, uses synthetic scenarios, and treats route summaries as hints rather than guarantees.
- v0.1.7 release-prep docs now record the post-v0.1.6 local policy workbench arc for a future `v0.1.7-local-preview` tag. `v0.1.6-local-preview` remains the latest published release until a separate tag and GitHub Release are created.
- A repeatable local evidence demo workflow script now drives route-explain, audit-events, evidence-bundle generation, listing, validation, archiving, archive verification, and manifest inspection under ignored local-evidence paths. It includes dry-run and self-test modes that stay local-only.
- `make evidence-check` runs the local evidence workflow regression checks without requiring a live daemon. It verifies the demo workflow script, the `ignispromptctl evidence-bundle` help surface, and the Aethra boundary-language alignment.
- `make policy-check` runs deterministic local policy workbench checks without requiring a live daemon. It verifies policy scenario CLI output, report output, grouping metadata, package generation/list/validate behavior, demo workflow command construction, and Aethra policy wording alignment.
- Issue #42 is closed after Qwen2.5 7B local legal candidate evidence was documented.
- Issue #43 is closed after Saul 7B local legal candidate evidence was documented.

## Current Working Facts

- Default no-model path works without Ollama, GGUF, external model weights, or local model binaries.
- `StubLegalRunner` remains the default fallback.
- The optional GGUF path is feature-gated and local-only. Its subprocess spike has deterministic timeout handling for configured local fake/real runners, but it remains an experimental local path rather than production-grade runner management.
- Model manifests distinguish route eligibility from local file and runner availability. `/v1/models` reports configured manifest fields, while `/v1/status/models` reports read-only local hints for declared path presence, runner configuration, runner executable presence, conservative availability labels, and language that file/runner presence does not mean executable inference was attempted.
- Generated evidence and transcripts live under ignored `local-evidence/`.
- The local evidence demo workflow is a local-preview operator aid. It does not sign output, provide cryptographic verification, or claim production attestation.
- The local evidence regression check stays local-only and does not replace full release verification.
- Local model files live under ignored `models/`.
- Model weights, local evidence, generated transcripts, demo bundles, attestation bundles, audit logs, `target/`, and `dist/` must not be committed.
- The synthetic public demo fixture is `tests/golden-legal/demo-synthetic-contract-request.json`.
- The default synthetic demo avoids placeholder-like `"string"` output in the checked demo path.
- Golden Legal adversarial fixtures are synthetic and deterministic; document-contained routing, cloud, fake system/developer, and audit-bypass instructions must stay untrusted content and preserve local Tier 3 routing/audit behavior.
- The demo proves local routing, audit capture, strict schema validation, and transcript generation. It does not prove legal answer quality for production use.
- Audit integrity regression coverage checks route-explain and chat-completion audit events for local route/domain/tier signals, request IDs, timestamps, conservative warning/explanation metadata, and optional Aethra estimate fields while preserving the HTTP `GET /v1/audit/events` JSON array shape.
- Audit append ordering writes the local JSONL record before adding the event to process memory. Failed JSONL writes no longer create memory-only events that look durable through `GET /v1/audit/events`.
- The HTTP daemon keeps the default loopback bind and local-origin CORS for browser clients. Non-loopback HTTP binds now require explicit `--allow-non-loopback-cors` or `IGNISPROMPT_ALLOW_NON_LOOPBACK_CORS=true`, which remains an unsafe local-preview override rather than auth, TLS, production readiness, or security certification.
- `./scripts/generate-local-only-attestation.sh --self-test` validates ignored local evidence, audit log, model, `target/`, and Aethra `dist/` paths, and rejects placeholder-like summary JSON containing literal `"string"` values. The normal script still generates developer local-only evidence only; it does not generate signed attestation reports or tamper-evident audit storage.
- `make security-check` runs deterministic local helper scans for hidden Unicode format/control characters and conservative accidental secret patterns. Optional `make cargo-audit` and `./scripts/generate-sbom-local.sh` support local dependency advisory and SBOM review when their tools are installed. These helpers do not claim certification, compliance approval, production security approval, or complete supply-chain assurance.
- `ignispromptctl models` should display current camelCase model manifest fields from the daemon and tolerate legacy snake_case model ids.
- `GET /v1/status/version` reports daemon service, crate version, release channel `local-preview`, local-only flag, build profile, start time, nullable git commit metadata, and conservative warning language. It is local-only support/debugging metadata, not telemetry, an update checker, an external release lookup, or a production readiness signal.
- `ignispromptctl status-version` reads `GET /v1/status/version` and prints the same local preview metadata.
- `ignispromptctl doctor` checks required local preview endpoints for `/health`, `/v1/status/version`, `/v1/models`, and `/v1/status/models`, plus an informational sustainability metrics check for `/v1/metrics/sustainability?period=30d`. It supports `--json`, exits non-zero when required checks fail, and prints local next steps for common failures. It does not add telemetry, cloud calls, GitHub calls, update checks, external lookup, persistence, uploads, model controls, runner controls, or command execution beyond local HTTP reads.
- `ignispromptctl readiness` reuses the same local endpoint checks as `doctor` and prints a local preview readiness summary. `--json` prints safe local diagnostics with category, severity, result, local next step, and boundary note fields. `--markdown` prints a copy-safe local helper report for issue or demo notes. It frames model and runner data as status hints, local helper checks as checks rather than certification, and Aethra live-local loading as manual.
- `ignispromptctl readiness --package-output local-evidence/readiness/<name>` writes a local readiness package with README, manifest, safe JSON summaries, and Markdown report output under an ignored readiness path. `--package-list` and `--package-validate` inspect package files locally without daemon access. Package outputs omit daemon URLs, prompts, raw audit text, generated evidence contents, private credentials, absolute paths, and local machine-specific values.
- `ignispromptctl operator-summary` prints local preview operator workflow guidance without calling the daemon. `--json` prints the same safe operator guidance as structured JSON. It summarizes readiness, readiness packages, evidence checks, Aethra fixture-backed review, and copy-only command recipes while keeping status values as hints, local helper checks separate from certification, package validation structural/local only, and live-local loading manual. `--package-output local-evidence/operator/<name>` writes a local operator package with README, manifest, safe JSON summaries, and Markdown report output under an ignored operator path. `--package-list` and `--package-validate` inspect package files locally without daemon access.
- `ignispromptctl policy-scenarios` prints synthetic local policy scenario guidance without calling the daemon. `--json` prints safe structured policy scenario metadata with grouping, local-only expectation, and fail-closed expectation fields. `--report` prints a copy-safe Markdown report, and `--package-output local-evidence/policy/<name>` writes a local policy package with README, manifest, safe JSON summaries, and Markdown report output under an ignored policy path. `--package-list` and `--package-validate` inspect package files locally without daemon access and check required files, JSON shape, schema fields, boundary terms, placeholder values, and unsafe content. Policy package validation is structural/local only.
- `ignispromptctl sustainability --period 30d` reads `GET /v1/metrics/sustainability?period=<period>` and prints aggregate local sustainability metrics. Supported periods are `7d`, `30d`, and `90d`; the default is `30d`, and `--json` prints the same local endpoint response as formatted JSON.
- `ignispromptctl audit-events` reads the existing local `GET /v1/audit/events` endpoint as a read-only terminal inspection command. It can print a human-readable summary or formatted JSON and does not mutate, persist, upload, or externally redact audit events.
- `ignispromptctl evidence-bundle --output local-evidence/demo-bundle` writes a local-only diagnostic bundle from the existing local health, version status, model, model and runner status hint, and sustainability endpoints. `--include-audit-events` adds the raw local audit event response only when explicitly requested, and `--json` prints the summary JSON. `--list` inspects an existing bundle without calling the daemon, `--validate` checks the on-disk bundle contract without daemon access, `--archive` creates a local archive after validating the bundle, `--verify-archive` inspects an existing archive without calling the daemon, and `--print-manifest` prints the manifest for an existing bundle without calling the daemon. The Evidence Bundle Viewer also offers clipboard-only Markdown and JSON report export helpers that stay local-preview only. The command keeps output under ignored `local-evidence/` by default guidance, and it is not signed, not certified, not production evidence, and does not call cloud services or external endpoints.
- `ignispromptctl route-explain` calls the existing local `POST /v1/route/explain` endpoint with synthetic/non-sensitive `--text` or a request JSON `--input`, with optional formatted JSON output. It is route inspection only, not legal advice or legal accuracy validation.
- The experimental stdio MCP stub exposes `route_explain` plus read-only local observability tools: `audit_events`, `status_version`, and `sustainability_summary`. The observability tools reuse existing local audit, version status, and sustainability summary logic. MCP `audit_events` now returns object-shaped structured content with an `events` array for stricter MCP client compatibility. They do not add telemetry, cloud calls, GitHub calls, update checks, external lookups, command execution, prompt/resource/sampling support, remote transports, model controls, runner controls, config changes, persistence, uploads, or global aggregation. Sustainability output remains estimated, counterfactual, proxy, methodology-dependent, and not certified sustainability reporting.
- `docs/releases/v0.1.1-local-preview.md` is the v0.1.1 release-readiness record and post-release planning note. It does not claim production readiness. It should be reviewed with `docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md` before any future patch tag work.
- `docs/releases/v0.1.2-local-preview.md` is the v0.1.2 patch release record. It documents post-v0.1.1 MCP compatibility and docs guardrail cleanup, includes upgrade notes and historical pre-tag checks, and does not claim production readiness.
- `docs/releases/v0.1.5-local-preview.md` is the v0.1.5 release-readiness record for the local readiness arc.
- `docs/releases/v0.1.6-local-preview.md` is the v0.1.6 release-readiness record for the local operator workflow arc.
- `docs/releases/v0.1.7-local-preview.md` is the v0.1.7 release-prep record for the local policy workbench arc. It does not tag or publish v0.1.7.
- Local-preview schema-lock tests protect the JSON field names and high-level response shapes consumed by local-preview users, Aethra, smoke checks, and `ignispromptctl` for health, models, model/runner status, version status, audit events, sustainability metrics, invalid sustainability period errors, OpenAI-compatible chat completion responses, and existing MCP stdio responses. Route-policy regression tests cover legal Tier 3 routing, general non-legal local routing, local-only fail-closed routing, adversarial document-instruction warnings, conservative route explanations, local audit emission for route explanations and chat completions, audit durability ordering, and HTTP bind/CORS guardrails. Model availability tests cover configured manifests, route eligibility, missing local files, missing runners, staged GGUF prerequisites, and feature-gated GGUF fallback/error metadata without requiring real model weights or external binaries. GGUF subprocess tests use temporary fake local scripts for fast success, timeout/hang fallback, non-zero exit fallback, invalid JSON metadata, and async request-path blocking isolation. Chat completion locks cover non-streaming responses, streaming SSE chunks, route metadata, local-only route flags, UTF-8-safe streaming fragments, and representative invalid-input error shape for future local gateway planning. MCP locks cover initialize, tools/list, route_explain tool success/error payloads, read-only audit_events/status_version/sustainability_summary success and error payloads, notification no-response behavior, and JSON-RPC error envelopes.
- Aethra Overview can manually load daemon version status in live-local mode and otherwise shows fixture fallback release status metadata.
- Aethra Overview shows live-local connection diagnostics derived from manual local loads only. Diagnostics distinguish fixture mode active, live-local ready, live-local connected, daemon unreachable, endpoint unavailable, invalid response shape, last refresh failed, and last refresh succeeded states.
- Aethra Overview shows copyable local commands for starting the daemon, starting Aethra, smoke/release checks, and local API endpoint inspection. Copying writes text to the browser clipboard only; Aethra does not execute commands.
- Aethra now shows a local preview banner that keeps fixture mode, manual live-local loading, no telemetry, no cloud calls by default, and not-a-production-deployment boundaries visible.
- Aethra groups live-local endpoint buttons as manual refresh actions. This is UI copy/layout only; it does not add polling, storage persistence, telemetry, cloud calls, GitHub calls, update checks, command execution, or backend behavior.
- Aethra main pages now include lightweight "What this page shows" guidance panels and more consistent subtitles. This is UI guidance only and does not change data loading, routing, audit behavior, or endpoint shapes.
- Aethra empty states now provide clearer local preview guidance for fixture mode, missing live-local data, unavailable daemon responses, valid empty endpoint responses, and panels that need manual refresh.
- Aethra now includes a guided demo path and clearer sidebar labels so reviewers can move from route inspection to audit records, model and runner hints, the evidence workflow, and sustainability preview in a safe order.

## Aethra Status

AETHRA - Local AI Routing Observatory is implemented under `apps/aethra/` as a local-first MVP checkpoint.

Current Aethra boundaries:

- fixture-backed by default
- read-only
- no telemetry
- no cloud calls by default
- model and runner status hints
- proxy-only sustainability indicators

Aethra currently provides fixture-backed screens for Overview, Routing Explorer, Audit Events, Model / Runner Status, Evidence Bundle Viewer, and Sustainability Preview. Fixture mode remains the default. Live local mode is explicit and manual, with read-only local metadata loading for:

- `GET /health`
- `GET /v1/models`
- `GET /v1/status/models`
- `GET /v1/audit/events`
- `GET /v1/metrics/sustainability?period=30d`
- `GET /v1/status/version`

The live metadata controls use the configured loopback/local daemon base URL. They do not poll, do not persist state in local storage or session storage, do not add telemetry, and do not make cloud calls by default. The rollout did not add model or runner controls.

Aethra also includes a fixture-backed evidence bundle viewer for manifest, validation summary, archive metadata preview, safe local-preview CLI snippets, and clipboard-only Markdown and JSON report export helpers. It is read-only and local-preview only. It does not extract archives, upload data, persist bundle state, or read arbitrary local paths.

The evidence bundle viewer shows conservative empty states when metadata is missing or invalid. Missing fields do not imply signing, certification, attestation, cryptographic verification, or production readiness.

`POST /v1/route/explain` remains local and inspection-oriented, but it appends a local audit event. Aethra now requires explicit confirmation before sending a live local route-explain request, resets that confirmation when the target daemon URL or request inputs change, and continues to recommend synthetic or non-sensitive text.

IgnisPrompt now exposes `GET /v1/status/models` for local model and runner status hints. This endpoint is read-only, local-only, and conservative: it reports configuration/path/runner hints and warning language, not production readiness, model quality, legal accuracy, or compliance status.

IgnisPrompt now exposes `GET /v1/status/version` for local preview support, debugging, release validation, and future Aethra display. This endpoint is read-only and local-only. It does not call telemetry, cloud services, GitHub, update services, or external release lookups, and it does not imply production readiness.

Aethra can manually load `GET /v1/status/version` on the Overview screen in live-local mode. Fixture mode remains the default, the fixture version status remains visible until a successful manual load, and unreachable daemon/schema errors keep a clear fixture fallback state. Aethra does not poll, persist this metadata, add telemetry, call cloud services, call GitHub, or perform release/update checks.

Aethra Overview live-local diagnostics explain next local steps such as starting `./scripts/start-dev.sh`, checking the loopback `/health` endpoint, confirming endpoint availability, or using fixture mode while debugging. Diagnostics are local-only, manual, non-persistent, and not telemetry.

Aethra Overview includes a Local Commands panel with copyable local preview helper commands. The commands are for the operator to run in a terminal. The panel does not add remote execution, telemetry, cloud calls, GitHub calls, update checks, polling, or local/session storage persistence.

Aethra includes a local preview banner and grouped manual live-local refresh controls. Fixture mode remains the default, live local loading remains explicit/manual, and no polling, local/session storage persistence, telemetry, cloud calls, GitHub calls, update checks, command execution, backend changes, or API shape changes are added by this UI polish.

Aethra includes a Local Readiness page that summarizes daemon health, version/status, configured models, model and runner status hints, evidence workflow availability, and local helper checks. The page is fixture-backed by default, uses already-loaded live-local data only after manual refreshes elsewhere, provides copy-only snippets for `./scripts/start-dev.sh`, `cargo run -p ignispromptctl -- health`, `cargo run -p ignispromptctl -- doctor`, `cargo run -p ignispromptctl -- readiness`, `cargo run -p ignispromptctl -- readiness --markdown`, readiness package generation/list/validate commands, `make dev-check`, and `make evidence-check`, offers a browser-local copy-only readiness report snippet, shows a read-only readiness package preview, and shows read-only diagnostic drilldown hints for category, status, severity, local next step, and boundary note.

Aethra includes a Local Operator Console that combines fixture-backed local preview readiness, readiness package status, operator package preview, evidence workflow status, demo next steps, local safety boundaries, and copy-only command recipes. It is read-only and does not execute commands, upload files, extract archives, poll endpoints, persist operator data, add telemetry, add cloud calls, add backend endpoints, or add model or runner controls.

Aethra includes a Local Policy Workbench that shows fixture-backed synthetic policy scenarios, grouping helpers, read-only route hints, policy package preview metadata, and copy-safe policy report snippets. It does not execute commands, upload files, read arbitrary local paths, extract archives, poll endpoints, persist policy data, add telemetry, add cloud calls, add backend endpoints, or add model or runner controls.

`docs/AETHRA_DEMO_PACKAGE.md` documents a public-safe Aethra demo package with a recommended Hero -> Overview -> Local Readiness -> Local Operator Console -> Local Policy Workbench -> Local Command Center -> Routing Explorer -> Audit Events -> Model / Runner Status -> Evidence Bundle Viewer -> Sustainability Preview sequence, screenshot captions, audience guidance, and conservative local-preview boundaries. It is docs-only and does not add screenshots, generated images, Aethra behavior, telemetry, cloud calls, model controls, or API changes.

Aethra main pages include small guidance panels that explain local preview status, route inspection, local audit records, model and runner status hints, and sustainability proxy indicators. These panels are static help copy and do not add model controls, runner controls, polling, telemetry, storage persistence, cloud calls, GitHub calls, update checks, command execution, backend changes, or API shape changes.

Aethra empty states explain what data is missing, why fixture fallback may still be visible, and what local action to try next, such as starting `./scripts/start-dev.sh`, running `./scripts/smoke.sh`, or manually refreshing the relevant panel. These empty states are local-only UI copy. They do not auto-load data, poll endpoints, persist state, add telemetry, call cloud services, call GitHub, or perform update checks.

Aethra Routing Explorer includes clearer fixture-backed route example labels, local-preview route decision guidance, and a compact decision breakdown for tier, route code, local-only policy signals, warnings, and explanation text. Route decision JSON copy uses the browser Clipboard API only; it does not execute commands, persist state, add telemetry, call cloud services, call GitHub, or perform update checks.

Aethra Audit Events includes clearer local-preview search/filter labels, no-match guidance, and a request ID copy helper for the selected event. The filtering is browser-local against currently displayed fixture or manually loaded records. Copying writes text to the browser clipboard only; it does not execute commands, persist state, add telemetry, call cloud services, call GitHub, or perform update checks.

IgnisPrompt now exposes `GET /v1/metrics/sustainability?period=30d` for Aethra v0.1 local-only counterfactual sustainability and cost proxy estimates derived from in-memory audit events. It reports methodology version, confidence, and disclaimer fields. It must be presented as not measured energy use, not actual carbon accounting, not ESG certification, and not compliance evidence.

`ignispromptctl sustainability` provides terminal access to the same local aggregate metrics without opening Aethra. It validates supported periods before sending a request, shows daemon-unreachable guidance that mentions `./scripts/start-dev.sh` and the local endpoint, and does not add telemetry, cloud calls, GitHub calls, update checks, external coefficient lookup, persistence, upload, global aggregation, prompts, raw audit text, PII, or machine identifiers.

Aethra can manually load `GET /v1/status/models` on the Model / Runner Status screen. It can also manually load `GET /v1/metrics/sustainability?period=30d` on the Sustainability Preview screen in live-local mode, with fixture fallback data remaining visible until a successful manual load. Fixture mode remains the default, live loading remains explicit/manual, and the UI presents these values as local daemon hints and methodology-dependent proxy estimates.

Sustainability Preview can export a structured local Markdown report and a deterministic schema-versioned JSON report from the currently displayed sustainability metrics, whether those metrics are fixture fallback data or manually loaded live-local data. The JSON report uses `report_schema_version: "aethra-sustainability-report-0.1"` and includes summary, estimates, tier breakdown, baseline, methodology, confidence, disclaimer, limitations, and `local_only: true`. Export is client-side only. It does not persist report data, send report data to a backend, add telemetry, call cloud services, call GitHub, check for updates, poll endpoints, look up external coefficients, or include request content, prompts, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys.

Sustainability Preview now repeats concise report export guidance beside the Markdown/JSON actions: reports are generated in the browser from displayed aggregate metrics, exclude prompts/raw audit text/PII/machine identifiers, and are for local preview review/debugging. Methodology version copy uses the browser Clipboard API only and does not persist state, execute commands, add telemetry, call cloud services, call GitHub, or perform update checks.

Aethra observes IgnisPrompt state. IgnisPrompt still owns routing decisions, route explanations, audit events, local-only behavior, model manifests, runner/provider selection, and fail-closed behavior.

## Known Good Commands

These commands have passed in recent local work when their prerequisites were present:

```bash
cargo build
cargo test
make dev-check
make readiness-check
make operator-check
make policy-check
make evidence-check
make smoke
make gguf-smoke
make golden
make demo
./scripts/demo-transcript.sh
./scripts/generate-local-only-attestation.sh
```

The default path must keep working without Ollama, GGUF tooling, local model weights, network access, cloud access, or cloud credentials.

For Aethra app changes, run from `apps/aethra/`:

```bash
npm test
npm run build
```

Public CI also runs these Aethra checks in a separate job. This is local-preview test/build coverage only, not production certification.

For opt-in Aethra local API smoke, run from `apps/aethra/`:

```bash
npm run smoke:local-api -- --start-daemon
```

Add `--include-route-explain` only when you intentionally want to append a local audit event with synthetic text.

## Open Issues

- #56 Request for feedback: IgnisPrompt MVP architecture and local-first routing design: https://github.com/AIgnitron/ignisprompt/issues/56

## Closed Follow-Up Blockers

- #42 Add and review Qwen2.5 7B local legal candidate: closed after local bakeoff evidence was documented.
- #43 Add and review Saul 7B local legal candidate: closed after local bakeoff evidence was documented.

## Remaining Gaps

- The local HTTP API has no daemon-level authentication, authorization, or TLS.
- Audit events are local process records and JSONL appends; they are not signed, immutable, tamper-evident, encrypted by the daemon, or certified.
- Prompt-injection handling is lightweight pattern detection, not a complete adversarial robustness solution.
- No command in the current audit proves production legal accuracy or legal advice quality.
- Local bakeoff documentation records candidate behavior observed under local conditions; it does not prove legal accuracy, production readiness, compliance status, or broad model quality.
- Aethra sustainability indicators are proxy-only. They are not measured energy use, not actual carbon accounting, not ESG certification, not compliance evidence, and not certified sustainability reporting.

## Recommended Next Tasks

1. Follow up on public feedback in issue #56.
2. Improve Aethra daemon error, empty-state, and live-mode copy as operators test the manual local metadata flows.
3. Improve Aethra model and runner status hint copy, empty states, and operator guidance based on live-mode feedback.
4. Keep Aethra version status language limited to local preview support/debugging metadata; avoid update-check, readiness, certification, or compliance claims.
5. Keep Aethra live-local diagnostics limited to local connection/debugging state; avoid polling, persistence, external lookup, cloud calls, update checks, readiness claims, or controls.
6. Keep copyable command helpers local and explicit; avoid dashboard-side command execution, remote command language, telemetry, or persistence.
7. Keep any future model and runner status work limited to hints; avoid readiness, certification, legal-quality, or compliance claims.
8. Continue v0.1.6 planning around the local operator console and operator workflow alignment while keeping docs conservative.

Avoid cloud telemetry, analytics, auth providers, a SaaS backend, model install/delete controls, and production/legal/compliance/sustainability overclaims unless a future task explicitly scopes and reviews those changes.

## Handoff Notes

- Start every task from clean `main`.
- Keep PRs small and reviewable.
- Keep generated evidence local and ignored.
- Keep model weights local and ignored.
- Preserve local-only behavior, route explanations, audit events, and adversarial document-instruction handling.
- Keep `StubLegalRunner` as the default fallback.
- Keep language conservative: local-first control-plane MVP and Aethra observability MVP, not production legal advice, legal accuracy certification, compliance certification, formal attestation, and not certified sustainability reporting.
- Future sustainability work must use estimated/proxy/counterfactual/methodology-dependent language and avoid unsupported ESG, compliance, carbon-certainty, zero-emissions, or certified reporting claims.
- Future sustainability report work must keep export local-only, avoid request content and raw audit text, and preserve the current boundary: not actual carbon accounting, not ESG certification, not certified sustainability reporting, and not production compliance evidence.
- `./scripts/check-sustainability-language.sh` enforces the sustainability language guardrail and is included in `./scripts/dev-check.sh`. `./scripts/release-check.sh` runs it directly and then runs `./scripts/dev-check.sh`, so release checks include the guardrail twice by design. The script scans README, docs, Aethra source, daemon source, and scripts for a narrow set of unsupported sustainability claim phrases while excluding generated and ignored output paths.
- If generated/model output is invalid or low quality, report that directly and keep validation strict.

Post-v0.1.7 local demo studio work adds local demo studio CLI, Aethra, demo package, demo-check, and demo workflow validation. Keep it local-preview only, fixture-backed/read-only in Aethra, and do not claim production readiness, certification, signed attestation, or tamper-evident storage.
