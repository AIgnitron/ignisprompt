#!/usr/bin/env node
import { openSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://127.0.0.1:8765";
const HEALTH_TIMEOUT_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;

const args = new Set(process.argv.slice(2));
const shouldStartDaemon = args.has("--start-daemon");
const includeRouteExplain = args.has("--include-route-explain");
const baseUrl = normalizeBaseUrl(
  process.env.IGNISPROMPT_BASE_URL ?? DEFAULT_BASE_URL,
);
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
let daemon;
let daemonLogFd;
let daemonLogPath;

main().catch((error) => {
  console.error(`[aethra-smoke] ${error.message}`);
  if (daemonLogPath) {
    console.error(`[aethra-smoke] daemon log: ${daemonLogPath}`);
  }
  process.exitCode = 1;
});

async function main() {
  try {
    assertLocalBaseUrl(baseUrl);

    if (shouldStartDaemon) {
      startDaemon();
    }

    await waitForHealth();

    const health = await getJson("/health");
    assertHealth(health);
    console.log(
      `[aethra-smoke] health ok: ${health.service} ${health.version}, local_only=${String(
        health.local_only,
      )}`,
    );

    const models = await getJson("/v1/models");
    assertModels(models);
    console.log(`[aethra-smoke] models ok: ${models.models.length} entries`);

    const modelStatus = await getJson("/v1/status/models");
    assertModelStatus(modelStatus);
    console.log(
      `[aethra-smoke] model status hints ok: ${modelStatus.statusHints.length} entries`,
    );

    const auditEvents = await getJson("/v1/audit/events");
    assertAuditEvents(auditEvents);
    console.log(
      `[aethra-smoke] audit events ok: ${auditEvents.length} records`,
    );

    const sustainabilityMetrics = await getJson(
      "/v1/metrics/sustainability?period=30d",
    );
    assertSustainabilityMetrics(sustainabilityMetrics);
    console.log(
      `[aethra-smoke] sustainability metrics ok: ${sustainabilityMetrics.requests_total} records, methodology=${sustainabilityMetrics.methodology_version}`,
    );

    if (includeRouteExplain) {
      console.log(
        "[aethra-smoke] route-explain is enabled; this appends a local audit event.",
      );
      const routeExplain = await postJson("/v1/route/explain", {
        model: "ignisprompt/legal",
        messages: [
          {
            role: "user",
            content:
              "Synthetic Aethra smoke request: inspect local routing for a fictional contract clause.",
          },
        ],
        metadata: { domain: "legal", source: "aethra-smoke-local-api" },
      });
      assertRouteExplain(routeExplain);
      console.log(
        `[aethra-smoke] route explain ok: ${routeExplain.decision.route_code}, data_left_device=${String(
          routeExplain.decision.data_left_device,
        )}`,
      );
    } else {
      console.log(
        "[aethra-smoke] route-explain skipped; pass --include-route-explain to run the local audit-appending POST.",
      );
    }

    console.log("[aethra-smoke] completed");
  } finally {
    await stopDaemon();
  }
}

function startDaemon() {
  daemonLogPath = join(
    tmpdir(),
    `aethra-smoke-ignispromptd-${process.pid}.log`,
  );
  daemonLogFd = openSync(daemonLogPath, "w");
  daemon = spawn("./scripts/start-dev.sh", {
    cwd: repoRoot,
    detached: true,
    env: {
      ...process.env,
      IGNISPROMPT_BIND: bindFromBaseUrl(baseUrl),
      IGNISPROMPT_BASE_URL: baseUrl,
    },
    stdio: ["ignore", daemonLogFd, daemonLogFd],
  });
  console.log(`[aethra-smoke] started local daemon, log: ${daemonLogPath}`);
}

async function waitForHealth() {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const health = await getJson("/health");
      assertHealth(health);
      return;
    } catch (error) {
      lastError = error;
      if (daemon && daemon.exitCode !== null) {
        throw new Error(
          `local daemon exited before /health became ready; last error: ${error.message}`,
        );
      }
      await sleep(500);
    }
  }

  throw new Error(
    `timed out waiting for ${baseUrl}/health; last error: ${
      lastError?.message ?? "none"
    }`,
  );
}

async function getJson(path) {
  return requestJson(path, { method: "GET" });
}

async function postJson(path, body) {
  return requestJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function requestJson(path, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `request timed out after ${REQUEST_TIMEOUT_MS}ms: ${baseUrl}${path}`,
      );
    }
    throw new Error(
      `unable to reach local ignispromptd at ${baseUrl}${path}; start the daemon or pass --start-daemon`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${baseUrl}${path}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`invalid JSON from ${baseUrl}${path}`);
  }
}

function assertHealth(value) {
  assertRecord(value, "health response");
  assertString(value.status, "health.status");
  assertString(value.service, "health.service");
  assertString(value.version, "health.version");
  assertString(value.started_at, "health.started_at");
  assertBoolean(value.local_only, "health.local_only");
  assertNumber(value.model_count, "health.model_count");
}

