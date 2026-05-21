# Local Preview Quickstart

This quickstart runs the current IgnisPrompt daemon and Aethra dashboard locally. It is intended for a first-time local preview user.

## 1. Clone The Repo

```bash
git clone https://github.com/AIgnitron/ignisprompt.git
cd ignisprompt
```

## 2. Install Required Tools

Install:

- Rust and Cargo: https://rustup.rs/
- Node.js and npm
- `jq`
- `curl`
- `rg` / ripgrep

`rg` is required by `./scripts/check-sustainability-language.sh`, which is part of the default developer check.

macOS Homebrew example:

```bash
brew install rustup node jq curl ripgrep
rustup-init
```

Use your platform's normal package manager if you are not on macOS.

## 3. Run The Default Check

```bash
./scripts/dev-check.sh
```

This builds and tests the Rust daemon, starts the local-only daemon, runs the smoke script, checks sustainability language, and stops the daemon.

No model weights, cloud key, telemetry, Ollama, or GGUF tooling are required for the default path.

## 4. Start The Daemon

In terminal 1:

```bash
./scripts/start-dev.sh
```

The daemon should listen at:

```text
http://127.0.0.1:8765
```

Optional sanity check from terminal 2:

```bash
curl -fsS http://127.0.0.1:8765/health | jq .
curl -fsS http://127.0.0.1:8765/v1/status/version | jq .
cargo run -p ignispromptctl -- sustainability --period 30d
```

`GET /v1/status/version` reports local preview support/debugging metadata such as daemon service, crate version, release channel, local-only flag, build profile, start time, and conservative warning language. It is not an update checker, telemetry mechanism, release lookup, or cloud call.

`ignispromptctl sustainability --period 30d` prints an aggregate local sustainability summary from `GET /v1/metrics/sustainability?period=30d`. It supports `7d`, `30d`, and `90d`, defaults to `30d`, and has an optional `--json` mode. The command is local-only and does not include prompts, raw audit text, PII, machine identifiers, telemetry, cloud calls, GitHub lookups, external coefficient lookup, persistence, or uploads.

## 5. Start Aethra

In terminal 2:

```bash
cd apps/aethra
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## 6. Use Fixture Mode First

Aethra starts in fixture mode by default. Fixture mode is useful for deterministic local preview, screenshots, and review without a live daemon dependency.

The app shell includes a local preview banner that summarizes the current boundary: fixture mode is default, live-local loading is manual, Aethra sends no telemetry, makes no cloud calls by default, and is not a production deployment.

Each main page includes a small "What this page shows" panel that explains the local preview data on that page, including when values come from fixtures and when they require a manual live-local refresh.

The Overview screen shows live-local connection diagnostics. In fixture mode, diagnostics should report that fixture mode is active and that Aethra is not contacting the daemon.

Overview also includes a Local Commands panel with copyable local preview helper commands for starting the daemon, starting Aethra, running smoke/release checks, and inspecting local API endpoints. Copying a command only writes text to your browser clipboard; Aethra does not execute commands, call telemetry, or contact remote services.

Aethra panels now include clearer empty states for fixture mode, missing live-local data, unavailable daemon responses, and panels that need manual refresh. These messages explain what is missing, why fixture fallback may still be visible, and the local command or refresh action to try next.

Routing Explorer includes clearer fixture-backed route examples, a compact decision breakdown for tier, route code, local-only policy signals, warnings, and explanation text, and a browser-only route decision JSON copy helper. Copying route decision JSON does not persist state, execute commands, upload data, or contact remote services.

Audit Events includes browser-local search and warning/cache filters for the displayed audit records. The selected event detail can copy `request_id` to the browser clipboard only; it does not persist copied state, execute commands, or call remote services.

## 7. Switch To Live-Local Mode

In Aethra:

1. Switch the data mode to live-local.
2. Keep the daemon URL on loopback, such as `http://127.0.0.1:8765`.
3. Load health.
4. Load daemon version status on the Overview screen.
5. Load models.
6. Load model and runner status hints.
7. Load audit events.
8. Open Sustainability Preview.
9. Manually load sustainability metrics.

Live-local loading is explicit/manual. Aethra can show daemon version status as local preview support/debugging metadata. It is not an update checker or telemetry mechanism. Aethra does not poll, persist live data in local storage or session storage, call telemetry, call cloud services, upload data, perform release lookups, or change IgnisPrompt routing behavior.

Manual live-local refresh actions are grouped and labeled in the app so each endpoint load is clearly separate from fixture fallback data and local report export actions.

If live-local refresh fails, the Overview diagnostics show whether the local daemon appears unreachable, an endpoint is unavailable, or the response shape is invalid. Typical next steps are to start the daemon with `./scripts/start-dev.sh`, confirm `http://127.0.0.1:8765/health` is reachable, and keep using fixture mode while debugging local setup.

Use the Overview Local Commands panel when you want a copyable terminal command for the local daemon/dashboard flow. These commands run in your terminal.

Empty states in live-local mode remain manual and local-only. They do not auto-load data, poll endpoints, persist state, send telemetry, call cloud services, call GitHub, or perform update checks.

## 8. Export A Local Sustainability Report

In Sustainability Preview:

1. Confirm fixture metrics or manually loaded live-local metrics are visible.
2. Select a period such as `30d`.
3. Click `Export Markdown`.
4. Click `Export JSON`.

The reports are generated client-side from the currently displayed metrics. They are local-only reports and include structured schema, methodology, confidence, disclaimer, limitations, and local-only export notes. They are counterfactual proxy estimates, not actual carbon accounting, not ESG certification, not certified sustainability reporting, and not production compliance evidence.

The exports do not include prompts, raw request text, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys. Aethra does not upload reports, call telemetry, call cloud services, call GitHub, check for updates, poll endpoints, or persist export state in local storage or session storage.

The export panel now repeats this local-only boundary beside the Markdown/JSON actions, and methodology metadata can be copied with the browser Clipboard API. Copying metadata does not persist state, execute commands, upload data, or contact remote services.

## 9. Stop Services

Stop Aethra with `Ctrl-C` in the terminal running `npm run dev`.

Stop IgnisPrompt with `Ctrl-C` in the terminal running `./scripts/start-dev.sh`.

## Boundaries

- local preview only
- not production deployment
- not legal advice
- not legal accuracy certification
- not production compliance evidence
- sustainability values are estimated counterfactual proxy estimates
- not ESG certification
- no telemetry/cloud calls by default
- no model weights included
- fixture mode remains default
