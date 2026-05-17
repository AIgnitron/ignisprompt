# Model and Runner Status Endpoint Design

## 1. Status

Status: design proposal only.

This document proposes a safe local IgnisPrompt daemon endpoint for model and runner status hints. It does not implement the endpoint, change routing behavior, add telemetry, add cloud calls, add model install/delete controls, add runner controls, or make production-readiness claims.

The intended downstream consumer is Aethra, the Local AI Routing Observatory. Aethra should continue to describe these values as model and runner status hints.

## 2. Goal

Add a local read-only IgnisPrompt endpoint that reports conservative model and runner status hints for configured local model candidates and runners.

The endpoint should help answer:

- Which models are configured?
- Which model files appear staged locally?
- Which runner path/provider is configured?
- Which candidates are unavailable or unknown?
- What status can be safely shown in Aethra without implying production readiness?

The goal is observability, not control.

## 3. Non-goals

This design does not include:

- telemetry
- analytics
- cloud calls
- cloud model provider checks
- SaaS backend integration
- authentication provider integration
- model downloads
- model install/delete controls
- runner start/stop controls
- model quality scoring
- legal accuracy scoring
- production readiness claims
- compliance certification
- enterprise certification
- formal attestation
- measured energy use
- carbon accounting
- ESG evidence
- not certified sustainability reporting

## 4. Current state

IgnisPrompt currently exposes local APIs including:

- `GET /health`
- `GET /v1/models`
- `POST /v1/route/explain`
- `GET /v1/audit/events`

Aethra can manually load live local metadata from:

- `GET /health`
- `GET /v1/models`
- `GET /v1/audit/events`

Aethra also requires explicit confirmation before live local `POST /v1/route/explain`, because that endpoint appends a local audit event.

The current `/v1/models` endpoint is useful for configured model manifests, but it should not be treated as a full runner readiness or model quality signal.

## 5. Proposed endpoint

Recommended endpoint:

```text
GET /v1/status/models
```

Alternative names considered:

```text
GET /v1/models/status
GET /v1/runners/status
GET /v1/status/model-runners
```

Recommended name: `GET /v1/status/models`.

Rationale:

- Clearly read-only.
- Keeps status separate from model configuration.
- Allows future expansion while staying scoped to model-level status hints.
- Avoids implying runner control.

## 6. Proposed response shape

Example response:

```json
{
  "schemaVersion": "v0.1",
  "generatedAt": "2026-05-15T00:00:00Z",
  "source": "local-daemon",
  "statusHints": [
    {
      "modelId": "legal-qwen2.5-7b-instruct-q4-k-m-local",
      "displayName": "Qwen2.5 7B Instruct Q4_K_M Local Legal Adapter",
      "tier": 3,
      "domains": ["legal", "contracts", "compliance"],
      "configured": true,
      "localPathDeclared": true,
      "localPathExists": true,
      "runnerConfigured": true,
      "runnerKind": "ollama-gguf-wrapper",
      "runnerExecutableExists": true,
      "availability": "staged",
      "lastCheckedAt": "2026-05-15T00:00:00Z",
      "warnings": [
        "Status is a local hint, not a production readiness claim."
      ]
    }
  ]
}
```

## 7. Field semantics

Top-level fields:

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Response contract version. |
| `generatedAt` | Time the daemon generated the response. |
| `source` | Should be `local-daemon`. |
| `statusHints` | Array of model status hint records. |

Per-model fields:

| Field                   | Meaning                                                                   |
| ------------------------| --------------------------------------------------------------------------|
| `modelId`               | Stable model id from the model manifest.                                  |
| `displayName`           | Human-readable model name.                                                |
| `tier`                  | Routing tier from the manifest/config.                                    |
| `domains`               | Declared domains from manifest/config.                                    |
| `configured`            | Model is configured in IgnisPrompt.                                       |
| `localPathDeclared`     | Manifest declares a local path.                                           |
| `localPathExists`       | Daemon-side local filesystem check found the path.                        |
| `runnerConfigured`      | A runner/provider path is configured for this model.                      |
| `runnerKind`            | Conservative runner label, not a readiness guarantee.                     |
| `runnerExecutableExists`| Daemon-side check found the configured runner executable, if applicable.  |
| `availability`          | Conservative enum described below.                                        |
| `lastCheckedAt`         | Timestamp for this status hint generation.                                |
| `warnings`              | Human-readable conservative warnings.                                     |

