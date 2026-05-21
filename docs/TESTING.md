# Testing

The default test path must pass without Ollama, GGUF tooling, local model weights, network access, or cloud credentials.

## Required default checks

For the default one-command developer check:

```bash
./scripts/dev-check.sh
```

This wrapper runs `cargo build`, `cargo test`, starts `./scripts/start-dev.sh` in the background, waits for `/health`, runs `./scripts/smoke.sh`, and stops the daemon on exit, including failure paths. It intentionally uses the default local-only scaffold and does not require Ollama, GGUF tooling, local model weights, network access, cloud access, or cloud credentials.

The same checks can still be run separately:

```bash
cargo build
cargo test
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
cargo run -p ignispromptctl -- health
cargo run -p ignispromptctl -- status-version
cargo run -p ignispromptctl -- models
cargo run -p ignispromptctl -- sustainability --period 30d
cargo run -p ignispromptctl -- sustainability --period 30d --json
cargo run -p ignispromptctl -- route-explain --file ./tests/golden-legal/smoke-legal-request.json
cargo run -p ignispromptctl -- audit tail
```

The `sustainability` command reads `GET /v1/metrics/sustainability?period=<period>` with supported periods `7d`, `30d`, and `90d`; it defaults to `30d` and rejects unsupported values before sending a request. It prints aggregate local sustainability metrics only. It does not include prompts, raw request text, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys.

The `route-explain` command reads a JSON request file. For a legal route example, use a request file that already carries legal context such as `./tests/golden-legal/smoke-legal-request.json`, which sets `model` to `ignisprompt/legal`.

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

For the opt-in local API smoke path, first run the Aethra app checks above, then run:

```bash
npm run smoke:local-api -- --start-daemon
```

This starts the default local-only `ignispromptd` path with `./scripts/start-dev.sh`, waits for `/health`, and checks that Aethra can read `GET /health`, `GET /v1/status/version`, `GET /v1/models`, `GET /v1/status/models`, `GET /v1/audit/events`, and `GET /v1/metrics/sustainability?period=30d` over localhost. `GET /v1/status/version` is treated as local preview support/debugging metadata only, not an update checker or telemetry mechanism. `GET /v1/status/models` is treated as model and runner status hints only. `GET /v1/metrics/sustainability?period=30d` is treated as methodology-dependent counterfactual proxy estimates only. It does not require Ollama, GGUF tooling, model weights, cloud credentials, generated evidence, or a browser E2E runner.

In the Aethra UI, Overview and Sustainability Preview remain fixture-backed by default. The local preview banner should state that fixture mode is default, live-local loading is manual, Aethra sends no telemetry, makes no cloud calls by default, and is not a production deployment. Each main page should include lightweight guidance that explains what the page shows without adding controls or live loading behavior. To exercise the live-local UI path manually, start the daemon, switch Aethra to Live local mode, keep the daemon URL on a loopback origin such as `http://127.0.0.1:8765`, use the grouped manual Overview actions to load health and daemon version status, open Sustainability Preview, choose a period such as `30d`, and use the manual live sustainability metrics load action. The UI should show fixture fallback data until the operator requests the live load, and it should keep fixture fallback data visible if the local daemon is unreachable or returns invalid JSON/schema.

Overview live-local diagnostics are derived from manual local loads only. Tests cover fixture mode active, live-local ready, live-local connected, daemon unreachable, endpoint unavailable, invalid response shape, last refresh failed, and last refresh succeeded summaries. Diagnostics are local-only, non-persistent, not telemetry, and not an update checker.

Overview also includes copyable local commands for preview verification and debugging. The command definitions are covered by Aethra unit tests. Copy behavior uses the browser Clipboard API when available, shows an in-app fallback message when clipboard access is unavailable or fails, and does not execute commands, persist state, add telemetry, or call remote services.

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

Local-preview API schema-lock tests cover the JSON field names and high-level response shapes consumed by Aethra, smoke checks, and `ignispromptctl` for `GET /health`, `GET /v1/models`, `GET /v1/status/models`, `GET /v1/status/version`, `GET /v1/audit/events`, `GET /v1/metrics/sustainability?period=30d`, and invalid sustainability period errors.

The endpoint is local-only and derived from in-memory audit events. Tests should not add telemetry, network calls, cloud calls, external coefficient lookup, or global opt-in pools. The output must remain framed as estimated, proxy, counterfactual, and methodology-dependent.

The `ignispromptctl sustainability` tests cover default and custom period URL generation, supported-period validation, representative summary formatting, and invalid response-shape detection. JSON output is a CLI presentation option for the same local endpoint response; it is not a report upload or external lookup.

The Aethra client tests cover `sustainabilityMetrics(period)`, period query encoding, and unsupported sustainability response shapes. Aethra data-source tests cover local error labels for the sustainability metrics endpoint. Sustainability report tests cover structured Markdown sections, deterministic schema-versioned JSON shape, methodology/confidence/disclaimer fields, export limitations, fixture and live-local report sources, excluded prompt/raw audit/machine fields, and conservative claim language. UI-level browser tests are not part of the current app test setup.

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
- one experimental tool: `route_explain`

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

`./scripts/generate-local-only-attestation.sh` writes a developer-generated evidence bundle under `./local-evidence/attestation/<timestamp>/`. It captures git SHA, build mode, built binary path and hash, `/health`, legal route explanation, audit snapshot, `data_left_device=false` evidence, and git-ignore safety for `models/**` and `local-evidence/**`. It is not a signed attestation report or compliance certification.

Current local reliability note as of May 2, 2026: the latest local Golden Legal v0.3 evidence available in this workspace records all six control-plane cases as passing with the Qwen2.5 0.5B pipe baseline. The Tier 3 success case records `legal_json.status = "ok"` and `schema_valid = true`. This does not prove legal accuracy, production readiness, enterprise attestation, or compliance certification.

## What tests assert today

- Legal requests route to Tier 3 when a legal manifest is installed.
- Legal requests fail closed when a local legal model is unavailable.
- Cloud fallback is not allowed without explicit consent.
- Adversarial document instructions are treated as untrusted content.
- Route explanations remain human-readable.
- Chat completions append audit events.
- `stream: false` and missing `stream` preserve the current JSON chat-completion shape.
- `stream: true` returns a basic SSE-compatible chat-completion scaffold ending in `data: [DONE]`.
- Safe identical chat completions can reuse a local in-memory exact-match cache entry.
- The exact-match cache stays bounded and evicts old entries when its local entry limit is exceeded.
- Adversarial, rejected, and fail-closed chat completions are not cached.
- The default Tier 3 path uses `StubLegalRunner` unless the feature-gated GGUF runner is explicitly available.
- The feature-gated GGUF tests require an explicit local runner path and reject bare executable names.
- The legal JSON normalizer accepts realistic local noisy output forms and records schema failures as structured local failures.
- The experimental MCP stub can initialize, list tools, and call `route_explain` while reusing the existing local route and audit behavior.

## What tests do not prove

- Production legal accuracy.
- Enterprise compliance certification.
- Signed attestation.
- Tamper-evident audit storage.
- Broad MCP client compatibility beyond the experimental stdio `route_explain` stub.
- Dashboard behavior.
- Tier 4 or Tier 5 routing.
