# Aethra Architecture Plan

Aethra is the planned standalone dashboard and observatory for IgnisPrompt. This document describes a proposed MVP architecture only. It does not mean the dashboard is implemented, packaged, production-ready, or certified for compliance or sustainability reporting.

The first Aethra MVP should be read-only by default and local-first by design. Its job is to make IgnisPrompt state understandable: health, route decisions, audit events, model manifest hints, and conservative local-only visibility.

## Purpose And Boundary

Aethra should answer operational questions such as:

- Is the local IgnisPrompt daemon reachable?
- Is local-only mode enabled?
- Which model manifests did IgnisPrompt load?
- What recent route decisions did IgnisPrompt make?
- Why did a request route to a given tier or fail closed?
- Did recent events report `data_left_device=false`?
- Which observations are direct daemon facts, and which are dashboard-derived summaries?

Aethra should not answer legal questions, run model inference, decide routes, edit local policy, install models, or certify sustainability or compliance outcomes.

## Relationship To IgnisPrompt

IgnisPrompt remains the source of truth for:

- route classification and route decisions
- route explanation text
- local-only and fail-closed behavior
- audit event creation and local JSONL append behavior
- model manifest loading
- runner/provider selection and fallback behavior
- adversarial document-instruction handling

Aethra observes IgnisPrompt over local HTTP APIs. It may calculate UI summaries from returned data, but it must not reimplement the routing policy or silently reinterpret route outcomes. When Aethra derives a value, the UI should label it as dashboard-derived.

## MVP Architecture

Text diagram:

```text
Operator browser
  |
  | local HTTP, default http://127.0.0.1:8765
  v
Aethra single-page dashboard
  |
  | read-only fetches:
  |   GET /health
  |   GET /v1/models
  |   GET /v1/audit/events
  |
  | explicit inspection action:
  |   POST /v1/route/explain
  |
  | optional metadata-only development probe:
  |   POST /v1/chat/completions
  v
ignispromptd
  |
  | owns routing, explanations, audit append, model registry,
  | runner/provider fallback, cache metadata, local-only policy
  v
local filesystem paths configured for IgnisPrompt
```

The first MVP should not require a separate Aethra backend. A local proxy can be reconsidered later if packaging, CORS hardening, or local file access requirements justify it.

## Frontend Shape

Recommended first frontend shape:

- TypeScript single-page app under `apps/aethra/` in a later implementation PR
- route-driven screens for Overview, Routing Explorer, Audit Events, Model / Runner Status, and Sustainability Preview
- one small API client module that wraps IgnisPrompt HTTP calls
- typed response contracts kept near the client
- fixture-backed development mode for working without a live daemon
- no telemetry, analytics, cloud calls, or external model dependencies

The UI should be dense and operational rather than promotional. It should favor tables, small status summaries, filters, and direct route/audit explanations.

## Local-Only API Client Shape

The first API client should be intentionally small:

```text
src/api/
  client.ts         local base URL, fetch wrapper, timeout handling
  contracts.ts      Health, ModelManifest, AuditEvent, RouteExplain types
  fixtures.ts       static representative responses
  errors.ts         unreachable daemon and malformed response handling
```

Client behavior:

- default base URL: `http://127.0.0.1:8765`
- configurable base URL for local development
- no bundled cloud endpoint
- no automatic telemetry or remote logging
- clear handling for unreachable daemon, invalid JSON, and unexpected response shape
- no retry loop that could spam `POST /v1/route/explain`
- treat `POST /v1/route/explain` as an explicit user action because it appends a local audit event

## Data Sources Available Today

### `GET /health`

Direct facts:

- `status`
- `service`
- `version`
- `started_at`
- `local_only`
- `model_count`

Use for Overview status, daemon version, local-only posture, and uptime derived in the browser.

### `GET /v1/models`

Direct facts:

- model id and display name
- tier and domains
- format and quantization
- context window
- local path string, if declared
- prompt pack and response format, if declared
- sha256, version, installed flag, and source

