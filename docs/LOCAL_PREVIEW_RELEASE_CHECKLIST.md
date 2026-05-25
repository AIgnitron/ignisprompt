# Local Preview Release Checklist

This checklist prepares a small local preview release of the current IgnisPrompt + Aethra product. It is a release-discipline checklist, not a production readiness claim.

## Prerequisites

Install:

- Rust and Cargo
- Node.js and npm
- `jq`
- `curl`
- `rg` / ripgrep, required by `./scripts/check-sustainability-language.sh`
- GitHub CLI `gh`, only if opening or checking PRs from the command line

The default path does not require Ollama, GGUF tooling, model weights, cloud credentials, telemetry, or external network services beyond normal repository/dependency setup.

## Clean Checkout

Start from a clean `main`:

```bash
git checkout main
git pull --ff-only origin main
git status --short
git log --oneline -5
```

If GitHub CLI is installed and you want to check open PRs from the command line, run:

```bash
gh pr list --state open --limit 20
```

If `git status --short` shows unrelated local changes, pause before release work. Do not include model weights, local evidence, generated transcripts, demo bundles, attestation bundles, audit logs, `target/`, `dist/`, `.DS_Store`, or secrets.

## Build

```bash
cargo build
```

## Tests

```bash
./scripts/check-sustainability-language.sh
cargo test
./scripts/check-hidden-unicode.sh
make security-check
make readiness-check
make operator-check
make evidence-check
make dev-check
git diff --check
```

## v0.1.5 Readiness Notes

For v0.1.5 release-readiness work, keep the local readiness quality gate aligned with Aethra Local Readiness and the CLI:

- `docs/releases/v0.1.5-local-preview.md` exists and stays conservative
- `make readiness-check` passes
- `cargo run -p ignispromptctl -- readiness` stays local preview readiness only
- `cargo run -p ignispromptctl -- readiness --json` keeps status hints and local helper checks conservative
- `cargo run -p ignispromptctl -- readiness --markdown` prints a copy-safe local helper report for issue or demo notes
- `cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo-readiness` writes only under ignored `local-evidence/readiness/`
- `cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo-readiness` and `cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo-readiness` inspect package output locally
- Aethra Local Readiness remains fixture-backed by default
- live-local loading remains manual
- Aethra readiness report snippets remain browser-local and copy-only
- Aethra readiness package preview remains read-only and fixture-backed by default
- status hints remain hints, not controls
- local helper checks remain checks, not certification
- readiness packages remain local-only helper outputs and are not signed
- readiness package verification remains structural local validation only
- no telemetry, cloud calls by default, global aggregation, model controls, runner controls, command execution, upload, polling, or persistence are added

## v0.1.6 Operator Console Planning Notes

For v0.1.6 planning, keep the local operator workflow aligned across Aethra, CLI, scripts, and docs:

- `make operator-check` passes
- `cargo run -p ignispromptctl -- operator-summary` stays local preview operator workflow only
- `cargo run -p ignispromptctl -- operator-summary --json` keeps copy-only command recipes and boundary notes conservative
- `cargo run -p ignispromptctl -- operator-summary --package-output local-evidence/operator/demo` writes only under ignored `local-evidence/operator/`
- `cargo run -p ignispromptctl -- operator-summary --package-list local-evidence/operator/demo` and `cargo run -p ignispromptctl -- operator-summary --package-validate local-evidence/operator/demo` inspect package output locally
- Aethra Local Operator Console remains fixture-backed by default and read-only
- Aethra operator package preview remains read-only and fixture-backed by default
- command recipes remain copy-only and are not executed from Aethra
- readiness and operator package validation remain structural/local only
- archives and packages remain local-only helper outputs and are not signed
- local helper checks remain checks, not certification
- status values remain hints, not controls
- no telemetry, cloud calls by default, global aggregation, model controls, runner controls, command execution, upload, polling, file picker, or persistence are added
- no production deployment, legal advice, legal accuracy, or compliance, supply-chain, signed-attestation, tamper-evident, cryptographic, production-grade inference, or production-grade security claims are added; wording must say not ESG certification where sustainability boundaries are mentioned
- LiteLLM remains planning only

## v0.1.4 Release Prep

Before tagging `v0.1.4-local-preview`, confirm the docs and checklist reflect the implemented local evidence and Aethra workflow arc:

