# Local Preview 0.1.0 Release Notes

Status: ready for local preview tag.

## What Is Included

- local IgnisPrompt daemon
- local-only default no-model path
- route explanations
- local audit events
- adversarial document-instruction handling
- `StubLegalRunner` as the default Tier 3 legal fallback
- model and runner status hints
- Aethra local dashboard with fixture mode default
- explicit/manual live-local Aethra loading
- sustainability metrics endpoint
- Aethra Sustainability Preview
- local Markdown/JSON sustainability report export
- sustainability methodology documentation
- sustainability language guardrails
- demo script and talking track
- release checklist and quickstart docs

## What Is Not Included

- production deployment packaging
- model weights
- built-in legal-quality model inference
- production legal advice
- legal accuracy certification
- not production compliance evidence
- not ESG certification
- not certified sustainability reporting
- telemetry
- cloud calls by default
- SaaS backend
- external coefficient lookup
- global opt-in aggregation
- model install/delete controls
- runner controls
- daemon-level authentication, authorization, or TLS

## Safety Boundaries

- fixture mode remains Aethra's default
- live-local mode is explicit/manual
- local daemon access should stay on loopback for preview
- no telemetry/cloud calls by default
- no uploads
- no external sustainability coefficient lookup
- no model weights committed
- generated evidence and reports remain local
- sustainability values are estimated counterfactual proxy estimates and methodology-dependent

## Known Limitations

- local preview only
- not production deployment
- not legal advice
- not legal accuracy certification
- not production compliance evidence
- not ESG certification
- not certified sustainability reporting
- audit events are local process records and JSONL appends, not signed, immutable, encrypted, or certified evidence
- sustainability estimates are low-confidence v0.1 proxy estimates
- local HTTP API has no daemon-level authentication, authorization, or TLS
- optional GGUF path requires local prerequisites and is not part of the default preview path

## Verification Commands

Run from the repo root:

```bash
./scripts/check-sustainability-language.sh
cargo test
./scripts/dev-check.sh
git diff --check
```

Run Aethra checks:

```bash
cd apps/aethra
npm test
npm run build
cd ../..
```

Or run the combined local release check:

```bash
./scripts/release-check.sh
```

## Manual Preview Checks

1. Start the daemon with `./scripts/start-dev.sh`.
2. Start Aethra with `cd apps/aethra && npm run dev`.
3. Open `http://127.0.0.1:5173/`.
4. Confirm fixture mode is default.
5. Switch to live-local mode.
6. Load health, models, model/runner status hints, audit events, and sustainability metrics manually.
7. Export Markdown and JSON sustainability reports.
8. Confirm exported reports include `methodology_version`, `confidence`, and `disclaimer`.

## Upgrade And Cleanup Notes

- No model weights are included.
- No migrations are required.
- Existing ignored local evidence under `local-evidence/` may remain in place.
- Existing ignored model files under `models/` may remain in place.
- Aethra build output under `apps/aethra/dist/` is ignored and should not be committed.
- Local audit logs under `data/audit/*.jsonl` are ignored and should not be committed.
- To clean generated local evidence, use `make clean-local-evidence` only if those ignored outputs are no longer needed.

## Draft Tag

Candidate tag after final verification:

```text
local-preview-v0.1.0
```
