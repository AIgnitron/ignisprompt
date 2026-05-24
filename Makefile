SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

IGNISPROMPT_BIND ?= 127.0.0.1:8765
IGNISPROMPT_BASE_URL ?= http://127.0.0.1:8765
IGNISPROMPT_MODEL_DIR ?= ./config/models
IGNISPROMPT_AUDIT_LOG ?= ./data/audit/events.jsonl

.PHONY: help build test smoke dev-check security-check readiness-check operator-check evidence-check hidden-unicode-check secret-scan cargo-audit sbom-dry-run gguf-build gguf-test gguf-smoke golden bakeoff demo demo-transcript attestation clean-local-evidence

help:
	printf '%s\n' \
	  'IgnisPrompt developer targets:' \
	  '  build                 cargo build' \
	  '  test                  cargo test' \
	  '  smoke                 start the default local daemon, run ./scripts/smoke.sh, stop the daemon' \
	  '  dev-check             run ./scripts/dev-check.sh' \
	  '  security-check        run deterministic local security review helper checks' \
	  '  readiness-check       run local readiness CLI/Aethra alignment checks' \
	  '  operator-check        run local operator console CLI/Aethra alignment checks' \
	  '  evidence-check        run local evidence workflow regression checks' \
	  '  hidden-unicode-check  scan tracked text files for hidden Unicode controls' \
	  '  secret-scan           scan tracked text files for obvious accidental secrets' \
	  '  cargo-audit           optional cargo-audit advisory check when installed' \
	  '  sbom-dry-run          show optional local SBOM generation status' \
	  '  gguf-build            cargo build --features gguf-runner-spike' \
	  '  gguf-test             cargo test --features gguf-runner-spike' \
	  '  gguf-smoke            start the GGUF local daemon, run ./scripts/smoke-gguf-local.sh, stop the daemon' \
	  '  golden                run ./scripts/run-golden-legal-v0.3.sh (requires local GGUF prerequisites)' \
	  '  bakeoff               run ./scripts/run-alpha-legal-bakeoff-v0.1.sh (requires local GGUF prerequisites)' \
	  '  demo                  run ./scripts/demo-local-legal-review.sh (requires local GGUF prerequisites)' \
	  '  demo-transcript       write transcript.md from the latest ignored demo evidence bundle' \
	  '  attestation           run ./scripts/generate-local-only-attestation.sh' \
	  '  clean-local-evidence  remove generated evidence under ./local-evidence/ only'

build:
	cargo build

test:
	cargo test

smoke:
	@set -eu -o pipefail; \
	log_file="$$(mktemp "$${TMPDIR:-/tmp}/ignisprompt-smoke.XXXXXX")"; \
	daemon_pid=""; \
	trap 'if [ -n "$$daemon_pid" ] && kill -0 "$$daemon_pid" >/dev/null 2>&1; then kill "$$daemon_pid" >/dev/null 2>&1 || true; wait "$$daemon_pid" >/dev/null 2>&1 || true; fi' EXIT; \
	IGNISPROMPT_BIND="$(IGNISPROMPT_BIND)" IGNISPROMPT_MODEL_DIR="$(IGNISPROMPT_MODEL_DIR)" IGNISPROMPT_AUDIT_LOG="$(IGNISPROMPT_AUDIT_LOG)" ./scripts/start-dev.sh >"$$log_file" 2>&1 & \
	daemon_pid=$$!; \
	for attempt in $$(seq 1 60); do \
	  if curl -fsS "$(IGNISPROMPT_BASE_URL)/health" >/dev/null 2>&1; then \
	    IGNISPROMPT_BASE_URL="$(IGNISPROMPT_BASE_URL)" ./scripts/smoke.sh; \
	    exit 0; \
	  fi; \
	  sleep 1; \
	done; \
	echo "daemon did not become healthy at $(IGNISPROMPT_BASE_URL)" >&2; \
	echo "daemon log: $$log_file" >&2; \
	exit 1

dev-check:
	./scripts/dev-check.sh

security-check:
	./scripts/check-hidden-unicode.sh
	./scripts/check-secrets-local.sh

readiness-check:
	./scripts/readiness-check.sh

operator-check:
	./scripts/operator-check.sh

evidence-check:
	./scripts/evidence-check.sh

hidden-unicode-check:
	./scripts/check-hidden-unicode.sh

secret-scan:
	./scripts/check-secrets-local.sh

cargo-audit:
	./scripts/cargo-audit-local.sh

sbom-dry-run:
	./scripts/generate-sbom-local.sh --dry-run

gguf-build:
	cargo build --features gguf-runner-spike

gguf-test:
	cargo test --features gguf-runner-spike

gguf-smoke:
	@set -eu -o pipefail; \
	log_file="$$(mktemp "$${TMPDIR:-/tmp}/ignisprompt-gguf-smoke.XXXXXX")"; \
	daemon_pid=""; \
	trap 'if [ -n "$$daemon_pid" ] && kill -0 "$$daemon_pid" >/dev/null 2>&1; then kill "$$daemon_pid" >/dev/null 2>&1 || true; wait "$$daemon_pid" >/dev/null 2>&1 || true; fi' EXIT; \
	IGNISPROMPT_GGUF_RUNNER_BIN="$${IGNISPROMPT_GGUF_RUNNER_BIN:-./scripts/ollama-gguf-runner.sh}" \
	OLLAMA_HOST="$${OLLAMA_HOST:-http://127.0.0.1:11434}" \
	OLLAMA_NO_CLOUD="$${OLLAMA_NO_CLOUD:-true}" \
	cargo run -p ignispromptd --features gguf-runner-spike -- \
	  --bind "$(IGNISPROMPT_BIND)" \
	  --model-dir "$(IGNISPROMPT_MODEL_DIR)" \
	  --audit-log "$(IGNISPROMPT_AUDIT_LOG)" \
	  --local-only >"$$log_file" 2>&1 & \
	daemon_pid=$$!; \
	for attempt in $$(seq 1 60); do \
	  if curl -fsS "$(IGNISPROMPT_BASE_URL)/health" >/dev/null 2>&1; then \
	    IGNISPROMPT_BASE_URL="$(IGNISPROMPT_BASE_URL)" ./scripts/smoke-gguf-local.sh; \
	    exit 0; \
	  fi; \
	  sleep 1; \
	done; \
	echo "GGUF daemon did not become healthy at $(IGNISPROMPT_BASE_URL)" >&2; \
	echo "daemon log: $$log_file" >&2; \
	exit 1

golden:
	./scripts/run-golden-legal-v0.3.sh

bakeoff:
	./scripts/run-alpha-legal-bakeoff-v0.1.sh

demo:
	./scripts/demo-local-legal-review.sh

demo-transcript:
	./scripts/demo-transcript.sh

attestation:
	./scripts/generate-local-only-attestation.sh

clean-local-evidence:
	mkdir -p local-evidence
	find local-evidence -mindepth 1 -maxdepth 1 ! -name '.gitkeep' -exec rm -rf {} +