- `docs/releases/v0.1.4-local-preview.md` exists and stays conservative
- `docs/README.md`, `README.md`, `docs/CODEX_HANDOFF.md`, `docs/ROADMAP.md`, and this checklist mention the v0.1.4 draft release note
- Aethra remains fixture-backed by default with manual live-local loading
- evidence archives are local-only and not signed
- verification is structural local validation only, not cryptographic verification
- the Aethra Local Command Center copy stays read-only and clipboard-only
- `make evidence-check` passes
- `make readiness-check` passes
- `./scripts/check-hidden-unicode.sh` passes
- `make security-check` passes
- `make dev-check` passes
- `git diff --check` passes
- `git status --short` is clean

## Default Developer Check

```bash
./scripts/dev-check.sh
```

This runs the default local-only daemon path, the Rust build/test path, sustainability language guardrails, and the daemon smoke script.

The daemon smoke includes `GET /v1/status/version` for local preview support/debugging metadata. This endpoint is local-only and is not an update checker, telemetry mechanism, release lookup, or cloud call.

`./scripts/dev-check.sh` runs `./scripts/check-sustainability-language.sh` after `cargo test`. The guardrail scans README, docs, Aethra source, daemon source, and scripts for a narrow set of unsupported sustainability claim phrases while excluding generated or ignored output paths.

## Full Release Check

```bash
./scripts/release-check.sh
```

This combines the repository sustainability language guardrail, Rust tests, default developer check, Aethra tests, Aethra production build, and `git diff --check`. It runs `./scripts/check-sustainability-language.sh` directly and also includes the same guardrail again through `./scripts/dev-check.sh`.

The guardrail is intended to catch unsupported or overconfident sustainability wording such as carbon-saved claims, measured-emissions certainty, zero-emissions certainty, certification language, ESG claims, and production or compliance claims that conflict with the estimated/proxy/counterfactual/methodology-dependent boundaries. It is a repository language check, not a substitute for reviewer judgment.

For v0.1.5 release prep, also confirm `make readiness-check` and `make evidence-check` pass and that the local evidence and readiness package workflows still keep outputs under ignored `local-evidence/` paths.

## Aethra Checks

```bash
cd apps/aethra
npm test
npm run build
cd ../..
```

The build writes ignored output under `apps/aethra/dist/`. Do not commit it.

## Smoke Script

For manual smoke inspection, start the daemon:

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
./scripts/smoke.sh
```

Stop the daemon with `Ctrl-C` in the terminal that started it.

## Version Status Endpoint Verification

With the daemon running:

```bash
curl -fsS "http://127.0.0.1:8765/v1/status/version" | jq .
```

Confirm the response includes:

- `service: "ignispromptd"`
- `version`
- `release_channel: "local-preview"`
- `local_only: true`
- `build_profile` as `debug` or `release`
- `git_commit` as `null` unless build metadata is added later without external lookup
- `started_at`
- `warnings` with local preview and non-production language

Do not treat this endpoint as telemetry, an update check, a GitHub lookup, or a production readiness signal.

## Manual Dashboard Verification

1. Start the daemon with `./scripts/start-dev.sh`.
2. Start Aethra:

```bash
cd apps/aethra
npm run dev
```

3. Open `http://127.0.0.1:5173/`.
4. Confirm the local preview banner states fixture mode is default, live-local loading is manual, there is no telemetry, there are no cloud calls by default, and this is not a production deployment.
5. Confirm fixture mode is the default.
6. Switch to live-local mode.
7. Confirm live local loads are manual, grouped as manual live-local refresh actions, and target the configured loopback daemon.
8. Load health, daemon version status, models, model and runner status hints, audit events, and sustainability metrics.
9. Confirm daemon version status appears on the Overview screen as local preview support/debugging metadata.
10. Confirm Overview live-local diagnostics clearly distinguish fixture mode active, live-local ready, live-local connected, daemon unreachable, endpoint unavailable, invalid response shape, last refresh failed, and last refresh succeeded states as applicable.
11. Confirm diagnostics include local next steps such as starting `./scripts/start-dev.sh`, checking `/health`, and using fixture mode while debugging.
12. Confirm the Overview Local Commands panel shows copyable local commands for daemon startup, smoke/release checks, local API inspection, and Aethra startup.
13. Confirm command copying only writes text to the browser clipboard and does not execute commands from the dashboard.
14. Confirm empty states explain fixture mode, missing live-local data, unavailable daemon responses, and panels that need manual refresh.
15. Open Aethra Local Readiness and confirm readiness cards, diagnostics, report snippets, and readiness package preview are fixture-backed by default and read-only.
16. Confirm Local Readiness command snippets include `ignispromptctl readiness`, `readiness --json`, `readiness --markdown`, readiness package generation/list/validate commands, `make readiness-check`, and `make evidence-check`.
17. Confirm no polling, no telemetry, no cloud call, no upload, no update check, no GitHub API call, no remote execution, and no persistence is introduced.

