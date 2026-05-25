# Security Model

This document describes the current scaffold security posture. It is not a certification, audit report, or enterprise attestation.

## Security goals

- Keep the default daemon local-only.
- Prevent silent cloud fallback.
- Preserve human-readable route explanations.
- Preserve local audit events for route explanations and chat completions.
- Treat document-contained routing override attempts as untrusted content.
- Keep model weights and local evidence out of git.

## Local-only boundary

The daemon has no default cloud provider calls. Current route decisions report `data_left_device: false`. Legal requests either route to a local Tier 3 path or fail closed.

Optional GGUF flows are local operator-controlled integrations. The included Ollama wrapper targets `OLLAMA_HOST`, which should be a local host such as `http://127.0.0.1:11434`, and sets `OLLAMA_NO_CLOUD=true` by default. The daemon only accepts an explicit configured runner binary path for the GGUF subprocess path; it does not implicitly resolve a bare executable name from `PATH`.

Cloud BYOK routing is not implemented. Tier 5 cloud routing is not implemented.

## HTTP bind and CORS boundary

The default HTTP daemon bind remains `127.0.0.1:8765`. Loopback binds use a CORS policy limited to loopback browser origins such as `http://127.0.0.1:<port>`, `http://localhost:<port>`, and `http://[::1]:<port>`.

Binding the HTTP daemon to a non-loopback address is rejected unless the local operator explicitly sets `--allow-non-loopback-cors` or `IGNISPROMPT_ALLOW_NON_LOOPBACK_CORS=true`. That override enables permissive CORS for a trusted local-preview network only. It does not add authentication, TLS, production readiness, or security certification.

## Prompt and document handling

The daemon scans combined message text for known adversarial document instructions, including attempts to ignore routing rules, disable audit logging, or route to cloud. When detected, it returns a warning and keeps routing and audit behavior unchanged.

This is a lightweight scaffold control, not a complete prompt-injection defense.

## Audit behavior

Route explanations and chat completions append local audit events. Events include route code, tier, domain, model id, explanation, warnings, and `data_left_device`.

Audit appends write the local JSONL record before the event is made visible through the process-memory audit list. If the JSONL write fails, the event is not reported through `GET /v1/audit/events` as a memory-only durable event.

Current limitations:

- audit events are not signed
- audit events are not tamper-evident
- audit events are not encrypted by the daemon
- `GET /v1/audit/events` returns events accumulated in the current process memory
- the JSONL audit file location is controlled by local config
- audit storage is still local-preview JSONL, not signed, tamper-evident, certified, or production-grade storage

## Local exact-match cache

The Tier 1 cache is local, in-memory, and exact-match only. It is limited to safe chat completions that stay on device and does not implement semantic caching, embeddings, cross-user reuse, or cross-process persistence. It is bounded to `128` entries by default and can be tightened or expanded locally with `IGNISPROMPT_EXACT_MATCH_CACHE_MAX_ENTRIES` or `--exact-match-cache-max-entries`.

Current safeguards:

- adversarial document-instruction requests are not cached
- preflight-rejected requests are not cached
- fail-closed responses are not cached
- parse-error legal JSON outputs are not cached as successful entries
- cache hits preserve `data_left_device: false`
- cache hits preserve the underlying local route metadata and audit behavior

## Model and evidence handling

Model weights belong outside git. Local model files are expected under `./models/`, which is ignored.

Demo, golden, and bakeoff outputs belong under `./local-evidence/`, which is ignored. Evidence may contain request text, route decisions, model output, logs, and local paths. Treat it as sensitive.

## Local security review helpers

The repo includes reproducible local helper checks for security review. These are developer checks, not certification, audit approval, compliance approval, production security approval, or complete supply-chain assurance.

Run the deterministic local checks with:

```bash
make security-check
```

That target scans tracked text files for hidden Unicode format/control characters and conservative secret patterns such as private key headers, common token formats, tracked `.env` files, and credential-like assignments. It does not upload repository contents or call external services.

Optional dependency advisory checking uses `cargo-audit` when installed:

```bash
cargo install cargo-audit --locked
make cargo-audit
```

This is intentionally optional unless a workflow installs the tool deterministically. A missing local `cargo-audit` binary should be treated as a missing prerequisite, not as a clean advisory result.

Optional SBOM planning/generation uses `cargo-cyclonedx` when installed:

```bash
./scripts/generate-sbom-local.sh --dry-run
cargo install cargo-cyclonedx --locked
./scripts/generate-sbom-local.sh
```

The default SBOM output path is under ignored `local-evidence/sbom/`. Review any generated SBOM before intentionally tracking it. SBOM generation here does not claim completeness, certification, or compliance.

## Current security gaps

- No authentication or authorization on the local HTTP API.
- No TLS termination in the daemon.
- No signed attestation report generation.
- No tamper-evident audit log chain.
- No complete prompt-injection defense.
- No sandbox, signature verification, or allowlist around the optional GGUF subprocess.
- No enterprise policy engine.
- No production secrets manager integration.
- No required CI dependency advisory gate yet; local `cargo-audit` is optional unless CI installs it deterministically.
- No complete supply-chain assurance or SBOM completeness guarantee.

Run the daemon only in a trusted local development environment unless these gaps are explicitly addressed.
