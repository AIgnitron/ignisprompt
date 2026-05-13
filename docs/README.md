# IgnisPrompt Documentation

IgnisPrompt is currently a small local Rust daemon scaffold. The implemented milestone is the control-plane spine: accept a request, route it locally, explain the route, write a local audit event, and preserve fail-closed behavior for legal requests without cloud fallback.

The default path does not require Ollama, GGUF tooling, model weights, or network access. `StubLegalRunner` is the default Tier 3 legal completion fallback. The feature-gated GGUF subprocess path is an opt-in spike.

## Current implementation

- Rust daemon crate: `crates/ignispromptd`
- Default endpoints: `GET /health`, `GET /v1/models`, `POST /v1/route/explain`, `POST /v1/chat/completions`, `GET /v1/audit/events`
- Experimental stdio MCP stub: one `route_explain` tool exposed by `ignispromptd --experimental-mcp-stdio`
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

The repository does not currently implement a production-grade or broad-compatibility MCP server surface, a dashboard, production-grade token-by-token streaming, production legal inference, production GGUF or ONNX inference, Apple Foundation Models integration, Tier 4 edge dispatch, Tier 5 cloud dispatch, enterprise compliance certification, or signed Local-Only Attestation Report generation.

Qwen2.5 0.5B is documented here only as a pipe/demo baseline for validating the local GGUF path. It is not the settled legal-quality model.

## Artifact policy

Do not commit model weights, local evidence bundles, secrets, generated target artifacts, or `.DS_Store` files. Keep `./models/**` and `./local-evidence/**` ignored by git.
