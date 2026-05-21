# Contributing to IgnisPrompt

IgnisPrompt is open-source local AI routing infrastructure. Early contributions should focus on the Apple Spine Smoke Test and the control-plane contract before adding new feature surfaces.

Before making changes, contributors and AI coding agents should read `AGENTS.md` for permanent repository rules. For current MVP state, known gaps, and recommended post-MVP tasks, also read `docs/CODEX_HANDOFF.md`.

For more detailed local setup, artifact hygiene, conservative claim language, and documentation expectations, see `docs/CONTRIBUTING_DEV.md`. For release history, see `CHANGELOG.md`. New issues should use the templates under `.github/ISSUE_TEMPLATE/`, and PRs should use `.github/pull_request_template.md`.

## Current priorities

1. Keep `ignispromptd` minimal and reliable.
2. Make route decisions explainable.
3. Keep local-only behavior fail-closed.
4. Add real model runtime integration only after the manifest/audit/router spine is stable.

## Before submitting a PR

- Run `cargo fmt`.
- Run `cargo clippy --all-targets --all-features`.
- Run `cargo test`.
- Run `./scripts/smoke.sh` with the daemon running.
- Confirm the PR template's local-first checklist, including no cloud calls by default, no committed model weights, no audit logs, no `target/` artifacts, and no `local-evidence/` files.
