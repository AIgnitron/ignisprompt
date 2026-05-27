# How to Try IgnisPrompt v0.1.8 Local Preview

IgnisPrompt v0.1.8-local-preview is a local-preview release focused on the Local Demo Studio, local demo package workflows, and stronger validation around generated local artifacts.

Release:
https://github.com/AIgnitron/ignisprompt/releases/tag/v0.1.8-local-preview

Repository:
https://github.com/AIgnitron/ignisprompt

## What you can test

You can test:

- the Rust local routing daemon
- the ignispromptctl CLI
- local readiness checks
- local operator summary checks
- local policy scenario checks
- local demo summary checks
- local evidence workflow checks
- Aethra local dashboard build/tests
- Local Demo Studio package/report validation

## What this is not

This is not:

- production software
- legal advice
- legal accuracy validation
- certification
- signed attestation
- tamper-evident audit storage
- cryptographic verification
- cloud AI integration
- telemetry or global aggregation

Aethra is fixture-backed by default and read-only.

## 1. Clone the repo

```bash
git clone https://github.com/AIgnitron/ignisprompt.git
cd ignisprompt
```

## 2. Checkout the release tag

```bash
git fetch --tags origin
git checkout v0.1.8-local-preview
```

## 3. Run the local preview checks

```bash
./scripts/check-hidden-unicode.sh
make security-check
make demo-check
make policy-check
make operator-check
make readiness-check
make evidence-check
make preview-release-check
```

## 4. Run the full dev check

```bash
make dev-check
```

This builds and tests the Rust workspace, runs local guardrails, starts the local daemon, runs the smoke script, and stops the daemon.

## 5. Try the Local Demo Studio CLI

```bash
cargo run -p ignispromptctl -- demo-summary
cargo run -p ignispromptctl -- demo-summary --json
cargo run -p ignispromptctl -- demo-summary --report
```

## 6. Generate a local demo package

Generated packages should stay under ignored `local-evidence/` paths.

```bash
cargo run -p ignispromptctl -- demo-summary \
  --package-output local-evidence/demo-studio/demo
```

List package contents:

```bash
cargo run -p ignispromptctl -- demo-summary \
  --package-list local-evidence/demo-studio/demo
```

Validate package contents:

```bash
cargo run -p ignispromptctl -- demo-summary \
  --package-validate local-evidence/demo-studio/demo
```

Package validation is structural/local only. It is not signing, certification, attestation, tamper-evidence, or cryptographic verification.

## 7. Run Aethra checks

```bash
cd apps/aethra
npm ci
npm test
npm run build
cd ../..
```

## 8. Start the local daemon manually

```bash
./scripts/start-dev.sh
```

In another terminal:

```bash
curl http://127.0.0.1:8765/health
curl http://127.0.0.1:8765/v1/models
```

## 9. Run smoke test

```bash
./scripts/smoke.sh
```

## 10. What to expect

A successful local preview run should show:

- local-only health response
- model and runner status hints
- local route explanations
- audit events
- sustainability proxy indicators
- demo package validation
- Aethra tests/build passing

## 11. Generated artifacts

Do not commit generated local artifacts.

These should remain ignored:

- `local-evidence/`
- `local-evidence/demo-studio/`
- `local-evidence/policy/`
- `local-evidence/operator/`
- `local-evidence/readiness/`
- `local-evidence/archives/`
- `data/audit/*.jsonl`
- `models/`
- `target/`
- `apps/aethra/dist/`
- root `dist/`
- SBOM outputs

## 12. Feedback

If you try the release, useful feedback includes:

- Did the setup steps work?
- Did the demo summary make sense?
- Did the Local Demo Studio explain the workflow clearly?
- Were the local-preview boundaries clear?
- Were any commands confusing?
- Did any generated artifacts appear unexpectedly in git status?
