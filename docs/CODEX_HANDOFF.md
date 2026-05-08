# Codex Handoff

This file records the current IgnisPrompt state so future prompts can simply say: "Follow `AGENTS.md` and `docs/CODEX_HANDOFF.md`."

## Current MVP State

- Repo: https://github.com/AIgnitron/ignisprompt
- Local path: `~/Downloads/Aignitron/IgnisPrompt/Code/ignisprompt`
- MVP tag: `v0.1.0-mvp`
- Final readiness result: **PASS WITH GAPS**
- Pinned MVP issue: https://github.com/AIgnitron/ignisprompt/issues/40
- Latest known main commit after PR #49: `5adc645 fix: improve synthetic demo answer quality`
- Main CI after PR #49: passed
- Open PRs at this handoff: none

## Recent Completed Work

- PR #38: fixed portable `mktemp` templates for Makefile smoke targets.
- PR #39: fixed demo transcript request override and generated evidence-base handling.
- PR #49: improved synthetic demo answer quality beyond schema validity.
- Issue #41 was closed after PR #49.

## Current Working Facts

- Default no-model path works without Ollama, GGUF, external model weights, or local model binaries.
- `StubLegalRunner` remains the default fallback.
- The optional GGUF path is feature-gated and local-only.
- Generated evidence and transcripts live under ignored `local-evidence/`.
- Local model files live under ignored `models/`.
- The synthetic public demo fixture is `tests/golden-legal/demo-synthetic-contract-request.json`.
- The default synthetic demo now avoids placeholder-like `"string"` output in the checked demo path.
- The demo still proves local routing, audit capture, strict schema validation, and transcript generation. It does not prove legal answer quality for production use.

## Known Good Commands

These commands passed during recent post-MVP work when local prerequisites were present:

```bash
cargo build
cargo test
make dev-check
make smoke
make gguf-smoke
make golden
make demo
./scripts/demo-transcript.sh
./scripts/generate-local-only-attestation.sh
```

`make bakeoff` completed in prior optional validation with at least one passing candidate, but candidate-specific gaps remain.

## Open Post-MVP Issues

- #40 MVP status and feedback issue: https://github.com/AIgnitron/ignisprompt/issues/40
- #42 Add and review Qwen2.5 7B local legal candidate: https://github.com/AIgnitron/ignisprompt/issues/42
- #43 Add and review Saul 7B local legal candidate: https://github.com/AIgnitron/ignisprompt/issues/43
- #44 Investigate Phi 3.5 mini Golden subset failures: https://github.com/AIgnitron/ignisprompt/issues/44
- #45 Add macOS release artifact workflow: https://github.com/AIgnitron/ignisprompt/issues/45
- #46 Clean up GitHub Actions runtime deprecation annotation: https://github.com/AIgnitron/ignisprompt/issues/46
- #47 Improve README positioning for MVP status: https://github.com/AIgnitron/ignisprompt/issues/47
- #48 Publish MVP announcement on LinkedIn: https://github.com/AIgnitron/ignisprompt/issues/48

Issue #1 remains open for broader structured JSON reliability work:

- #1 Improve structured JSON reliability for legal prompt pack: https://github.com/AIgnitron/ignisprompt/issues/1

## Remaining Gaps

- Qwen2.5 7B candidate is skipped until a reviewed local model file is staged under ignored `models/`.
- Saul 7B candidate is skipped until a reviewed local model file is staged under ignored `models/`.
- Phi 3.5 mini currently fails the Golden subset.
- Linux x86_64 release artifact exists; macOS artifact workflow is not added yet.
- GitHub Actions may still report a non-blocking `actions/checkout@v4` Node.js 20 deprecation annotation.
- The local HTTP API has no daemon-level authentication, authorization, or TLS.
- Audit events are local process records and JSONL appends; they are not signed, immutable, tamper-evident, encrypted by the daemon, or certified.
- Prompt-injection handling is lightweight pattern detection, not a complete adversarial robustness solution.
- No command in the current audit proves production legal accuracy or legal advice quality.

## Recommended Next Tasks

1. Improve README MVP positioning via issue #47.
2. Investigate Phi 3.5 mini Golden failures via issue #44.
3. Add macOS manual release artifact workflow via issue #45.
4. Clean up the Actions runtime deprecation annotation via issue #46.
5. Review and stage larger local legal candidates via issues #42 and #43.

## Handoff Notes

- Start every task from clean `main`.
- Keep PRs small and reviewable.
- Keep generated evidence local and ignored.
- Keep language conservative: local-first control-plane MVP, not production legal advice or certified compliance.
- If model output is invalid or low quality, report that directly and keep validation strict.
