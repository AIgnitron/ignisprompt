# Product Readiness Audit - 2026-05-07

Overall result: **PASS WITH GAPS**

This audit covers commit `46f083ced5b440aa033de1653ce86da2787fd56e` on `main`. The default no-model local scaffold path passed build, test, smoke, and main CI. Optional live GGUF, golden, bakeoff, and local legal-review demo paths were not rerun because the local Ollama server was not reachable at `http://127.0.0.1:11434`.

This report is conservative. It is not a production readiness claim, legal advice quality claim, compliance certification, formal attestation, or enterprise readiness statement.

## Blockers

None for the default no-model local scaffold path.

## Non-blocking improvements

- Live GGUF demo validation depends on local Ollama being started and kept local-only with `OLLAMA_NO_CLOUD=true`.
- The bakeoff host has `models/qwen2.5-0.5b-instruct-q4_k_m.gguf` and `models/Phi-3.5-mini-instruct.q5_k_m.gguf`, but not `models/qwen2.5-7b-instruct-q4_k_m.gguf` or `models/saul-instruct-v1.q4_k_m.gguf`.
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
- `git status --short --ignored models local-evidence`: confirmed generated model/evidence paths are ignored.
- `git diff --check`: passed.
- `git ls-files models local-evidence data/audit`: only placeholders are tracked: `models/.gitkeep`, `local-evidence/.gitkeep`, and `data/audit/.gitkeep`.
- `git ls-files | grep -Ei '(^|/)(\.env|id_rsa|id_dsa|.*\.pem|.*\.key|secrets?)'`: no tracked secret-like file paths matched.
- `gh run list --branch main --limit 10`: latest 10 main CI runs were successful.

## Commands skipped

- `make gguf-smoke`: skipped because the local Ollama server is not reachable at `http://127.0.0.1:11434`; the GGUF runner wrapper is executable and the baseline local model file is present.
- `make golden`: skipped for the same missing local Ollama prerequisite.
- `make bakeoff`: skipped for the same missing local Ollama prerequisite. Additional optional candidate files `models/qwen2.5-7b-instruct-q4_k_m.gguf` and `models/saul-instruct-v1.q4_k_m.gguf` are also not present.
- `make demo`: skipped for the same missing local Ollama prerequisite.

## Files changed

- Added this audit report only: `docs/PRODUCT_READINESS_AUDIT_2026-05-07.md`.

## Git Ignore Safety

The repository still ignores generated local artifacts and model weights:

- `models/**` remains ignored except `models/.gitkeep`.
- `local-evidence/**` remains ignored except `local-evidence/.gitkeep`.
- `data/audit/*.jsonl` remains ignored; only `data/audit/.gitkeep` is tracked.
- Generated attestation and transcript outputs stayed under ignored `local-evidence/`.

## CI Status

Main CI is green for `46f083ced5b440aa033de1653ce86da2787fd56e`.

Latest relevant main CI run:

- `25498620447`: `docs: add demo readiness checklist (#32)`, status `completed`, conclusion `success`.

## Current Limitations

- Default Tier 3 legal completions use `StubLegalRunner` unless the optional GGUF spike is compiled and fully configured.
- The GGUF runner path is an opt-in local subprocess spike, not a production inference stack.
- `stream: true` is an OpenAI-compatible SSE scaffold over an already-produced completion, not token-by-token model streaming.
- MCP support is an experimental opt-in stdio stub exposing `route_explain`, not a full MCP server.
- The local HTTP API has no daemon-level authentication, authorization, or TLS.
- Audit events are local process records and JSONL appends; they are not signed, immutable, tamper-evident, encrypted by the daemon, or certified.
- Prompt-injection handling is lightweight pattern detection, not a complete adversarial robustness solution.
- No cloud BYOK, Tier 4 edge dispatch, Tier 5 cloud dispatch, dashboard, Apple Foundation Models bridge, production GGUF/ONNX backend, signed attestation generation, or enterprise policy engine is implemented.
- No command in this audit proves production legal accuracy or legal advice quality.
