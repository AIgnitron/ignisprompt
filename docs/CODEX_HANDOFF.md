# Codex Handoff

This file records the current IgnisPrompt and Aethra state so future prompts can simply say: "Follow `AGENTS.md` and `docs/CODEX_HANDOFF.md`."

## Current MVP State

- Repo: https://github.com/AIgnitron/ignisprompt
- Local path: `~/Downloads/Aignitron/IgnisPrompt/Code/ignisprompt`
- MVP tag: `v0.1.0-mvp`
- Final readiness result: **PASS WITH GAPS**
- Public feedback issue: https://github.com/AIgnitron/ignisprompt/issues/56
- Latest known main commit: `ce0c687 test: harden route policy regression coverage (#146)`
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
- Adapter concepts are documented as a design direction for possible future local LiteLLM-style and DreamServer-style integration. No adapter is implemented, no compatibility guarantee is made, and IgnisPrompt remains a local policy/routing/audit control plane rather than another model server.
- Issue #42 is closed after Qwen2.5 7B local legal candidate evidence was documented.
- Issue #43 is closed after Saul 7B local legal candidate evidence was documented.

## Current Working Facts

- Default no-model path works without Ollama, GGUF, external model weights, or local model binaries.
- `StubLegalRunner` remains the default fallback.
- The optional GGUF path is feature-gated and local-only.
- Model manifests distinguish route eligibility from local file and runner availability. `/v1/models` reports configured manifest fields, while `/v1/status/models` reports read-only local hints for declared path presence, runner configuration, runner executable presence, and conservative availability labels.
- Generated evidence and transcripts live under ignored `local-evidence/`.
- Local model files live under ignored `models/`.
- Model weights, local evidence, generated transcripts, demo bundles, attestation bundles, audit logs, `target/`, and `dist/` must not be committed.
- The synthetic public demo fixture is `tests/golden-legal/demo-synthetic-contract-request.json`.
- The default synthetic demo avoids placeholder-like `"string"` output in the checked demo path.
- The demo proves local routing, audit capture, strict schema validation, and transcript generation. It does not prove legal answer quality for production use.
- `ignispromptctl models` should display current camelCase model manifest fields from the daemon and tolerate legacy snake_case model ids.
- `GET /v1/status/version` reports daemon service, crate version, release channel `local-preview`, local-only flag, build profile, start time, nullable git commit metadata, and conservative warning language. It is local-only support/debugging metadata, not telemetry, an update checker, an external release lookup, or a production readiness signal.
- `ignispromptctl status-version` reads `GET /v1/status/version` and prints the same local preview metadata.
- `ignispromptctl doctor` checks required local preview endpoints for `/health`, `/v1/status/version`, `/v1/models`, and `/v1/status/models`, plus an informational sustainability metrics check for `/v1/metrics/sustainability?period=30d`. It supports `--json`, exits non-zero when required checks fail, and prints local next steps for common failures. It does not add telemetry, cloud calls, GitHub calls, update checks, external lookup, persistence, uploads, model controls, runner controls, or command execution beyond local HTTP reads.
- `ignispromptctl sustainability --period 30d` reads `GET /v1/metrics/sustainability?period=<period>` and prints aggregate local sustainability metrics. Supported periods are `7d`, `30d`, and `90d`; the default is `30d`, and `--json` prints the same local endpoint response as formatted JSON.
- The experimental stdio MCP stub exposes `route_explain` plus read-only local observability tools: `audit_events`, `status_version`, and `sustainability_summary`. The observability tools reuse existing local audit, version status, and sustainability summary logic. MCP `audit_events` now returns object-shaped structured content with an `events` array for stricter MCP client compatibility. They do not add telemetry, cloud calls, GitHub calls, update checks, external lookups, command execution, prompt/resource/sampling support, remote transports, model controls, runner controls, config changes, persistence, uploads, or global aggregation. Sustainability output remains estimated, counterfactual, proxy, methodology-dependent, and not certified sustainability reporting.
- `docs/releases/v0.1.1-local-preview.md` is the v0.1.1 release-readiness record and post-release planning note. It does not claim production readiness. It should be reviewed with `docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md` before any future patch tag work.
- `docs/releases/v0.1.2-local-preview.md` is the v0.1.2 patch release record. It documents post-v0.1.1 MCP compatibility and docs guardrail cleanup, includes upgrade notes and historical pre-tag checks, and does not claim production readiness.
- `docs/ADAPTER_CONCEPTS.md` is docs-only design material. It does not add LiteLLM support, DreamServer support, proxying, runner controls, model controls, cloud calls, telemetry, external lookups, or API behavior.
- `docs/LOCAL_ADAPTER_IMPLEMENTATION_CHECKLIST.md` is a docs-only future implementation gate for local adapter work. It does not implement adapters, change API behavior, add proxying, or add runner/model controls.
- `docs/LITELLM_LOCAL_GATEWAY_PLAN.md` is a docs-only future implementation plan for a LiteLLM-style OpenAI-compatible local gateway path. It does not implement adapter code, proxying, API behavior, cloud fallback, runner controls, or model controls.
- Local-preview schema-lock tests protect the JSON field names and high-level response shapes consumed by local-preview users, Aethra, smoke checks, and `ignispromptctl` for health, models, model/runner status, version status, audit events, sustainability metrics, invalid sustainability period errors, OpenAI-compatible chat completion responses, and existing MCP stdio responses. Route-policy regression tests cover legal Tier 3 routing, general non-legal local routing, local-only fail-closed routing, adversarial document-instruction warnings, conservative route explanations, and local audit emission for route explanations and chat completions. Model availability tests cover configured manifests, route eligibility, missing local files, missing runners, staged GGUF prerequisites, and feature-gated GGUF fallback/error metadata without requiring real model weights or external binaries. Chat completion locks cover non-streaming responses, streaming SSE chunks, route metadata, local-only route flags, UTF-8-safe streaming fragments, and representative invalid-input error shape for future local gateway planning. MCP locks cover initialize, tools/list, route_explain tool success/error payloads, read-only audit_events/status_version/sustainability_summary success and error payloads, notification no-response behavior, and JSON-RPC error envelopes.
- Aethra Overview can manually load daemon version status in live-local mode and otherwise shows fixture fallback release status metadata.
- Aethra Overview shows live-local connection diagnostics derived from manual local loads only. Diagnostics distinguish fixture mode active, live-local ready, live-local connected, daemon unreachable, endpoint unavailable, invalid response shape, last refresh failed, and last refresh succeeded states.
- Aethra Overview shows copyable local commands for starting the daemon, starting Aethra, smoke/release checks, and local API endpoint inspection. Copying writes text to the browser clipboard only; Aethra does not execute commands.
- Aethra now shows a local preview banner that keeps fixture mode, manual live-local loading, no telemetry, no cloud calls by default, and not-a-production-deployment boundaries visible.
- Aethra groups live-local endpoint buttons as manual refresh actions. This is UI copy/layout only; it does not add polling, storage persistence, telemetry, cloud calls, GitHub calls, update checks, command execution, or backend behavior.
- Aethra main pages now include lightweight "What this page shows" guidance panels and more consistent subtitles. This is UI guidance only and does not change data loading, routing, audit behavior, or endpoint shapes.
- Aethra empty states now provide clearer local preview guidance for fixture mode, missing live-local data, unavailable daemon responses, valid empty endpoint responses, and panels that need manual refresh.