function assertModels(value) {
  assertRecord(value, "models response");
  if (!Array.isArray(value.models)) {
    throw new Error("models response did not include models[]");
  }

  value.models.forEach((model, index) => {
    const label = `models[${index}]`;
    assertRecord(model, label);
    assertString(model.modelId, `${label}.modelId`);
    assertString(model.displayName, `${label}.displayName`);
    assertNumber(model.tier, `${label}.tier`);
    assertStringArray(model.domains, `${label}.domains`);
    assertString(model.format, `${label}.format`);
    assertOptionalNullableString(model.quantization, `${label}.quantization`);
    assertOptionalNullableNumber(model.contextWindow, `${label}.contextWindow`);
    assertOptionalNullableString(model.localPath, `${label}.localPath`);
    assertOptionalNullableString(model.promptPack, `${label}.promptPack`);
    assertOptionalNullableString(
      model.responseFormat,
      `${label}.responseFormat`,
    );
    assertOptionalNullableString(model.sha256, `${label}.sha256`);
    assertOptionalNullableString(model.version, `${label}.version`);
    assertBoolean(model.installed, `${label}.installed`);
    assertOptionalNullableString(model.source, `${label}.source`);
  });
}

function assertModelStatus(value) {
  assertRecord(value, "model status response");
  assertString(value.schemaVersion, "model_status.schemaVersion");
  assertString(value.generatedAt, "model_status.generatedAt");
  if (value.source !== "local-daemon") {
    throw new Error("model_status.source was not local-daemon");
  }
  if (!Array.isArray(value.statusHints)) {
    throw new Error("model_status.statusHints was not an array");
  }

  const conservativeAvailability = new Set([
    "configured",
    "staged",
    "runner-missing",
    "model-file-missing",
    "unavailable",
    "unknown",
  ]);

  value.statusHints.forEach((hint, index) => {
    const label = `model_status.statusHints[${index}]`;
    assertRecord(hint, label);
    assertString(hint.modelId, `${label}.modelId`);
    assertString(hint.displayName, `${label}.displayName`);
    assertNumber(hint.tier, `${label}.tier`);
    assertStringArray(hint.domains, `${label}.domains`);
    assertBoolean(hint.configured, `${label}.configured`);
    assertBoolean(hint.localPathDeclared, `${label}.localPathDeclared`);
    assertBoolean(hint.localPathExists, `${label}.localPathExists`);
    assertBoolean(hint.runnerConfigured, `${label}.runnerConfigured`);
    assertString(hint.runnerKind, `${label}.runnerKind`);
    assertBoolean(
      hint.runnerExecutableExists,
      `${label}.runnerExecutableExists`,
    );
    assertString(hint.availability, `${label}.availability`);
    if (!conservativeAvailability.has(hint.availability)) {
      throw new Error(`${label}.availability was not a conservative hint`);
    }
    assertString(hint.lastCheckedAt, `${label}.lastCheckedAt`);
    assertStringArray(hint.warnings, `${label}.warnings`);
  });
}

function assertAuditEvents(value) {
  if (!Array.isArray(value)) {
    throw new Error("audit events response was not an array");
  }

  value.forEach((event, index) => {
    const label = `audit_events[${index}]`;
    assertRecord(event, label);
    assertString(event.request_id, `${label}.request_id`);
    assertString(event.timestamp, `${label}.timestamp`);
    assertString(event.event_type, `${label}.event_type`);
    assertString(event.route_code, `${label}.route_code`);
    assertString(event.tier, `${label}.tier`);
    assertString(event.domain, `${label}.domain`);
    assertOptionalNullableString(event.model_id, `${label}.model_id`);
    assertBoolean(event.data_left_device, `${label}.data_left_device`);
    assertString(event.explanation, `${label}.explanation`);
    assertStringArray(event.warnings, `${label}.warnings`);

    if (event.cache !== undefined) {
      assertRecord(event.cache, `${label}.cache`);
      assertBoolean(event.cache.hit, `${label}.cache.hit`);
      assertString(event.cache.kind, `${label}.cache.kind`);
    }

    if (event.completion_output !== undefined) {
      assertRecord(event.completion_output, `${label}.completion_output`);
      assertString(
        event.completion_output.runner,
        `${label}.completion_output.runner`,
      );
      if (
        event.completion_output.legal_json !== undefined &&
        event.completion_output.legal_json !== null
      ) {
        assertRecord(
          event.completion_output.legal_json,
          `${label}.completion_output.legal_json`,
        );
        assertString(
          event.completion_output.legal_json.status,
          `${label}.completion_output.legal_json.status`,
        );
      }
    }

    assertOptionalNumber(event.input_tokens_est, `${label}.input_tokens_est`);
    assertOptionalNumber(event.output_tokens_est, `${label}.output_tokens_est`);
    assertOptionalString(event.baseline_provider, `${label}.baseline_provider`);
    assertOptionalString(event.baseline_model, `${label}.baseline_model`);
    assertOptionalNumber(
      event.estimated_cloud_cost_usd,
      `${label}.estimated_cloud_cost_usd`,
    );
    assertOptionalNumber(
      event.estimated_cloud_cost_avoided_usd,
      `${label}.estimated_cloud_cost_avoided_usd`,
    );
    assertOptionalNumber(
      event.estimated_local_energy_wh,
      `${label}.estimated_local_energy_wh`,
    );
    assertOptionalNumber(
      event.estimated_cloud_baseline_wh,
      `${label}.estimated_cloud_baseline_wh`,
    );
    assertOptionalNumber(
      event.estimated_carbon_avoided_gco2e,
      `${label}.estimated_carbon_avoided_gco2e`,
    );
    assertOptionalString(
      event.methodology_version,
      `${label}.methodology_version`,
    );
    assertOptionalString(event.confidence, `${label}.confidence`);
  });
}

