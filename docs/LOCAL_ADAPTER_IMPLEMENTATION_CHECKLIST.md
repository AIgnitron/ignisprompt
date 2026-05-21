# Local Adapter Implementation Checklist

This checklist is a future implementation gate for local adapter work. It translates `docs/ADAPTER_CONCEPTS.md` into concrete review requirements before writing adapter code. It does not implement a LiteLLM-style adapter, a DreamServer-style adapter, proxying, runner controls, model controls, or any API behavior.

Use this checklist when proposing a local-preview adapter that connects IgnisPrompt to an operator-owned local model gateway, runner, or server. Any future adapter PR should remain conservative until implementation, tests, documentation, and review all land.

## Problem Statement Gate

Before writing adapter code, the PR or design issue must state:

- what local operator problem the adapter addresses
- which local stack or local interface shape is in scope
- whether IgnisPrompt sits before, beside, or above the local stack
- why existing `ModelRunner` or manifest behavior is insufficient
- what sensitive-domain behavior must be preserved
- what is explicitly out of scope

The problem statement must not claim production support, compatibility certification, seamless replacement behavior, or enterprise readiness.

## Target Adapter Type Gate

The proposal must identify exactly one initial adapter type:

- front-of-gateway policy proxy
- beside-runner status and route-planning adapter
- read-only adapter status provider
- Aethra-only observability surface fed by existing IgnisPrompt endpoints

The PR must not mix multiple adapter types unless a prior design review approves the expanded scope.

## Local-Only Boundary Gate

Any future adapter PR must prove the default path remains local-first:

- disabled by default
- explicitly configured
- loopback/local-first by default
- no telemetry
- no cloud calls by default
- no GitHub calls
- no API or update checks
- no external lookup
- no global aggregation
- no cloud fallback without explicit policy and review
- no model weights committed to git
- no generated evidence, transcripts, demo bundles, attestation bundles, audit logs, `target/`, or `dist/` artifacts committed to git

If a downstream local stack can route to cloud providers, the adapter design must define the safe default and the tests that prevent accidental cloud fallback.

## Configuration Boundary Gate

Configuration must be explicit and reviewable:

- no hidden auto-discovery by default
- no environment variable that silently enables proxying
- no secrets stored in repository files
- no local model path assumptions that require checked-in weights
- clear loopback URL validation
- clear missing-config and unsupported-config errors
- clear distinction between configured, reachable, unavailable, and unknown states

The PR must document every new config field, default value, failure mode, and local-only implication.

## Security Review Gate

Before adapter code lands, reviewers must confirm:

- prompts and raw requests are not persisted by default
- secrets are not logged, committed, or returned in status endpoints
- proxying, if added, requires explicit opt-in
- request fields forwarded downstream are documented
- response fields returned upstream are documented
- timeouts and downstream failures fail closed where policy requires it
- adversarial document-instruction behavior is preserved
- model install and delete controls are not added unless separately designed
- runner controls are not added unless separately designed
- route explanations remain available for sensitive routing paths

Any adapter touching legal-domain behavior must preserve fail-closed behavior and avoid claims about production legal advice or solved legal accuracy.

## Audit Behavior Gate

The PR must define audit behavior before implementation:

- which event types are emitted
- whether audit records represent a policy decision, attempted downstream call, completed downstream call, or failure
- how route codes and warnings map to adapter states
- how downstream timeout and error classes are represented
- whether downstream model identifiers are recorded
- how local-only status is represented
- how prompt and raw request storage is avoided by default

Audit events must remain local. Any intentional prompt/raw request persistence would need a separate design, explicit documentation, and review before implementation.

## Sustainability Behavior Gate

Adapter work must not weaken sustainability language or methodology boundaries:

- sustainability values remain proxy, counterfactual, estimated, and methodology-dependent
- estimates are not measured energy use
- estimates are not actual carbon accounting
- estimates are not ESG certification
- estimates are not compliance evidence
- estimates are not certified sustainability reporting
- any downstream token or usage data source is documented
- conservative fallback estimates are documented when downstream data is missing

Changes to methodology require updating the methodology docs and tests before any user-facing claim changes.

## Aethra Observability Gate

If Aethra consumes adapter status, the PR must preserve Aethra boundaries:

- fixture mode remains default
- live-local loading remains explicit unless a separate design changes that boundary
- no telemetry
- no cloud calls
- no GitHub calls
- no update checks
- no local command execution
- no model install or delete controls by default
- no runner controls by default
- status labels distinguish IgnisPrompt policy state from downstream runner or gateway state
- schema compatibility is tested if Aethra consumes a new or changed status shape

Aethra should observe adapter status; it should not become an operations console without a separate design review.

## Minimum Test Gates

Future adapter implementation must include tests for:

- disabled-by-default behavior
- explicit config required
- loopback/local endpoint URL validation
- unsupported adapter config errors
- missing adapter config errors
- no cloud fallback without explicit policy
- route explanation generation
- audit event generation
- adversarial document-instruction behavior
- no prompt/raw request persistence unless intentionally designed
- no secrets in status responses or audit records
- Aethra fixture mode still default when Aethra consumes adapter status
- schema compatibility if Aethra or `ignispromptctl` consumes adapter status
- default build/test/smoke path without Ollama, GGUF, external model weights, or local model binaries

Tests must land before any documentation claims a specific adapter path is available.

## Documentation Gates

Future adapter PRs must update:

- `docs/ADAPTER_CONCEPTS.md` if the concept or adapter pattern changes
- `docs/TESTING.md` with new verification commands and skipped-prerequisite guidance
- `docs/CODEX_HANDOFF.md` with current state, boundaries, and follow-up work
- `docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md` with release validation steps
- `README.md` only if a user-facing command, config file, endpoint, or workflow exists

Depending on scope, the PR may also need updates to:

- `docs/ARCHITECTURE.md`
- `docs/SECURITY_MODEL.md`
- `docs/THREAT_MODEL.md`
- `docs/RUNNER_PROVIDERS.md`
- `docs/AETHRA_ARCHITECTURE.md`
- `docs/AETHRA_MVP_CHECKPOINT.md`

Docs must stay conservative: concept until implemented, local-preview boundary, no production support claim, and no compatibility guarantee until tested and documented.

## Release Checklist Gate

Before an adapter PR is considered for local preview release notes, reviewers must confirm:

- default release checks pass without adapter prerequisites
- adapter checks are clearly optional when local prerequisites are absent
- generated local evidence stays under ignored `local-evidence/`
- local model files stay under ignored `models/`
- audit logs stay ignored
- failure modes are documented
- rollback steps are documented when config or endpoint behavior changes

## Reviewer Approval Checklist

Reviewers should approve future adapter implementation only after confirming:

- the adapter is disabled by default
- the adapter requires explicit configuration
- loopback/local-first defaults are preserved
- no telemetry was added
- no cloud call was added by default
- no GitHub/API/update check was added
- no external lookup was added
- prompts and raw requests are not persisted by default
- secrets are not stored in repo files
- model weights are not committed
- model install/delete controls were not added unless separately designed
- runner controls were not added unless separately designed
- route explanations are preserved
- audit events are preserved
- adversarial document-instruction behavior is preserved
- Aethra remains observational unless separately designed
- tests land before any adapter availability claim
- docs clearly say what is implemented and what remains a future design
