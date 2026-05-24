# Testing

The default test path must pass without Ollama, GGUF tooling, local model weights, network access, or cloud credentials.

## Required default checks

For the default one-command developer check:

```bash
./scripts/dev-check.sh
```

This wrapper runs `cargo build`, `cargo test`, starts `./scripts/start-dev.sh` in the background, waits for `/health`, runs `./scripts/smoke.sh`, and stops the daemon on exit, including failure paths. It intentionally uses the default local-only scaffold and does not require Ollama, GGUF tooling, local model weights, network access, cloud access, or cloud credentials.

It also runs `./scripts/check-sustainability-language.sh` after `cargo test`. That guardrail scans README, docs, Aethra source, daemon source, and scripts for a narrow set of unsupported sustainability claim phrases, excluding generated or ignored output paths. `./scripts/release-check.sh` runs the same guardrail directly and then includes it again through `./scripts/dev-check.sh`.

The guardrail is intended to catch wording that conflicts with the estimated/proxy/counterfactual/methodology-dependent sustainability boundary, including carbon-saved claims, measured-emissions certainty, zero-emissions certainty, certification language, ESG claims, and production or compliance claims. It does not replace careful review of sustainability wording.

`./scripts/dev-check.sh` also runs `make security-check`. That target is deterministic and local-only: it scans tracked text files for hidden Unicode format/control characters and conservative accidental secret patterns. It does not upload content, call external services, add telemetry, or claim certification, compliance approval, production security approval, or complete supply-chain assurance.

The same checks can still be run separately:

```bash
cargo build
cargo test
./scripts/check-sustainability-language.sh
make security-check
```

For the lower-level manual daemon smoke path:

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
./scripts/smoke.sh
```

`./scripts/smoke.sh` assumes the daemon is already listening at `IGNISPROMPT_BASE_URL`, defaulting to `http://127.0.0.1:8765`.

The smoke script checks `GET /v1/status/version` in addition to health, models, model/runner status hints, route explanation, chat completions, audit events, and sustainability metrics. The version status endpoint is for local preview support/debugging and release validation only. It does not perform telemetry, update checks, GitHub lookups, cloud calls, or external release lookups.

## ignispromptctl smoke

With the daemon already running, `ignispromptctl` can be used for quick local inspection:

```bash
cargo run -p ignispromptctl -- doctor
cargo run -p ignispromptctl -- doctor --json
cargo run -p ignispromptctl -- health
cargo run -p ignispromptctl -- status-version
cargo run -p ignispromptctl -- models
cargo run -p ignispromptctl -- sustainability --period 30d
cargo run -p ignispromptctl -- sustainability --period 30d --json
cargo run -p ignispromptctl -- audit-events
cargo run -p ignispromptctl -- audit-events --json
cargo run -p ignispromptctl -- evidence-bundle --output local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --output local-evidence/demo-bundle --include-audit-events
cargo run -p ignispromptctl -- evidence-bundle --output local-evidence/demo-bundle --json
cargo run -p ignispromptctl -- evidence-bundle --list local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --validate local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --archive local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --verify-archive local-evidence/archives/demo-bundle.tar.gz
cargo run -p ignispromptctl -- evidence-bundle --print-manifest local-evidence/demo-bundle
cargo run -p ignispromptctl -- route-explain --text "Review this synthetic contract clause."
cargo run -p ignispromptctl -- route-explain --input ./tests/golden-legal/smoke-legal-request.json
cargo run -p ignispromptctl -- route-explain --input ./tests/golden-legal/smoke-legal-request.json --json
cargo run -p ignispromptctl -- audit tail
```

The `doctor` command checks required local preview endpoints for health, version status, model manifests, and model and runner status hints. It also checks sustainability metrics as informational diagnostics. It exits non-zero only when required checks fail, supports `--json`, and should be used before Aethra live-local debugging when a terminal status summary is useful. It does not add telemetry, cloud calls, GitHub calls, update checks, external lookup, persistence, uploads, model controls, runner controls, or command execution beyond local HTTP reads.

