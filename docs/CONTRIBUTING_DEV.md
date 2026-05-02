# Contributing Dev Notes

IgnisPrompt is currently an open-source local daemon scaffold. Keep contributions small, testable, and honest about what is implemented.

## Local setup

Required for the default path:

- Rust and Cargo
- `curl`
- `jq`

Default checks:

```bash
cargo build
cargo test
./scripts/start-dev.sh
./scripts/smoke.sh
```

Run `./scripts/smoke.sh` from another terminal while the daemon is running.

## PR rules

- Preserve local-only behavior.
- Do not add cloud calls unless the task explicitly requires a cloud BYOK feature.
- Preserve route explanations.
- Preserve audit events.
- Preserve adversarial document-instruction handling.
- Keep `StubLegalRunner` as the default fallback unless explicitly told otherwise.
- Keep default build, tests, and smoke working without Ollama, GGUF tooling, or model weights.
- Feature-gated GGUF changes must not break default CI.
- Update README or docs whenever behavior changes.
- Prefer small PRs with focused tests.

## Artifact hygiene

Do not commit:

- model weights
- local evidence bundles
- secrets or credentials
- `target/` artifacts
- `.DS_Store` files

Keep these ignore rules intact:

```text
/models/**
!/models/
!/models/.gitkeep
/local-evidence/**
!/local-evidence/
!/local-evidence/.gitkeep
```

## Claims to avoid

Do not claim unimplemented features are complete. In particular, do not claim the repo implements:

- MCP server
- dashboard
- Tier 2 platform bridge
- Tier 4 edge dispatch
- Tier 5 cloud dispatch
- cloud BYOK routing
- signed attestation generation
- enterprise compliance certification
- production legal advice or solved legal accuracy

Qwen2.5 0.5B is a pipe/demo baseline only, not a settled legal-quality model.

## Documentation expectations

When changing behavior, update the relevant docs:

- route, runner, or audit behavior: `ARCHITECTURE.md`, `SECURITY_MODEL.md`, and `TESTING.md`
- scripts or demos: `DEMO.md` and `TESTING.md`
- model manifests or candidate guidance: `MODELS.md`
- release procedure: `RELEASE_CHECKLIST.md`
- enterprise, attestation, or compliance wording: `ENTERPRISE.md`, `ATTESTATION_REPORT_TEMPLATE.md`, and `COMPLIANCE_NOTES.md`
