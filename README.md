# IgnisPrompt

**IgnisPrompt is local-preview infrastructure for local AI routing.**

Latest release: `v0.1.6-local-preview`.

IgnisPrompt is local-first infrastructure for routing, audit, inspection, and local evidence review. By default it makes no cloud calls, sends no telemetry, performs no global aggregation, and is not production deployment software. It is not legal advice, does not claim legal accuracy, and does not claim compliance, ESG, supply-chain, or signed attestation certification.

Recent local-preview work includes:

- reproducible security review checks
- Aethra live-local contract hardening
- `ignispromptctl` audit-events and route-explain inspection
- `ignispromptctl evidence-bundle` generation, list, validate, archive, verify archive, and manifest inspection
- GGUF timeout and runner preflight hardening
- audit and evidence validation hardening
- Golden Legal adversarial demo hardening
- Aethra Local Readiness, local readiness quality gates, readiness reports, diagnostics, and local readiness package workflow
- Aethra Local Operator Console, `ignispromptctl operator-summary`, local operator packages, and `make operator-check` for local preview operator workflow alignment
- Aethra Local Policy Workbench, `ignispromptctl policy-scenarios`, local policy packages, grouping helpers, stricter structural validation, and `make policy-check` for synthetic local policy workflow alignment

## Project foundation: v0.1.0-mvp

`v0.1.0-mvp` is a technical MVP snapshot with a conservative **PASS WITH GAPS** readiness result.

This repository started as a minimal `ignispromptd` Rust daemon scaffold for the Apple Spine Smoke Test. It is intentionally small: it validates the control-plane shape before real model inference is wired in.

It proves that the local-first control-plane scaffold works: the daemon can run locally, expose the core HTTP surfaces, explain routing decisions, treat adversarial document instructions as untrusted content, record local audit events, and exercise the default no-model smoke path in CI.

It does not prove production model quality, legal accuracy, enterprise compliance, certification, design-partner readiness, production-grade streaming, production-grade MCP support, or packaged distribution. Current gaps are intentionally documented rather than hidden.

For details, see the [demo flows](docs/DEMO.md), [testing notes](docs/TESTING.md), [packaging notes](docs/PACKAGING.md), [runner provider notes](docs/RUNNER_PROVIDERS.md), [attestation report template](docs/ATTESTATION_REPORT_TEMPLATE.md), and [current Codex handoff](docs/CODEX_HANDOFF.md).

## Current smoke-test status

`./scripts/dev-check.sh` is the recommended one-command developer path. `./scripts/start-dev.sh` plus `./scripts/smoke.sh` remains available as the lower-level manual debugging path when you want to inspect a running daemon directly.

- `/health`, `/v1/models`, `/v1/status/models`, `/v1/route/explain`, `/v1/chat/completions`, `/v1/audit/events`, and `/v1/metrics/sustainability?period=30d` respond locally
- legal requests route to Tier 3 with a human-readable explanation
- adversarial document instructions are detected and treated as untrusted content
- audit events are written locally
- audit events include optional Aethra v0.1 counterfactual estimate fields when a request is routed locally
- legal chat completions default to `StubLegalRunner`
- `stream: false` or a missing `stream` field keeps the current JSON completion shape, while `stream: true` returns a basic SSE-compatible scaffold
- an opt-in `GgufRunner` spike can invoke a local GGUF runner binary when both the runner executable and the configured `.gguf` model file are present
- an experimental stdio MCP stub can expose `route_explain` plus read-only local observability tools without changing the default HTTP daemon path
- a developer local-only evidence script can capture health, route, audit, binary-hash, and ignore-safety evidence under ignored `./local-evidence/attestation/`
- Aethra also includes a local command center with safe CLI recipes, an evidence workflow checklist, and demo readiness notes for dashboard review.

## CI status

The repository now includes a default GitHub Actions workflow at `.github/workflows/ci.yml` for the no-model daemon path and Aethra fixture-backed dashboard checks on `main`. It runs `cargo build`, `cargo test`, and `./scripts/smoke.sh` against the default local scaffold without requiring Ollama, GGUF model weights, or any cloud access. A separate Aethra job runs `npm ci`, `npm test`, and `npm run build` under `apps/aethra/`.

