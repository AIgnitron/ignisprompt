# Local SLM Runner Control Design

Status: design plus read-only status foundation. PR #217 added read-only
runner process status metadata only; it did not implement runner lifecycle
control.

## Purpose

IgnisPrompt may eventually support local SLM runner lifecycle management, such as showing whether a local runner process is running and later allowing an operator to start or stop that runner. That capability must be designed as an explicit local operator-control feature, not hidden inside observability, readiness, routing, or Aethra status pages.

The default IgnisPrompt and Aethra posture remains local-first, conservative, manual, and read-only unless a future PR explicitly adds guarded operator controls with tests.

## Current State

IgnisPrompt already has several runner-adjacent pieces:

- `crates/ignispromptd/src/model_runner.rs` owns the current model runner abstraction.
- `StubLegalRunner` remains the default fallback for the no-model path.
- The optional `gguf-runner-spike` feature can call a configured local GGUF subprocess path when enabled and when local prerequisites exist.
- Runner preflight and status hints are exposed through read-only model status metadata.
- `GET /v1/status/models` reports conservative model and runner status hints.
- `GET /v1/models/readiness` reports local model readiness metadata, including runner hints.
- Routing policy metadata includes the `no_runner_mutation` boundary.
- Aethra Model / Runner Status observes model, readiness, capability, and runner hint metadata after manual refresh.

What does not exist today:

- No runner process manager.
- No runner start or stop endpoint.
- No runner lifecycle CLI command.
- No Aethra runner start or stop button.
- No automatic runner startup.
- No runner mutation through observability endpoints.

PR #217 adds `GET /v1/runners/status` and
`ignispromptctl runners status` as read-only status metadata surfaces. They
report conservative runner process state and `actions_allowed: ["none"]`.
They do not start, stop, restart, or manage runner processes.

## Product Distinction

### Status And Readiness

Status and readiness are safe to expose now when they stay observational:

- read-only
- local metadata only
- manually refreshed
- no process mutation
- no route execution
- no model execution claim
- no hidden substitution of fixture state for live operator state

These surfaces answer: "What does the local daemon know about configured models, runner paths, and readiness hints?"

### Operator Controls

Runner lifecycle controls are a future feature and must be treated separately:

- explicit operator mode
- guarded start and stop actions
- local daemon only
- loopback only
- confirmation before lifecycle mutation
- local audit event for each lifecycle action
- fail-closed behavior when configuration or process state is unclear

These surfaces answer: "Should IgnisPrompt start or stop a specifically configured local runner process now?"

## Proposed Phased Roadmap

Future work should land in this order:

1. `#217`: Daemon/CLI: add read-only runner process status contract - implemented as read-only status metadata only.
2. `#218`: Daemon/CLI: add guarded local runner start/stop commands
3. `#219`: Aethra: add local runner control panel behind explicit operator mode

Do not add Aethra mutation controls before daemon and CLI control behavior exists, is guarded, and is covered by tests.

## Proposed Future Data Model

Future runner process status should be explicit enough to distinguish configuration, process state, endpoint shape, and allowed actions. A possible contract:

```text
runner_id: string
runner_kind: stub | gguf | ollama | llama_cpp | other_local
model_id: string | null
configured: boolean
executable_exists: boolean
process_state: unknown | stopped | starting | running | stopping | failed
pid: number | null
local_endpoint: string | null
started_at: timestamp | null
stopped_at: timestamp | null
last_checked_at: timestamp
last_error_summary: string | null
managed_by_ignisprompt: boolean
operator_mode_required: boolean
actions_allowed: start | stop | restart | none
```

Field requirements:

- `runner_id` must be stable and safe to display.
- `runner_kind` must avoid exposing secrets or raw command strings.
- `model_id` must refer to configured manifest metadata, not downloaded model state.
- `pid` is optional and should be omitted, redacted, or controlled when not needed.
- `local_endpoint` must be loopback-only when present.
- `last_error_summary` must be short and sanitized.
- `managed_by_ignisprompt` must distinguish external operator-managed processes from future daemon-managed processes.
- `operator_mode_required` must be true for lifecycle actions.
- `actions_allowed` must be derived by daemon policy, not trusted from the client.

## Proposed Future Daemon Endpoints

`GET /v1/runners/status` exists after #217 as a read-only status endpoint.
The start and stop endpoints remain planned candidates and are not present.

```text
GET /v1/runners/status
POST /v1/runners/{runner_id}/start  # future, not implemented
POST /v1/runners/{runner_id}/stop   # future, not implemented
```

