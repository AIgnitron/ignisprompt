# Aethra MVP Plan

Aethra is the planned standalone dashboard and observatory for IgnisPrompt. The MVP should observe an existing local `ignispromptd` instance; it should not replace IgnisPrompt routing, run model inference, or become an admin plane in its first version.

This plan is intentionally conservative. It describes a read-only MVP that can be built from today's IgnisPrompt surfaces plus a small set of future API additions.

For a deeper proposed technical shape, see the [Aethra architecture plan](AETHRA_ARCHITECTURE.md). For the current implemented dashboard checkpoint, see the [Aethra MVP checkpoint](AETHRA_MVP_CHECKPOINT.md).
For a sustainability monitor walkthrough and talking track, see the [Aethra Sustainability Monitor demo script](AETHRA_SUSTAINABILITY_DEMO.md).

## MVP Responsibilities

Aethra MVP should show:

- daemon health, version, start time, local-only status, and model count
- configured model manifests and obvious local prerequisite hints
- recent route decisions from local audit events
- route explanations and warnings, especially adversarial document-instruction warnings
- fail-closed behavior such as `LEGAL_MODEL_NOT_INSTALLED` and `LOCAL_MODEL_UNAVAILABLE_RAM_PRESSURE`
- no-cloud indicators from route decisions, including `cloud_considered`, `cloud_allowed`, and `data_left_device`
- cache-hit metadata when it appears in audit events
- local runner output metadata when available, including legal JSON parse status from the optional GGUF spike
- a sustainability preview that is clearly labeled as an estimate or proxy, not a certified carbon, energy, or compliance metric

The first useful product shape is an operator console for understanding what IgnisPrompt did and why. It should prioritize route transparency, audit readability, and local-only posture over broad controls.

## Data Available Today

Aethra can read the following HTTP surfaces from `ignispromptd` today:

- `GET /health`: status, service name, daemon version, `started_at`, `local_only`, and `model_count`
- `GET /v1/models`: loaded model manifests, including model id, display name, tier, domains, format, quantization, context window, local path, prompt pack, response format, version, installed flag, and source
- `POST /v1/route/explain`: route decision, explanation text, warnings, request id, tier, domain, model id, cloud flags, and data-locality flag
- `GET /v1/audit/events`: in-memory audit events accumulated during the current daemon process
- `POST /v1/chat/completions`: route metadata, cache metadata, and optional local output metadata on completion responses

The initial dashboard should prefer `GET` surfaces for passive display. `POST /v1/route/explain` can power a Routing Explorer, but the UI must make clear that submitting an example request creates a local route-explain audit event.

## MVP Views

### Overview

Show daemon status, local-only mode, uptime derived from `started_at`, model count, latest route decision, latest warning, and a compact local-only posture summary. Avoid claiming the system is production-ready, compliant, or legally accurate.

### Routing Explorer

Let the user enter a synthetic or non-sensitive prompt and optional domain/model hints, call `POST /v1/route/explain`, and display the route decision and explanation. This should be framed as route inspection only, not legal advice or model-quality validation.

### Audit Events

Render recent events from `GET /v1/audit/events` in a filterable table with timestamp, event type, route code, tier, domain, model id, `data_left_device`, warnings, cache metadata, and completion output metadata. The UI should state that these are local process records, not signed, immutable, encrypted, or certified audit evidence.

### Model And Runner Status

Show model manifests from `GET /v1/models` and derive simple local prerequisite hints, such as whether a manifest declares a `localPath`, `promptPack`, `responseFormat`, and `installed`. Today's API does not prove the referenced local model file exists or that a runner can execute it, so Aethra must label these as manifest-derived hints unless IgnisPrompt adds a richer status endpoint.

### Sustainability Preview

Show simple local-first proxy indicators:

- count of recent events where `data_left_device=false`
- count of recent events where `cloud_allowed=false`
- count of fail-closed legal events
- avoided-cloud-call estimate based only on route decisions that stayed local
- local daemon estimate summary from `GET /v1/metrics/sustainability?period=30d` when available

Fixture mode remains the default for screenshots and demos. In explicit live-local mode, the Sustainability Preview can manually load `GET /v1/metrics/sustainability?period=30d` from the configured loopback daemon URL. It does not poll, persist state, call external services, or change IgnisPrompt routing/audit behavior. If the daemon is unavailable or returns unsupported data, Aethra keeps fixture fallback metrics visible and shows a local error state.

The daemon endpoint returns routing-aware counterfactual fields such as `estimated_cloud_cost_avoided_usd`, `estimated_carbon_avoided_kgco2e`, and `estimated_data_kept_local_gb`, plus `methodology_version`, `confidence`, and a disclaimer. Fixture-backed examples in Aethra are demo data only.

This view must not claim certified sustainability metrics, measured energy usage, carbon accounting, sustainability certification, or compliance evidence. It should be labeled as an early observability preview with methodology-dependent proxy estimates.

### Local Sustainability Report Export

Sustainability Preview can generate a local Markdown report, and a simple JSON report, from the currently displayed sustainability metrics. The export works with bundled fixture data and with manually loaded live-local metrics from the configured loopback daemon.