An experimental manual-only release workflow now also lives at `.github/workflows/release-draft.yml`. It runs only through GitHub Actions `workflow_dispatch`, builds the default `ignispromptd` Linux x86_64 release binary, and uploads it as a downloadable workflow artifact. It does not publish a GitHub Release automatically, and it does not bundle model weights or local evidence.

## Documentation

The docs set under `docs/` describes the current scaffold and clearly separates implemented behavior from planned work:

- [Codex/agent instructions](AGENTS.md) for contributors and AI coding agents working in this repo
- [Current Codex handoff](docs/CODEX_HANDOFF.md) for current-state context and post-MVP follow-up work
- [Docs index](docs/README.md)
- [Local preview quickstart](docs/LOCAL_PREVIEW_QUICKSTART.md)
- [Local preview release checklist](docs/LOCAL_PREVIEW_RELEASE_CHECKLIST.md)
- [Local Preview 0.1.0 release notes draft](docs/releases/LOCAL_PREVIEW_0_1_0.md)
- [Local Preview v0.1.1 release readiness](docs/releases/v0.1.1-local-preview.md)
- [Local Preview v0.1.2 patch release record](docs/releases/v0.1.2-local-preview.md)
- [Local Preview v0.1.3 release readiness](docs/releases/v0.1.3-local-preview.md)
- [Local Preview v0.1.4 release readiness](docs/releases/v0.1.4-local-preview.md)
- [Local Preview v0.1.5 release readiness](docs/releases/v0.1.5-local-preview.md)
- [Local Preview v0.1.6 release record](docs/releases/v0.1.6-local-preview.md)
- [Contributor MCP usage](docs/MCP_USAGE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Aethra MVP plan](docs/AETHRA.md)
- [Aethra MVP checkpoint](docs/AETHRA_MVP_CHECKPOINT.md) for the current fixture-backed local dashboard status
- [Aethra public demo package](docs/AETHRA_DEMO_PACKAGE.md)
- [Runner providers](docs/RUNNER_PROVIDERS.md)
- [Demo flows](docs/DEMO.md)
- [Testing](docs/TESTING.md)
- [Packaging](docs/PACKAGING.md)
- [Models](docs/MODELS.md)
- [Security model](docs/SECURITY_MODEL.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Developer contributing notes](docs/CONTRIBUTING_DEV.md)
- [Enterprise notes](docs/ENTERPRISE.md)
- [Attestation report template](docs/ATTESTATION_REPORT_TEMPLATE.md)
- [Compliance notes](docs/COMPLIANCE_NOTES.md)

Contributors and AI coding agents should read `AGENTS.md` before making changes. For current repo state, known gaps, and recommended next tasks, also read `docs/CODEX_HANDOFF.md`.

Contributor entry points:

- [Contributing](CONTRIBUTING.md) for the short contribution path
- [Developer contributing notes](docs/CONTRIBUTING_DEV.md) for local-first rules, artifact hygiene, and documentation expectations
- [Changelog](CHANGELOG.md) for release history
- [GitHub issue templates](.github/ISSUE_TEMPLATE/) and [pull request template](.github/pull_request_template.md) for contributor intake and safety checklist prompts

## What this scaffold includes

- `GET /health`
- `GET /v1/models`
- `GET /v1/status/models` for model and runner status hints
- `GET /v1/metrics/sustainability?period=30d` for local-only Aethra counterfactual estimate summaries
- `POST /v1/route/explain`
- `POST /v1/chat/completions` using an OpenAI-compatible request shape
- basic SSE-compatible chat-completion scaffolding when `stream: true`
- experimental stdio MCP stub with `route_explain` plus read-only local observability tools
- optional feature-gated Tier 3 legal GGUF runner spike via a local subprocess contract
- Tier 3 legal chat completion dispatch through `StubLegalRunner`
- `GET /v1/audit/events`
- JSON model manifest loading
- local audit event logging
- local-only fail-closed behavior
- adversarial contract-instruction detection as untrusted document content
- smoke fixtures for legal routing