## 8. Availability enum

Recommended availability values:

```text
configured
staged
runner-missing
model-file-missing
unavailable
unknown
```

Meanings:

| Value                 | Meaning                                                                                |
| ----------------------| ---------------------------------------------------------------------------------------|
| `configured`          | Manifest/config exists, but no stronger local readiness hint is available.             |
| `staged`              | Required local file/path checks passed, but no model quality/readiness claim is made.  |
| `runner-missing`      | Model is configured, but expected runner executable/config appears missing.            |
| `model-file-missing`  | Model local path is declared but file/path is missing.                                 |
| `unavailable`         | Daemon can identify the model as not currently usable locally.                         |
| `unknown`             | Daemon cannot determine a safer status.                                                |

Avoid names such as:

- `ready`
- `production-ready`
- `verified`
- `certified`
- `legal-quality`
- `compliant`

## 9. Safety boundaries

The endpoint must not:

- call cloud services
- download models
- install models
- delete models
- start runners
- stop runners
- run inference
- mutate audit logs
- mutate model config
- upload telemetry
- report measured energy/carbon values
- claim production readiness
- claim legal accuracy
- claim compliance certification

The endpoint may perform lightweight local checks such as:

- reading configured model manifests
- checking whether declared local paths exist
- checking whether configured local runner executable paths exist
- reporting conservative warnings

## 10. Error handling

The endpoint should return a successful response even if some models are unavailable. Per-model failures should be represented as status hints instead of failing the entire response.

Examples:

- Missing model file: `availability: "model-file-missing"`
- Missing runner executable: `availability: "runner-missing"`
- Unknown state: `availability: "unknown"`

The endpoint should return an HTTP error only when the daemon itself cannot build a valid response.

## 11. Aethra display guidance

Aethra should continue using conservative language:

- model and runner status hints
- manifest-derived hints
- local daemon status hints
- not production readiness
- not legal accuracy
- not compliance certification

Aethra should not show:

- ready for production
- certified
- legal-grade
- compliant
- verified model quality

Aethra can show:

- configured
- staged locally
- model file missing
- runner missing
- unknown
- local hints only

## 12. Testing plan

Implementation PRs should add focused daemon tests for:

- endpoint returns a valid response with configured models
- missing model path reports `model-file-missing`
- missing runner executable reports `runner-missing`
- no cloud calls are made
- response schema is stable
- warnings are present for conservative status language

Aethra follow-up tests should cover:

- client contract parsing
- live local success
- unsupported schema
- empty status list
- model status hint display copy

Validation should include:

```bash
cargo test
cargo build
git diff --check
```

For Aethra follow-up work:

```bash
cd apps/aethra
npm test
npm run build
npm run smoke:local-api -- --start-daemon
```

Do not run model bakeoffs for this endpoint design or initial implementation.

## 13. Rollout plan

Recommended small PR sequence:

1. Design doc only.
2. Add daemon response structs and endpoint route with fixture/config-derived status hints.
3. Add daemon tests for missing model path and missing runner executable.
4. Add Aethra client contract support.
5. Add manual Aethra live local display for `GET /v1/status/models`.
6. Extend Aethra local API smoke coverage for the new endpoint.

Each step should preserve:

- local-only behavior
- no telemetry
- no cloud calls
- no model controls
- no runner controls
- conservative status wording

## 14. Open questions

- Should status generation check filesystem paths on every request, or cache briefly?
- Should runner executable checks be limited to configured wrapper paths?
- Should the endpoint include host resource hints, or should that be a separate design?
- Should status hints include the active route tier mapping, or stay manifest-focused?
- Should Aethra replace `/v1/models` on the Model / Runner Status screen, or show both sources separately?
