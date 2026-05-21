# Adapter Concepts: LiteLLM and DreamServer

This document describes possible future adapter directions for local AI stacks such as LiteLLM-style gateways and DreamServer-style local servers. It is a design concept only. IgnisPrompt does not currently implement these adapters, does not claim production support for them, and does not provide a compatibility guarantee.

## Purpose

Adapters matter because many local AI operators already run model servers, gateways, or runner tools. IgnisPrompt should not become another broad model server just to participate in those workflows. A future adapter layer could let IgnisPrompt keep its narrower role as a local policy, routing, explanation, and audit control plane while existing local stacks continue to own inference.

The design direction is to make integration explicit, local, configurable, and disabled by default until implementation exists. Any future adapter should preserve local-preview boundaries and avoid broad support claims until code, tests, and operator documentation exist.

## Current status

There is no implemented LiteLLM adapter, DreamServer adapter, model-gateway proxy, or runner-control integration in the current repository.

The current local preview includes:

- local route explanations
- local audit events
- local model manifest hints
- local model and runner status hints
- local version/status metadata
- proxy-only sustainability estimates derived from local audit events
- Aethra as a fixture-backed and live-local observability surface

These features do not imply adapter support for external local model stacks.

## Non-goals

IgnisPrompt should not become a bundled model-weight distribution channel, a replacement for every local runner, or a general-purpose model server.

Non-goals for this concept include:

- bundling model weights
- owning every runner lifecycle
- adding model install or delete controls by default
- adding runner start, stop, or mutation controls by default
- polling external services for releases, updates, or compatibility metadata
- adding telemetry, global aggregation, or cloud calls by default
- claiming seamless replacement behavior for existing model gateways
- claiming verified adapter certification, production support, or enterprise readiness

## IgnisPrompt's role

IgnisPrompt's durable role should remain the local-first control plane:

- decide whether a request is eligible for a local route
- explain the route decision
- preserve fail-closed behavior for sensitive legal paths
- record local audit events for route decisions and completion paths
- expose local status hints for Aethra and command-line inspection
- keep model weights and generated evidence outside git

IgnisPrompt can sit before, beside, or above a local model server as a policy, routing, and audit layer. It should not need to own the full inference runtime when a local operator already has one.

## Adapter pattern A: IgnisPrompt before a local model gateway

In this pattern, a future IgnisPrompt adapter could receive an application request first, apply local routing policy, write a route decision audit event, and then forward an allowed local request to a configured loopback gateway.

Conceptual flow:

1. Client sends a request to IgnisPrompt.
2. IgnisPrompt classifies or validates the requested domain.
3. IgnisPrompt decides whether the request can stay local.
4. IgnisPrompt records the route decision without storing prompts or raw request text unless intentionally designed and documented.
5. IgnisPrompt forwards only an explicitly allowed request to a configured local gateway.
6. IgnisPrompt returns the local gateway response with route metadata where the API contract allows it.

This pattern could be useful when the operator wants IgnisPrompt to be the policy entry point while a local gateway owns provider fanout, model naming, batching, retries, and inference details.

Implementation boundaries would need to define timeout behavior, error mapping, streaming semantics, prompt-handling rules, and whether the adapter modifies or only observes the downstream response.

## Adapter pattern B: IgnisPrompt beside a local runner/server

In this pattern, IgnisPrompt would not proxy inference traffic by default. Instead, it could expose local policy decisions, status hints, and audit metadata beside a local runner or server that continues to receive application traffic directly.

Conceptual flow:

1. A local model server remains the inference endpoint.
2. IgnisPrompt reads explicit local configuration about available models or runner status.
3. IgnisPrompt exposes route explanations and status hints for local inspection.
4. Aethra observes IgnisPrompt's local status, routing, audit, and sustainability signals.

This pattern is lower risk because IgnisPrompt does not sit on the critical inference path. It could help operators understand policy and local readiness without adding a proxying surface.

## Adapter pattern C: Aethra as observability layer

Aethra should remain an observability surface. It can display IgnisPrompt's local status, route explanations, audit events, version metadata, model and runner hints, and sustainability proxy estimates.

For future adapters, Aethra could show adapter status if IgnisPrompt exposes it through explicit local endpoints. Aethra should not execute local commands, install models, delete models, start runners, stop runners, poll by default, call GitHub, call cloud services, or perform update checks.

## LiteLLM-style concept

A LiteLLM-style concept treats a local model gateway as the component that normalizes model/provider access. A possible future IgnisPrompt adapter could sit in front of such a gateway or beside it.

Possible future front-of-gateway responsibilities:

- map an IgnisPrompt route decision to a configured local model alias
- reject routes that would leave the local boundary unless explicitly allowed by a future opt-in design
- attach local route metadata to audit events
- preserve conservative legal-domain behavior and fail-closed routing
- pass through only the fields that an adapter contract explicitly permits

