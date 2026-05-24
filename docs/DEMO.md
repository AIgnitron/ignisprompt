# Demo

IgnisPrompt has two practical demo paths today: the default scaffold smoke demo and an optional local GGUF/Ollama legal-review demo.

> **Demo safety boundary:** Use synthetic demo data only. These flows are local preview aids, not legal advice and not a production deployment. They make no cloud calls by default and add no telemetry. Audit and sustainability outputs are local-preview signals only; sustainability values are estimated, proxy, counterfactual, methodology-dependent, and non-certified.

Before a public or stakeholder demo, run through the [Demo Readiness Checklist](DEMO_READINESS_CHECKLIST.md).

## Default smoke demo

This path requires Rust, Cargo, `curl`, and `jq`. It does not require Ollama, GGUF tooling, network access, or model weights.

Terminal 1:

```bash
./scripts/start-dev.sh
```

Terminal 2:

```bash
./scripts/smoke.sh
```

The smoke script checks:

- `GET /health`
- `GET /v1/models`
- legal route explanation
- OpenAI-compatible chat completions
- adversarial document instruction handling
- audit event retrieval

The expected Tier 3 legal completion in the default path comes from `StubLegalRunner`.

## Optional GGUF local smoke

This path is opt-in and requires a local runner, a local model file, and the `gguf-runner-spike` feature. The repository does not include model weights.

Expected local baseline path:

```text
./models/qwen2.5-0.5b-instruct-q4_k_m.gguf
```

Run the daemon with the feature and runner configured:

```bash
IGNISPROMPT_GGUF_RUNNER_BIN=./scripts/ollama-gguf-runner.sh \
IGNISPROMPT_GGUF_MAX_TOKENS=96 \
OLLAMA_HOST=http://127.0.0.1:11434 \
OLLAMA_NO_CLOUD=true \
cargo run -p ignispromptd --features gguf-runner-spike -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only
```

Then run:

```bash
./scripts/smoke-gguf-local.sh
```

Qwen2.5 0.5B is only a pipe/demo baseline for this flow. Passing this smoke test does not prove legal accuracy, production readiness, or that the model is the final legal-quality choice.

## Local legal review demo

The convenience script starts a feature-gated daemon, sends a fully synthetic contract-review fixture, and writes local evidence:

```bash
./scripts/demo-local-legal-review.sh
```

Requirements:

- local Ollama server reachable at `OLLAMA_HOST`, usually `http://127.0.0.1:11434`
- `OLLAMA_NO_CLOUD=true`
- executable `scripts/ollama-gguf-runner.sh`
- local GGUF file at `./models/qwen2.5-0.5b-instruct-q4_k_m.gguf`, or `IGNISPROMPT_GGUF_MODEL_PATH` pointing to another local file

Evidence is written under `./local-evidence/demo-local-legal-review/`. Do not commit it.

Use `tests/golden-legal/demo-synthetic-contract-request.json` for public demos. Never demo with real customer contracts, confidential legal text, personal data, or production matter materials.

To turn the latest evidence bundle into a shareable local transcript, run:

```bash
./scripts/demo-transcript.sh
```

The transcript generator reads the latest complete bundle under `./local-evidence/demo-local-legal-review/` by default and writes `transcript.md` into that same ignored bundle directory. It prints the request summary, route decision, route explanation, `legal_json` status, a parsed JSON excerpt, and the audit evidence path.

If the local model returns invalid legal JSON, the demo and transcript keep the failure visible with `legal_json.status`, `schema_valid`, source, and error details. Local route and audit evidence can still be useful, but invalid legal JSON is not a valid legal answer.

If no complete bundle exists and the local GGUF prerequisites are available, the transcript script can run the demo first:

```bash
./scripts/demo-transcript.sh --generate
```

This is still a local-only demo path. It does not make cloud calls, does not use real customer or legal data, and does not produce legal advice, production readiness evidence, formal attestation, or compliance certification.

## Local evidence workflow demo

This path runs the local evidence demo workflow end to end with synthetic input and ignored output paths only. It stays local-preview only and does not add signing, certification, tamper-evident storage, cryptographic verification, telemetry, or cloud calls.

Run:

```bash
./scripts/demo-local-evidence-workflow.sh
```

The script demonstrates `route-explain`, `audit-events`, evidence bundle generation, listing, validation, archiving, archive verification, and manifest inspection. Generated outputs stay under ignored `./local-evidence/` paths.

Use `--dry-run` to print the planned workflow without starting the daemon. Use `--self-test` to verify ignored-path checks and command construction without a live daemon.

For regression checks that verify the CLI command shape and the Aethra boundary wording stay aligned, run `make readiness-check` and `make evidence-check`.

The Aethra Local Readiness page summarizes fixture-backed local preview readiness cards for daemon health, version/status, configured models, model and runner status hints, evidence workflow availability, and local helper checks. Its daemon guidance is copy-only and includes the matching `ignispromptctl readiness` summary. Aethra does not execute commands, add polling, add telemetry, or add controls.

The Aethra Local Command Center mirrors the same local-preview command recipes, the evidence workflow checklist, and the demo readiness notes for safe dashboard review.

## Golden and bakeoff demos

`./scripts/run-golden-legal-v0.3.sh` runs a nine-case local subset against the live GGUF path. It includes the Tier 3 success case, fail-closed local-only cases, adversarial document-instruction handling, explanation quality, a subtle legal-language routing-instruction case, and an expanded synthetic adversarial fixture matrix. It writes evidence under `./local-evidence/golden-legal-v0.3/`.

Current local reliability note as of May 2, 2026: the earlier local Golden Legal v0.3 evidence available in this workspace recorded the original six control-plane cases as passing with the Qwen2.5 0.5B pipe baseline, and the Tier 3 success case had `legal_json.status = "ok"` and `schema_valid = true`. The current script now includes additional synthetic adversarial fixtures. This is not a legal-accuracy result, production readiness, enterprise attestation, or compliance certification.

`./scripts/run-alpha-legal-bakeoff-v0.1.sh` runs that subset across locally staged candidate model files and writes comparison output under `./local-evidence/alpha-legal-bakeoff-v0.1/`.

These scripts are local evaluation aids. They do not establish enterprise attestation, legal advice quality, or compliance certification.
