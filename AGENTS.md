# IgnisPrompt Codex Instructions

## Project

Repo: https://github.com/AIgnitron/ignisprompt  
Local path: `~/Downloads/Aignitron/IgnisPrompt/Code/ignisprompt`

## How to use this file

Codex should read and follow this file for all future IgnisPrompt tasks. Future prompts may be short and should not need to repeat these permanent rules.

Also read `docs/CODEX_HANDOFF.md` at the start of IgnisPrompt tasks for the current project state, open follow-up work, and recommended next tasks.

## Permanent rules

- Do not add cloud calls.
- Do not commit model weights.
- Do not commit local evidence.
- Do not commit generated transcripts.
- Do not commit demo bundles.
- Do not commit attestation bundles.
- Do not commit audit logs.
- Do not commit `target/` artifacts.
- Do not commit `dist/` artifacts.
- Do not commit `.DS_Store`.
- Do not commit secrets.
- Do not commit `data/audit/*.jsonl`.
- Keep generated output under ignored `local-evidence/`.
- Keep `models/` ignored.
- Preserve local-only behavior.
- Preserve route explanations.
- Preserve audit events.
- Preserve adversarial document-instruction handling.
- Keep `StubLegalRunner` as the default fallback.
- Default build/test/smoke must work without Ollama, GGUF, external model weights, or local model binaries.
- Do not claim production legal advice.
- Do not claim legal accuracy is solved.
- Do not claim enterprise compliance certification.
- Do not claim formal attestation.
- Do not claim production readiness.
- Keep docs conservative and accurate.
- If generated/model output is invalid, report it honestly. Do not hide failures.

## Default baseline

Before starting a task:

```bash
git checkout main
git pull origin main
git status --short
git log --oneline -5
gh pr list --state open --limit 20
```

If the worktree is not clean or there are unexpected open PRs, stop and report before editing.

## Branch and PR workflow

- Use a small task branch from clean `main`.
- Keep each PR narrowly scoped.
- Do not mix unrelated fixes.
- If a task discovers a bug outside the requested scope, pause and report before mixing it into the PR.
- Prefer draft PRs until the user asks to mark ready or merge.
- Do not merge a PR unless explicitly instructed.
- If CI fails, inspect logs and make the smallest safe fix.
- Do not address unrelated CI deprecation warnings unless the task is specifically about CI maintenance.

## Verification defaults

For code or script changes, run the relevant subset of:

```bash
cargo build
cargo test
make dev-check
git diff --check
git status --short
git status --short --ignored models local-evidence
```

For optional local GGUF/demo changes, run when local prerequisites are available:

```bash
make gguf-smoke
make golden
make bakeoff
make demo
./scripts/demo-transcript.sh
```

For docs-only changes, run at least:

```bash
make dev-check
git diff --check
git status --short
git status --short --ignored models local-evidence
```

If a command is skipped, report the exact missing prerequisite.

## Reporting format

Final reports should include:

- branch or PR URL
- files changed
- verification commands run
- commands skipped, if any, and why
- CI status, when a PR is opened or merged
- final `git status --short`
- whether generated evidence, models, audit logs, and transcripts stayed ignored

For PR merges, report:

- PR URL
- merge commit
- main CI status
- final git status
- latest `git log --oneline -5` when requested

## GitHub issue hygiene

- If a similar issue already exists, do not create a duplicate.
- When closing an issue after a PR, add a short comment linking the PR unless GitHub auto-closed it.
- Keep issue language conservative and avoid production/legal/compliance overclaims.
