# Security Policy

IgnisPrompt is security-sensitive infrastructure. Please do not file public issues for vulnerabilities that could affect local-only routing, audit integrity, or cloud-consent enforcement.

## Report a vulnerability

Email: security@aignitron.com

## Security invariants

- Cloud routing must never occur without explicit consent.
- Local-only mode must fail closed.
- Document-contained instructions must never modify routing policy or audit behavior.
- Audit event writes must not be silently disabled by request content.
