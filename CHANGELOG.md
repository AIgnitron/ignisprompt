# Changelog

## Unreleased

### Added
- Default CI path for build, test, daemon startup, health wait, and smoke verification.
- `/v1/models` smoke coverage for local model manifest visibility.
- Runtime warning when the legal prompt pack is missing or unreadable.
- Repository documentation pack under `docs/`.
- Public README demo section with local-only legal review caveats.
- One-command developer bootstrap script: `./scripts/dev-check.sh`.
- Legal JSON extraction and validation improvements for noisy local model output.
- Subtle adversarial legal-language Golden Legal case.
- Legal model candidate manifest templates under `config/models/examples/`.
- Alpha legal bakeoff summary reporting with `summary.jsonl`, `summary.md`, and terminal summary output.

### Changed
- Removed Cargo `target/` artifacts from git tracking.
- Removed local audit event logs from git tracking and ignored `data/audit/*.jsonl`.

### Notes
- IgnisPrompt is not production legal advice.
- IgnisPrompt does not claim legal accuracy is solved.
- IgnisPrompt is not enterprise compliance certified.
- Local-only attestation, MCP, streaming, dashboard, Tier 2, Tier 4, and Tier 5 are not implemented yet.
