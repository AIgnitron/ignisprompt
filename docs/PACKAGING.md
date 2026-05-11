# Packaging

IgnisPrompt is currently source-first. The supported install and run path today is a local Rust/Cargo checkout. There is not yet a published Homebrew formula, package repository, or automatic GitHub Release publication flow.

## Current status

- supported today: build and run from source
- supported today: local `cargo install --path ...` from this repository
- supported today: manual GitHub Actions release-draft artifact build for `ignispromptd` on Linux x86_64 and experimental macOS arm64
- not available yet: Homebrew formula
- not available yet: published package manager distribution

The default no-model daemon path stays local-only and does not require Ollama, GGUF binaries, model weights, or local evidence. `StubLegalRunner` remains the default Tier 3 legal fallback.

## Build and run from source

Requires Rust and Cargo.

Run the daemon directly from the workspace:

```bash
cargo run -p ignispromptd -- \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only
```

In another terminal, exercise the default local smoke path:

```bash
./scripts/smoke.sh
```

For the usual one-command local verification path:

```bash
./scripts/dev-check.sh
```

or:

```bash
make dev-check
```

## Install from source with Cargo

The workspace supports local `cargo install --path ...` for the current binary crates.

Install the daemon:

```bash
cargo install --path crates/ignispromptd
```

Optional CLI install:

```bash
cargo install --path crates/ignispromptctl
```

After install, the binaries land in Cargo's bin directory, typically `~/.cargo/bin`.

This install path builds from the current source tree. It does not install model weights, local evidence, or a packaged GGUF runner.

## Build a release binary locally

To build the default daemon binary without installing it:

```bash
cargo build --release -p ignispromptd
```

The resulting binary is:

```bash
./target/release/ignispromptd
```

You can run it with the same local-only flags as the development path:

```bash
./target/release/ignispromptd \
  --bind 127.0.0.1:8765 \
  --model-dir ./config/models \
  --audit-log ./data/audit/events.jsonl \
  --local-only
```

## Optional ignispromptctl usage

If you build or install `ignispromptctl`, it can inspect a running daemon:

```bash
cargo run -p ignispromptctl -- health
cargo run -p ignispromptctl -- models
cargo run -p ignispromptctl -- route-explain --file ./tests/golden-legal/smoke-legal-request.json
cargo run -p ignispromptctl -- audit tail
```

If you installed it with `cargo install --path crates/ignispromptctl`, the same commands can be run as:

```bash
ignispromptctl health
ignispromptctl models
ignispromptctl route-explain --file ./tests/golden-legal/smoke-legal-request.json
ignispromptctl audit tail
```

## Manual release-draft artifact

The repository now includes an experimental manual GitHub Actions workflow at `.github/workflows/release-draft.yml`.

Current scope:

- manual trigger only: `workflow_dispatch`
- builds `ignispromptd` for Linux x86_64 and experimental macOS arm64
- uploads a workflow artifact containing:
  - `ignispromptd`
  - `ignispromptd.sha256`
  - release metadata text
- creates separate artifacts per target platform

Current limitations:

- it does not publish a GitHub Release automatically
- it does not publish Homebrew or other packages
- it does not bundle `models/`, `local-evidence/`, or `data/`

Treat this as an experimental artifact-preparation step, not as a published distribution channel.

## Future Homebrew plan

Homebrew is not available for IgnisPrompt yet.

If the project adds a Homebrew formula later, the likely prerequisites are:

- stable versioned source or release archives
- published checksums for released binaries or tarballs
- clear install scope for `ignispromptd` and optional `ignispromptctl`
- conservative smoke verification for the no-model local path
- documentation that the default install remains local-only and does not include model weights

Until those pieces exist, the accurate install story is still source build, local Cargo install, or a manually downloaded workflow artifact.
