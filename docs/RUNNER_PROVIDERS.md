# Runner Providers

This document describes the current `ModelRunner` provider interface in `ignispromptd`. It is a developer-facing reference for adding new local runner integrations without changing the default daemon behavior or overstating unimplemented features.

## Current scope

The current runner layer is intentionally small:

- runner code lives in `crates/ignispromptd/src/model_runner.rs`
- route selection still happens in `crates/ignispromptd/src/main.rs`
- the default build keeps `StubLegalRunner` as the active Tier 3 fallback
- the optional `GgufRunner` path is behind the `gguf-runner-spike` Cargo feature
- no default cloud runner is implemented

The runner layer is responsible for producing local completion content after routing has already selected a policy outcome.

## Interface overview

The core trait is:

```rust
pub(crate) trait ModelRunner: Send + Sync {
    fn name(&self) -> &'static str;
    fn supports(&self, context: &ModelRunnerContext<'_>) -> bool;
    fn run(&self, context: &ModelRunnerContext<'_>) -> Result<ModelRunnerOutput>;
}
```

Each method has a narrow purpose:

- `name()`: returns a stable identifier used in logs and local output metadata.
- `supports()`: performs a cheap eligibility check for the current routed request.
- `run()`: executes the local runner path and returns completion text plus optional metadata.

The trait is `Send + Sync` because runners are stored behind `Arc<dyn ModelRunner>` and shared through daemon state.

## ModelRunnerOutput

`ModelRunnerOutput` is the value returned by a successful runner:

- `content`: the assistant text that will be returned to the chat completion caller
- `metadata`: optional structured local metadata such as runner name or legal JSON parse results

Today, `GgufRunner` uses `metadata` to expose:

- `runner = "gguf-runner-spike"`
- `legal_json` parse and schema-validation metadata

`StubLegalRunner` returns only plain text and leaves `metadata = None`.

## ModelRunnerContext

`ModelRunnerContext` gives a runner the already-routed request context:

```rust
pub(crate) struct ModelRunnerContext<'a> {
    #[cfg(feature = "gguf-runner-spike")]
    pub(crate) config: &'a Args,
    pub(crate) request: &'a ChatCompletionRequest,
    pub(crate) decision: &'a RouteDecision,
    pub(crate) model: Option<&'a ModelManifest>,
}
```

Field behavior:

- `request`: the original chat-completion-style request
- `decision`: the already-computed route decision
- `model`: the manifest selected from `decision.model_id`, if any
- `config`: daemon CLI/env config, compiled in only when the GGUF spike feature is enabled today

Important constraints:

- runners do not decide policy tier or domain
- runners are invoked after route selection
- route explanations are generated outside the runner layer
- audit append behavior is also outside the runner layer, although runner metadata may be included in chat-completion audit events

## How manifests are used

Not every runner needs a manifest.

Use `context.model` only when the runner depends on manifest data such as:

- `format`
- `localPath`
- `promptPack`
- `responseFormat`
- `version`

Current examples:

- `GgufRunner` requires a selected manifest and checks `format: "gguf"`.
- `GgufRunner` reads `localPath`, `promptPack`, and `responseFormat`.
- `StubLegalRunner` does not require a manifest to support the request.

## When a runner should support a manifest

A runner should return `true` from `supports()` only when all of its required local prerequisites are satisfied. The check should stay cheap and deterministic.

Current `GgufRunner` support rules:

- route tier is `TIER_3`
- route domain is `legal`
- a manifest is selected
- manifest `format` is `gguf`
- daemon config contains an explicit runner binary path
- the configured runner binary path exists locally
- manifest `localPath` exists locally

The prompt pack and subprocess response are still validated during execution, not in `supports()`. If prompt-pack loading fails, the subprocess times out, the subprocess exits non-zero, stdout is empty, or local legal JSON normalization records invalid output, `run()` returns the current local result or error path and the adapter/fallback behavior remains local-only.

Practical guidance for new runners:

- gate on route policy first
- require only manifest fields you actually need
- treat missing local files or invalid local configuration as unsupported or as a recoverable runner failure
- do not claim support for a request if the runner cannot realistically execute locally

## Fallback ordering

Runner fallback behavior comes from two layers:

1. `configured_model_runners()` defines registration order.
2. `ModelRunnerAdapter::generate()` walks that order and returns the first successful result.

Current order:

- `GgufRunner` first, but only when `gguf-runner-spike` is compiled
- `StubLegalRunner` second, always

Adapter behavior:

- if `supports()` is `false`, that runner is skipped
- if `supports()` is `true` and `run()` succeeds, that output wins immediately
- if `supports()` is `true` and `run()` fails, the adapter records the error and continues to the next runner
- if no runner supports the request, the adapter returns `Ok(None)`
- if at least one eligible runner failed and no later runner succeeded, the adapter returns the last error

The caller in `completion_output_for_decision()` then applies a final inline fallback:

- `Ok(Some(output))`: use runner output
- `Ok(None)`: use `default_completion_text(...)`
- `Err(_)`: log a warning and use `default_completion_text(...)`

This means new runners must preserve the existing fallback expectation: failure should not break the default local scaffold path.

## Current providers

### StubLegalRunner

Purpose:

- default Tier 3 legal fallback
- always available in the default build
- does not require external binaries, model weights, prompt packs, or feature flags

Support behavior:

- supports any request whose routed decision is Tier 3 legal

Execution behavior:

- returns a clearly labeled local stub response
- includes a short summary of the latest non-empty user prompt text
- does not emit local output metadata

### GgufRunner

Purpose:

- experimental subprocess-based local GGUF spike

Availability:

- only compiled with `--features gguf-runner-spike`

Support behavior:

- only supports Tier 3 legal requests with a selected `gguf` manifest and valid local prerequisites

Execution behavior:

- builds a prompt from the request plus legal prompt-pack content
- writes the prompt to a temp file
- invokes a local runner binary with `--model`, `--prompt-file`, and `--max-tokens`
- enforces a deterministic subprocess timeout, configurable with `IGNISPROMPT_GGUF_RUNNER_TIMEOUT_MS` or `--gguf-runner-timeout-ms` and defaulting to 30 seconds
- optionally sets structured-output env vars for `json` or `schema` response modes
- normalizes local legal JSON output and returns metadata

Failure behavior:

- invalid runner config, missing files, subprocess timeout, non-zero exit status, empty stdout, or prompt-pack read failures all cause fallback to the next runner
- invalid or schema-mismatched legal JSON stdout is returned as structured local `legal_json` error metadata rather than hidden
- local file presence and runner executable presence are status hints only; they do not prove model quality, legal accuracy, compliance status, or production-grade runner management

## Rules for new runner providers

- no cloud calls unless explicitly configured by the operator and documented separately
- do not add any default cloud provider path to the current scaffold
- do not commit model weights or local evidence into git
- default build and default CI must not require external binaries
- keep local-only behavior clear and fail closed where current policy requires it
- preserve route explanations by keeping policy/explanation logic outside the runner
- preserve audit behavior by not bypassing the existing chat-completion and route-explain handlers
- preserve `StubLegalRunner` as the default fallback unless the repository intentionally changes that policy in a later task

## Skeleton example

This is a minimal sketch for a new local runner provider:

```rust
use anyhow::{bail, Result};

#[derive(Debug, Default)]
pub(crate) struct MyLocalRunner;

impl ModelRunner for MyLocalRunner {
    fn name(&self) -> &'static str {
        "my-local-runner"
    }

    fn supports(&self, context: &ModelRunnerContext<'_>) -> bool {
        let Some(model) = context.model else {
            return false;
        };

        context.decision.tier == "TIER_3"
            && context.decision.domain == "legal"
            && model.format.eq_ignore_ascii_case("my-local-format")
    }

    fn run(&self, context: &ModelRunnerContext<'_>) -> Result<ModelRunnerOutput> {
        let model = context
            .model
            .ok_or_else(|| anyhow::anyhow!("no model manifest was selected"))?;

        if model.local_path.as_deref().unwrap_or("").trim().is_empty() {
            bail!("selected manifest does not declare localPath");
        }

        Ok(ModelRunnerOutput {
            content: "[stub] replace with local runner output".to_string(),
            metadata: Some(CompletionOutputMetadata {
                runner: self.name().to_string(),
                legal_json: None,
            }),
        })
    }
}
```

Integration steps remain manual today:

1. add the runner type in `model_runner.rs`
2. decide whether it belongs behind a Cargo feature
3. register it in `configured_model_runners()` in `main.rs`
4. place it before or after other runners intentionally
5. add focused tests for support rules and fallback behavior
6. update `ARCHITECTURE.md`, this document, and any user-facing docs that mention the active runner path

## Non-claims

This interface documentation does not mean the repository already supports:

- production inference providers
- cloud BYOK runners
- sandboxed subprocess execution
- provider hot-swapping
- enterprise policy engines
- token-by-token incremental streaming from real model backends

Document new providers only when the code path actually exists.
