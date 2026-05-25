# Aethra Public Demo Package

Aethra is the Local AI Routing Observatory for IgnisPrompt. It helps viewers understand how IgnisPrompt routes requests, records local audit metadata, surfaces model and runner status hints, and presents sustainability proxy indicators without turning the dashboard into a control plane.

This package is text-only. Use it for public-safe screenshots, carousel captions, demo talk tracks, GitHub README links, IO Ignition review material, early contributor orientation, potential design-partner walkthroughs, and LinkedIn or company-page posts. Do not add generated screenshots, images, demo bundles, transcripts, local evidence, audit logs, or model weights to the repository for this package.

## Public Positioning

Short description:

```text
Aethra is a local-first observability dashboard for IgnisPrompt. It shows routing decisions, audit events, model and runner status hints, and sustainability proxy indicators so reviewers can see what happened locally and why.
```

Longer description:

```text
IgnisPrompt owns local AI routing, route explanations, audit events, and fail-closed behavior. Aethra observes those signals in a fixture-backed dashboard by default, with optional manual live-local loading from a loopback daemon. It is designed for transparent local-preview review: no telemetry, no cloud calls by default, no global aggregation, and no model or runner controls.
```

Use this framing for public material:

- local-first routing observability
- fixture-backed by default
- manual live-local loading
- read-only dashboard and observatory
- local readiness surface with status hints and copy-only daemon guidance
- local operator console with readiness, evidence, operator package, and copy-only command guidance
- local command center with safe CLI recipes and evidence workflow notes
- route explanations and local audit visibility
- model and runner status hints, not controls
- sustainability proxy indicators with methodology and confidence labels
- guided demo path in Overview, from route inspection through evidence workflow and sustainability preview
- evidence bundle viewer, validation summary, and archive metadata preview as local-preview diagnostics only

Avoid positive claims about production deployment, legal advice, model-quality proof, compliance evidence, or broad MCP compatibility. Keep the explicit non-claims visible: not ESG certification and not certified sustainability reporting.

## Audience Fit

GitHub visitors:

- Show the product surface without requiring local model weights or private evidence.
- Emphasize that fixture mode is deterministic and safe for screenshots.
- Link to `docs/AETHRA_MVP_CHECKPOINT.md` and `docs/LOCAL_PREVIEW_QUICKSTART.md` for implementation status and local setup.

IO Ignition reviewers:

- Lead with the product thesis: IgnisPrompt routes locally and Aethra makes the decisions legible.
- Keep the current boundaries visible: local preview only, no telemetry, no cloud calls by default, and not a production deployment.
- Use the carousel order below so the story moves from posture to route reasoning to audit traceability to model/runner hints to sustainability proxies.

Early contributors:

- Explain that Aethra observes IgnisPrompt state; it does not replace routing, audit, policy, or runner selection.
- Point contributors to fixture-backed screens first, then manual live-local loading if they have a local daemon running.
- Keep UI changes separate from daemon/API changes unless a task explicitly scopes both.

Potential design partners:

- Present Aethra as a local-preview observability concept and review surface.
- Ask for feedback on workflows, terminology, and missing local metadata.
- Do not imply production readiness, legal reliability, compliance certification, or enterprise deployment status.

LinkedIn and company-page posts:

- Use concise captions from this package.
- Avoid screenshots with real contracts, customer data, personal data, private audit logs, local filesystem paths, secrets, or model weights.
- Prefer fixture mode unless a post explicitly explains that live-local loading was manual and loopback-only.

## Demo Boundaries

Keep these boundaries visible in every public/demo use:

- Aethra is fixture-backed by default.
- Live-local loading is manual.
- Aethra is a read-only dashboard and observatory.
- Aethra sends no telemetry.
- Aethra makes no cloud calls by default.
- Aethra performs no global aggregation.
- Model and runner status values are hints, not controls.
- Sustainability values are estimated, proxy, counterfactual, methodology-dependent, and non-certified.
- Aethra is not a production deployment.
- Aethra does not provide legal advice.
- Aethra sustainability preview is not ESG certification.

## Carousel / Demo Order

