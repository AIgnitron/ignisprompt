# Threat Model

This threat model covers the current local daemon scaffold. It should be updated when new transports, cloud providers, dashboards, plugins, or enterprise features are implemented.

## Assets

- User prompts and documents.
- Route decisions and explanations.
- Local audit events.
- Model manifests.
- Local model weights in `./models/` or other ignored paths.
- Local evidence bundles in `./local-evidence/`.
- Prompt packs under `config/prompts`.
- Optional GGUF runner binaries and local Ollama state.

## Trust boundaries

- Local HTTP client to `ignispromptd`.
- `ignispromptd` to local filesystem for manifests and audit JSONL.
- `ignispromptd` to optional local subprocess runner.
- Optional runner to local Ollama through `OLLAMA_HOST`.
- Git repository boundary, where model weights and evidence must not cross into committed files.

There is no implemented cloud trust boundary today because cloud routing is not implemented.

## Threats and current mitigations

Prompt or document attempts to change routing:

- Current mitigation: known instruction strings are detected and returned as warnings.
- Golden coverage includes direct override language and subtler legal-language clauses that ask for unrestricted, most-capable, or external cloud analysis; these clauses are treated as document content and must not change local-only routing or audit behavior.
- Gap: this is pattern matching, not a complete adversarial robustness system.

Silent cloud exfiltration:

- Current mitigation: default daemon has no cloud calls, legal routes fail closed, and route decisions expose `data_left_device`.
- Gap: future cloud BYOK work would need explicit consent, policy checks, tests, audit detail, and docs before being enabled.

Model weight leakage:

- Current mitigation: `./models/**` is ignored and docs require weights to stay out of git.
- Gap: local operators still need to manage file permissions and licensing.

Evidence leakage:

- Current mitigation: `./local-evidence/**` is ignored and scripts write evidence there by default.
- Gap: evidence may contain sensitive prompt text and model output; no encryption is provided by the daemon.

Audit tampering:

- Current mitigation: audit events are written locally and exposed for inspection.
- Gap: logs are not signed, chained, immutable, or externally verified.

Subprocess runner compromise:

- Current mitigation: GGUF runner is feature-gated and opt-in.
- Gap: no subprocess sandbox, binary allowlist, seccomp profile, or filesystem isolation is implemented.

Unauthenticated local API access:

- Current mitigation: default bind is `127.0.0.1:8765`.
- Gap: no daemon-level auth, authorization, rate limiting, or TLS.

False product claims:

- Current mitigation: docs explicitly mark MCP, dashboard, Tier 4, Tier 5, and attestation as not implemented.
- Gap: release notes and PR descriptions still need human review.

## Required updates for future scope

Update this threat model before adding:

- cloud BYOK routing
- MCP server
- dashboard
- plugin or connector runtime
- Tier 2 platform bridge
- Tier 4 edge dispatch
- Tier 5 cloud dispatch
- signed attestation
- enterprise audit or compliance features