Future endpoint requirements:

- `GET /v1/runners/status` must be read-only and must not start, stop, probe external networks, or execute inference.
- `POST /v1/runners/{runner_id}/start` must require explicit operator mode and a configured allowlisted runner path.
- `POST /v1/runners/{runner_id}/stop` must only stop runner processes managed by IgnisPrompt or explicitly marked safe for IgnisPrompt lifecycle control.
- Start and stop responses must include sanitized status and an audit event identifier.
- All lifecycle actions must fail closed when runner identity, process ownership, endpoint locality, or configuration is ambiguous.

## Proposed Future CLI Commands

`ignispromptctl runners status` exists after #217 as a read-only CLI command.
The start and stop commands remain planned candidates and are not present.

```text
ignispromptctl runners status
ignispromptctl runners start <runner_id>  # future, not implemented
ignispromptctl runners stop <runner_id>   # future, not implemented
```

Future CLI requirements:

- `runners status` must be read-only.
- `runners start` and `runners stop` must require explicit operator intent.
- CLI output must be conservative and local-only.
- JSON output must avoid secrets, raw prompts, request bodies, full local paths unless already safe relative paths, and raw command strings.

## Safety And Guardrails

Future runner lifecycle work must satisfy these requirements:

- Local daemon only.
- Loopback only.
- No cloud calls.
- No telemetry.
- No model downloads.
- No arbitrary command execution.
- No shell string execution.
- Runner executable must come from an explicit allowlisted or configured path.
- No bare executable names resolved from `PATH`.
- No secret entry in UI.
- No automatic startup.
- No polling by default from Aethra.
- No localStorage or sessionStorage persistence for runner control state.
- Confirmation required before start or stop.
- Local audit event required for each lifecycle action.
- Fail closed when unsure.
- No production, compliance, security, certification, attestation, or legal-correctness claims.

Runner process launch must use structured process APIs with explicit argv values. It must not concatenate shell strings or pass operator-controlled text through a shell.

## Aethra Future UI Requirements

Design only. This PR does not add Aethra runner controls.

A future Aethra runner control panel must:

- be behind explicit operator mode
- show status before controls
- require manual refresh
- require confirmation for start and stop
- show local-only data source
- never silently substitute fixture data for live operator state
- avoid mutation controls unless operator mode is enabled
- never download models
- never connect cloud providers
- never expose raw command strings, secrets, raw prompts, request bodies, or full evidence contents

The default Aethra Model / Runner Status page should remain an observational surface unless the operator mode is explicitly entered.

## Non-Goals For This PR

PR #217 does not:

- implement start or stop
- implement a process manager
- implement lifecycle daemon endpoints
- implement lifecycle CLI commands
- add Aethra controls
- execute models
- download models
- add cloud support
- change routing behavior
- weaken read-only default Aethra behavior
- change API contracts
- change daemon runtime behavior
- change CLI runtime behavior

## Acceptance Criteria For Future PRs

### `#217`: Read-Only Runner Process Status

- Added a read-only runner process status contract.
- Added daemon and CLI status access only.
- Does not start, stop, restart, or mutate runner processes.
- Does not execute models or routes.
- Reports local process state conservatively.
- Keeps loopback/local-only behavior.
- Added tests for the locked response shape, read-only boundary language,
  sanitized output, `actions_allowed: ["none"]`, and CLI formatting.
- Keeps Aethra controls out of scope except optional read-only display after the contract exists.

### `#218`: Guarded Local Runner Start/Stop

- Adds guarded lifecycle commands only after #217 status semantics exist.
- Requires explicit operator intent.
- Requires configured/allowlisted explicit runner paths.
- Rejects bare executable names.
- Uses structured process APIs, not shell strings.
- Emits local audit events for start and stop attempts.
- Fails closed on ambiguous process ownership or unsafe endpoint state.
- Includes daemon, CLI, and regression tests for success and rejection paths.
- Does not add Aethra mutation controls yet.

### `#219`: Aethra Operator Control Panel

- Adds Aethra runner controls only after daemon and CLI lifecycle controls exist.
- Places controls behind explicit operator mode.
- Shows status before controls.
- Requires manual refresh.
- Requires confirmation before start or stop.
- Never substitutes fixture rows for live operator state.
- Keeps no polling, no browser storage persistence, no telemetry, and no cloud calls.
- Adds tests that unsafe controls are absent outside operator mode and guarded inside operator mode.
