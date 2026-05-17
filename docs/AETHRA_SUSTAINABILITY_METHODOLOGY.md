# Aethra Sustainability Monitor — Methodology v0.1

## Purpose

This page explains how Aethra converts local IgnisPrompt routing and audit metadata into conservative routing-aware counterfactual proxy estimates.

Aethra Sustainability Monitor v0.1 answers a narrow observability question: given the local-first routing decisions IgnisPrompt recorded, what cloud usage was avoided under the current counterfactual baseline assumptions? It does not measure hardware directly and does not claim certified carbon, ESG, or compliance results.

## What Aethra Estimates

Aethra currently reports:

- estimated cloud cost avoided
- estimated CO₂e avoided
- estimated data kept local
- local request rate
- tier breakdown

These values are routing-aware counterfactual proxy estimates. They are methodology-dependent and should be read as early observability signals, not as certified sustainability or finance records.

## What Aethra Does Not Claim

Aethra Sustainability Monitor v0.1 is:

- not measured energy use
- not actual carbon accounting
- not ESG certification
- not production compliance evidence
- not certified sustainability reporting
- not guaranteed invoice savings

## Data Sources

Phase 1 uses local IgnisPrompt audit events and route decisions only. The daemon computes sustainability estimates from local routing metadata, token estimates, route tiers, and data-locality fields.

The current path adds:

- no telemetry
- no cloud calls
- no external coefficient lookup
- no uploaded prompts
- no raw request content in exports

Aethra observes IgnisPrompt state. IgnisPrompt remains the source of routing, audit, policy, and endpoint behavior.

## Token Estimation

Methodology v0.1 uses a rough fallback token estimate based on character count:

```text
estimated_tokens = ceil(character_count / 4)
```

This chars/4 fallback is intentionally simple. It keeps the default path local-only and avoids requiring a model-specific tokenizer or external service.

Known limitations:

- language differences can change character-to-token ratios
- code and math can have different density from prose
- tokenizer and model differences are not captured
- output length variation can change totals materially

Future methodology versions may replace or supplement this fallback with better local tokenizer support.

## Baseline Assumptions

The current implementation uses:

- `baseline_provider`: `openai`
- `baseline_model`: `gpt-4.1-mini`

This baseline is a configurable counterfactual assumption. It is not proof that a specific cloud call would have happened. It exists so the local route can be compared against a stable cloud-baseline scenario for v0.1 estimates.

## Cost Estimate

The cost estimate uses local token estimates and baseline pricing assumptions in the local methodology module. The reported field is:

- `estimated_cloud_cost_avoided_usd`

Use careful wording:

- estimated cloud cost avoided
- counterfactual cost proxy
- not guaranteed billing savings
- not a replacement for provider invoices

The estimate should help operators reason about routing impact. It should not be presented as a finance-grade savings report.

## CO₂e Estimate

The CO₂e estimate is a proxy estimate based on local methodology coefficients. The implementation estimates local energy and cloud-baseline energy from token counts, computes avoided watt-hours, and converts that value with the v0.1 grid-carbon coefficient.

The reported field is:

- `estimated_carbon_avoided_kgco2e`

Use careful wording:

- estimated CO₂e avoided
- counterfactual proxy estimate
- methodology-dependent
- not actual carbon accounting

This value is not measured energy use and is not a certified carbon result.

## Data Kept Local Estimate

The data kept local estimate is an approximate data-volume proxy derived from local routing and audit metadata. In v0.1, estimated token counts are converted back to an approximate character volume and then into gigabytes.

The reported field is:

- `estimated_data_kept_local_gb`

Use careful wording:

- estimated data kept local
- local routing observability proxy
- not formal data-loss-prevention evidence
- not compliance certification

The estimate helps explain data-locality posture. It does not prove enterprise policy enforcement or formal data protection controls.

## Methodology Version

The current `methodology_version` is:

```text
aethra-impact-0.1
```

Versioning matters because sustainability methodology will improve over time. Keeping the methodology version in endpoint responses, UI, and exports supports:

- audit continuity
- reproducibility
- transparent improvements over time
- investor and enterprise trust

If a future change modifies token estimation, coefficients, baseline assumptions, aggregation rules, or field semantics, it should update the methodology version.

## Confidence

The current `confidence` value is:

```text
low
```

Low confidence is intentional and conservative for v0.1. The system uses rough token estimates, placeholder local coefficients, and a counterfactual baseline. The confidence label should remain visible in the endpoint response, UI, and exported reports.

## Empty And Invalid States

Empty audit periods return safe zero values. A zero-result response should still include `baseline_provider`, `baseline_model`, `methodology_version`, `confidence`, and `disclaimer`.

Invalid or out-of-range periods are rejected before summarization. The endpoint returns HTTP 400 with:

```text
INVALID_SUSTAINABILITY_PERIOD
```

Current valid period input uses a day suffix such as `30d`, with day counts from `0d` through `3650d`.

## Future Methodology Versions

Future versions may explore, without claiming implementation today:

- better tokenizer support
- configurable baseline models
- regional coefficient tables
- user-supplied coefficient files
- enterprise/team rollup later
- independent methodology review later

Any future expansion should keep local-only behavior explicit unless a separate reviewed task scopes a different boundary.

## Safe Language

Use:

- estimated CO₂e avoided
- estimated cloud cost avoided
- counterfactual proxy estimates
- methodology-dependent
- not actual carbon accounting
- not ESG certification
- not production compliance evidence

Avoid wording that implies saved carbon, measured emissions certainty, or carbon neutrality. Keep these non-claims explicit: not ESG certification, not production compliance evidence, and not certified sustainability reporting. The repository guardrail enforces the most sensitive claim language in `./scripts/check-sustainability-language.sh`.

## Relationship To CodeCarbon / EcoLogits / SCI

CodeCarbon estimates hardware energy and carbon from computation. EcoLogits estimates environmental impact of GenAI inference/API usage. The Software Carbon Intensity specification provides useful methodology principles for reasoning about software carbon impact.

Aethra's differentiator is routing-aware counterfactual impact: it focuses on what was avoided because the routing decision did not default to cloud. This complements compute-impact and inference-impact approaches, while keeping Aethra v0.1 scoped to local routing and audit metadata.

## Reviewer Checklist

For future methodology changes, check:

- `methodology_version` updated when assumptions or semantics change
- `confidence` reviewed
- disclaimer still present
- `./scripts/check-sustainability-language.sh` passes
- exports include `methodology_version`, `confidence`, and `disclaimer`
- no telemetry, cloud call, or external lookup added unless explicitly scoped
