# Product Readiness Audit - 2026-05-07

Overall result: **PASS WITH GAPS**

This audit covers commit `46f083ced5b440aa033de1653ce86da2787fd56e` on `main`, with post-audit optional validation reruns after PR #34 on commit `d546e27af16b77910c1eb13467029bb0bbe1961e` and after PR #36 on commit `56195d65981f71e6af6d695788b6bd1c25c292c2`. The default no-model local scaffold path passed build, test, smoke, and main CI. Optional live GGUF, golden, bakeoff, and local legal-review demo paths were rerun with local Ollama reachable at `http://127.0.0.1:11434`.

This report is conservative. It is not a production readiness claim, legal advice quality claim, compliance certification, formal attestation, or enterprise readiness statement.

## Blockers

None for the default no-model local scaffold path.

## Non-blocking improvements

- Live GGUF validation now runs when local Ollama is started and kept local-only with `OLLAMA_NO_CLOUD=true`, but this remains an operator-managed local prerequisite.
- The bakeoff host has `models/qwen2.5-0.5b-instruct-q4_k_m.gguf` and `models/Phi-3.5-mini-instruct.q5_k_m.gguf`, but not `models/qwen2.5-7b-instruct-q4_k_m.gguf` or `models/saul-instruct-v1.q4_k_m.gguf`.
- The Phi 3.5 mini candidate failed the Golden Legal subset in the post-audit bakeoff rerun.
- PR #36 fixed the default synthetic demo legal JSON schema-validity issue. The local legal-review demo now captures route, audit, and local-only evidence with `legal_json.status=ok` and `schema_valid=true`.
- The default synthetic demo output still contains placeholder-like strings, so schema validity is not a production legal-quality or legal-accuracy claim.
- GitHub Actions main CI still reports the recurring `actions/checkout@v4` Node.js 20 deprecation annotation. This is CI maintenance, not a current test failure.
- `cargo build --features gguf-runner-spike` completed but emitted local macOS SDK discovery warnings from `xcrun`.

## Commands run

- `cargo build`: passed.
- `cargo test`: passed, 6 `ignispromptctl` tests and 34 `ignispromptd` tests.
- `cargo build --features gguf-runner-spike`: passed.
- `cargo test --features gguf-runner-spike`: passed, 6 `ignispromptctl` tests and 39 `ignispromptd` tests.
- `make smoke`: passed; verified `/health`, `/v1/models`, route explanation, chat completion, adversarial document-instruction handling, and local audit events.
- `./scripts/demo-transcript.sh`: passed against existing ignored demo evidence.
- `make attestation`: passed after rerunning outside the sandbox; the first sandboxed run could not start the built daemon binary and logged `Operation not permitted`.
- Post-audit `make gguf-smoke`: passed with route `TIER_3` / `DOMAIN_MODEL_SELECTED`, `data_left_device=false`, `legal_json.status=ok`, and `schema_valid=true`.
- Post-audit `make golden`: passed with 6 Golden Legal v0.3 cases. Evidence was written under ignored `local-evidence/golden-legal-v0.3/20260507T141541Z`.
- Post-audit `make bakeoff`: completed with at least one passing candidate. Qwen2.5 0.5B passed; Qwen2.5 7B and Saul 7B were skipped because local model files were not staged; Phi 3.5 mini failed the Golden subset. Evidence was written under ignored `local-evidence/alpha-legal-bakeoff-v0.1/20260507T141553Z`.
- Post-audit `make demo` after PR #36: passed and captured route/audit/local-only evidence with route `TIER_3` / `DOMAIN_MODEL_SELECTED`, `data_left_device=false`, `legal_json.status=ok`, `schema_valid=true`, and `source=raw_json`. Evidence was written under ignored `local-evidence/demo-local-legal-review/`.
- Post-audit `./scripts/demo-transcript.sh` after PR #36: passed and saved a transcript under ignored `local-evidence/demo-local-legal-review/`; the transcript reports `schema_valid=true` for the default synthetic demo.
- `git status --short --ignored models local-evidence`: confirmed generated model/evidence paths are ignored.
- `git diff --check`: passed.
- `git ls-files models local-evidence data/audit`: only placeholders are tracked: `models/.gitkeep`, `local-evidence/.gitkeep`, and `data/audit/.gitkeep`.
- `git ls-files | grep -Ei '(^|/)(\.env|id_rsa|id_dsa|.*\.pem|.*\.key|secrets?)'`: no tracked secret-like file paths matched.
- `gh run list --branch main --limit 10`: latest 10 main CI runs were successful.

## Commands skipped

None in the post-audit optional validation reruns. Gaps remain because the Qwen2.5 7B and Saul 7B bakeoff candidate model files were not staged locally, and the staged Phi 3.5 mini candidate failed the Golden subset.

## Files changed

- This audit report only: `docs/PRODUCT_READINESS_AUDIT_2026-05-07.md`.

## Git Ignore Safety

The repository still ignores generated local artifacts and model weights:

- `models/**` remains ignored except `models/.gitkeep`.
- `local-evidence/**` remains ignored except `local-evidence/.gitkeep`.
- `data/audit/*.jsonl` remains ignored; only `data/audit/.gitkeep` is tracked.
- Generated attestation and transcript outputs stayed under ignored `local-evidence/`.

## CI Status

Main CI is green for `56195d65981f71e6af6d695788b6bd1c25c292c2`.

Latest relevant main CI run:

- `25515029281`: `fix: make synthetic demo emit valid legal json`, status `completed`, conclusion `success`.

## Current Limitations

- Default Tier 3 legal completions use `StubLegalRunner` unless the optional GGUF spike is compiled and fully configured.
- The GGUF runner path is an opt-in local subprocess spike, not a production inference stack.
- `stream: true` is an OpenAI-compatible SSE scaffold over an already-produced completion, not token-by-token model streaming.
- MCP support is an experimental opt-in stdio stub exposing `route_explain`, not a full MCP server.
- The local HTTP API has no daemon-level authentication, authorization, or TLS.
- Audit events are local process records and JSONL appends; they are not signed, immutable, tamper-evident, encrypted by the daemon, or certified.
- Prompt-injection handling is lightweight pattern detection, not a complete adversarial robustness solution.
- The default synthetic demo now validates against the legal JSON schema, but the observed content includes placeholder-like strings and does not establish legal answer quality.
- No cloud BYOK, Tier 4 edge dispatch, Tier 5 cloud dispatch, dashboard, Apple Foundation Models bridge, production GGUF/ONNX backend, signed attestation generation, or enterprise policy engine is implemented.
- No command in this audit proves production legal accuracy or legal advice quality.
