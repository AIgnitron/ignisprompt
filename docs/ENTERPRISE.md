# Enterprise Notes

IgnisPrompt does not currently implement enterprise features. This document exists to keep enterprise-facing language precise and to prevent accidental overclaims.

## What exists today

- Local Rust daemon scaffold.
- Local-only default route behavior.
- Local model manifests.
- Local audit JSONL events.
- Human-readable route explanations.
- Adversarial document-instruction warnings for known patterns.
- Optional local GGUF runner spike.

## What does not exist today

- Enterprise compliance certification.
- Enterprise attestation.
- Signed Local-Only Attestation Report generation.
- Admin dashboard.
- Organization policy management.
- RBAC or SSO.
- Tamper-evident audit ledger.
- Managed key service.
- Cloud BYOK routing.
- MCP server.
- Tier 4 or Tier 5 production routing.
- Production legal advice system.

## Enterprise readiness gaps

Before enterprise claims are made, the project would need scoped design, implementation, and tests for areas such as:

- authentication and authorization
- operator policy configuration
- audit log integrity and retention
- signed reports and verifiable build metadata
- secrets handling
- deployment hardening
- data classification and redaction
- security review of local runners and subprocess boundaries
- model provenance, licensing, and hash verification
- incident response and upgrade process

## Cloud BYOK note

Cloud BYOK is not implemented. If future work adds it, it should be explicit, opt-in, policy-gated, audited, and documented before any release claims are made.

Default local-only behavior must remain available and must not depend on cloud credentials.