## What this scaffold does not include yet

- built-in SaulLM/Qwen/Phi inference
- production-grade GGUF/ONNX inference
- Apple Foundation Models bridge
- semantic cache
- production-grade MCP server surface beyond the experimental stdio stub
- production-grade token-by-token streaming
- real hardware RAM/thermal telemetry
- signed Local-Only Attestation Report generation

## Quick start

Requires Rust and Cargo.

Run the default developer check:

```bash
./scripts/dev-check.sh
```

This runs `cargo build`, `cargo test`, starts the local-only daemon, waits for `/health`, runs `./scripts/smoke.sh`, and stops the daemon on exit. It uses the default no-model path and does not require Ollama, GGUF tooling, local model weights, cloud access, or cloud credentials.

If you prefer a repo-level command runner, the new `Makefile` wraps the same local flows:

```bash
make help
make build
make test
make smoke
make dev-check
make readiness-check
make operator-check
make policy-check
```

The default safe targets stay on the no-model local path. Optional local-prerequisite targets are also available for the existing GGUF and evidence scripts:

```bash
make gguf-build
make gguf-test
make gguf-smoke
make golden
make bakeoff
make demo
make attestation
make evidence-check
make clean-local-evidence
```

The `gguf-*`, `golden`, `bakeoff`, and `demo` targets still require the same local Ollama and model-file prerequisites as the underlying scripts. `make clean-local-evidence` only removes generated content under ignored `./local-evidence/` and does not delete model weights under `./models/`.

For current source install, release-build, and manual release-artifact notes, see [docs/PACKAGING.md](docs/PACKAGING.md). That guide is conservative on purpose: it documents today's source-first workflow and a future Homebrew plan, but it does not claim that Homebrew or published packages are available yet.

For low-level manual debugging, start the daemon directly:

```bash
cargo run -p ignispromptd -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only true
```

In another terminal:

```bash
./scripts/smoke.sh
```

While the daemon is running, `ignispromptctl` provides a local CLI for inspecting its state:

```bash
cargo run -p ignispromptctl -- doctor
cargo run -p ignispromptctl -- doctor --json
cargo run -p ignispromptctl -- readiness
cargo run -p ignispromptctl -- readiness --json
cargo run -p ignispromptctl -- readiness --markdown
cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo-readiness
cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo-readiness --json
cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo-readiness
cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo-readiness
cargo run -p ignispromptctl -- operator-summary
cargo run -p ignispromptctl -- operator-summary --json
cargo run -p ignispromptctl -- operator-summary --package-output local-evidence/operator/demo
cargo run -p ignispromptctl -- operator-summary --package-list local-evidence/operator/demo
cargo run -p ignispromptctl -- operator-summary --package-validate local-evidence/operator/demo
cargo run -p ignispromptctl -- policy-scenarios
cargo run -p ignispromptctl -- policy-scenarios --json
cargo run -p ignispromptctl -- policy-scenarios --report
cargo run -p ignispromptctl -- policy-scenarios --package-output local-evidence/policy/demo
cargo run -p ignispromptctl -- policy-scenarios --package-list local-evidence/policy/demo
cargo run -p ignispromptctl -- policy-scenarios --package-validate local-evidence/policy/demo
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
cargo run -p ignispromptctl -- evidence-bundle --archive local-evidence/demo-bundle --json
cargo run -p ignispromptctl -- evidence-bundle --verify-archive local-evidence/archives/demo-bundle.tar.gz
cargo run -p ignispromptctl -- evidence-bundle --print-manifest local-evidence/demo-bundle
cargo run -p ignispromptctl -- evidence-bundle --print-manifest local-evidence/demo-bundle --json
cargo run -p ignispromptctl -- route-explain --text "Review this synthetic contract clause."
cargo run -p ignispromptctl -- route-explain --input ./tests/golden-legal/smoke-legal-request.json
cargo run -p ignispromptctl -- route-explain --input ./tests/golden-legal/smoke-legal-request.json --json
cargo run -p ignispromptctl -- audit tail
```