The `sustainability` command reads `GET /v1/metrics/sustainability?period=<period>` with supported periods `7d`, `30d`, and `90d`; it defaults to `30d` and rejects unsupported values before sending a request. It prints aggregate local sustainability metrics only. It does not include prompts, raw request text, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys.

The `audit-events` command reads the existing local `GET /v1/audit/events` endpoint. Human-readable output includes request IDs, route/domain/tier signals, warnings, timestamps when present, and local-only/proxy fields only when present. `--json` prints the endpoint response as formatted JSON. The command is read-only and does not mutate, persist, upload, or redact audit events through external services.

The `evidence-bundle` command writes a local-only diagnostic bundle under an ignored `local-evidence/` path by reading the existing local health, version status, model, model and runner status hint, and sustainability endpoints. Audit events stay omitted unless `--include-audit-events` is passed. `--json` prints the bundle summary JSON. `--list` inspects an existing bundle without calling the daemon, `--validate` checks the on-disk bundle contract without daemon access, `--archive` creates a local tar.gz archive under `local-evidence/archives/` by default after validating the bundle, `--archive-output` can override that path when it stays under `local-evidence/`, `--verify-archive` inspects an existing archive without calling the daemon, and `--print-manifest` prints the manifest for an existing bundle without calling the daemon. The bundle is for local preview review only: it is not signed, not certified, not production evidence, and does not call cloud services or external endpoints.

Safe local-preview examples:

```bash
cargo run -p ignispromptctl -- evidence-bundle --output local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --list local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --validate local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --archive local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --verify-archive local-evidence/archives/demo-bundle.tar.gz
cargo run -p ignispromptctl -- evidence-bundle --print-manifest local-evidence/demo-bundle
```

These snippets are local-preview examples only. Keep generated outputs under ignored `local-evidence/` paths. Archive verification is structural local validation only; it is not cryptographic verification.

The `route-explain` command calls the existing local `POST /v1/route/explain` endpoint with either `--text` or `--input`. Use synthetic or non-sensitive local preview text. `--json` prints the raw daemon response as formatted JSON. This is route inspection, not legal advice or legal accuracy validation. For a legal route example, use a request file that already carries legal context such as `./tests/golden-legal/smoke-legal-request.json`, which sets `model` to `ignisprompt/legal`.

## CI path

`.github/workflows/ci.yml` runs:

- `cargo build`
- `cargo test`
- `./scripts/smoke.sh` against `./scripts/start-dev.sh`

This default path intentionally avoids Ollama, GGUF model weights, and cloud access.

## Aethra scaffold checks

The planned Aethra dashboard scaffold lives under `apps/aethra/` and is isolated from the default Rust daemon path. It uses synthetic fixtures only in the first scaffold and does not require a running `ignispromptd`, Ollama, GGUF tooling, model weights, cloud access, or cloud credentials.

When changing Aethra files, run its local checks from the app directory:

```bash
cd apps/aethra
npm ci
npm run build
npm test
```

Do not make `make dev-check` depend on Node tooling unless a future task explicitly changes the repository-wide verification policy.

The Aethra app checks cover the fixture-backed evidence bundle viewer, validation summary, archive metadata preview, and local-preview CLI snippets. The default render must stay read-only and must not surface prompts, raw audit event bodies, secrets, hostnames, usernames, machine identifiers, or absolute filesystem paths. The viewer must also show conservative empty states when evidence bundle metadata is missing or invalid, without inferring signing, certification, attestation, or production readiness.

For the opt-in local API smoke path, first run the Aethra app checks above, then run:

```bash
npm run smoke:local-api -- --start-daemon
```

