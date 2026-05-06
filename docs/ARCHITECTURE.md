# Architecture

IgnisPrompt currently ships as a single Rust daemon crate, `ignispromptd`, built with `axum`, `tokio`, `serde`, `clap`, `tracing`, `uuid`, and `chrono`.

The architecture is intentionally small. It validates the local routing control plane before production inference, cloud routing, dashboards, or attestation features are implemented.

## Runtime components

- CLI config: bind address, model manifest directory, audit log path, local-only mode, RAM-pressure simulation, and optional GGUF spike settings.
- Model registry: loads JSON manifests from `config/models`.
- Router: classifies requests as legal or general and chooses a local route decision.
- Tier 1 exact-match cache: optional in-memory cache for safe chat completions with identical request and route inputs.
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
7. For safe chat completions only, it may reuse an in-memory Tier 1 exact-match cache entry when the request messages, model or domain hints, selected route inputs, and relevant local policy flags match exactly.
8. For general requests, it returns a Tier 2 route decision with stubbed OS-native dispatch.
9. Route explanations and chat completions append local audit events.

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

Tier 1 exact-match cache behavior:

- Exact-match cache hits are chat-completion-only and do not change `route_code`.
- The original safe local route decision remains in `route`.
- Chat completion responses and audit events add explicit cache metadata for hits.
- Adversarial, rejected, fail-closed, or non-local responses are not cached.
- The in-memory cache is bounded to `128` entries by default and evicts the oldest retained entry first when full.
- Operators can change the bound with `IGNISPROMPT_EXACT_MATCH_CACHE_MAX_ENTRIES` or `--exact-match-cache-max-entries`.

## Runner behavior

The default build registers `StubLegalRunner` only. For Tier 3 legal requests, it returns a clearly marked local stub response and no `local_output` metadata.

When built with `--features gguf-runner-spike`, the adapter tries `GgufRunner` before `StubLegalRunner`. `GgufRunner` only supports a request when all of these are true:

- The selected route is Tier 3 legal.
- The selected manifest has `format: "gguf"`.
- `IGNISPROMPT_GGUF_RUNNER_BIN` or `--gguf-runner-bin` supplies an explicit local binary path, not a bare executable name.
- That configured local runner path points to an existing local executable.
- The selected manifest `localPath` points to an existing local `.gguf` file.
- The configured prompt pack can be read.

At startup, the daemon logs whether the optional GGUF subprocess path is configured and, when it is configured correctly, which local binary path will be used.

If the GGUF path is unavailable, configured with a non-explicit runner name, or fails at runtime, the daemon falls back to `StubLegalRunner`. This keeps the default smoke path independent of Ollama, GGUF tooling, and local model weights.

## Audit events

The daemon appends JSONL audit events to the configured audit log path and stores events in memory for `GET /v1/audit/events`. Events include route code, tier, domain, model id, route explanation, warnings, whether data left the device, and cache-hit metadata when a local exact-match entry is reused.

Audit events are local process records. They are not currently signed, tamper-evident, replicated, encrypted by the daemon, or certified as enterprise audit evidence.

## Data locality

The daemon contains no default cloud provider calls. The current routes set `data_left_device: false`. Optional GGUF flows call local subprocesses and local Ollama when explicitly configured by the operator.

The Tier 1 cache is process-local and in-memory only. It is exact-match only, not semantic caching, not distributed, and not shared across daemon restarts. The default bound is `128` entries.

Cloud BYOK, Tier 5, and enterprise provider routing are not implemented.
