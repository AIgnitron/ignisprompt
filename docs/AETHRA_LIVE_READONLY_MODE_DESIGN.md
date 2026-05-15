# Aethra Live Read-Only Mode Design

## 1. Status

Status: rollout partially implemented through PR #88.

Completed:

- PR #84: design doc.
- PR #85: local base URL and explicit fixture/live mode state.
- PR #86: manual read-only `/health` live local metadata.
- PR #87: manual read-only `/v1/models` live local metadata.
- PR #88: manual read-only `/v1/audit/events` live local metadata.

Not complete:

- PR #89 or later: explicit route-explain confirmation before any live local request that appends a local audit event.

Aethra currently exists as the Local AI Routing Observatory for IgnisPrompt. The MVP is fixture-backed by default, read-only, and local-first. This document describes a conservative path for optional live local metadata from an operator-managed `ignispromptd` instance. It does not implement the mode, change daemon behavior, change routing policy, add telemetry, add cloud calls, add a SaaS backend, or add model control features.

## 2. Goal

Add a carefully staged design for optional live local metadata in Aethra while preserving the current boundaries:

- fixture-backed by default
- read-only
- no telemetry
- no cloud calls by default
- model and runner status hints
- proxy-only sustainability indicators

The goal is to let an operator inspect local daemon metadata when they explicitly choose live mode, without turning Aethra into a control panel or a model management surface.

## 3. Non-goals

This design does not include:

- model inference inside Aethra
- automatic polling by default
- telemetry, analytics, or product usage reporting
- cloud calls or cloud model providers
- a SaaS backend
- authentication providers or hosted identity
- model install, delete, download, start, stop, or runner control actions
- route policy edits
- daemon configuration writes
- audit log mutation
- production readiness claims
- legal advice or legal accuracy claims
- compliance certification, enterprise certification, formal attestation, or certified sustainability reporting
- measured energy use, carbon accounting, ESG evidence, or provider energy reporting

## 4. Current State

Aethra is implemented under `apps/aethra/` with fixture-backed screens:

- Overview
- Routing Explorer
- Audit Events
- Model / Runner Status
- Sustainability Preview

The current dashboard uses synthetic local fixtures by default. It includes a data-mode boundary strip that makes the mode explicit: fixture-backed by default, read-only, no telemetry, no cloud calls by default, model and runner status hints, and proxy-only sustainability indicators.

Aethra already has a typed local API client for IgnisPrompt endpoints and an opt-in local API smoke command. The UI should continue to treat fixture mode as the stable default for demos, screenshots, and development without a running daemon.

## 5. Proposed User Experience

Aethra should expose a clear data-mode control with two states:

- `Fixture`: default. Uses bundled synthetic fixtures only.
- `Live local`: optional. Reads selected metadata from the configured localhost daemon.

The control should be visible near the existing data-mode boundary strip. It should explain that live local mode:

- only talks to the configured local daemon base URL
- performs read-only metadata requests for the endpoints listed in this design
- does not contact cloud services
- does not send telemetry
- does not modify daemon state
- does not install, delete, start, stop, or configure models or runners

Every screen using live local data should show its source state: fixture, live local, partial live local, or unavailable. Fixture and live values should not be silently mixed unless the UI labels the fallback clearly.

## 6. Proposed Technical Design

Add explicit state for the local data source:

- `mode`: `fixture` or `live-local`
- `baseUrl`: configurable localhost URL, defaulting to `http://127.0.0.1:8765`
- `endpointStates`: per-endpoint load state for health, models, and audit events
- `lastLoadedAt`: timestamp for successful live local metadata loads

The initial implementation should keep fixture mode as the default and should not auto-enable live mode. Live mode should be an explicit operator choice. Aethra should read only from the configured base URL and should reject or warn on non-localhost URLs unless a future security review explicitly changes that behavior.

The API client should continue to use typed response guards. Unsupported response shapes should be shown as unsupported schema states rather than coerced into fixture-like data.

No prompt text should be stored in browser local storage. If local preferences are stored later, they should be limited to non-sensitive UI settings such as data mode and local daemon base URL.

## 7. Data Boundaries

Live read-only metadata is limited to endpoint responses from a local `ignispromptd` daemon. Aethra may summarize those responses for display, but it must label dashboard-derived summaries clearly.

Aethra must not:

- infer hidden daemon state that is not returned by the endpoint
- duplicate routing policy
- claim model readiness beyond model and runner status hints
- treat local audit events as signed, immutable, encrypted, or certified evidence
- treat sustainability proxies as measured energy use, carbon accounting, ESG evidence, compliance evidence, or certified sustainability reporting
- upload metadata, prompts, audit events, model ids, or base URLs to external services

## 8. Endpoint-by-Endpoint Behavior

### `GET /health`

Purpose: read basic daemon availability and local-only metadata.

