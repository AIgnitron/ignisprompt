# Aethra Sustainability Monitor — Phase 1 Checkpoint

Aethra now has an end-to-end local-first sustainability monitor path:

```text
IgnisPrompt audit events
-> /v1/metrics/sustainability?period=30d
-> Aethra live-local Sustainability Preview
-> sustainability language guardrails
-> review hardening
-> local Markdown/JSON report export
```

This checkpoint is about observability for local-first routing decisions. Aignitron is not just showing AI usage. Aethra shows the cloud usage avoided by local-first routing decisions, using estimated CO₂ avoided, counterfactual proxy estimates, and methodology-dependent caveats.

For the v0.1 assumptions, limitations, and reviewer checklist, see the [Aethra Sustainability Monitor methodology](AETHRA_SUSTAINABILITY_METHODOLOGY.md).

## Completed PRs

- #101: backend/API sustainability metrics
- #102: live Aethra Sustainability Preview wiring
- #103: sustainability language guardrails
- #104: review fixes and hardening

## What Is Implemented

- local-only audit estimate fields
- sustainability metrics endpoint
- live-local Aethra UI loading
- fixture mode remains default
- manual live loading only
- period selector for 7d/30d/90d
- `methodology_version`, `confidence`, and disclaimer shown
- language guardrail wired into `dev-check`
- invalid/out-of-range period validation
- local Markdown/JSON report export from the currently displayed metrics

## Safety Boundaries

- no telemetry
- no cloud calls
- no external coefficient lookup
- no global opt-in pool
- no polling
- no persistence
- not ESG certification
- not production compliance evidence
- no report upload
- values remain estimated, proxy, counterfactual, and methodology-dependent

These values are counterfactual proxy estimates. They are not actual carbon accounting, not measured energy use, not ESG certification, and not production compliance evidence.

## Positioning

Use careful language:

- estimated CO₂ avoided
- counterfactual proxy estimates
- methodology-dependent
- not actual carbon accounting
- not ESG certification
- not production compliance evidence

The sustainability monitor should stay framed as a local-first routing observability milestone, not a certified sustainability, carbon, or compliance system.

## Recommended Next Work

- enterprise/team rollup later
- global opt-in aggregation later, not implemented