## Aethra Status

AETHRA - Local AI Routing Observatory is implemented under `apps/aethra/` as a local-first MVP checkpoint.

Current Aethra boundaries:

- fixture-backed by default
- read-only
- no telemetry
- no cloud calls by default
- model and runner status hints
- proxy-only sustainability indicators

Aethra currently provides fixture-backed screens for Overview, Routing Explorer, Audit Events, Model / Runner Status, and Sustainability Preview. Fixture mode remains the default. Live local mode is explicit and manual, with read-only local metadata loading for:

- `GET /health`
- `GET /v1/models`
- `GET /v1/status/models`
- `GET /v1/audit/events`
- `GET /v1/metrics/sustainability?period=30d`
- `GET /v1/status/version`

The live metadata controls use the configured loopback/local daemon base URL. They do not poll, do not persist state in local storage or session storage, do not add telemetry, and do not make cloud calls by default. The rollout did not add model or runner controls.

`POST /v1/route/explain` remains local and inspection-oriented, but it appends a local audit event. Aethra now requires explicit confirmation before sending a live local route-explain request, resets that confirmation when the target daemon URL or request inputs change, and continues to recommend synthetic or non-sensitive text.

IgnisPrompt now exposes `GET /v1/status/models` for local model and runner status hints. This endpoint is read-only, local-only, and conservative: it reports configuration/path/runner hints and warning language, not production readiness, model quality, legal accuracy, or compliance status.

IgnisPrompt now exposes `GET /v1/status/version` for local preview support, debugging, release validation, and future Aethra display. This endpoint is read-only and local-only. It does not call telemetry, cloud services, GitHub, update services, or external release lookups, and it does not imply production readiness.

Aethra can manually load `GET /v1/status/version` on the Overview screen in live-local mode. Fixture mode remains the default, the fixture version status remains visible until a successful manual load, and unreachable daemon/schema errors keep a clear fixture fallback state. Aethra does not poll, persist this metadata, add telemetry, call cloud services, call GitHub, or perform release/update checks.

Aethra Overview live-local diagnostics explain next local steps such as starting `./scripts/start-dev.sh`, checking the loopback `/health` endpoint, confirming endpoint availability, or using fixture mode while debugging. Diagnostics are local-only, manual, non-persistent, and not telemetry.

Aethra Overview includes a Local Commands panel with copyable local preview helper commands. The commands are for the operator to run in a terminal. The panel does not add remote execution, telemetry, cloud calls, GitHub calls, update checks, polling, or local/session storage persistence.

Aethra includes a local preview banner and grouped manual live-local refresh controls. Fixture mode remains the default, live local loading remains explicit/manual, and no polling, local/session storage persistence, telemetry, cloud calls, GitHub calls, update checks, command execution, backend changes, or API shape changes are added by this UI polish.

`docs/AETHRA_DEMO_PACKAGE.md` documents a public-safe Aethra demo package with a recommended Hero -> Overview -> Routing Explorer -> Audit Events -> Model / Runner Status -> Sustainability Preview sequence, screenshot captions, audience guidance, and conservative local-preview boundaries. It is docs-only and does not add screenshots, generated images, Aethra behavior, telemetry, cloud calls, model controls, or API changes.

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
8. For v0.1.3 planning, use the contributor MCP usage docs and Aethra public/demo package as review material, and keep LiteLLM-style local gateway work as planning only, not implementation.
9. Use `docs/LOCAL_ADAPTER_IMPLEMENTATION_CHECKLIST.md` before any adapter implementation begins; preserve route explanations, audit events, local-only defaults, and adversarial document-instruction behavior.
10. Treat `docs/LITELLM_LOCAL_GATEWAY_PLAN.md` as the focused plan for any future OpenAI-compatible local gateway path; DreamServer work is out of scope for v0.1.3 planning unless a future task explicitly scopes it.

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
