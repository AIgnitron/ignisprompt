# Contributing to IgnisPrompt

IgnisPrompt is open-source local AI routing infrastructure. Early contributions should focus on the Apple Spine Smoke Test and the control-plane contract before adding new feature surfaces.

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