## Sustainability Endpoint Verification

With the daemon running:

```bash
cargo run -p ignispromptctl -- doctor
cargo run -p ignispromptctl -- doctor --json
cargo run -p ignispromptctl -- readiness
cargo run -p ignispromptctl -- readiness --json
cargo run -p ignispromptctl -- readiness --markdown
rm -rf local-evidence/readiness/release-check-demo
cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/release-check-demo --json
cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/release-check-demo --json
cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/release-check-demo --json
curl -fsS "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d" | jq .
cargo run -p ignispromptctl -- sustainability --period 30d
cargo run -p ignispromptctl -- sustainability --period 30d --json
```

`ignispromptctl doctor` and `ignispromptctl readiness` should pass required checks for `/health`, `/v1/status/version`, `/v1/models`, and `/v1/status/models`. Their `/v1/metrics/sustainability?period=30d` check is informational. The commands must remain local-only diagnostics with no telemetry, cloud calls, GitHub calls, update checks, external lookup, persistence, uploads, model controls, or runner controls.

Confirm the response includes:

- `period`
- `requests_total`
- `local_request_rate`
- `tier_breakdown`
- `estimated_cloud_cost_avoided_usd`
- `estimated_carbon_avoided_kgco2e`
- `estimated_data_kept_local_gb`
- `baseline_provider`
- `baseline_model`
- `methodology_version`
- `confidence`
- `disclaimer`

Rust schema-lock tests also protect the local-preview JSON field names and high-level shapes for health, models, model/runner status, version status, audit events, sustainability metrics, invalid sustainability period errors, OpenAI-compatible chat completion responses, and the experimental MCP initialize/tools/list/tool-call response shapes because these surfaces are consumed by local-preview users, Aethra, smoke checks, `ignispromptctl`, and future local gateway planning.

The experimental MCP stdio tools should advertise `route_explain`, `audit_events`, `status_version`, and `sustainability_summary`. The three observability tools must remain read-only and local-only. They expose existing local audit, version status, and aggregate sustainability metadata only; they must not add telemetry, cloud calls, GitHub calls, update checks, external lookups, command execution, prompt/resource/sampling support, remote transports, model controls, runner controls, config changes, persistence, uploads, or global aggregation. Sustainability output remains estimated, counterfactual, proxy, methodology-dependent, and not certified sustainability reporting.

Invalid period check:

```bash
curl -sS -o /tmp/ignisprompt-invalid-period.json -w "%{http_code}\n" \
  "http://127.0.0.1:8765/v1/metrics/sustainability?period=bad"
jq . /tmp/ignisprompt-invalid-period.json
```

Expected result: HTTP `400` with `INVALID_SUSTAINABILITY_PERIOD`.

CLI invalid period check:

```bash
cargo run -p ignispromptctl -- sustainability --period bad
```

Expected result: non-zero exit before a request is sent, with supported values `7d`, `30d`, and `90d` listed. The CLI summary is local-only aggregate metadata and must not include prompts, raw audit text, PII, machine identifiers, telemetry, cloud calls, GitHub lookups, external coefficient lookup, persistence, uploads, or global aggregation.

## Readiness Report And Package Verification

Run:

```bash
make readiness-check
```

Confirm:

- `scripts/readiness-check.sh` validates readiness help, human output, JSON output, Markdown output, and package output/list/validate behavior
- generated readiness package output stays under ignored `local-evidence/readiness/`
- readiness reports and packages do not include prompts, raw user text, raw audit text, secrets, API keys, hostnames, usernames, machine identifiers, absolute filesystem paths, generated evidence contents, or local machine-specific values
- readiness reports and packages stay local preview only
- readiness packages are local-only and not signed
- readiness verification remains structural local validation only
- readiness wording does not claim production deployment, legal advice, legal accuracy, compliance certification, supply-chain certification, signed attestation, tamper-evident audit storage, cryptographic verification, production-grade inference, or production-grade security; wording must say not ESG certification where sustainability boundaries are mentioned

## Operator Package Verification

Run:

```bash
make operator-check
```

Confirm:

- `scripts/operator-check.sh` validates operator-summary help, human output, JSON output, and operator package output/list/validate behavior
- generated operator package output stays under ignored `local-evidence/operator/`
- operator reports and packages do not include prompts, raw user text, raw audit text, secrets, API keys, hostnames, usernames, machine identifiers, absolute filesystem paths, generated evidence contents, model file contents, or local machine-specific values
- operator reports and packages stay local preview only
- operator packages are local-only and not signed
- operator package validation remains structural local validation only
- operator wording does not claim production deployment, legal advice, legal accuracy, compliance certification, supply-chain certification, signed attestation, tamper-evident audit storage, cryptographic verification, production-grade inference, or production-grade security; wording must say not ESG certification where sustainability boundaries are mentioned

