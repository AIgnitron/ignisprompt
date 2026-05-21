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
git pull origin main
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
cargo test
```

## Default Developer Check

```bash
./scripts/dev-check.sh
```

This runs the default local-only daemon path, the Rust build/test path, sustainability language guardrails, and the daemon smoke script.

The daemon smoke includes `GET /v1/status/version` for local preview support/debugging metadata. This endpoint is local-only and is not an update checker, telemetry mechanism, release lookup, or cloud call.

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
15. Confirm no polling, no telemetry, no cloud call, no upload, no update check, no GitHub API call, no remote execution, and no persistence is introduced.

## Sustainability Endpoint Verification

With the daemon running:

```bash
cargo run -p ignispromptctl -- doctor
cargo run -p ignispromptctl -- doctor --json
curl -fsS "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d" | jq .
cargo run -p ignispromptctl -- sustainability --period 30d
cargo run -p ignispromptctl -- sustainability --period 30d --json
```

`ignispromptctl doctor` should pass required checks for `/health`, `/v1/status/version`, `/v1/models`, and `/v1/status/models`. Its `/v1/metrics/sustainability?period=30d` check is informational. The command must remain a local-only diagnostic with no telemetry, cloud calls, GitHub calls, update checks, external lookup, persistence, uploads, model controls, or runner controls.

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

Rust schema-lock tests also protect the local-preview JSON field names and high-level shapes for health, models, model/runner status, version status, audit events, sustainability metrics, invalid sustainability period errors, and OpenAI-compatible chat completion responses because these surfaces are consumed by local-preview users, Aethra, smoke checks, `ignispromptctl`, and future local gateway planning.

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
- local HTTP API has no daemon-level authentication, authorization, or TLS
- audit events are local process records and JSONL appends, not signed, immutable, encrypted, or certified evidence
- `StubLegalRunner` remains the default Tier 3 legal fallback

## Release Tag Steps

Use these only after the release branch is merged and the final commit is verified:

```bash
git checkout main
git pull --ff-only origin main
./scripts/release-check.sh
git status --short
git tag -a local-preview-v0.1.0 -m "Local preview v0.1.0"
git push origin local-preview-v0.1.0
```

Do not tag if verification fails or if untracked release artifacts are present.

## Rollback Notes

This local preview does not publish model weights or a hosted service. Rollback is primarily a Git operation:

- If a branch is not merged, close or update the PR.
- If a tag is incorrect, create a corrected tag only after communicating the change.
- If docs are misleading, patch the docs and rerun `./scripts/release-check.sh`.
- If a local generated artifact appears in status, remove it only when it is under an ignored generated path and rerun the ignored artifact check.