The report is generated client-side in the browser. Aethra does not persist the report to local storage or session storage, send it to a backend, call telemetry, call cloud services, look up external coefficients, or join a global opt-in aggregation pool. The report must not include request content, prompts, raw audit event text, PII, or machine identifiers.

Report language must stay conservative: estimated CO₂ avoided, counterfactual proxy estimates, methodology-dependent, not actual carbon accounting, not ESG certification, and not production compliance evidence.

## API Gaps

The following IgnisPrompt API additions would make Aethra more useful without moving routing logic into the dashboard:

- `GET /v1/status`: combine health, local-only mode, model count, cache settings, runner configuration summary, and current audit-log path metadata without exposing secrets
- `GET /v1/runners`: expose configured runner names and readiness states, including why an optional runner is unavailable
- `GET /v1/models/status`: report manifest readiness checks such as local path exists, prompt pack exists, and runner eligibility
- `GET /v1/audit/events?limit=&since=&type=&route_code=`: add bounded querying and filtering instead of returning only the full in-memory event list
- `GET /v1/audit/summary`: return route-code counts, tier counts, warning counts, cache-hit counts, and `data_left_device` counts for the current process
- `GET /v1/policy/locality`: expose the effective local-only and cloud-consent policy state in a read-only form
- richer bounded filtering for `GET /v1/metrics/sustainability`: if implemented later, keep clearly named estimates or proxies with methodology fields, not certified measurements

These are dashboard support endpoints. They should preserve IgnisPrompt as the source of routing, audit, and policy truth.

## Read-Only First

The MVP should be read-only except for the optional Routing Explorer call to `POST /v1/route/explain`. It should not include controls to:

- change routing policy
- enable cloud routes
- start, stop, install, or delete models
- edit manifests or prompt packs
- clear audit logs
- modify cache settings
- run legal completions on real customer or matter data

Write controls can be designed later after the observability contract is stable.

## Out Of Scope

The MVP should not include:

- model inference inside Aethra
- duplicate route classification logic
- cloud calls by default
- production legal advice claims
- not production compliance evidence
- not certified sustainability reporting or not actual carbon accounting
- signed or tamper-evident audit storage
- multi-tenant identity, authorization, or enterprise policy administration
- broad MCP client compatibility claims
- packaged desktop distribution unless a separate packaging task defines it

## Recommended Technical Shape

Frontend:

- a TypeScript single-page app focused on dense operational views
- route-driven views for Overview, Routing Explorer, Audit Events, Model And Runner Status, and Sustainability Preview
- generated or hand-maintained TypeScript types matching the current IgnisPrompt JSON shapes
- local configuration for the IgnisPrompt base URL, defaulting to `http://127.0.0.1:8765`
- no telemetry or cloud analytics by default

Backend:

- no separate Aethra backend for the first MVP unless browser restrictions or packaging force one
- call `ignispromptd` directly from the local browser during development
- keep any future proxy local-only and read-only by default

Repository layout options:

1. Start in this repository under `apps/aethra/` while the API contract is still moving.
2. Extract to a separate repository after the dashboard/API boundary stabilizes.

Recommended first layout:

```text
apps/aethra/
  package.json
  src/
    api/
    components/
    routes/
    types/
    main.tsx
  tests/
docs/AETHRA.md
```

Keeping the initial app in this repo makes it easier to evolve the IgnisPrompt API and dashboard together. The boundary should still be explicit: Aethra reads IgnisPrompt state and sends route-explain inspection requests; IgnisPrompt remains responsible for routing, audit append behavior, local-only policy, and runner selection.

## First Implementation Path

1. Add a small Aethra frontend scaffold under `apps/aethra/`.
2. Implement a typed client for `GET /health`, `GET /v1/models`, `GET /v1/audit/events`, and `POST /v1/route/explain`.
3. Build Overview, Audit Events, and Model And Runner Status first.
4. Add Routing Explorer with synthetic-data guidance and a visible note that route-explain calls create local audit events.
5. Add Sustainability Preview using only clearly labeled proxy counts from audit events.
6. Add dashboard support endpoints only when the first UI exposes concrete gaps that cannot be handled honestly from existing data.

The implementation should continue to preserve the default no-model path: Aethra development and tests should not require Ollama, GGUF tooling, model weights, network access, cloud credentials, or local model binaries.

## Proposed Follow-Up Issues

1. Scaffold `apps/aethra/` as a local-only TypeScript dashboard with static sample fixtures and no IgnisPrompt API changes.
2. Add an Aethra typed API client for `GET /health`, `GET /v1/models`, `GET /v1/audit/events`, and `POST /v1/route/explain`.
3. Build the first read-only Overview, Audit Events, and Model And Runner Status views using today's IgnisPrompt responses.
4. Add a Routing Explorer that calls `POST /v1/route/explain` with synthetic or operator-entered text and clearly indicates that route-explain calls append local audit events.
5. Design, but do not overclaim, the first IgnisPrompt dashboard support endpoint for audit summaries or model/runner readiness after the initial UI exposes the concrete data gap.
