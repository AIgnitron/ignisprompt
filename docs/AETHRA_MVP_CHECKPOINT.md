# Aethra MVP Checkpoint

Aethra is the Local AI Routing Observatory for IgnisPrompt. At this checkpoint it is a local-first, read-only observability dashboard that helps inspect IgnisPrompt routing, audit, model-manifest, and sustainability-proxy metadata without replacing IgnisPrompt behavior.

The dashboard is fixture-backed by default. It is suitable for public screenshots and local demos that need stable synthetic data. It is not production-ready, not legal advice, and not compliance or sustainability certification.

## What Exists Today

Aethra currently provides these fixture-backed screens:

- Overview
- Routing Explorer
- Audit Events
- Model / Runner Status
- Sustainability Preview

The default UI uses synthetic health, model, audit, and route data. This keeps screenshots and demos local, deterministic, and free of model weights, local evidence bundles, audit logs, cloud calls, telemetry, or analytics.

The app shell includes a local preview banner that keeps the fixture-default, manual live-local loading, no-telemetry, no-cloud-calls-by-default, and not-a-production-deployment boundaries visible. Manual live-local refresh actions are grouped and labeled so operators can distinguish endpoint loads from fixture fallback data and local report export actions.

Each main page includes a small guidance panel that explains what the page shows and how to interpret fixture data, manual live-local metadata, route explanations, audit records, model and runner status hints, and sustainability proxy indicators.

## Live Local Touchpoints

Aethra includes local IgnisPrompt API support, but the dashboard remains fixture-first by default.

The pieces that can touch a live local `ignispromptd` are:

- the explicit Routing Explorer local route-explain action
- the Aethra local API client
- the opt-in local API smoke command

`POST /v1/route/explain` is an inspection action only. It is local, but it appends a local audit event. Use synthetic or non-sensitive text when exercising it.

Aethra observes IgnisPrompt state. IgnisPrompt still owns routing decisions, route explanations, audit events, local-only behavior, model manifests, runner/provider selection, and fail-closed behavior.

## Conservative Boundaries

Aethra does not claim:

- production readiness
- legal advice or legal accuracy
- compliance certification
- signed, immutable, encrypted, or certified audit evidence
- not certified sustainability reporting
- measured energy use or carbon accounting
- model quality validation
- cloud calls by default
- telemetry or analytics

The Sustainability Preview shows proxy indicators derived from route and audit metadata. It is not ESG evidence, carbon accounting, measured energy reporting, or compliance evidence.

## Run Locally

From the repository root:

```bash
cd apps/aethra
npm ci
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## Checks

For Aethra app changes:

```bash
cd apps/aethra
npm test
npm run build
```

For the opt-in local API smoke path:

```bash
cd apps/aethra
npm run smoke:local-api -- --start-daemon
```

The smoke starts the default local-only `ignispromptd` path and checks local metadata endpoints. It does not require Ollama, GGUF tooling, model weights, cloud credentials, generated evidence, or a browser E2E runner.

To include route explanation in the smoke, use:

```bash
npm run smoke:local-api -- --start-daemon --include-route-explain
```

That variant uses synthetic text and appends a local audit event.

## Suggested Screenshot Set

For a public-safe carousel order, captions, and demo talking points, see the [Aethra Public Demo Package](AETHRA_DEMO_PACKAGE.md).

- Overview
- Routing Explorer
- Audit Events
- Model / Runner Status
- Sustainability Preview
