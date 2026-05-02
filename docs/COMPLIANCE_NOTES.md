# Compliance Notes

These notes describe the current repository posture. They are not legal advice, a compliance certification, or an enterprise attestation.

## Current posture

- The default daemon is local-only.
- The default test and smoke path does not require model weights or cloud access.
- Route explanations and audit events are implemented.
- Legal requests fail closed when no eligible local Tier 3 legal model is available.
- Known adversarial document instructions are treated as untrusted content.
- `StubLegalRunner` is the default legal completion fallback.

## Legal advice disclaimer

IgnisPrompt does not provide production legal advice. The current legal flow is a routing and local execution scaffold. Any model output, including output from optional GGUF demos, must not be described as legal advice or legally reliable review.

Qwen2.5 0.5B is a pipe/demo baseline only. It is not the settled legal-quality model.

## Data handling

The daemon can process user prompts and document excerpts. Local audit events and local evidence bundles may contain sensitive text, route decisions, model outputs, logs, and file paths.

Do not commit:

- model weights
- local evidence
- secrets
- target artifacts
- `.DS_Store`

## Audit limitations

Audit events are useful for local development and smoke validation. They are not currently:

- signed
- immutable
- tamper-evident
- encrypted by the daemon
- backed by retention policy
- enterprise-certified

## Compliance gaps

The repository does not currently implement:

- HIPAA, SOC 2, ISO 27001, GDPR, or other certification controls
- data subject request tooling
- retention management
- enterprise access controls
- SSO or RBAC
- signed attestation
- formal legal-quality validation

Future compliance work should start from explicit requirements, threat model updates, tests, docs, and release checklist updates.
