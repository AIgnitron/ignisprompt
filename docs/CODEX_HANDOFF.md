# Codex Handoff

This file records the current IgnisPrompt and Aethra state so future prompts can simply say: "Follow `AGENTS.md` and `docs/CODEX_HANDOFF.md`."

## Current MVP State

- Repo: https://github.com/AIgnitron/ignisprompt
- Local path: `~/Downloads/Aignitron/IgnisPrompt/Code/ignisprompt`
- MVP tag: `v0.1.0-mvp`
- Final readiness result: **PASS WITH GAPS**
- Public feedback issue: https://github.com/AIgnitron/ignisprompt/issues/56
- Latest known main commit: `5bbd39c fix: parse current model manifest fields in ignispromptctl (#81)`
- Open PRs at this handoff: none
- Open issues at this handoff: #56 only

## Recent Completed Work

- PR #78: added the Aethra MVP checkpoint.
- PR #79: documented Saul 7B local bakeoff status and evidence summary.
- PR #80: documented Qwen2.5 7B local bakeoff status and evidence summary.
- PR #81: fixed `ignispromptctl models` so it reads current `/v1/models` manifest fields such as `modelId`, with a legacy `model_id` fallback.
- Issue #42 is closed after Qwen2.5 7B local legal candidate evidence was documented.
- Issue #43 is closed after Saul 7B local legal candidate evidence was documented.

## Current Working Facts

- Default no-model path works without Ollama, GGUF, external model weights, or local model binaries.
- `StubLegalRunner` remains the default fallback.
- The optional GGUF path is feature-gated and local-only.
- Generated evidence and transcripts live under ignored `local-evidence/`.
- Local model files live under ignored `models/`.
- Model weights, local evidence, generated transcripts, demo bundles, attestation bundles, audit logs, `target/`, and `dist/` must not be committed.
- The synthetic public demo fixture is `tests/golden-legal/demo-synthetic-contract-request.json`.
- The default synthetic demo avoids placeholder-like `"string"` output in the checked demo path.
- The demo proves local routing, audit capture, strict schema validation, and transcript generation. It does not prove legal answer quality for production use.
- `ignispromptctl models` should display current camelCase model manifest fields from the daemon and tolerate legacy snake_case model ids.

## Aethra Status

AETHRA - Local AI Routing Observatory is implemented under `apps/aethra/` as a local-first MVP checkpoint.

Current Aethra boundaries:

- fixture-backed by default
- read-only
- no telemetry
- no cloud calls by default
- model and runner status hints
- proxy-only sustainability indicators

Aethra currently provides fixture-backed screens for Overview, Routing Explorer, Audit Events, Model / Runner Status, and Sustainability Preview. Its live local touchpoints remain explicit and local: the typed API client, the Routing Explorer route-explain action, and the opt-in local API smoke command. `POST /v1/route/explain` is local and inspection-oriented, but it appends a local audit event; use synthetic or non-sensitive text when exercising it.

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
- Aethra sustainability indicators are proxy-only. They are not measured energy use, carbon accounting, ESG evidence, compliance evidence, or certified sustainability reporting.

## Recommended Next Tasks

1. Follow up on public feedback in issue #56.
2. Improve Aethra fixture/live mode clarity while keeping fixture-backed behavior as the default.
3. Add read-only live data loading paths for local `/health`, `/v1/models`, and `/v1/audit/events`, with clear daemon-unreachable and invalid-response states.
4. Add a configurable localhost daemon base URL for Aethra without storing prompt text or adding telemetry.
5. Improve Aethra daemon error states and empty states for live local metadata.
6. Keep any future model and runner status work limited to hints unless IgnisPrompt adds a dedicated local status endpoint.

Avoid cloud telemetry, analytics, auth providers, a SaaS backend, model install/delete controls, and production/legal/compliance/sustainability overclaims unless a future task explicitly scopes and reviews those changes.

## Handoff Notes

- Start every task from clean `main`.
- Keep PRs small and reviewable.
- Keep generated evidence local and ignored.
- Keep model weights local and ignored.
- Preserve local-only behavior, route explanations, audit events, and adversarial document-instruction handling.
- Keep `StubLegalRunner` as the default fallback.
- Keep language conservative: local-first control-plane MVP and Aethra observability MVP, not production legal advice, legal accuracy certification, compliance certification, formal attestation, or certified sustainability reporting.
- If generated/model output is invalid or low quality, report that directly and keep validation strict.
