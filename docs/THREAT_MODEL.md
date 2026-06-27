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

- Current mitigation: GGUF runner is feature-gated, opt-in, and requires an explicit local binary path from operator configuration. The daemon does not silently fall back to a bare executable name resolved from `PATH`.
- Current mitigation: startup logs record the configured local runner path when present, or note that the subprocess path is disabled when not configured.
- Current mitigation: if the configured path is invalid, missing, or otherwise unusable, the daemon skips the subprocess path and falls back to `StubLegalRunner`.
- Gap: no subprocess sandbox, binary allowlist, signature verification, seccomp profile, or filesystem isolation is implemented.
- Gap: operators are still responsible for deciding whether the configured local runner binary is trusted, patched, and scoped to local-only dependencies.

Untrusted local runner binary risks:

- A local runner binary can read prompt files, model paths, prompt packs, environment variables, and any other filesystem locations available to the daemon user.
- A local runner binary can emit malformed or misleading output; the daemon records structured parse failures when legal JSON normalization fails, but it cannot prove the runner behaved honestly.
- A local runner binary can ignore local-only expectations if the operator wires it to other tools or endpoints outside this repository's defaults.
- A local runner binary can inherit the daemon's local privileges. Treat it as operator-managed code, not as a trusted component shipped and sandboxed by IgnisPrompt.

Unauthenticated local API access:

- Current mitigation: default bind is `127.0.0.1:8765`.
- Current boundary: the explicit non-loopback override is a local-preview operator decision for a trusted network and remains unauthenticated.
- Gap: no daemon-level auth, authorization, rate limiting, or TLS. This hardening work does not redesign that boundary; future production deployment would require authentication, authorization, TLS, and stricter CORS.

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
