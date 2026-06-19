# Architecture

IgnisPrompt currently ships as a single Rust daemon crate, `ignispromptd`, built with `axum`, `tokio`, `serde`, `clap`, `tracing`, `uuid`, and `chrono`.

The architecture is intentionally small. It validates the local routing control plane before production inference, cloud routing, dashboards, or attestation features are implemented.

## Runtime components

- CLI config: bind address, model manifest directory, audit log path, local-only mode, RAM-pressure simulation, optional experimental MCP stdio mode, and optional GGUF spike settings.
- Model registry: loads JSON manifests from `config/models`.
- Router: classifies requests as legal or general and chooses a local route decision.
- Tier 1 exact-match cache: optional in-memory cache for safe chat completions with identical request and route inputs.
- Audit store: keeps in-memory events for the process and appends JSONL events to the configured local audit log.
- Model runner adapter: tries configured model runners in order and falls back safely.
- Experimental MCP stdio stub: optional newline-delimited JSON-RPC loop exposing `route_explain` plus read-only local observability tools.
- `StubLegalRunner`: default Tier 3 legal completion path.
- `GgufRunner`: optional subprocess runner behind the `gguf-runner-spike` Cargo feature.

## HTTP endpoints

- `GET /health`: returns daemon status, package version, start time, local-only flag, and model count.
- `GET /v1/models`: returns loaded model manifests.
- `GET /v1/capabilities`: returns local-preview connector and capability status metadata for the route ladder, including provider id, tier, connector type, status, availability/configuration booleans, data boundary, reason, confidence, warnings, and last-checked metadata. It is sanitized status only: no secrets, no telemetry, no cloud checks, no runner execution, no polling, and no connector controls.
- `GET /v1/status/models`: returns local preview model and runner status hints, including model identity, manifest/path availability, runner configuration, last-checked metadata, and conservative warnings. This is a debug/status surface only; it is not a model-quality, production-readiness, legal-accuracy, or compliance-evidence claim.
- `GET /v1/status/version`: returns local preview daemon version and release status metadata, including service name, package version, release channel, local-only flag, build profile, nullable git commit, start time, and conservative warnings. It does not perform telemetry, update checking, external release lookup, GitHub calls, cloud calls, or production-readiness validation.
- `POST /v1/route/explain`: returns a route decision, human-readable explanation, and warnings.
- `POST /v1/chat/completions`: accepts an OpenAI-compatible request shape, preserves the current JSON response when `stream` is missing or `false`, and returns a basic SSE-compatible scaffold when `stream` is `true`.
- `GET /v1/audit/events`: returns audit events accumulated in the current daemon process.
- `GET /v1/metrics/sustainability?period=30d`: returns local-only Aethra counterfactual sustainability and cost proxy estimates derived from local audit events.

The default daemon path does not implement a full MCP server surface, dashboard, Tier 4 edge dispatch, Tier 5 cloud dispatch, or signed attestation generation. Its `stream: true` path is a compatibility scaffold that formats an already-produced local completion as SSE chunks; it is not a full incremental token streaming engine.

## Experimental MCP stdio stub

`ignispromptd` can optionally run an experimental MCP-compatible stdio loop instead of the default HTTP daemon when `--experimental-mcp-stdio` is set.

- Transport: newline-delimited stdio JSON-RPC 2.0.
- Lifecycle handled: `initialize`, `notifications/initialized`, and `ping`.
- Tool surface: `tools/list` and `tools/call`.
- Tools exposed: `route_explain`, `audit_events`, `status_version`, and `sustainability_summary`.
- Reused behavior: existing local route classification, route explanation text, adversarial warning detection, local audit append behavior for `route_explain`, and read-only local audit/version/sustainability observability data for the observability tools.

MCP `audit_events` returns object-shaped tool-call `structuredContent` as `{ "events": [...] }` for stricter MCP clients. The HTTP `GET /v1/audit/events` response remains the existing JSON array shape.

This stub is intentionally narrow. It is not a full MCP implementation, does not expose prompts or resources, does not implement MCP HTTP transport, and is documented as experimental rather than production-ready interoperability. See [Contributor MCP Usage](MCP_USAGE.md) for manual stdio examples and current limitations.

