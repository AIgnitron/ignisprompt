# Architecture

IgnisPrompt currently ships as a single Rust daemon crate, `ignispromptd`, built with `axum`, `tokio`, `serde`, `clap`, `tracing`, `uuid`, and `chrono`.

The architecture is intentionally small. It validates the local routing control plane before production inference, cloud routing, dashboards, or attestation features are implemented.

## Runtime components

- CLI config: bind address, model manifest directory, audit log path, local-only mode, RAM-pressure simulation, and optional GGUF spike settings.
- Model registry: loads JSON manifests from `config/models`.
- Router: classifies requests as legal or general and chooses a local route decision.
- Audit store: keeps in-memory events for the process and appends JSONL events to the configured local audit log.
- Model runner adapter: tries configured model runners in order and falls back safely.
- `StubLegalRunner`: default Tier 3 legal completion path.
- `GgufRunner`: optional subprocess runner behind the `gguf-runner-spike` Cargo feature.

## HTTP endpoints

- `GET /health`: returns daemon status, package version, start time, local-only flag, and model count.
- `GET /v1/models`: returns loaded model manifests.
- `POST /v1/route/explain`: returns a route decision, human-readable explanation, and warnings.
- `POST /v1/chat/completions`: accepts a non-streaming OpenAI-compatible request shape and returns a local response with route metadata.
- `GET /v1/audit/events`: returns audit events accumulated in the current daemon process.

Streaming is rejected in preflight. The daemon does not implement an MCP server, dashboard, Tier 4 edge dispatch, Tier 5 cloud dispatch, or signed attestation generation.

## Request flow

1. The daemon validates that messages are present, non-empty, and non-streaming.
2. It combines message text for lightweight classification.
3. It infers `legal` when the model name contains `legal`, metadata declares `domain: "legal"`, or the prompt contains legal keywords such as contract, clause, indemnification, governing law, NDA, or termination.
4. It scans for known document-contained instructions such as attempts to ignore routing rules, disable audit logging, or route to cloud.
5. For legal requests, it selects an installed Tier 3 legal manifest when one is present.
6. If no local legal model is eligible, or simulated RAM pressure is enabled, it fails closed without cloud fallback.
7. For general requests, it returns a Tier 2 route decision with stubbed OS-native dispatch.
8. Route explanations and chat completions append local audit events.

## Route decisions

Legal success:

- `tier: "TIER_3"`
- `route_code: "DOMAIN_MODEL_SELECTED"`
- `cloud_considered: false`
- `cloud_allowed: false`
- `data_left_device: false`

Legal unavailable cases:

- `LEGAL_MODEL_NOT_INSTALLED` when no installed Tier 3 legal manifest is available.
- `LOCAL_MODEL_UNAVAILABLE_RAM_PRESSURE` when RAM pressure is simulated.
- Both fail closed and keep `data_left_device: false`.

General request:

- `tier: "TIER_2"`
- `route_code: "OS_NATIVE_LOCAL_SELECTED"`
- The OS-native bridge itself is not implemented.

## Runner behavior

The default build registers `StubLegalRunner` only. For Tier 3 legal requests, it returns a clearly marked local stub response and no `local_output` metadata.

When built with `--features gguf-runner-spike`, the adapter tries `GgufRunner` before `StubLegalRunner`. `GgufRunner` only supports a request when all of these are true:

- The selected route is Tier 3 legal.
- The selected manifest has `format: "gguf"`.
- `IGNISPROMPT_GGUF_RUNNER_BIN` or `--gguf-runner-bin` points to an existing local executable.
- The selected manifest `localPath` points to an existing local `.gguf` file.
- The configured prompt pack can be read.

If the GGUF path is unavailable or fails, the daemon falls back to `StubLegalRunner`. This keeps the default smoke path independent of Ollama, GGUF tooling, and local model weights.

## Audit events

The daemon appends JSONL audit events to the configured audit log path and stores events in memory for `GET /v1/audit/events`. Events include route code, tier, domain, model id, route explanation, warnings, and whether data left the device.

Audit events are local process records. They are not currently signed, tamper-evident, replicated, encrypted by the daemon, or certified as enterprise audit evidence.

## Data locality

The daemon contains no default cloud provider calls. The current routes set `data_left_device: false`. Optional GGUF flows call local subprocesses and local Ollama when explicitly configured by the operator.

Cloud BYOK, Tier 5, and enterprise provider routing are not implemented.