This starts the default local-only `ignispromptd` path with `./scripts/start-dev.sh`, waits for `/health`, and checks that Aethra can read `GET /health`, `GET /v1/status/version`, `GET /v1/models`, `GET /v1/status/models`, `GET /v1/audit/events`, and `GET /v1/metrics/sustainability?period=30d` over localhost. `GET /v1/status/version` is treated as local preview support/debugging metadata only, not an update checker or telemetry mechanism. `GET /v1/status/models` is treated as model and runner status hints only. `GET /v1/metrics/sustainability?period=30d` is treated as methodology-dependent counterfactual proxy estimates only. It does not require Ollama, GGUF tooling, model weights, cloud credentials, generated evidence, or a browser E2E runner.

In the Aethra UI, Overview and Sustainability Preview remain fixture-backed by default. The local preview banner should state that fixture mode is default, live-local loading is manual, Aethra sends no telemetry, makes no cloud calls by default, and is not a production deployment. Each main page should include lightweight guidance that explains what the page shows without adding controls or live loading behavior. To exercise the live-local UI path manually, start the daemon, switch Aethra to Live local mode, keep the daemon URL on a loopback origin such as `http://127.0.0.1:8765`, use the grouped manual Overview actions to load health and daemon version status, open Sustainability Preview, choose a period such as `30d`, and use the manual live sustainability metrics load action. The UI should show fixture fallback data until the operator requests the live load, and it should keep fixture fallback data visible if the local daemon is unreachable or returns invalid JSON/schema.

Overview live-local diagnostics are derived from manual local loads only. Tests cover fixture mode active, live-local ready, live-local connected, daemon unreachable, endpoint unavailable, invalid response shape, last refresh failed, and last refresh succeeded summaries. Diagnostics are local-only, non-persistent, not telemetry, and not an update checker.

Overview also includes copyable local commands for preview verification and debugging. The command definitions are covered by Aethra unit tests. Copy behavior uses the browser Clipboard API when available, shows an in-app fallback message when clipboard access is unavailable or fails, and does not execute commands, persist state, add telemetry, or call remote services.

Routing Explorer helper tests cover route decision JSON copy payload formatting. The payload should include request ID, decision, explanation, and warnings, and should not include prompt text or request messages. The UI copy helper uses the browser Clipboard API only and must not execute commands, persist state, add telemetry, or call remote services.

Aethra Audit Events search and filters run in the browser against the currently displayed fixture or manually loaded live-local records. Request ID copy helpers use the same Clipboard API boundary as command copy helpers: no command execution, no persistence, no telemetry, and no remote calls.

Aethra empty-state copy is covered by unit tests for fixture mode, missing audit events, model status hints, sustainability metrics, and manual local error guidance. The UI should explain missing data, fixture fallback, daemon startup, and manual refresh actions without auto-loading, polling, storage persistence, telemetry, cloud calls, GitHub calls, or update checks.

If a daemon is already running, omit `--start-daemon`:

```bash
npm run smoke:local-api
```

To also exercise route explanation with synthetic text, use:

```bash
npm run smoke:local-api -- --start-daemon --include-route-explain
```

`--include-route-explain` calls `POST /v1/route/explain` with synthetic text only. The request is local, but it appends a local audit event. The smoke does not call chat completions, does not call cloud services, and does not prove model quality, production readiness, legal accuracy, or compliance readiness. It is not certified sustainability reporting, measured energy use, or measured carbon impact.

## Sustainability metrics checks

The default Rust tests cover the Aethra v0.1 methodology fields on audit events, valid JSON shape for `GET /v1/metrics/sustainability?period=30d`, safe zero values with no audit data, local fail-closed/cloud-denied route counting, and always-present methodology/disclaimer fields.