`doctor` checks the local daemon health, version status, model manifest, and model and runner status hint endpoints, then reports local next steps for common failures. Its sustainability metrics check is informational. The command is local-only and does not perform telemetry, cloud calls, GitHub calls, update checks, external lookup, persistence, uploads, model controls, or runner controls.

`readiness` reuses the same local endpoint checks as `doctor` and presents them as local preview readiness only. It keeps status hints framed as hints, not controls; local helper checks as checks, not certification; and Aethra live-local loading as manual. `--json` prints safe diagnostic fields for category, severity, result, local next step, and boundary note without daemon URLs or local machine details. `--markdown` prints a copy-safe local helper report for issue or demo notes without generated evidence contents or local machine details. `--package-output local-evidence/readiness/<name>` writes a local readiness package with README, manifest, JSON summaries, and Markdown report output under an ignored readiness path. `--package-list` and `--package-validate` inspect that package locally without calling the daemon. It does not add telemetry, cloud calls, persistence, uploads, model controls, or runner controls.

`operator-summary` prints local preview operator workflow guidance without calling the daemon. The human and JSON outputs align readiness, readiness packages, evidence workflow checks, Aethra fixture-backed review, and copy-only command recipes. `--package-output local-evidence/operator/<name>` writes a local operator package with README, manifest, JSON summaries, and Markdown report output under an ignored operator path. `--package-list` and `--package-validate` inspect that package locally without daemon access. It treats status values as hints, package validation as structural/local only, and local helper checks as checks rather than certification.

`policy-scenarios` prints synthetic local policy scenario guidance without calling the daemon. Human, JSON, and `--report` output summarize local-preview route hints for representative synthetic scenarios, grouping counts, local-only expectations, and fail-closed expectations. `--package-output local-evidence/policy/<name>` writes a local policy package with README, manifest, JSON summaries, and Markdown report output under an ignored policy path. `--package-list` and `--package-validate` inspect that package locally without daemon access and check required files, JSON shape, schema fields, boundary terms, placeholder values, and unsafe content. Policy packages are local-only, not signed, and validated structurally/local only.

`sustainability` reads aggregate local metrics from `GET /v1/metrics/sustainability?period=<period>`, defaults to `30d`, supports `7d`, `30d`, and `90d`, and can print the daemon JSON with `--json`. It does not include prompts, raw audit text, PII, or machine identifiers.

`audit-events` reads the existing local `GET /v1/audit/events` endpoint and can print either a terminal summary or formatted JSON. It is read-only and does not mutate, upload, persist, or redact audit events through external services.

`evidence-bundle` writes a small local-only bundle under an ignored `local-evidence/` path from the existing local health, version status, model, model and runner status hint, and sustainability endpoints. `--include-audit-events` adds the raw local audit event response only when explicitly requested. `--json` prints the bundle summary JSON. `--list` inspects an existing bundle without calling the daemon, `--validate` checks an existing bundle without calling the daemon, `--archive` validates and archives an existing bundle to `local-evidence/archives/<bundle-name>.tar.gz` by default, `--archive-output` can override the archive path when it stays under `local-evidence/`, `--verify-archive` inspects an existing archive without calling the daemon, and `--print-manifest` prints the manifest for an existing bundle without calling the daemon. The command is diagnostic/demo output only: it is not signed, not certified, not production evidence, and does not call cloud services or external endpoints.

For a repeatable local evidence demo workflow that drives `route-explain`, `audit-events`, bundle generation, listing, validation, archiving, archive verification, manifest inspection, readiness package generation, operator package generation, and policy package generation, run:

```bash
./scripts/demo-local-evidence-workflow.sh
```

Use `--dry-run` to print the planned local workflow without starting the daemon, or `--self-test` to verify ignored-path checks and command construction without a live daemon.

`make evidence-check` runs the workflow regression checks, including the demo script dry-run and self-test plus a local CLI help and boundary-language alignment check.