Use for Model / Runner Status. Today this endpoint does not prove that `localPath` exists, a prompt pack is readable, or a runner can execute the model. Aethra can show manifest-derived hints, but readiness checks need a future IgnisPrompt endpoint.

### `GET /v1/audit/events`

Direct facts:

- request id
- timestamp
- event type
- route code, tier, domain, model id
- `data_left_device`
- explanation
- warnings
- optional cache metadata
- optional completion output metadata

Use for Audit Events, Overview recent activity, and Sustainability Preview proxy counts. These are in-memory process records returned by the current daemon, not signed, immutable, encrypted, replicated, or certified audit evidence.

### `POST /v1/route/explain`

Direct facts:

- request id
- route decision
- explanation
- warnings

Use for Routing Explorer only. The UI should encourage synthetic or non-sensitive prompts and disclose that this call creates a local route-explain audit event.

### `POST /v1/chat/completions`

This endpoint can return useful route, cache, and local output metadata, but it also invokes the completion path. For the Aethra MVP it should not be a default dashboard polling source.

Acceptable MVP uses:

- fixture development for response-shape coverage
- optional manual smoke panel only if clearly labeled as invoking completion behavior
- metadata inspection from operator-provided test requests, not production legal work

Do not use it to benchmark legal answer quality, claim production legal advice, or generate sustainability conclusions.

## Screen Architecture

### Overview

Inputs:

- `GET /health`
- latest rows from `GET /v1/audit/events`

Show:

- daemon reachability
- service/version
- local-only status
- model count
- latest route code and tier
- latest warning count
- recent `data_left_device=false` count

### Routing Explorer

Inputs:

- operator-entered or fixture prompt
- optional model and domain hints
- `POST /v1/route/explain`

Show:

- route decision fields
- explanation text
- warnings
- explicit note that route-explain appends a local audit event

Do not include legal-answer generation in the first MVP.

### Audit Events

Inputs:

- `GET /v1/audit/events`

Show:

- timestamp
- event type
- route code
- tier
- domain
- model id
- `data_left_device`
- warnings
- cache metadata
- completion output metadata when present

Filtering can happen client-side in the first MVP because the current endpoint has no query parameters. Future server-side filtering should be an IgnisPrompt API task.

### Model / Runner Status

Inputs:

- `GET /v1/models`
- `GET /health`

Show:

- manifest list
- installed flag
- declared format, quantization, context window, prompt pack, response format, and source
- manifest-derived prerequisite hints

Do not claim runner readiness from manifest data alone. Runner status needs a future IgnisPrompt API.

### Sustainability Preview

Inputs:

- `GET /v1/audit/events`
- `GET /health`

Show only conservative proxies:

- recent events with `data_left_device=false`
- recent events with `cloud_allowed=false` when available from route decisions or route-explain results
- fail-closed legal route counts by route code
- local-only status from `/health`

This screen must be labeled as an early preview. It does not measure device energy use, carbon impact, avoided emissions, provider-side energy, or certified sustainability metrics.

## Typed Contracts To Define First

Aethra should define narrow TypeScript contracts that mirror current daemon JSON shapes:

```text
HealthResponse
ModelRegistry
ModelManifest
RouteDecision
RouteExplainRequest
RouteExplainResponse
AuditEvent
CacheMetadata
CompletionOutputMetadata
LegalJsonMetadata
AethraApiError
```

Contract rules:

- keep server fields optional only when the daemon response actually omits them
- keep dashboard-derived view models separate from raw API response types
- store route-code and tier values as strings rather than closed enums until the API contract stabilizes
- include unknown-field tolerance in parsing if a runtime validator is added later

## Fixture Strategy

Dashboard development should work without a running daemon.

Recommended fixture set:

- healthy daemon with one legal model manifest
- empty model registry
- legal Tier 3 route-explain success
- legal fail-closed `LEGAL_MODEL_NOT_INSTALLED`
- simulated `LOCAL_MODEL_UNAVAILABLE_RAM_PRESSURE`
- adversarial document-instruction warning
- audit event list with route-explain and chat-completion events
- audit event with cache metadata
- audit event with GGUF legal JSON metadata, including both valid and invalid parse states
- unreachable daemon and malformed response cases for UI error states

Fixtures must be synthetic and should not include real customer contracts, personal data, confidential legal text, model weights, generated evidence bundles, or audit logs.

## Local-Only Development And Test Strategy

Development requirements:

- no Ollama requirement for default dashboard development
- no GGUF tooling requirement
- no model weights
- no network access or cloud credentials
- no telemetry endpoint

Recommended checks for future implementation PRs:

- typecheck the Aethra app
- run unit tests against fixtures
- run a lightweight local UI smoke test with mocked API responses
- optionally run an integration smoke against `./scripts/start-dev.sh` and the default no-model daemon path

The existing `make dev-check` should remain the baseline IgnisPrompt check and must continue to pass without Aethra requiring local model prerequisites.

## Security And Privacy Boundaries

Initial assumptions:

- Aethra runs locally in an operator browser.
- The daemon is normally bound to `127.0.0.1`.
- The current HTTP API has no daemon-level authentication, authorization, or TLS.
- The current daemon uses permissive CORS.

MVP boundaries:

- no cloud calls
- no telemetry or analytics
- no external error reporting
- no persistence of prompts beyond what IgnisPrompt already records
- no upload of audit events or model metadata
- no handling of real customer contracts or production matter data in demos

Aethra should avoid storing prompt text in browser local storage. If local UI preferences are added later, they should be limited to non-sensitive settings such as the local daemon base URL and table display choices.

## Sustainability Preview Limits

Aethra can present local-first observability proxies, not measured sustainability outcomes.

Allowed wording:

- local-only route indicator
- `data_left_device=false` count
- cloud not allowed / not used indicators
- avoided-cloud-call proxy based on local route decisions
- methodology: derived from IgnisPrompt route and audit metadata

Avoided claims:

- certified sustainability metric
- measured carbon reduction
- measured energy savings
- provider energy comparison
- production ESG reporting
- compliance-ready sustainability evidence

If IgnisPrompt later adds a sustainability summary endpoint, it should return methodology fields and conservative labels so Aethra can display what was estimated and what was directly observed.

## Future IgnisPrompt API Gaps

These should remain IgnisPrompt tasks, not Aethra-side reimplementations:

- `GET /v1/status`: combined daemon status, local-only mode, cache settings, and safe config summary
- `GET /v1/runners`: configured runner names and readiness states
- `GET /v1/models/status`: model local-path, prompt-pack, and runner eligibility checks
- `GET /v1/audit/events?limit=&since=&type=&route_code=`: bounded audit querying
- `GET /v1/audit/summary`: route-code, tier, warning, cache, and locality counts
- `GET /v1/policy/locality`: effective local-only and cloud-consent policy state
- `GET /v1/sustainability/summary`: optional proxy summary with methodology, not certification

Aethra may display these endpoints when they exist, but should not infer hidden daemon state by duplicating internal IgnisPrompt logic.

## First Implementation Milestones

1. Add `apps/aethra/` scaffold with TypeScript, fixture-backed tests, and no runtime dependency on a live daemon.
2. Add the local-only IgnisPrompt API client and raw response contracts for health, models, audit events, and route explain.
3. Build Overview, Audit Events, and Model / Runner Status from fixtures first, then from a configurable local daemon base URL.
4. Add Routing Explorer with synthetic prompt guidance and a clear audit-event disclosure.
5. Add Sustainability Preview using only labeled proxy counts from audit and health data.
6. Propose the first IgnisPrompt support endpoint only after the UI demonstrates the concrete missing data.

Each milestone should be small enough for a focused PR. None should add dashboard code that calls cloud services, commits model weights, commits local evidence, or changes IgnisPrompt routing behavior.