Local-preview API schema-lock tests cover the JSON field names and high-level response shapes consumed by Aethra, smoke checks, and `ignispromptctl` for `GET /health`, `GET /v1/models`, `GET /v1/status/models`, `GET /v1/status/version`, `GET /v1/audit/events`, `GET /v1/metrics/sustainability?period=30d`, and invalid sustainability period errors. Audit integrity regression tests also check route-explain and chat-completion audit events for local route/domain/tier signals, request IDs, timestamps, conservative warning/explanation metadata, and optional Aethra estimate fields while preserving the HTTP audit endpoint's JSON array shape. OpenAI-compatible `POST /v1/chat/completions` tests also lock the non-streaming response shape, streaming SSE chunk shape, route metadata, local-only route flags, UTF-8-safe streaming fragments, and representative invalid-input error shape for local-preview users and future local gateway planning. Existing MCP response shape tests lock `initialize`, `tools/list`, `route_explain` tool success/error payloads, notification behavior, and JSON-RPC error envelopes before any future MCP expansion.

Route-policy regression tests cover legal Tier 3 routing, general non-legal local routing, local-only fail-closed legal routing, adversarial document-instruction warnings, conservative route explanation text, and local audit emission for route explanations and chat completions. The tests use existing deterministic golden legal fixtures and do not add generated evidence, model weights, cloud calls, telemetry, or HTTP response shape changes.

Model availability regression tests keep route eligibility separate from local file and runner hints. They cover configured-but-not-route-eligible manifests, route-eligible manifests whose local file is missing, conservative `/v1/status/models` availability values, feature-gated GGUF status hints for missing runner and staged local prerequisites, and wording that says local file/runner presence does not mean executable inference was attempted.

Feature-gated GGUF subprocess tests use temporary fake local scripts and placeholder local files only. They cover the fast successful path, subprocess timeout/hang fallback, non-zero subprocess exit fallback, missing prompt/model/runner prerequisites, and invalid legal JSON metadata. These tests do not require real Ollama, GGUF tooling, model weights, network access, cloud credentials, or production-grade runner management.

The endpoint is local-only and derived from in-memory audit events. Tests should not add telemetry, network calls, cloud calls, external coefficient lookup, or global opt-in pools. The output must remain framed as estimated, proxy, counterfactual, and methodology-dependent.

The `ignispromptctl doctor` tests cover endpoint URL formatting, required/informational check lists, representative endpoint-shape validation including model and runner status hint fields, failed required-check summaries, and JSON output shape. The `ignispromptctl sustainability` tests cover default and custom period URL generation, supported-period validation, representative summary formatting, and invalid response-shape detection. The `ignispromptctl audit-events` and `route-explain` tests cover endpoint URL formatting, human-readable summaries, formatted JSON preservation, invalid response shapes, local next-step error messages, and invalid route input handling. JSON output is a CLI presentation option for the same local endpoint response; it is not a report upload or external lookup.

The Aethra client and contract tests cover current local-preview daemon response shapes for health, version status, model manifests, model and runner status hints, audit events, and sustainability metrics. They also cover missing optional model and audit fields, unsupported schema guidance, request IDs, route/domain/tier signals, warning metadata, and optional Aethra proxy estimate fields. Sustainability report tests cover structured Markdown sections, deterministic schema-versioned JSON shape, methodology/confidence/disclaimer fields, export limitations, fixture and live-local report sources, excluded prompt/raw audit/machine fields, redacted sensitive local identifiers, and conservative claim language. Sustainability Preview export guidance and methodology copy helpers should remain browser-local UI behavior; UI-level browser tests are not part of the current app test setup.

For local sustainability report export changes, run:

```bash
cd apps/aethra
npm test
npm run build
```

The export path should remain browser-local. Tests and implementation should not add telemetry, cloud calls, external network calls, external coefficient lookup, persistence, global aggregation, request content, prompts, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys.

## Sustainability language guardrail

Run the repository language guardrail before sustainability copy, docs, or UI changes:

```bash
./scripts/check-sustainability-language.sh
```

The check is also part of `./scripts/dev-check.sh`. It blocks unsupported sustainability certainty or certification phrases unless the line uses an approved negated disclaimer. Keep Aethra language framed as estimated, proxy, counterfactual, and methodology-dependent.