`make readiness-check` runs deterministic local readiness quality gates for CLI help surfaces, readiness JSON, Markdown report, and readiness package safety, the demo workflow dry-run/self-test path, evidence-check integration, and Aethra readiness wording alignment. It does not require model weights, GGUF tooling, external runners, cloud credentials, or a live daemon.

`make operator-check` validates the local operator summary, operator package generation/list/validate behavior, Aethra Local Operator Console copy, safe command recipes, readiness package help shape, and demo workflow self-test. It is deterministic and does not require model weights, external runners, cloud credentials, external services, or a live daemon.

`make policy-check` validates the local policy scenario CLI surface, JSON and Markdown report output, grouping metadata, policy package generation/list/validate behavior, Aethra Local Policy Workbench copy, and demo workflow command construction. It is deterministic and does not require model weights, external runners, cloud credentials, external services, or a live daemon.

The Aethra Local Readiness page, Local Operator Console, Local Policy Workbench, and Local Command Center mirror these safe CLI recipes, the evidence workflow checklist, copy-safe readiness and policy report snippets, local diagnostic drilldown hints, readiness package preview, operator package preview, policy package preview, and the demo readiness notes in the dashboard. They stay read-only and local-preview only.

`route-explain` calls the existing local `POST /v1/route/explain` endpoint with either `--text` or `--input`. Use synthetic or non-sensitive text. This is route inspection, not legal advice or legal accuracy validation. For a legal route example, use a file that already carries legal context such as `./tests/golden-legal/smoke-legal-request.json`, which sets `model` to `ignisprompt/legal`.

For the real local GGUF path, start Ollama locally and then run:

```bash
./scripts/smoke-gguf-local.sh
```

## Experimental MCP Stub

The repo now includes an experimental stdio MCP stub inside `ignispromptd`. It does not change default daemon startup, default CI, or the fallback to `StubLegalRunner`.

For contributor-focused examples and response-shape notes, see [Contributor MCP usage](docs/MCP_USAGE.md).

Current scope:

- transport: newline-delimited stdio JSON-RPC 2.0
- handshake methods: `initialize`, `notifications/initialized`, and `ping`
- tool methods: `tools/list` and `tools/call`
- tools exposed: `route_explain`, `audit_events`, `status_version`, and `sustainability_summary`
- behavior reused: existing local route classification, human-readable explanation text, adversarial warning handling, local audit appends for `route_explain`, and read-only local audit/version/sustainability observability data for the observability tools

The observability tools are read-only and local-only. They do not control models or runners, change configuration, execute commands, add telemetry, make cloud calls, perform update or GitHub lookups, add external coefficient lookup, upload data, persist new data, or add prompt/resource/sampling support. Sustainability values remain estimated, counterfactual, proxy, methodology-dependent, and not certified reporting.

Manual example:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0.1.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"route_explain","arguments":{"model":"ignisprompt/legal","messages":[{"role":"user","content":"Review this indemnification clause in a vendor services agreement and return the key risks."}],"metadata":{"domain":"legal"}}}}' \
  | cargo run -p ignispromptd -- --experimental-mcp-stdio