Expected UI behavior:

- show service name, version, started time, local-only flag, and model count when present
- label values as live local metadata
- show fixture values only when mode is fixture or when the user explicitly returns to fixture mode
- show stale or unavailable state if the daemon cannot be reached

### `GET /v1/models`

Purpose: read model manifest metadata.

Expected UI behavior:

- show model manifests and installed flags returned by the daemon
- label local paths, prompt packs, response formats, and installed flags as manifest-derived hints
- keep the screen language as model and runner status hints
- do not check filesystem paths from the browser
- do not add install, delete, download, start, stop, or runner control actions
- do not claim a model is high quality, legally accurate, production-ready, or compliance-ready

### `GET /v1/audit/events`

Purpose: read local audit event metadata from the daemon API.

Expected UI behavior:

- show returned audit records as local daemon records
- label any counts or summaries as dashboard-derived
- show warnings and route explanations exactly enough to preserve meaning
- do not claim audit events are signed, immutable, tamper-evident, encrypted, certified, or compliance evidence

### `POST /v1/route/explain`

Purpose: inspect a route decision for an explicit request.

This endpoint is different from read-only metadata because it appends a local audit event. It should not be part of automatic live metadata loading. It should remain an explicit operator action with clear confirmation before any request is sent.

Expected UI behavior:

- keep fixture route examples available by default
- require explicit user action before sending a live local route-explain request
- explain that the request is local but appends a local audit event
- recommend synthetic or non-sensitive text
- show returned route decisions as IgnisPrompt-owned decisions, not Aethra decisions

## 9. Error and Empty States

Aethra should show specific states instead of generic failure messages:

- `Daemon unreachable`: no connection to the configured base URL.
- `Timeout`: the local daemon did not respond within the configured timeout.
- `Invalid JSON`: response was not parseable JSON.
- `Unsupported schema`: response JSON did not match the expected contract.
- `Empty data`: endpoint returned a valid empty set, such as no audit events.
- `Partial live metadata`: one endpoint loaded successfully while another failed.
- `Fixture fallback`: fixture data is being shown after an explicit return to fixture mode or after a clearly labeled fallback.

The UI should not hide invalid model output or malformed metadata. It should report failures honestly and keep validation strict.

## 10. Security and Privacy Boundaries

The local live metadata mode should preserve the project posture:

- no telemetry
- no analytics
- no cloud calls by default
- no SaaS backend
- no auth provider integration
- no prompt text stored in local storage
- no model weights in git
- no generated evidence in git
- no audit logs in git

The configurable base URL should default to `http://127.0.0.1:8765`. Aethra should prefer localhost and loopback addresses. If broader local network targets are considered later, that should be a separate security and threat-modeling task.

## 11. Testing Plan

Unit and integration test coverage should grow in small steps:

- fixture mode remains the default state
- mode switching does not trigger live requests until explicitly selected
- base URL normalization handles trailing slashes
- non-localhost or unsupported base URLs are rejected or warned, depending on the final policy
- `GET /health` live success, unreachable daemon, timeout, invalid JSON, and unsupported schema states
- `GET /v1/models` live success, empty model list, and unsupported schema states
- `GET /v1/audit/events` live success, empty event list, and unsupported schema states
- partial live metadata states when one endpoint succeeds and another fails
- route-explain live requests require explicit action and confirmation

Validation for implementation PRs should include:

```bash
cd apps/aethra
npm test
npm run build
```

For opt-in local API smoke, use:

```bash
cd apps/aethra
npm run smoke:local-api -- --start-daemon
```

Do not use model bakeoffs for this UI metadata work.

## 12. Rollout Plan

Rollout progress:

1. PR 1: design doc only - complete in #84.
2. PR 2: local base URL and explicit fixture/live mode state - complete in #85.
3. PR 3: read-only `/health` live metadata - complete in #86.
4. PR 4: read-only `/v1/models` live metadata - complete in #87.
5. PR 5: read-only `/v1/audit/events` live metadata - complete in #88.
6. PR 6: explicit route-explain confirmation before any request that appends an audit event - not complete.

Each implementation PR should keep fixture mode as the default and should be reversible without affecting IgnisPrompt routing, model runners, audit append behavior, or local-only policy.

## 13. Open Questions

- Should live local mode remember the selected mode, or should every app load start in fixture mode?
- Should the base URL be stored in local storage, session storage, or only React state?
- Should non-loopback private LAN addresses be blocked, warned, or allowed only behind an advanced setting?
- Should live metadata loading be manual refresh only, or should there be an opt-in refresh interval later?
- What timeout should Aethra use per endpoint?
- Should audit events be capped in the browser, paginated by the daemon, or both?
- Should unsupported schema errors include raw field names, or only a conservative summary?
- Should route-explain confirmation be a modal, inline confirmation, or separate route-explain mode?