## Security review helper checks

Run deterministic local security helper checks with:

```bash
make security-check
```

This runs:

```bash
./scripts/check-hidden-unicode.sh
./scripts/check-secrets-local.sh
```

The hidden Unicode scan covers tracked Rust source, shell scripts, docs, JSON fixtures, GitHub workflow files, TypeScript/React files, TOML/config files, lockfiles, and Markdown where practical. It flags Unicode format/control characters, including bidirectional text markers, while allowing ordinary tab/newline/carriage-return whitespace.

The local secret scan is intentionally conservative. It checks tracked text files for obvious private key headers, common token formats, tracked `.env` files, and credential-like assignments. It is not a replacement for a full security review or a hosted secret-scanning product, and it does not call external services.

Optional Rust dependency advisory checking is available when `cargo-audit` is installed:

```bash
cargo install cargo-audit --locked
make cargo-audit
```

If `cargo-audit` is not installed, `./scripts/cargo-audit-local.sh` exits with a missing-prerequisite message. The default CI path does not depend on this optional tool unless a future workflow installs it deterministically.

Optional local SBOM planning/generation is available with:

```bash
./scripts/generate-sbom-local.sh --dry-run
cargo install cargo-cyclonedx --locked
./scripts/generate-sbom-local.sh
```

The default SBOM output path is ignored under `local-evidence/sbom/`. Do not commit generated SBOM output unless it is intentionally reviewed and scoped in a future PR. These helpers do not claim SBOM completeness, supply-chain certification, compliance approval, or production security readiness.

## Experimental MCP stub

The experimental MCP path is manual-only and is not part of default CI. It can be exercised locally with newline-delimited JSON-RPC over stdio:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0.1.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"route_explain","arguments":{"model":"ignisprompt/legal","messages":[{"role":"user","content":"Review this indemnification clause in a vendor services agreement and return the key risks."}],"metadata":{"domain":"legal"}}}}' \
  | cargo run -p ignispromptd -- --experimental-mcp-stdio