Use this order for public carousels, short demos, or README-linked walkthroughs:

1. Hero
2. Overview
3. Local Readiness
4. Local Operator Console
5. Local Command Center
6. Routing Explorer
7. Audit Events
8. Model / Runner Status
9. Evidence Bundle Viewer
10. Sustainability Preview

### 1. Hero

Purpose: establish the product frame before showing UI details.

Caption:

```text
Aethra is the local AI routing observatory for IgnisPrompt: fixture-backed by default, read-only, no telemetry, and no cloud calls by default.
```

Talk track:

```text
IgnisPrompt makes local routing decisions. Aethra makes those decisions visible for reviewers and contributors without adding a SaaS backend, telemetry, or model controls.
```

Screenshot guidance:

- Use the app shell or a neutral title slide.
- Keep visible text focused on local preview observability.
- Do not show customer data, real contracts, private logs, local paths, or generated evidence.

### 2. Overview

Purpose: show the local preview posture and fixture-first state.

Caption:

```text
Overview shows fixture-backed local preview status, manual live-local diagnostics, copyable local commands, and current route posture without changing IgnisPrompt behavior.
```

Talk track:

```text
The first screen tells reviewers what mode they are seeing. Fixture mode is the default. Live-local loading is explicit and manual, and Aethra remains read-only.
```

Screenshot guidance:

- Show the local preview banner and data mode badges.
- Keep fixture mode visible for public screenshots unless the caption explicitly mentions manual live-local loading.

### 3. Local Readiness

Purpose: summarize local preview readiness without adding controls.

Caption:

```text
Local Readiness shows daemon health, version/status, configured models, model and runner status hints, evidence workflow availability, and local helper checks using fixture-backed data by default.
```

Talk track:

```text
This page is a read-only local preview checklist. Live-local loading stays manual, command snippets are copy-only guidance, and helper checks are not certification or production deployment approval.
```

Screenshot guidance:

- Show local preview readiness cards and the checklist.
- Keep the copy-only command snippets visible if discussing daemon setup.
- Do not imply continuous monitoring, telemetry, controls, cloud uploads, compliance certification, or production deployment approval.

### 4. Local Operator Console

Purpose: show the operator workflow summary without adding actions.

Caption:

```text
Local Operator Console combines readiness, readiness package, operator package, evidence workflow, and demo next-step hints with copy-only local command recipes.
```

Talk track:

```text
This view is for local preview review. It keeps status values as hints, local helper checks separate from certification, and package validation structural/local only.
```

Screenshot guidance:

- Keep fixture mode selected.
- Show command recipes as text snippets only.
- Do not show hostnames, user account names, absolute paths, secrets, local evidence contents, or raw audit events.

### 5. Local Command Center

Purpose: show copyable local recipes and evidence workflow notes.

Caption:

```text
Local Command Center collects safe local-preview CLI recipes, evidence workflow notes, and demo readiness guidance without running commands from the dashboard.
```

Talk track:

```text
These recipes help operators run local checks in their own terminal. Aethra copies text only and does not execute commands, persist command state, or add telemetry.
```

Screenshot guidance:

- Show copyable command recipes and checklist language.
- Keep ignored `local-evidence/` paths visible only as repo-relative examples.
- Do not show generated evidence, audit logs, transcripts, archives, secrets, or absolute filesystem paths.

### 6. Routing Explorer

Purpose: show route reasoning and local-only policy signals.

Caption:

```text
Routing Explorer displays IgnisPrompt route decisions, explanations, warnings, and local-only signals for synthetic or non-sensitive prompts.
```

Talk track:

```text
This view explains why a request routes to a tier and whether the route stayed local. Live route-explain calls are local inspection actions, but they append local audit events.
```

Screenshot guidance:

- Use synthetic prompt text only.
- Keep route code, tier, explanation, warnings, and `data_left_device=false` visible when possible.
- Do not present route output as legal advice or model-quality validation.

### 7. Audit Events

Purpose: show local route traceability.

Caption:

```text
Audit Events turns local process records into a readable route history with filters, warnings, route codes, tiers, and request IDs.
```

Talk track:

```text
IgnisPrompt records local audit events for route explanations and completions. Aethra helps inspect those records, but they are local process records, not signed or certified audit evidence.
```

Screenshot guidance:

- Use fixture records or synthetic live-local records only.
- Avoid raw prompt text and private matter details.
- If request IDs are visible, keep them synthetic or fixture-backed.

### 8. Model / Runner Status

Purpose: show local status hints without implying controls.

Caption:

```text
Model / Runner Status shows manifest, local file, runner executable, and inference-attempt status hints so operators can understand local prerequisites without installing, deleting, or controlling models from Aethra.
```

Talk track:

```text
These are status hints, not controls. Aethra does not start runners, install model weights, delete models, or certify model quality.
```

Screenshot guidance:

- Show status labels and conservative warning copy.
- Do not show local filesystem paths that reveal private machine details.
- Do not imply the presence of model weights in git.

### 9. Evidence Bundle Viewer

Purpose: show local evidence bundle metadata, validation summary, and archive metadata preview without extracting archives or loading arbitrary local paths.

Caption:

```text
Evidence Bundle Viewer surfaces fixture-backed manifest fields, local validation summary, and archive metadata preview for local-preview review only.

The same surface also includes clipboard-only Markdown and JSON report export helpers that stay local-preview only and do not download, upload, or verify archives cryptographically.
```

Talk track:

```text
This view helps reviewers inspect the local evidence bundle workflow with local-preview command snippets, without upload, archive extraction, telemetry, signing, or certification claims.
```

Screenshot guidance:

- Keep the safe manifest, validation summary, archive metadata preview, and command snippets visible.
- If report export controls are shown, keep the Markdown and JSON copy actions visible and note that they are browser-local only.
- Do not show raw audit event content, prompts, secrets, local machine identifiers, or absolute filesystem paths.

### 10. Sustainability Preview

Purpose: show local-first sustainability observability without overclaiming.

Caption:

```text
Sustainability Preview shows routing-aware counterfactual proxy estimates with methodology and confidence labels; values are estimated, methodology-dependent, and non-certified.
```

Talk track:

```text
This view summarizes local audit metadata into proxy estimates such as local request rate and estimated cloud cost avoided. It is not actual carbon accounting, not ESG certification, not certified sustainability reporting, and not production compliance evidence.
```

Screenshot guidance:

- Keep methodology, confidence, and disclaimer language visible.
- Prefer fixture mode for public screenshots.

If showing export actions, state that reports are generated client-side from displayed aggregate metrics.

## Short Post Copy

Use this for public posts:

```text
Aethra is the local AI routing observatory for IgnisPrompt. It shows route decisions, local audit events, model and runner status hints, and sustainability proxy indicators from a fixture-backed dashboard by default. No telemetry, no cloud calls by default, no model controls, and no production-readiness claim.
```

Use this when showing the sustainability screen:

```text
Aethra Sustainability Preview uses routing-aware counterfactual proxy estimates. The values are estimated, methodology-dependent, and non-certified: useful for local-preview review, not ESG certification and not production compliance evidence.
```

## Demo Checklist

Before publishing or presenting:

- Use fixture mode unless a manual live-local sequence is intentional and explained.
- Use synthetic prompts and fixture records only.
- Do not show customer data, real contracts, PII, secrets, local filesystem paths, private audit logs, generated evidence bundles, transcripts, or model weights.
- Keep local preview and non-production wording visible.
- Keep no-telemetry and no-cloud-by-default wording visible.
- Confirm model and runner status values are described as hints, not controls.
- Confirm sustainability values are described as estimated, proxy, counterfactual, methodology-dependent, and non-certified.

## Related Docs

- [Aethra MVP Checkpoint](AETHRA_MVP_CHECKPOINT.md)
- [Aethra MVP Plan](AETHRA.md)
- [Aethra Sustainability Monitor Demo](AETHRA_SUSTAINABILITY_DEMO.md)
- [Aethra Sustainability Monitor Methodology](AETHRA_SUSTAINABILITY_METHODOLOGY.md)
- [Local Preview Quickstart](LOCAL_PREVIEW_QUICKSTART.md)