function assertSustainabilityMetrics(value) {
  assertRecord(value, "sustainability metrics response");
  assertString(value.period, "sustainability.period");
  assertNumber(value.requests_total, "sustainability.requests_total");
  assertNumber(value.local_request_rate, "sustainability.local_request_rate");
  assertRecord(value.tier_breakdown, "sustainability.tier_breakdown");
  Object.entries(value.tier_breakdown).forEach(([tier, count]) => {
    assertString(tier, "sustainability.tier_breakdown key");
    assertNumber(count, `sustainability.tier_breakdown.${tier}`);
  });
  assertNumber(
    value.estimated_cloud_cost_avoided_usd,
    "sustainability.estimated_cloud_cost_avoided_usd",
  );
  assertNumber(
    value.estimated_carbon_avoided_kgco2e,
    "sustainability.estimated_carbon_avoided_kgco2e",
  );
  assertNumber(
    value.estimated_data_kept_local_gb,
    "sustainability.estimated_data_kept_local_gb",
  );
  assertString(value.baseline_provider, "sustainability.baseline_provider");
  assertString(value.baseline_model, "sustainability.baseline_model");
  assertString(value.methodology_version, "sustainability.methodology_version");
  assertString(value.confidence, "sustainability.confidence");
  assertString(value.disclaimer, "sustainability.disclaimer");
}

function assertRouteExplain(value) {
  assertRecord(value, "route-explain response");
  assertString(value.request_id, "route_explain.request_id");
  assertRecord(value.decision, "route_explain.decision");
  assertString(value.decision.tier, "route_explain.decision.tier");
  assertString(value.decision.route_code, "route_explain.decision.route_code");
  assertString(value.decision.domain, "route_explain.decision.domain");
  assertBoolean(
    value.decision.cloud_allowed,
    "route_explain.decision.cloud_allowed",
  );
  assertBoolean(
    value.decision.data_left_device,
    "route_explain.decision.data_left_device",
  );
  assertString(value.explanation, "route_explain.explanation");
  if (!Array.isArray(value.warnings)) {
    throw new Error("route_explain.warnings was not an array");
  }
}

function assertRecord(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} was not an object`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label} was not a string`);
  }
}

function assertStringArray(value, label) {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`${label} was not a string array`);
  }
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new Error(`${label} was not a boolean`);
  }
}

function assertNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} was not a finite number`);
  }
}

function assertOptionalNullableString(value, label) {
  if (value !== undefined && value !== null && typeof value !== "string") {
    throw new Error(`${label} was not a string, null, or undefined`);
  }
}

function assertOptionalString(value, label) {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${label} was not a string or undefined`);
  }
}

function assertOptionalNumber(value, label) {
  if (
    value !== undefined &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`${label} was not a finite number or undefined`);
  }
}

function assertOptionalNullableNumber(value, label) {
  if (
    value !== undefined &&
    value !== null &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`${label} was not a finite number, null, or undefined`);
  }
}

function assertLocalBaseUrl(urlString) {
  const url = new URL(urlString);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!localHosts.has(url.hostname)) {
    throw new Error(
      `refusing non-local IGNISPROMPT_BASE_URL host: ${url.hostname}`,
    );
  }
}

function bindFromBaseUrl(urlString) {
  const url = new URL(urlString);
  const bindHost = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  const socketHost = bindHost.includes(":") ? `[${bindHost}]` : bindHost;
  return `${socketHost}:${url.port || "8765"}`;
}

function normalizeBaseUrl(urlString) {
  return urlString.replace(/\/+$/, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopDaemon() {
  if (!daemon) {
    return;
  }

  if (daemon.exitCode === null) {
    try {
      process.kill(-daemon.pid, "SIGTERM");
    } catch {
      daemon.kill("SIGTERM");
    }
  }

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    daemon.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
