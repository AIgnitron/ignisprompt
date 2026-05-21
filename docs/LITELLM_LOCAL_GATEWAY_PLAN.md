# LiteLLM-Style Local Gateway Plan

This document is a future implementation plan for a LiteLLM-style, OpenAI-compatible local gateway adapter path. It is not implemented yet. It makes no support claim, no compatibility guarantee, and no production-readiness claim. The plan stays within the local preview boundary and does not add adapter code.

## Purpose

The purpose is to describe how IgnisPrompt could eventually sit in front of an operator-owned OpenAI-compatible local gateway while remaining a local policy, routing, explanation, and audit control plane.

This path is useful if an operator already uses a local gateway to normalize model names, chat completion request shapes, and local inference backends. IgnisPrompt should not become another model server to participate in that setup. A future adapter should let IgnisPrompt make local route decisions and preserve audit behavior while the local gateway continues to own inference.

## Current Status

This plan is documentation only:

- no LiteLLM-style local gateway adapter is implemented
- no proxying path is implemented
- no new configuration is implemented
- no endpoint shape is changed
- no Aethra adapter status display is implemented
- no OpenAI-compatible local gateway compatibility guarantee is made

The current local preview still uses the existing daemon routes, local manifests, runner fallback behavior, audit events, and Aethra observability surfaces.

## Relationship To Adapter Concepts

`docs/ADAPTER_CONCEPTS.md` defines the broader adapter design space. This plan narrows that work to one possible future path: IgnisPrompt before a local OpenAI-compatible model gateway.

This document does not expand DreamServer work. DreamServer remains a conceptual adapter direction only and is not part of this plan.

## Relationship To The Implementation Checklist

`docs/LOCAL_ADAPTER_IMPLEMENTATION_CHECKLIST.md` is the gate for any future adapter PR. This plan does not replace that checklist. A future LiteLLM-style local gateway PR must satisfy the checklist before code lands.

In particular, future implementation must be disabled by default, explicitly configured, loopback/local-first by default, and covered by tests before any availability claim is documented.

## Proposed Local Gateway Architecture

The proposed architecture is a front-of-gateway policy proxy:

1. A client sends an OpenAI-compatible chat completion request to IgnisPrompt.
2. IgnisPrompt applies local routing policy and sensitive-domain handling.
3. IgnisPrompt produces a route explanation.
4. IgnisPrompt records a local audit event for the route decision.
5. If explicitly configured and policy-allowed, IgnisPrompt forwards an allowed request to a configured loopback/local gateway endpoint.
6. IgnisPrompt maps the downstream result back into the existing response contract where the contract allows it.

The gateway owns inference. IgnisPrompt owns local policy, routing, explanation, and audit behavior. The adapter should not install models, delete models, start runners, stop runners, or infer that a model is available without explicit configuration and tested status checks.

## Explicit Configuration Requirements

Future configuration should be explicit and disabled by default. A proposed config shape should define:

- adapter kind, such as `openai-compatible-local-gateway`
- enabled flag, defaulting to false
- loopback/local base URL
- optional model alias mapping from IgnisPrompt manifests to downstream gateway model names
- timeout values
- behavior when downstream gateway is unavailable
- behavior when a model alias is missing
- whether streaming is unsupported, passed through, or normalized
- whether downstream usage fields are trusted for estimates

Configuration must not:

- silently enable proxying
- auto-discover remote endpoints by default
- store secrets in repository files
- require model weights in git
- make cloud fallback possible without a separately reviewed policy design

## Local-Only Boundaries

Any future adapter must preserve these boundaries:

- disabled by default
- explicit local configuration required
- loopback/local endpoint defaults
- no telemetry
- no cloud calls by default
- no external lookup
- no update checks
- no GitHub calls
- no global aggregation
- no cloud fallback unless explicitly policy-enabled in a future design
- no model install/delete controls
- no runner controls unless separately designed
- no prompts or raw requests persisted by default
- no generated evidence, model weights, audit logs, transcripts, demo bundles, attestation bundles, `target/`, or `dist/` artifacts committed to git

If the downstream gateway has cloud providers configured, IgnisPrompt must treat that as a policy risk. The safe default should be to avoid forwarding unless local-only routing can be enforced and tested.

## Security Constraints

Future implementation must define and test:

- loopback/local URL validation
- forbidden URL handling
- timeout behavior
- downstream connection failure behavior
- downstream error mapping
- prompt and raw request handling
- secret redaction in logs, status, and audit records
- whether request headers are forwarded
- whether downstream response metadata is returned
- fail-closed behavior for sensitive legal routes

The adapter must preserve adversarial document-instruction handling. Document-contained instructions must not change routing policy, audit behavior, adapter configuration, or downstream forwarding policy.

## Audit Behavior

Future implementation should define whether audit events are emitted for:

- route decision created
- downstream forwarding attempted
- downstream response completed
- downstream timeout or failure
- policy rejection before forwarding

At minimum, route decisions and local-only state must remain auditable. Audit records should not store prompts or raw request text by default. If a future design intentionally stores additional request material, that must be separately designed, reviewed, documented, and tested.

Audit events should distinguish IgnisPrompt policy decisions from downstream gateway behavior. For example, a downstream model name should not be treated as proof of model quality, legal accuracy, or production readiness.

