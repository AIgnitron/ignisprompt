SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

IGNISPROMPT_BIND ?= 127.0.0.1:8765
IGNISPROMPT_BASE_URL ?= http://127.0.0.1:8765
IGNISPROMPT_MODEL_DIR ?= ./config/models
IGNISPROMPT_AUDIT_LOG ?= ./data/audit/events.jsonl

.PHONY: help build test smoke dev-check gguf-build gguf-test gguf-smoke golden bakeoff demo attestation clean-local-evidence

help:
	printf '%s\n' \
	  'IgnisPrompt developer targets:' \
	  '  build                 cargo build' \
	  '  test                  cargo test' \
	  '  smoke                 start the default local daemon, run ./scripts/smoke.sh, stop the daemon' \
	  '  dev-check             run ./scripts/dev-check.sh' \
	  '  gguf-build            cargo build --features gguf-runner-spike' \
	  '  gguf-test             cargo test --features gguf-runner-spike' \
	  '  gguf-smoke            run ./scripts/smoke-gguf-local.sh (requires local GGUF prerequisites)' \
	  '  golden                run ./scripts/run-golden-legal-v0.3.sh (requires local GGUF prerequisites)' \
	  '  bakeoff               run ./scripts/run-alpha-legal-bakeoff-v0.1.sh (requires local GGUF prerequisites)' \
	  '  demo                  run ./scripts/demo-local-legal-review.sh (requires local GGUF prerequisites)' \
	  '  attestation           run ./scripts/generate-local-only-attestation.sh' \
	  '  clean-local-evidence  remove generated evidence under ./local-evidence/ only'

build:
	cargo build

test:
	cargo test

smoke:
	@set -eu -o pipefail; \
	log_file="$$(mktemp -t ignisprompt-smoke)"; \
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

gguf-build:
	cargo build --features gguf-runner-spike

gguf-test:
	cargo test --features gguf-runner-spike

gguf-smoke:
	./scripts/smoke-gguf-local.sh

golden:
	./scripts/run-golden-legal-v0.3.sh

bakeoff:
	./scripts/run-alpha-legal-bakeoff-v0.1.sh

demo:
	./scripts/demo-local-legal-review.sh

attestation:
	./scripts/generate-local-only-attestation.sh

clean-local-evidence:
	mkdir -p local-evidence
	find local-evidence -mindepth 1 -maxdepth 1 ! -name '.gitkeep' -exec rm -rf {} +
