# Aethra Sustainability Monitor — Demo Script

## Audience

- IO Ignition / early-stage advisors
- investors
- technical reviewers
- contributors

## Demo Purpose

Show that Aignitron is not just displaying AI usage. Aethra shows the cloud usage avoided by local-first routing decisions using conservative routing-aware counterfactual proxy estimates.

For methodology details, see the [Aethra Sustainability Monitor methodology](AETHRA_SUSTAINABILITY_METHODOLOGY.md).

Current demo flow:

```text
IgnisPrompt audit events
-> GET /v1/metrics/sustainability?period=30d
-> Aethra live-local Sustainability Preview
-> local Markdown/JSON report export
-> claim-language guardrails
```

## Required Setup

- repo cloned
- Rust/Cargo installed
- Node/npm installed for Aethra
- local daemon available at `http://127.0.0.1:8765`
- no model weights required
- no cloud key required
- no telemetry required

## Safety Boundaries

- fixture mode remains default
- live local loading is explicit/manual
- loopback-only daemon access
- no polling
- no persistence
- no telemetry
- no cloud calls
- no uploads
- no SaaS backend
- no external coefficient lookup
- no global opt-in pool
- not ESG certification
- not production compliance evidence
- values remain estimated, proxy, counterfactual, and methodology-dependent

## Demo Steps

1. Start the daemon with the existing local script:

```bash
./scripts/start-dev.sh
```

2. In a second terminal, run the default smoke or full developer check if appropriate:

```bash
./scripts/smoke.sh
```

For a fuller verification pass:

```bash
./scripts/dev-check.sh
```

3. Start Aethra:

```bash
cd apps/aethra
npm install
npm run dev
```

4. Open `http://127.0.0.1:5173/`.
5. Show fixture mode first. Explain that fixture data is the default for deterministic local demos and screenshots.
6. Switch to live local mode.
7. Load live health, model, and audit data if relevant to the audience.
8. Open Sustainability Preview.
9. Manually load live sustainability metrics.
10. Change the period selector, such as `7d`, `30d`, or `90d`, if available.
11. Explain the key fields:

- `requests_total`: count of records included in the selected period.
- `local_request_rate`: share of records where data stayed local.
- `tier_breakdown`: route tiers represented in the current metric set.
- `estimated_cloud_cost_avoided_usd`: counterfactual cost proxy for avoided cloud routing.
- `estimated_carbon_avoided_kgco2e`: estimated CO₂ avoided under the current methodology.
- `estimated_data_kept_local_gb`: proxy estimate for request/response data kept local.
- `baseline_provider`: provider used as the counterfactual comparison baseline.
- `baseline_model`: model used as the counterfactual comparison baseline.
- `methodology_version`: version of the current v0.1 estimation method.
- `confidence`: confidence label for the estimate, currently low.
- `disclaimer`: always-visible limitations and non-claims.

12. Export the Markdown report.
13. Export the JSON report.
14. Explain that reports are generated client-side and local only. Aethra does not store them in local storage or session storage, send them to a backend, upload them, call telemetry, call cloud services, or look up external coefficients.

## Investor Talking Track

Use simple language:

"Aignitron is building the Datadog + Cloudflare layer for local-first AI infrastructure. IgnisPrompt routes AI workloads according to policy, and Aethra makes the decisions visible. The sustainability monitor shows the cloud usage avoided by local-first routing decisions.

We do not just show AI usage. We show the cloud usage you avoided."

Position the feature as an observability wedge: it makes local-first routing decisions legible to operators, buyers, reviewers, and future contributors without requiring cloud credentials or model weights.

## Technical Talking Track

- IgnisPrompt emits local audit events when route explanations or completions run.
- The sustainability endpoint reads local audit metadata and returns methodology-dependent counterfactual proxy estimates.
- The estimates are v0.1, low-confidence, and conservative.
- The endpoint does not call an external coefficient service.
- Aethra does not add telemetry.
- Live-local loading is manual and targets the configured loopback daemon.
- Invalid or out-of-range period input is bounded and rejected by the daemon.
- The sustainability language guardrail runs inside `./scripts/dev-check.sh`.
- The report export uses the currently displayed metrics and is generated client-side.

## Marketing Wording

Use:

- estimated CO₂ avoided
- routing-aware counterfactual proxy estimates
- methodology-dependent
- local-first routing decisions
- cloud usage avoided

Avoid wording that implies carbon certainty or measured energy results. Keep the explicit non-claims visible: not certified sustainability reporting, not ESG certification, and not production compliance evidence. The repository language guardrail enforces these boundaries with `./scripts/check-sustainability-language.sh`.

## Failure Modes

- Daemon is not running: live-local loads fail with a local error state, and fixture fallback data remains visible.
- Live local data is not loaded: Sustainability Preview continues showing fixture data until the operator manually loads live metrics.
- Sustainability endpoint returns empty data: the UI can show safe zero-value metrics with methodology and disclaimer fields still present.
- Invalid period is requested: the daemon rejects unsupported or out-of-range period input instead of producing an unbounded query.
- Export is run from fixture mode: the report is generated from fixture metrics and labels `data_source` as `fixture`.

## Suggested 2-Minute Demo Script

"This is Aethra, the observability layer for IgnisPrompt. IgnisPrompt routes AI workloads locally according to policy, and Aethra makes those decisions visible.

I am starting in fixture mode because it is the default and keeps demos deterministic. Now I switch to live local mode and manually load the local daemon data from `127.0.0.1:8765`. There is no polling, no telemetry, and no cloud call.

On Sustainability Preview, Aethra reads `GET /v1/metrics/sustainability?period=30d`. These are routing-aware counterfactual proxy estimates. They show requests, local request rate, route tier breakdown, estimated cloud cost avoided, estimated CO₂ avoided, and estimated data kept local.

The important point is: We do not just show AI usage. We show the cloud usage you avoided.

Now I export a Markdown report and a JSON report. Both are generated client-side from the currently displayed metrics. They are local-only reports, not actual carbon accounting, not ESG certification, and not production compliance evidence."

## Suggested 5-Minute Technical Demo Script

"I will show the complete local-first sustainability monitor path. First, the daemon is running on loopback at `127.0.0.1:8765`. The default path does not require model weights, cloud credentials, telemetry, or external network services.

IgnisPrompt produces local audit events when route explanations or completions run. Those audit records contain routing metadata such as tier, route code, data locality, and local estimate fields. Aethra can show fixture data by default, then switch to explicit live local mode when the operator asks for it.

In Sustainability Preview, I manually load `GET /v1/metrics/sustainability?period=30d`. The endpoint derives a small metric set from local audit metadata: total requests, local request rate, tier breakdown, estimated cloud cost avoided, estimated CO₂ avoided, estimated data kept local, baseline provider, baseline model, methodology version, confidence, and disclaimer.

The estimates are intentionally low-confidence v0.1 counterfactual proxy estimates. There is no external coefficient lookup. Invalid or out-of-range periods are rejected by the daemon. Aethra does not poll, persist report data, upload data, or add telemetry.

Now I change the period selector to show how the same endpoint can be requested for a different bounded period. Then I export Markdown and JSON. The export uses only the currently displayed metrics and avoids request content, prompts, raw audit text, PII, and machine identifiers.

Finally, the language guardrail is part of the developer check. Running `./scripts/dev-check.sh` includes `./scripts/check-sustainability-language.sh`, which keeps this feature framed as estimated, proxy, counterfactual, and methodology-dependent."

## Suggested Follow-Up Roadmap

- polish report formatting
- exportable report templates
- enterprise/team rollup later
- global opt-in pool later, not implemented