```

Limitations:

- experimental and manual-only
- no MCP HTTP transport
- no prompts, resources, sampling, or completions
- no cloud calls
- no model controls, runner controls, command execution, telemetry, update checks, or external lookups
- intended for local tool-surface validation, not broad MCP client compatibility claims

## GGUF Runner Spike

The default daemon build does not require GGUF tooling or model weights. `StubLegalRunner` remains the active Tier 3 path unless you explicitly compile the spike:

```bash
cargo run -p ignispromptd --features gguf-runner-spike -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only true
```

The Tier 3 legal path supports an opt-in GGUF subprocess spike behind the `gguf-runner-spike` Cargo feature. If `IGNISPROMPT_GGUF_RUNNER_BIN` points to a local executable and the selected legal manifest's `localPath` exists, `ignispromptd` will invoke that executable before falling back to `StubLegalRunner`.

The runner contract is intentionally minimal:

- `ignispromptd` invokes the binary with `--model <localPath> --prompt-file <temp file> --max-tokens <n>`
- the binary should write the assistant completion text to stdout and exit `0`
- stderr and non-zero exit status are treated as runner failure and the daemon falls back to `StubLegalRunner`

Environment variables:

- `IGNISPROMPT_GGUF_RUNNER_BIN`: path to the local GGUF runner executable
- `IGNISPROMPT_PROMPT_DIR`: directory containing prompt-pack markdown files, defaults to `./config/prompts`
- `IGNISPROMPT_GGUF_MAX_TOKENS`: max tokens requested from the runner, defaults to `256`

This is a spike, not a production inference stack. Prompt shaping is naive, the `stream: true` path is only an SSE compatibility scaffold rather than a full incremental streaming engine, and no built-in llama.cpp or ONNX bridge ships in the daemon yet.

For legal Tier 3 requests, the GGUF path prepends a prompt pack before serializing the request messages into the subprocess contract. By default it uses `config/prompts/legal-contract-review-v0.1.md`, but a manifest can override this with `promptPack`, for example `legal-contract-review-compact-v0.1.md` for smaller local models.

For local Tier 3 legal completions, the daemon also runs a lightweight JSON shim over the runner stdout. It extracts schema-valid JSON from raw output, fenced ```json blocks, explanatory preambles, or common local response/content wrappers. It validates the required top-level fields, nested `risks` objects, enum values, and disallows additional schema fields. If validation fails, the daemon returns a structured local parse-error wrapper instead of hiding the failure. Raw runner text and parse status are exposed under `local_output.legal_json` in the chat completion response and mirrored into local chat-completion audit events.

When a local runner supports constrained output, a manifest can also opt into `responseFormat`. The current Ollama-backed wrapper supports:

- `responseFormat: "none"`: no structured output hint
- `responseFormat: "json"`: JSON-mode output hint
- `responseFormat: "schema"`: JSON schema constraint for the contract-review shape

If that prompt-pack file is missing or unreadable, the daemon emits a warning with the configured prompt-pack path, treats the GGUF spike as unavailable, and falls back to `StubLegalRunner`. This keeps the default smoke path working without local prompt assets or model weights.

### Local model placement

The placeholder legal manifest already shows the intended reference shape:

- manifest: `config/models/legal-qwen2_5-0_5b-instruct-q4.json`
- current `localPath`: `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
- current `promptPack`: `legal-contract-review-compact-v0.1.md`
- current `responseFormat`: `schema`

Place a local GGUF file at that path, or update `localPath` in the manifest to wherever you keep the file on disk. Model weights must stay local and are intentionally not committed; the repo ignores `./models/**`.

### Integration options evaluated

The current spike stays subprocess-based on purpose. Two realistic next-step integrations are:

- `llama.cpp` CLI or `llama-server` as a local process boundary. The official project documents both `llama-cli -m model.gguf` and `llama-server -m model.gguf` for GGUF inference and an OpenAI-compatible local server surface.
- `llama-cpp-2` for direct Rust bindings to `llama.cpp`. Its docs describe the crate as safe wrappers around near-direct bindings and note that API stability is intentionally secondary to tracking upstream `llama.cpp`.

The subprocess contract is the lower-risk spike because it keeps `ignispromptd` free of native binding churn while the `ModelRunner` interface settles.

## Golden Legal v0.3 Subset

The repo now includes a small Golden Legal Routing Test Set v0.3 runner for the live GGUF path:

```bash
./scripts/run-golden-legal-v0.3.sh
```

It executes six cases:

- legal Tier 3 success
- local model unavailable under simulated RAM pressure
- no cloud fallback without consent when no legal model is installed
- adversarial contract instruction handling
- human-readable explanation quality
- subtle legal-language routing instruction handling

The script expects:

- a local Ollama server at `OLLAMA_HOST`, typically `http://127.0.0.1:11434`
- `OLLAMA_NO_CLOUD=true`
- the local GGUF file at the manifest `localPath`

Evidence is written under `./local-evidence/golden-legal-v0.3/` and stays out of git.

Current local reliability note as of May 2, 2026: the latest local Golden Legal v0.3 evidence available in this workspace records all six control-plane cases as passing with the Qwen2.5 0.5B pipe baseline. The Tier 3 success case records `legal_json.status = "ok"` and `schema_valid = true`. This is a local schema and routing reliability signal only; it is not legal advice, a legal-accuracy result, production readiness, or compliance certification.

## Alpha Legal Bakeoff v0.1

The repo also includes an alpha bakeoff driver that runs the Golden Legal v0.3 subset against a small set of candidate local legal models and records a local comparison summary:

```bash
./scripts/run-alpha-legal-bakeoff-v0.1.sh
```

The bakeoff currently knows about these local candidate paths:

- baseline: `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`
- larger general candidate: `./models/qwen2.5-7b-instruct-q4_k_m.gguf`
- legal-domain candidate: `./models/saul-instruct-v1.q4_k_m.gguf`
- smaller fallback candidate: `./models/Phi-3.5-mini-instruct.q5_k_m.gguf`

If a candidate file is missing, the bakeoff records that candidate as skipped with a local note instead of failing the whole run. The summary is written under `./local-evidence/alpha-legal-bakeoff-v0.1/` and includes per-candidate latency, route correctness, explanation quality, JSON/schema reliability, adversarial handling, and evidence locations.

Current quality caveat: `qwen2.5-0.5b-instruct-q4_k_m` is the fastest pipe-validation baseline on this host, not a settled legal-quality winner. The prompt packs, constrained runner output, and local JSON extraction/validation shim make the Tier 3 path more reliably parseable and stricter about schema failures, but legal usefulness still depends on model quality and remains an open bakeoff question.

## Example request

```bash
curl -s -X POST http://127.0.0.1:8765/v1/route/explain \
  -H 'content-type: application/json' \
  --data-binary @tests/golden-legal/smoke-legal-request.json | jq .
```

## Public demo: local legal review

For a public-facing local demo, run the convenience legal-review flow. It uses a fully synthetic contract-review fixture and shows the local Tier 3 routing path, structured JSON parsing, schema validation, route explanation, and local audit evidence without sending request data to a cloud service. See [Demo flows](docs/DEMO.md) for the default smoke demo and optional GGUF setup details.

Read the warning at the top of [Demo flows](docs/DEMO.md) before presenting: demo inputs must stay synthetic, and audit/sustainability outputs are local-preview signals only.

```bash
./scripts/demo-local-legal-review.sh
```

A healthy demo run should show these signals:

- route tier = `TIER_3`
- route_code = `DOMAIN_MODEL_SELECTED`
- data_left_device = `false`
- legal_json.status = `ok`
- schema_valid = `true`
- audit evidence saved under `./local-evidence/`

The demo script expects:

- a local Ollama server at `OLLAMA_HOST`, typically `http://127.0.0.1:11434`
- `OLLAMA_NO_CLOUD=true`
- the local GGUF file at `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`

It starts `ignispromptd` with `--features gguf-runner-spike`, sends `tests/golden-legal/demo-synthetic-contract-request.json`, prints the route decision, explanation, `legal_json.status`, `schema_valid`, parsed legal JSON, and saved audit-event path, then writes the evidence bundle under `./local-evidence/demo-local-legal-review/`.

Demo caveats:

- this is not legal advice
- this is not production compliance evidence or certification
- Qwen2.5 0.5B is the pipe/demo baseline, not a settled legal model winner
- never use real customer contracts, confidential legal text, personal data, or production matter materials in a demo

For the default no-model scaffold path, the recommended check is still:

```bash
./scripts/dev-check.sh
```

If you need the lower-level manual debugging path instead, run:

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
./scripts/smoke.sh
```

## Smoke-test goal

The first milestone is still proving the control-plane spine: a legal request enters IgnisPrompt, routes locally to Tier 3, explains why, writes an audit event, and rejects unsafe cloud/adversarial behavior. The GGUF runner path is an early local execution spike layered on top of that control plane, not a finished inference backend.

## License

Apache-2.0.
