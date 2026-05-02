# Release Checklist

Use this checklist before tagging or publishing a release. It is intentionally conservative because the project handles local prompts, legal-domain routing, model files, and evidence bundles.

## Scope and claims

- Confirm the release notes only claim implemented behavior.
- Confirm Qwen2.5 0.5B is described as a pipe/demo baseline, not the settled legal-quality model.
- Confirm no text claims production legal advice, solved legal accuracy, enterprise compliance certification, or enterprise attestation.
- Confirm MCP, dashboard, Tier 4, Tier 5, and signed attestation are not described as implemented unless code and tests have landed.

## Default validation

```bash
cargo build
cargo test
./scripts/start-dev.sh
./scripts/smoke.sh
```

Run the smoke script while the daemon is healthy.

## Optional feature validation

Only run these when local prerequisites are intentionally present:

```bash
cargo test --all-features
./scripts/smoke-gguf-local.sh
./scripts/demo-local-legal-review.sh
./scripts/run-golden-legal-v0.3.sh
./scripts/run-alpha-legal-bakeoff-v0.1.sh
```

These optional scripts may create evidence under `./local-evidence/`. Do not commit it.

## Artifact checks

Confirm these are not staged:

- `models/**`
- `local-evidence/**`
- `target/**`
- secrets, credentials, or tokens
- `.DS_Store`

Useful commands:

```bash
git status --short
git diff --stat
git diff --cached --name-only
```

If files are staged, inspect them before committing:

```bash
git diff --cached --stat
git diff --cached --name-only
```

## Documentation checks

- README links to key docs.
- `docs/README.md` links to the documentation set.
- Behavior changes are reflected in `ARCHITECTURE.md`, `TESTING.md`, and any relevant security or model docs.
- Any new demo script has documentation and clear prerequisites.
- Any new evidence output location is ignored by git.

## Local-only checks

- Default build and smoke path do not require cloud access.
- Legal unavailable cases still fail closed.
- Route responses still include explanations.
- Audit events are still emitted for route explanations and chat completions.
- Adversarial document-instruction handling still returns warnings and preserves policy.