## Route Explanation Behavior

Route explanations must remain available and conservative. A future adapter should explain:

- why the request was eligible or ineligible for forwarding
- which local policy boundary applied
- whether the local gateway was configured
- whether the target endpoint was loopback/local
- whether cloud fallback was blocked
- which warnings were produced

Explanations must not claim legal advice quality, production legal accuracy, broad compatibility, or adapter certification.

## Sustainability Implications

Forwarding through a local gateway changes where usage data may come from. Future implementation must define:

- whether token estimates come from IgnisPrompt, downstream usage fields, or a fallback estimator
- how missing usage fields are handled
- how failed downstream calls affect estimates
- how local-only status is represented if the gateway can route to multiple providers
- how Aethra labels estimates derived from adapter paths

Sustainability values must remain proxy, counterfactual, estimated, and methodology-dependent. They are not measured energy use, not actual carbon accounting, not ESG certification, not compliance evidence, and not certified sustainability reporting.

## Aethra Observability Implications

Aethra should remain observational. If future implementation exposes local gateway adapter status, Aethra may display it from IgnisPrompt local endpoints.

Aethra must keep:

- fixture mode as the default
- live-local loading explicit unless separately designed
- no telemetry
- no cloud calls
- no GitHub calls
- no update checks
- no command execution
- no model install/delete controls
- no runner controls

Any adapter status display should clearly distinguish IgnisPrompt policy state from downstream gateway status. If Aethra or `ignispromptctl` consumes a new adapter status shape, schema-lock tests should cover the response.

## Phased Implementation Plan

### Phase 0: Design And Config Schema

- define the local gateway adapter config shape
- define model alias mapping semantics
- define URL validation rules
- define disabled-by-default behavior
- define downstream failure modes
- update docs before code begins

### Phase 1: Disabled-By-Default Local Gateway Config Validation

- parse explicit config without enabling forwarding by default
- reject non-loopback or non-local endpoints
- report missing or unsupported adapter config clearly
- keep default build/test/smoke independent of adapter prerequisites

### Phase 2: Local OpenAI-Compatible Forwarding Prototype

- implement forwarding only behind explicit local config
- forward only documented request fields
- map downstream errors conservatively
- avoid prompt/raw request persistence by default
- block cloud fallback unless a future policy explicitly allows it

### Phase 3: Audit And Route Explanation Integration

- emit local audit events for route decisions and adapter outcomes
- preserve existing route explanation behavior
- preserve adversarial document-instruction behavior
- add warnings for missing gateway, invalid config, blocked endpoint, and blocked cloud fallback

### Phase 4: Aethra Observability And Status Display

- expose read-only local adapter status only if needed
- add Aethra display as observational UI only
- keep fixture mode default
- add schema-lock coverage for any consumed status shape

### Phase 5: Hardening, Tests, Docs, Release Checklist

- complete unit and smoke coverage
- update testing docs and local preview release checklist
- document skipped prerequisites for optional adapter checks
- verify generated evidence and audit logs remain ignored
- avoid adapter availability claims until tests and docs land

## Test Plan

Future implementation should include tests for:

- disabled-by-default behavior
- explicit config required
- config validation
- invalid URL rejection
- loopback/local-only enforcement
- unsupported adapter config errors
- missing adapter config errors
- no cloud default
- route explanation preservation
- audit event preservation
- adversarial document-instruction behavior
- prompt/raw request non-persistence by default
- secret redaction from status and audit output
- downstream timeout and error mapping
- sustainability estimate behavior
- Aethra fixture mode remains default
- schema-lock compatibility for any Aethra or CLI adapter status consumer
- default build/test/smoke path without the local gateway running

## Non-Goals

This plan does not propose:

- adapter code in this docs change
- DreamServer implementation work
- model install/delete controls
- runner start/stop controls
- remote endpoint discovery
- update checks
- telemetry
- global aggregation
- cloud fallback by default
- model quality claims
- legal accuracy claims
- production support claims
- verified adapter certification
- seamless replacement behavior for existing gateways
- enterprise readiness claims

## Open Questions

- Should adapter config live in model manifests, a separate config file, or both?
- Should the adapter support streaming initially, or reject streaming until separately designed?
- Which OpenAI-compatible fields should be forwarded unchanged?
- Should downstream usage fields be trusted, normalized, or ignored?
- How should route metadata be returned without breaking existing response contracts?
- How should local-only policy handle a gateway that is locally hosted but configured with cloud providers?
- What status shape is useful enough for Aethra without implying readiness?
- What smoke command should validate the optional adapter path when prerequisites exist?

## Reviewer Checklist

- Is the plan still documentation only?
- Is the adapter described as not implemented yet?
- Does the plan avoid unsupported support and compatibility claims?
- Is the adapter disabled by default in the proposed design?
- Is explicit local configuration required?
- Are loopback/local endpoint defaults preserved?
- Is cloud fallback blocked unless separately designed?
- Are route explanations preserved?
- Are audit events preserved?
- Is adversarial document-instruction behavior preserved?
- Are prompts and raw requests not persisted by default?
- Are telemetry, external lookup, update checks, and global aggregation avoided?
- Are model install/delete controls avoided?
- Are runner controls avoided unless separately designed?
- Are Aethra changes observational only?
- Are tests required before any adapter availability claim?