```

Current scope:

- `initialize`, `notifications/initialized`, and `ping`
- `tools/list` and `tools/call`
- experimental tools: `route_explain`, `audit_events`, `status_version`, and `sustainability_summary`

The observability tools are read-only and local-only. `audit_events` returns recent local audit metadata already exposed by `GET /v1/audit/events`; `status_version` returns the existing local version/status shape from `GET /v1/status/version`; `sustainability_summary` returns aggregate local estimates from the existing sustainability metrics logic with `30d` as the default period. They do not add telemetry, cloud calls, update checks, external lookups, command execution, persistence, prompt/resource/sampling support, model controls, runner controls, config changes, or remote transports.

For contributor-facing usage notes, including `audit_events` `structuredContent` as `{ "events": [...] }` and the preserved HTTP `GET /v1/audit/events` JSON array shape, see [Contributor MCP Usage](MCP_USAGE.md).

Rust tests protect the current MCP response envelopes, advertised tool schemas, route_explain tool content and structured route decision shapes, observability tool success/error shapes, preflight rejection tool-error shape, notification no-response behavior, and invalid request error shape. The sustainability summary remains estimated, counterfactual, proxy, methodology-dependent, and not certified reporting.

This path must stay local-only and must not require Ollama, GGUF tooling, model weights, network access, or cloud access.

## Feature-gated GGUF checks

The `gguf-runner-spike` feature is optional. Feature-gated tests can be run with:

```bash
cargo build --features gguf-runner-spike
cargo test --features gguf-runner-spike
cargo test --all-features
```

Live GGUF smoke requires a local model file and local runner configuration:

```bash
make gguf-smoke
```

The `make gguf-smoke` target starts a feature-gated local daemon, waits for `/health`, runs `./scripts/smoke-gguf-local.sh`, and stops the daemon. If you run `./scripts/smoke-gguf-local.sh` directly, it expects the daemon to already be running with `--features gguf-runner-spike`, a configured `IGNISPROMPT_GGUF_RUNNER_BIN`, and a local manifest `localPath` that exists.

## Local evidence scripts

This repo includes one default-path developer evidence script that does not require Ollama, GGUF tooling, or local model weights:

- `./scripts/generate-local-only-attestation.sh`

These scripts require local Ollama and local model files:

- `./scripts/demo-local-legal-review.sh`
- `./scripts/run-golden-legal-v0.3.sh`
- `./scripts/run-alpha-legal-bakeoff-v0.1.sh`

They write evidence under `./local-evidence/`. Do not commit evidence bundles.

`./scripts/generate-local-only-attestation.sh` writes a developer-generated evidence bundle under `./local-evidence/attestation/<timestamp>/`. It captures git SHA, build mode, built binary path and hash, `/health`, legal route explanation, audit snapshot, `data_left_device=false` evidence, and git-ignore safety for `models/**`, `data/audit/*.jsonl`, `target/`, Aethra `dist/`, attestation evidence, demo transcripts, and Golden Legal evidence under `local-evidence/**`. It validates that the evidence root stays under ignored `local-evidence/` and that the summary does not contain placeholder-like literal `"string"` values. It is not a signed attestation report or compliance certification.

For a deterministic default-path validation of those local evidence guardrails without starting the daemon:

```bash
./scripts/generate-local-only-attestation.sh --self-test
```

The Golden Legal v0.3 script now includes nine local control-plane cases: the original Tier 3 success, fail-closed, no-cloud, explanation, and subtle legal-language cases plus an expanded adversarial fixture matrix. Passing this path validates local routing, audit capture, and schema handling under local prerequisites. It does not prove legal accuracy, production readiness, enterprise attestation, or compliance certification.

## What tests assert today

- Legal requests route to Tier 3 when a legal manifest is installed.
- Legal requests fail closed when a local legal model is unavailable.
- Cloud fallback is not allowed without explicit consent.
- Adversarial document instructions are treated as untrusted content across the Golden Legal fixture matrix.
- Route explanations remain human-readable.
- Chat completions append audit events.
- `stream: false` and missing `stream` preserve the current JSON chat-completion shape.
- `stream: true` returns a basic SSE-compatible chat-completion scaffold ending in `data: [DONE]`.
- Safe identical chat completions can reuse a local in-memory exact-match cache entry.
- The exact-match cache stays bounded and evicts old entries when its local entry limit is exceeded.
- Adversarial, rejected, and fail-closed chat completions are not cached.
- The default Tier 3 path uses `StubLegalRunner` unless the feature-gated GGUF runner is explicitly available.
- Feature-gated GGUF subprocess tests use temporary fake runner scripts and placeholder local files to cover missing runner binaries, missing `.gguf` paths, non-zero subprocess exits, invalid legal JSON output, malformed legal JSON schema output, and fallback to `StubLegalRunner`.
- The feature-gated GGUF tests require an explicit local runner path and reject bare executable names.
- The legal JSON normalizer accepts realistic local noisy output forms and records schema failures as structured local failures.
- `./scripts/demo-transcript.sh --self-test` writes a tiny ignored fixture bundle, verifies transcript safety language, and rejects placeholder-like successful demo JSON containing literal `"string"` values.
- `./scripts/generate-local-only-attestation.sh --self-test` verifies ignored local evidence, audit log, model, `target/`, and Aethra `dist/` paths, and rejects placeholder-like summary JSON containing literal `"string"` values.
- The experimental MCP stub can initialize, list tools, and call `route_explain` while reusing the existing local route and audit behavior.

## What tests do not prove

- Production legal accuracy.
- Enterprise compliance certification.
- Signed attestation.
- Tamper-evident audit storage.
- Broad MCP client compatibility beyond the experimental stdio stub.
- Dashboard behavior.
- Tier 4 or Tier 5 routing.