## Report Export Verification

In Aethra Sustainability Preview:

1. Export Markdown in fixture mode.
2. Export JSON in fixture mode.
3. Switch to live-local mode and manually load sustainability metrics.
4. Export Markdown again.
5. Export JSON again.

Confirm exported reports:

- are generated client-side
- are not stored in local storage or session storage
- are not uploaded
- include structured Markdown sections for report metadata, summary, key estimates, tier breakdown, baseline assumptions, methodology/confidence, safety/disclaimer, limitations, and local-only notes
- include JSON `report_schema_version: "aethra-sustainability-report-0.1"`
- include JSON `methodology`, `confidence`, `disclaimer`, `limitations`, and `local_only: true`
- include no request content, prompts, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys
- remain non-certified counterfactual proxy reports, not actual carbon accounting, not ESG certification, and not production compliance evidence

## Ignored Artifact Check

Run:

```bash
git diff --check
git status --short
git status --short --ignored apps/aethra/dist models local-evidence data/audit
```

Ignored output may include local model files, local evidence, `data/audit/events.jsonl`, and Aethra `dist/`. These must stay ignored and uncommitted.

Before tagging, also verify no generated artifacts are staged and no model weights, local evidence, audit logs, generated transcripts, demo bundles, attestation bundles, `target/`, `dist/`, `.DS_Store`, or secrets are committed.

## Safety Boundary Wording Check

Confirm release notes, checklist updates, README links, and quickstart notes keep these boundaries clear:

- local preview only
- not production deployment
- not legal advice
- not production compliance evidence
- not ESG certification
- not certified sustainability reporting
- sustainability values are estimated, counterfactual, proxy, and methodology-dependent
- no telemetry
- no cloud calls by default
- no global aggregation
- model and runner status values are hints, not controls
- MCP observability tools are read-only
- LiteLLM-style local gateway remains a future plan, not implemented

## Known Limitations

- local preview only
- not production deployment
- not legal advice
- not legal accuracy certification
- not production compliance evidence
- sustainability values are estimated counterfactual proxy estimates
- not ESG certification
- not certified sustainability reporting
- no model weights committed
- fixture mode is Aethra's default
- live-local mode is explicit/manual
- no telemetry/cloud calls by default
- no global aggregation
- local HTTP API has no daemon-level authentication, authorization, or TLS
- audit events are local process records and JSONL appends, not signed, immutable, encrypted, or certified evidence
- `StubLegalRunner` remains the default Tier 3 legal fallback
- model and runner status values are status hints, not controls
- MCP observability tools are read-only
- LiteLLM-style local gateway remains a future plan, not implemented

## Release Tag Steps

Use these only after a release branch is merged and the final commit is verified. Existing local-preview tags must not be moved, deleted, recreated, or republished. Use a future patch tag only after final verification and explicit release approval.

```bash
git checkout main
git pull --ff-only origin main
./scripts/release-check.sh
make readiness-check
make operator-check
make evidence-check
git status --short
git status --short --ignored apps/aethra/dist models local-evidence data/audit
git tag -a <next-local-preview-tag> -m "<next local preview>"
git push origin <next-local-preview-tag>
```

Do not tag if verification fails or if untracked release artifacts are present.

## Post-v0.1.1 Patch Context

- `v0.1.1-local-preview` remains tagged on #140.
- Do not move or recreate the `v0.1.1-local-preview` tag.
- #141 is post-v0.1.1 material and fixed MCP `audit_events` compatibility by changing MCP tool-call `structuredContent` to object-shaped `{ "events": [...] }`.
- The HTTP `GET /v1/audit/events` response remains the existing JSON array shape.
- #142 is post-v0.1.1 docs-only guardrail cleanup and reinforced sustainability guardrail wiring, demo warnings, tag immutability, `git pull --ff-only origin main`, and artifact hygiene.
- `v0.1.5-local-preview` is published and remains the latest release until a future local-preview release is explicitly tagged and published.

## Rollback Notes

This local preview does not publish model weights or a hosted service. Rollback is primarily a Git operation:

- If a branch is not merged, close or update the PR.
- If a tag is incorrect, create a corrected tag only after communicating the change.
- If docs are misleading, patch the docs and rerun `./scripts/release-check.sh`.
- If a local generated artifact appears in status, remove it only when it is under an ignored generated path and rerun the ignored artifact check.
