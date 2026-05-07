# Release Checklist

Use this checklist before tagging or publishing a release. It is intentionally conservative because the project handles local prompts, legal-domain routing, model files, and evidence bundles.

## Scope and claims

- Confirm the release notes only claim implemented behavior.
- Confirm Qwen2.5 0.5B is described as a pipe/demo baseline, not the settled legal-quality model.
- Confirm no text claims production legal advice, solved legal accuracy, enterprise compliance certification, formal certification, production attestation, or enterprise attestation.
- Confirm MCP, dashboard, Tier 4, Tier 5, and signed attestation are not described as implemented unless code and tests have landed.

## Repo hygiene and security gate

Confirm ignored artifact paths are still behaving as intended:

```bash
git status --short --ignored models local-evidence
git ls-files 'models/**' 'local-evidence/**'
```

Expected result:

- `models/**` is ignored unless a placeholder file such as `.gitkeep` is intentionally tracked
- `local-evidence/**` is ignored unless a placeholder file such as `.gitkeep` is intentionally tracked
- no generated evidence bundle, model weight, or audit JSONL file is staged

Confirm these are not tracked or staged:

- `models/**` model weights
- `local-evidence/**` evidence bundles
- `target/**`
- `data/audit/*.jsonl`
- `.DS_Store`

Useful staging checks:

```bash
git status --short
git diff --stat
git diff --cached --stat
git diff --cached --name-only
```

Confirm no obvious secrets are present in the tracked or staged tree. Use your organization-standard secret scanner if one exists. At minimum, inspect the staged file list and run a conservative heuristic scan such as:

```bash
rg -n 'BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY|ghp_|gho_|sk-' \
  . -g '!local-evidence/**' -g '!models/**' -g '!target/**'
```

## Default validation

Run the default no-model release gate first. This is the required baseline for the current scaffold:

```bash
cargo build
cargo test
./scripts/dev-check.sh
```

`./scripts/dev-check.sh` already covers:

- `cargo build`
- `cargo test`
- daemon startup through `./scripts/start-dev.sh`
- default local smoke through `./scripts/smoke.sh`

If you need the lower-level manual path for debugging, use:

```bash
./scripts/start-dev.sh
./scripts/smoke.sh
```

## Optional local runner and evidence validation

Only run these when the local prerequisites are intentionally present. These are not part of the default no-model CI gate:

```bash
cargo test --all-features
./scripts/smoke-gguf-local.sh
./scripts/demo-local-legal-review.sh
./scripts/run-golden-legal-v0.3.sh
./scripts/run-alpha-legal-bakeoff-v0.1.sh
```

These optional scripts may create evidence under `./local-evidence/`. Do not commit it.

Recommended interpretation:

- `cargo test --all-features`: optional feature coverage
- `./scripts/smoke-gguf-local.sh`: optional GGUF local smoke
- `./scripts/demo-local-legal-review.sh`: optional public local legal-review demo
- `./scripts/run-golden-legal-v0.3.sh`: optional Golden Legal subset
- `./scripts/run-alpha-legal-bakeoff-v0.1.sh`: optional candidate comparison bakeoff

If you are preparing a release that only covers the default local scaffold path, it is acceptable to leave the GGUF, golden, bakeoff, and demo checks marked as not-run due to missing local prerequisites. Do not claim those paths were validated if they were not.

## Local-only and evidence checks

Confirm the current local-only guarantees are still true:

- default build and smoke path do not require cloud access
- legal unavailable cases still fail closed
- route responses still include explanations
- audit events are still emitted for route explanations and chat completions
- adversarial document-instruction handling still returns warnings and preserves policy
- `StubLegalRunner` remains the default fallback unless a release note explicitly documents a code change

For the developer evidence template path, run:

```bash
./scripts/generate-local-only-attestation.sh
```

Confirm the generated bundle:

- is written under `./local-evidence/attestation/<timestamp>/`
- records git SHA
- records build mode
- records daemon binary path and SHA-256
- includes `/health`
- includes a Tier 3 legal route explanation
- includes an audit snapshot
- includes evidence that `data_left_device=false`
- includes ignore-safety checks for `models/**` and `local-evidence/**`

Do not describe that bundle as a signed attestation, certification, enterprise compliance artifact, or production attestation.

## Documentation checks

- README links to key docs.
- `docs/README.md` links to the documentation set.
- Behavior changes are reflected in `ARCHITECTURE.md`, `TESTING.md`, and any relevant security, threat, or attestation docs.
- Any new demo or evidence script has documentation and clear prerequisites.
- Any new evidence output location is ignored by git.
- Release notes and PR descriptions do not overstate compliance, certification, legal accuracy, or attestation scope.

## CI and tag gate

Confirm GitHub Actions is green on the exact commit you intend to tag.

If you use `gh`, these commands are useful:

```bash
gh run list --limit 5
gh run watch <run-id>
```

Before creating a release tag, make sure the worktree is clean:

```bash
git status --short
```

Create the tag only after the checklist above is complete:

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

Record in the release notes:

- which checks were run
- which optional GGUF or evidence paths were intentionally skipped
- which commit and tag were released
