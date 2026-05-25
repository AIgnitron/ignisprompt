# Changelog

## Unreleased

### Changed
- Aligned documentation after `v0.1.6-local-preview` was published as the latest local-preview release.
- Clarified current local-preview surfaces while keeping them scoped as scaffold, stub, fixture-backed, or local helper behavior where applicable.

## v0.1.6-local-preview

### Added
- Aethra Local Operator Console for fixture-backed local preview operator workflow guidance.
- `ignispromptctl operator-summary` and `ignispromptctl operator-summary --json`.
- Local operator package generation, listing, and structural validation under ignored `local-evidence/operator/` paths.
- Aethra read-only operator package preview.
- `scripts/operator-check.sh` and `make operator-check`.
- Demo workflow integration for local operator package generation, listing, and validation.

### Notes
- This release is local preview only.
- The default path makes no cloud calls by default, sends no telemetry, and performs no global aggregation.
- Aethra remains fixture-backed by default with manual live-local loading.
- Operator packages are local-only helper outputs. They are not signed, not certification, not attestation, not production evidence, and not release approval.
- The repository does not claim production deployment, legal advice, legal accuracy, ESG certification, compliance certification, security certification, supply-chain certification, signed attestation, tamper-evident audit storage, cryptographic verification, production-grade inference, or production-grade security.

## Historical Unreleased Notes

The notes below predate later local-preview releases. Some items that were listed as not implemented have since gained explicitly scoped scaffold, stub, fixture-backed, or local helper surfaces. Current docs and release records are the source of truth for present behavior.

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
- At the time these historical notes were written, local-only attestation, MCP, streaming, dashboard, Tier 2, Tier 4, and Tier 5 were not implemented. Current local-preview docs now describe later-scoped surfaces where they exist, such as MCP stub behavior, streaming scaffold behavior, and fixture-backed Aethra dashboard/operator surfaces.