Possible future beside-gateway responsibilities:

- read a local, operator-provided model mapping
- expose configured-vs-available status hints
- compare IgnisPrompt model manifests with local gateway aliases
- show warnings when a manifest declares a model that the local gateway does not appear to expose

This is not a claim that a LiteLLM adapter exists today. It is a possible future adapter direction that would require implementation, tests, documentation, and clear operator setup steps.

## DreamServer-style concept

A DreamServer-style concept treats a local server or runner hub as the component that owns local inference and model/runtime management. A possible future IgnisPrompt adapter could avoid runner control and focus on policy, routing, status interpretation, and audit boundaries.

Possible future responsibilities:

- consume explicit local configuration that maps IgnisPrompt manifests to DreamServer-style model identifiers
- report whether a configured local endpoint appears reachable on loopback
- keep runner controls disabled unless a future task explicitly designs and reviews them
- keep model install and delete controls out of the default path
- record route decisions and local-only status without storing prompts or raw request text by default

This is not a claim that a DreamServer adapter exists today. It is a possible future adapter direction, with no production support claim and no compatibility guarantee.

## Security and local-only boundaries

Any future adapter should preserve these boundaries:

- local-first by default
- loopback/local-only default endpoints
- no telemetry
- no cloud calls by default
- no external lookup
- no update checks
- no GitHub calls
- no global aggregation
- no model install or delete controls by default
- no runner controls by default
- explicit opt-in for any future proxying
- explicit operator configuration for any external local stack
- no secrets committed to git
- no model weights committed to git
- no generated evidence, transcripts, demo bundles, attestation bundles, audit logs, `target/`, or `dist/` artifacts committed to git

If a future adapter ever supports proxying, it should document exactly what request fields are forwarded, what response fields are returned, what audit data is recorded, and what local storage is used. The default audit posture should record route decisions without storing prompts or raw request text unless intentionally designed, reviewed, and documented.

## Audit and sustainability implications

Adapters can affect audit and sustainability signals because IgnisPrompt may no longer be the component that directly executes inference.

Future implementation should define:

- whether an audit event records a policy decision, an attempted downstream call, a completed downstream call, or all three
- how downstream failures map to route codes and warnings
- whether token estimates come from IgnisPrompt, the downstream server, or a conservative fallback
- how local-only status is represented when the downstream stack has its own provider routing
- how Aethra labels estimates as proxy, counterfactual, estimated, and methodology-dependent

Sustainability values must remain framed as proxy estimates. They are not measured energy use, not actual carbon accounting, not ESG certification, not compliance evidence, and not certified sustainability reporting.

## Future implementation phases

1. Document operator-owned local model mapping.
   Define a small configuration shape that maps IgnisPrompt model manifests to local gateway or server model identifiers. Keep it disabled by default.

2. Add read-only adapter status hints.
   Expose local, read-only status that shows configured mappings, loopback reachability, and conservative warnings. Avoid runner controls and model mutation controls.

3. Add non-proxy route planning.
   Let IgnisPrompt explain where it would route a request without forwarding traffic to the downstream stack.

4. Consider explicit opt-in proxying.
   If proxying is added, require explicit local configuration, clear request/response contracts, strict error handling, and tests that prove no cloud calls are introduced by default.

5. Extend Aethra display.
   Show adapter status and warnings only from local IgnisPrompt endpoints. Keep Aethra observational and manual unless a future design changes that boundary.

## Open questions

- Should adapter configuration live in model manifests, a separate adapter config file, or both?
- What is the minimum local status signal needed to avoid misleading "available" claims?
- How should IgnisPrompt represent downstream provider fanout while preserving local-only guarantees?
- How should streaming be handled if the downstream server streams tokens?
- Should adapter audit events include downstream latency and error class?
- What is the safest default when a downstream local gateway has both local and cloud providers configured?
- How should Aethra distinguish IgnisPrompt policy status from downstream runner status?
- What compatibility tests are required before documenting a specific adapter path?

## Reviewer checklist

- Does the change keep adapter language conceptual until implementation exists?
- Does it avoid claiming LiteLLM or DreamServer support?
- Does it avoid production support, verified adapter certification, seamless replacement, and enterprise readiness claims?
- Does it preserve local-first behavior and default no-cloud boundaries?
- Does it keep model weights, local evidence, generated transcripts, demo bundles, attestation bundles, audit logs, `target/`, and `dist/` artifacts out of git?
- Does it avoid adding model install, delete, start, stop, or runner mutation controls by default?
- Does it define audit behavior without storing prompts or raw request text by default?
- Does it keep Aethra observational rather than operational?
