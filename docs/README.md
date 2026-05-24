# IgnisPrompt Documentation

Latest local preview release: `v0.1.5-local-preview`.

IgnisPrompt is currently local-preview infrastructure for local AI routing and inspection. The implemented milestone is the control-plane spine: accept a request, route it locally, explain the route, write a local audit event, and preserve fail-closed behavior for legal requests without cloud fallback.

The default path does not require Ollama, GGUF tooling, model weights, or network access. `StubLegalRunner` is the default Tier 3 legal completion fallback. The feature-gated GGUF subprocess path is an opt-in spike.

## Current implementation

- Rust daemon crate: `crates/ignispromptd`
- Default endpoints: `GET /health`, `GET /v1/models`, `POST /v1/route/explain`, `POST /v1/chat/completions`, `GET /v1/audit/events`
- Experimental stdio MCP stub: `route_explain` plus read-only local observability tools `audit_events`, `status_version`, and `sustainability_summary` exposed by `ignispromptd --experimental-mcp-stdio`
- Model manifests: `config/models/*.json`
- Prompt packs for the GGUF spike: `config/prompts/*.md`
- Default smoke script: `./scripts/smoke.sh`
- Local evidence root: `./local-evidence/`, ignored by git
- Local model root: `./models/`, ignored by git

## Docs map

- [Codex/Agent Instructions](../AGENTS.md): permanent rules for contributors and AI coding agents working in this repository.
- [Codex Handoff](CODEX_HANDOFF.md): current MVP state, known gaps, open post-MVP issues, and recommended next tasks.
- [Architecture](ARCHITECTURE.md): daemon shape, endpoints, route flow, runner fallback behavior, and non-implemented tiers.
- [Aethra MVP Plan](AETHRA.md): conservative read-only dashboard scope, available IgnisPrompt data, API gaps, and first implementation path.
- [Aethra Architecture Plan](AETHRA_ARCHITECTURE.md): proposed dashboard boundary, local-only client shape, screens, contracts, fixtures, and test strategy.
- [Aethra MVP Checkpoint](AETHRA_MVP_CHECKPOINT.md): current local-first dashboard checkpoint, fixture-backed screens, local touchpoints, non-claims, and run/check commands.
- [Aethra Public Demo Package](AETHRA_DEMO_PACKAGE.md): public-safe carousel order, screenshot captions, audience guidance, and demo boundaries.
- [Aethra Sustainability Monitor Checkpoint](AETHRA_SUSTAINABILITY_MILESTONE.md): Phase 1 sustainability monitor milestone across backend metrics, live-local Aethra loading, language guardrails, and review hardening.
- [Aethra Sustainability Monitor Methodology](AETHRA_SUSTAINABILITY_METHODOLOGY.md): v0.1 routing-aware counterfactual proxy methodology, assumptions, limitations, and reviewer checklist.
- [Aethra Sustainability Monitor Demo](AETHRA_SUSTAINABILITY_DEMO.md): demo setup, talk tracks, failure modes, and local report export script for the Sustainability Monitor flow.
- [Adapter Concepts](ADAPTER_CONCEPTS.md): design concepts for possible future local adapter work without claiming implemented support.
- [Local Adapter Implementation Checklist](LOCAL_ADAPTER_IMPLEMENTATION_CHECKLIST.md): future implementation gates for local adapter PRs before any adapter code is written.
- [LiteLLM-Style Local Gateway Plan](LITELLM_LOCAL_GATEWAY_PLAN.md): focused future implementation plan for an OpenAI-compatible local gateway adapter path.
- [Contributor MCP Usage](MCP_USAGE.md): manual stdio MCP examples, current tool scope, `audit_events` structured content notes, and local-only limitations.
- [Local Preview Quickstart](LOCAL_PREVIEW_QUICKSTART.md): first-time local setup for IgnisPrompt + Aethra, live-local loading, and report export.
- [Local Preview Release Checklist](LOCAL_PREVIEW_RELEASE_CHECKLIST.md): repeatable local preview release verification, manual checks, tag steps, and rollback notes.
- [Local Preview 0.1.0 Release Notes Draft](releases/LOCAL_PREVIEW_0_1_0.md): draft release notes, boundaries, limitations, and verification commands.
- [Local Preview v0.1.1 Release Readiness](releases/v0.1.1-local-preview.md): v0.1.1 release-readiness record, published-tag boundary, post-v0.1.1 patch context, safety boundaries, and final checklist notes.
- [Local Preview v0.1.2 Patch Release Record](releases/v0.1.2-local-preview.md): published patch package for post-v0.1.1 MCP compatibility and docs guardrail cleanup.
- [Local Preview v0.1.3 Release Readiness](releases/v0.1.3-local-preview.md): draft release-readiness record for the next local preview package after v0.1.2.
- [Local Preview v0.1.4 Release Readiness](releases/v0.1.4-local-preview.md): draft release-readiness record for the next local preview package after v0.1.3, including the local evidence workflow and Aethra command center arc.
- [Local Preview v0.1.5 Release Readiness](releases/v0.1.5-local-preview.md): release-readiness record for the v0.1.5 local readiness arc, including the local readiness dashboard, CLI readiness diagnostics, readiness quality gate, report export, and readiness package workflow.
- [Runner Providers](RUNNER_PROVIDERS.md): `ModelRunner` trait, `ModelRunnerContext`, provider ordering, and rules for adding new local runners.
- [Demo](DEMO.md): default smoke flow and optional GGUF/Ollama demo flow.
- [Demo Readiness Checklist](DEMO_READINESS_CHECKLIST.md): short pre-demo checks for local-only behavior, synthetic data, evidence handling, and optional GGUF runs.
- [Testing](TESTING.md): build, test, smoke, feature-gated, and local evidence test guidance.
- [Packaging](PACKAGING.md): current source install/build/run paths and the future Homebrew formula plan.
- [Models](MODELS.md): manifest fields, local model placement, and Qwen2.5 0.5B baseline caveat.
- [Security Model](SECURITY_MODEL.md): current local-only security boundaries and known gaps.
- [Threat Model](THREAT_MODEL.md): assets, trust boundaries, threat cases, and mitigations.
- [Roadmap](ROADMAP.md): current scope and planned work without claiming future items are complete.
- [Contributing Dev](CONTRIBUTING_DEV.md): development rules for small local-only PRs.
- [Release Checklist](RELEASE_CHECKLIST.md): pre-release checks for docs, tests, artifacts, and staging hygiene.
- [Codex Tasks](CODEX_TASKS.md): safe task boundaries for Codex work in this repository.
- [Enterprise](ENTERPRISE.md): what exists now and what would be required before enterprise claims.
- [Attestation Template](ATTESTATION_REPORT_TEMPLATE.md): a manual report template only, not an implemented signed attestation feature.
- [Compliance Notes](COMPLIANCE_NOTES.md): compliance posture, legal-advice disclaimer, and evidence handling.

## Explicit non-claims

The repository does not currently implement a production-grade or broad-compatibility MCP server surface, a production dashboard, production-grade token-by-token streaming, production legal inference, production GGUF or ONNX inference, Apple Foundation Models integration, Tier 4 edge dispatch, Tier 5 cloud dispatch, enterprise compliance certification, or signed Local-Only Attestation Report generation.

Qwen2.5 0.5B is documented here only as a pipe/demo baseline for validating the local GGUF path. It is not the settled legal-quality model.

## Artifact policy

Do not commit model weights, local evidence bundles, secrets, generated target artifacts, or `.DS_Store` files. Keep `./models/**` and `./local-evidence/**` ignored by git.
