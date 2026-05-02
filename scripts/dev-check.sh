#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BIND="${IGNISPROMPT_BIND:-127.0.0.1:8765}"
BASE_URL="${IGNISPROMPT_BASE_URL:-http://${BIND}}"
HEALTH_TIMEOUT_SECONDS="${IGNISPROMPT_HEALTH_TIMEOUT_SECONDS:-60}"
DAEMON_LOG="${IGNISPROMPT_DEV_CHECK_LOG:-$(mktemp "${TMPDIR:-/tmp}/ignisprompt-dev-check.XXXXXX")}"
daemon_pid=""

export IGNISPROMPT_BIND="$BIND"
export IGNISPROMPT_BASE_URL="$BASE_URL"

cleanup() {
  local status=$?
  trap - EXIT INT TERM

  if [[ -n "${daemon_pid:-}" ]] && kill -0 "$daemon_pid" 2>/dev/null; then
    echo "[dev-check] stopping daemon"
    terminate_daemon TERM

    for _ in {1..10}; do
      if ! kill -0 "$daemon_pid" 2>/dev/null; then
        break
      fi
      sleep 0.5
    done

    if kill -0 "$daemon_pid" 2>/dev/null; then
      terminate_daemon KILL
    fi

    wait "$daemon_pid" 2>/dev/null || true
  fi

  if [[ "$status" -ne 0 && -f "$DAEMON_LOG" ]]; then
    echo "[dev-check] daemon log: $DAEMON_LOG"
    tail -n 80 "$DAEMON_LOG" || true
  fi

  exit "$status"
}

terminate_daemon() {
  local signal="$1"

  if terminate_descendants "$daemon_pid" "$signal"; then
    return
  fi

  kill "-$signal" "$daemon_pid" 2>/dev/null || true
}

terminate_descendants() {
  local pid="$1"
  local signal="$2"
  local child
  local found=1

  if command -v pgrep >/dev/null 2>&1; then
    while IFS= read -r child; do
      if [[ -n "$child" ]]; then
        terminate_process_tree "$child" "$signal"
        found=0
      fi
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi

  return "$found"
}

terminate_process_tree() {
  local pid="$1"
  local signal="$2"
  local child

  if command -v pgrep >/dev/null 2>&1; then
    while IFS= read -r child; do
      if [[ -n "$child" ]]; then
        terminate_process_tree "$child" "$signal"
      fi
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi

  kill "-$signal" "$pid" 2>/dev/null || true
}

wait_for_health() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))

  echo "[dev-check] waiting for $BASE_URL/health"
  until curl -fsS "$BASE_URL/health" >/dev/null 2>&1; do
    if [[ -n "${daemon_pid:-}" ]] && ! kill -0 "$daemon_pid" 2>/dev/null; then
      echo "[dev-check] daemon exited before health became ready"
      return 1
    fi

    if (( SECONDS >= deadline )); then
      echo "[dev-check] timed out waiting for health after ${HEALTH_TIMEOUT_SECONDS}s"
      return 1
    fi

    sleep 1
  done
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "[dev-check] cargo build"
cargo build

echo "[dev-check] cargo test"
cargo test

echo "[dev-check] starting daemon with ./scripts/start-dev.sh"
./scripts/start-dev.sh >"$DAEMON_LOG" 2>&1 &
daemon_pid=$!

wait_for_health

echo "[dev-check] ./scripts/smoke.sh"
./scripts/smoke.sh

echo "[dev-check] completed"