## Request flow

1. The daemon validates that messages are present and non-empty.
2. It combines message text for lightweight classification.
3. It infers `legal` when the model name contains `legal`, metadata declares `domain: "legal"`, or the prompt contains legal keywords such as contract, clause, indemnification, governing law, NDA, or termination.
4. It scans for known document-contained instructions such as attempts to ignore routing rules, disable audit logging, or route to cloud.
5. For legal requests, it selects an installed Tier 3 legal manifest when one is present.
6. If no local legal model is eligible, or simulated RAM pressure is enabled, it fails closed without cloud fallback.
7. For safe chat completions only, it may reuse an in-memory Tier 1 exact-match cache entry when the request messages, model or domain hints, selected route inputs, and relevant local policy flags match exactly.
8. For general requests, it returns a Tier 2 route decision with stubbed OS-native dispatch.
9. Route explanations and chat completions append local audit events with optional Aethra v0.1 estimate fields.
10. When `stream: true`, the daemon reuses the same completion result and emits it as SSE-framed JSON chunks ending in `data: [DONE]`.

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

See [Runner providers](RUNNER_PROVIDERS.md) for the current `ModelRunner` trait, `ModelRunnerContext`, provider ordering, and local integration rules.

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

The daemon appends JSONL audit events to the configured audit log path and stores events in memory for `GET /v1/audit/events`. Events include route code, tier, domain, model id, route explanation, warnings, whether data left the device, and cache-hit metadata when a local exact-match entry is reused. When request text is available, events also include optional Aethra v0.1 estimate fields such as `input_tokens_est`, `output_tokens_est`, `baseline_provider`, `baseline_model`, `estimated_cloud_cost_avoided_usd`, `estimated_local_energy_wh`, `estimated_cloud_baseline_wh`, `estimated_carbon_avoided_gco2e`, `methodology_version`, and `confidence`.

Audit events are local process records. They are not currently signed, tamper-evident, replicated, encrypted by the daemon, or certified as enterprise audit evidence. Successful MCP `route_explain` tool calls reuse the same local audit append path as the HTTP route-explain surface.

## Aethra sustainability estimates

`GET /v1/metrics/sustainability?period=30d` summarizes the in-memory local audit events for a day-based period string such as `30d`. It returns request counts, local request rate, tier breakdown, `estimated_cloud_cost_avoided_usd`, `estimated_carbon_avoided_kgco2e`, `estimated_data_kept_local_gb`, baseline provider/model, methodology version, confidence, and a disclaimer.

The v0.1 methodology is intentionally small and local-only:

- token estimate fallback: characters divided by 4
- baseline provider/model: `openai` / `gpt-4.1-mini`
- methodology version: `aethra-impact-0.1`
- confidence: `low`
- coefficients are conservative placeholder estimates in code, not measurements or external lookups

These values are routing-aware counterfactual proxy estimates. They are methodology-dependent, not measured energy use, not actual carbon accounting, not ESG certification, and not production compliance evidence.

## Data locality

The daemon contains no default cloud provider calls. The current routes set `data_left_device: false`. Optional GGUF flows call local subprocesses and local Ollama when explicitly configured by the operator.

The Tier 1 cache is process-local and in-memory only. It is exact-match only, not semantic caching, not distributed, and not shared across daemon restarts. The default bound is `128` entries.

Cloud BYOK, Tier 5, and enterprise provider routing are not implemented.

## Connector and capability status

`GET /v1/capabilities` is a local-preview foundation for exposing sanitized route-ladder metadata to CLIs and Aethra. It currently reports static/default-backed status for local policy guard, Tier 1 exact-match cache, OS-native local bridge, Stub Legal Runner, edge providers, and cloud providers.

The endpoint is deliberately observational. It does not enable cloud routing, call external endpoints, inspect cloud credentials, read secrets, execute model runners, start or stop connectors, or claim production readiness. Cloud providers are reported as disabled by default, and Aethra remains read-only and fixture-backed unless a user explicitly performs manual live-local loads.
