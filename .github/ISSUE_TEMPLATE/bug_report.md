---
name: Bug report
about: Report a reproducible issue in the local-first IgnisPrompt or Aethra flow
title: "bug: "
labels: bug
assignees: ""
---

## Summary

Describe the issue and the expected local-first behavior.

## Affected area

- [ ] `ignispromptd`
- [ ] `ignispromptctl`
- [ ] Aethra fixture-backed UI
- [ ] Aethra live-local mode
- [ ] Documentation
- [ ] Other

## Reproduction

1. TODO
2. TODO
3. TODO

## Actual behavior


## Expected behavior


## Local environment

- OS:
- IgnisPrompt commit or version:
- Daemon command, if relevant:
- Aethra command, if relevant:

## Local-first / safety notes

- Do not include secrets, API keys, private prompts, customer data, model weights, audit logs, `target/` artifacts, or `local-evidence/` files.
- Aethra is fixture-backed by default. Live-local behavior should be explicit and local loopback only.
- IgnisPrompt should not add telemetry or cloud calls by default.
