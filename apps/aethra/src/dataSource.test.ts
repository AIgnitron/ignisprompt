import { describe, expect, it } from "vitest";
import {
  auditEventFixtures,
  capabilitiesFixture,
  evidencePackageIndexFixture,
  healthFixture,
  modelFixtures,
  modelInventoryFixture,
  modelReadinessFixture,
  modelStatusFixture,
  operationsSummaryFixture,
  routingPolicySummaryFixture,
  sustainabilityMetricsFixture,
  versionStatusFixture,
} from "./api/fixtures";
import { AethraApiError } from "./api/errors";
import type { RunnerProcessStatusResponse } from "./api/contracts";
import {
  DEFAULT_AETHRA_BASE_URL,
  buildLiveLocalDiagnostics,
  formatLiveLocalDisplaySource,
  getLiveLocalDisplaySource,
  loadLiveLocalDaemonSnapshot,
  resolveAethraBaseUrlInput,
  describeAuditEventsLoadError,
  describeCapabilitiesLoadError,
  describeEvidencePackagesLoadError,
  describeHealthLoadError,
  describeModelInventoryLoadError,
  describeModelReadinessLoadError,
  describeModelStatusLoadError,
  describeModelsLoadError,
  describeOperationsSummaryLoadError,
  describeRoutingPolicyLoadError,
  describeSustainabilityMetricsLoadError,
  describeVersionStatusLoadError,
  normalizeLocalBaseUrl,
  validateLocalBaseUrl,
} from "./dataSource";

const runnerProcessStatusFixture: RunnerProcessStatusResponse = {
  schema_version: "ignisprompt-runner-process-status-v0.1" as const,
  generated_at: "2026-06-20T00:00:00Z",
  runners: [
    {
      runner_id: "stub-legal-runner",
      runner_kind: "stub-legal-runner",
      model_id: null,
      configured: true,
      executable_exists: true,
      process_state: "unknown" as const,
      pid: null,
      local_endpoint: null,
      started_at: null,
      stopped_at: null,
      last_checked_at: "2026-06-20T00:00:00Z",
      last_error_summary: null,
      managed_by_ignisprompt: false,
      operator_mode_required: true,
      actions_allowed: ["none"],
      warnings: ["Read-only status only."],
    },
  ],
  summary: {
    total: 1,
    configured: 1,
    running: 0,
    failed: 0,
    actions_available: 0,
  },
  boundaries: ["Runner process metadata is local-preview status only."],
  next_steps: ["Review process status without assuming executable inference."],
};

describe("Aethra data source helpers", () => {
  it("defaults to the local IgnisPrompt daemon URL", () => {
    expect(DEFAULT_AETHRA_BASE_URL).toBe("http://127.0.0.1:8765");
  });

  it("resolves blank Aethra UI input to the default daemon URL", () => {
    expect(resolveAethraBaseUrlInput("")).toEqual({
      ok: true,
      baseUrl: DEFAULT_AETHRA_BASE_URL,
    });
  });

  it("normalizes trailing slashes from local base URLs", () => {
    expect(normalizeLocalBaseUrl("http://127.0.0.1:8765///")).toBe(
      "http://127.0.0.1:8765",
    );
  });

  it("accepts trailing slash-only loopback origins", () => {
    expect(validateLocalBaseUrl("http://127.0.0.1:8765///")).toEqual({
      ok: true,
      baseUrl: "http://127.0.0.1:8765",
    });
  });

  it("accepts localhost and 127.0.0.1 URLs", () => {
    expect(validateLocalBaseUrl("http://localhost:8765")).toEqual({
      ok: true,
      baseUrl: "http://localhost:8765",
    });
    expect(validateLocalBaseUrl("http://127.0.0.1:8765")).toEqual({
      ok: true,
      baseUrl: "http://127.0.0.1:8765",
    });
  });

  it("accepts the IPv6 loopback URL", () => {
    expect(validateLocalBaseUrl("http://[::1]:8765")).toEqual({
      ok: true,
      baseUrl: "http://[::1]:8765",
    });
  });

  it("rejects non-loopback URLs", () => {
    expect(validateLocalBaseUrl("http://192.168.1.10:8765")).toMatchObject({
      ok: false,
    });
    expect(validateLocalBaseUrl("https://example.com")).toMatchObject({
      ok: false,
    });
  });

  it("rejects malformed and empty URLs", () => {
    expect(validateLocalBaseUrl("")).toMatchObject({ ok: false });
    expect(validateLocalBaseUrl("not a url")).toMatchObject({ ok: false });
  });

  it("rejects loopback URLs with paths, queries, or hashes", () => {
    expect(validateLocalBaseUrl("http://127.0.0.1:8765/health")).toMatchObject({
      ok: false,
    });
    expect(validateLocalBaseUrl("http://127.0.0.1:8765/?x=1")).toMatchObject({
      ok: false,
    });
    expect(validateLocalBaseUrl("http://127.0.0.1:8765/#health")).toMatchObject({
      ok: false,
    });
  });

  it("describes daemon unreachable health load failures", () => {
    expect(
      describeHealthLoadError(
        new AethraApiError("unreachable-daemon", "unreachable"),
      ),
    ).toEqual({
      label: "Daemon unreachable",
      message:
        "Aethra could not reach the configured local IgnisPrompt daemon.",
      diagnosticKind: "daemon-unreachable",
    });
  });

  it("describes invalid JSON and unsupported health schema failures", () => {
    expect(
      describeHealthLoadError(new AethraApiError("invalid-json", "bad json")),
    ).toMatchObject({
      label: "Invalid JSON",
    });
    expect(
      describeHealthLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toMatchObject({
      label: "Unsupported schema",
    });
  });

  it("describes daemon unreachable model metadata load failures", () => {
    expect(
      describeModelsLoadError(
        new AethraApiError("unreachable-daemon", "unreachable"),
      ),
    ).toEqual({
      label: "Daemon unreachable",
      message:
        "Aethra could not reach the configured local IgnisPrompt daemon.",
      diagnosticKind: "daemon-unreachable",
    });
  });

  it("describes invalid JSON and unsupported model schema failures", () => {
    expect(
      describeModelsLoadError(new AethraApiError("invalid-json", "bad json")),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeModelsLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected model manifest schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported model inventory schema failures", () => {
    expect(
      describeModelInventoryLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeModelInventoryLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected local model inventory schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported model readiness schema failures", () => {
    expect(
      describeModelReadinessLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeModelReadinessLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected local model readiness schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported routing policy schema failures", () => {
    expect(
      describeRoutingPolicyLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeRoutingPolicyLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected local routing policy summary schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported evidence package schema failures", () => {
    expect(
      describeEvidencePackagesLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeEvidencePackagesLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected local evidence package index schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported model status schema failures", () => {
    expect(
      describeModelStatusLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeModelStatusLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected model and runner status hint schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported capability schema failures", () => {
    expect(
      describeCapabilitiesLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeCapabilitiesLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected connector and capability status schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported daemon version status schema failures", () => {
    expect(
      describeVersionStatusLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeVersionStatusLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected daemon version status schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes daemon unreachable audit event metadata load failures", () => {
    expect(
      describeAuditEventsLoadError(
        new AethraApiError("unreachable-daemon", "unreachable"),
      ),
    ).toEqual({
      label: "Daemon unreachable",
      message:
        "Aethra could not reach the configured local IgnisPrompt daemon.",
      diagnosticKind: "daemon-unreachable",
    });
  });

  it("describes invalid JSON and unsupported audit event schema failures", () => {
    expect(
      describeAuditEventsLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeAuditEventsLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected audit event schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported sustainability metrics schema failures", () => {
    expect(
      describeSustainabilityMetricsLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeSustainabilityMetricsLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected sustainability metrics schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("describes invalid JSON and unsupported operations summary schema failures", () => {
    expect(
      describeOperationsSummaryLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
      message: expect.stringContaining("not valid JSON"),
    });
    expect(
      describeOperationsSummaryLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected local operations summary schema. This surface remains unavailable until a compatible local-preview daemon response is loaded.",
      diagnosticKind: "invalid-response-shape",
    });
  });

  it("builds fixture mode diagnostics without live calls", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "fixture",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [{ status: "not-loaded" }],
      }),
    ).toMatchObject({
      state: "fixture-mode-active",
      label: "Fixture mode active",
    });
  });

  it("builds live-local ready diagnostics before manual refresh", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [{ status: "not-loaded" }],
      }),
    ).toMatchObject({
      state: "live-local-ready",
      label: "Live-local ready",
      lastRefresh: "No live local refresh has run yet.",
    });
  });

  it("builds connected diagnostics after a successful refresh", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "loaded",
            health: {
              status: "ok",
              service: "ignispromptd",
              version: "0.1.0",
              started_at: "2026-05-20T00:00:00Z",
              local_only: true,
              model_count: 1,
            },
            loadedAt: "2026-05-20T00:01:00Z",
          },
          { status: "not-loaded" },
        ],
      }),
    ).toMatchObject({
      state: "live-local-connected",
      label: "Live-local connected",
      lastRefresh: "Last successful refresh: 2026-05-20T00:01:00Z.",
    });
  });

  it("builds succeeded diagnostics after every surface has loaded", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "loaded",
            health: {
              status: "ok",
              service: "ignispromptd",
              version: "0.1.0",
              started_at: "2026-05-20T00:00:00Z",
              local_only: true,
              model_count: 1,
            },
            loadedAt: "2026-05-20T00:01:00Z",
          },
        ],
      }),
    ).toMatchObject({
      state: "last-refresh-succeeded",
      label: "Last refresh succeeded",
    });
  });

  it("builds daemon unreachable diagnostics after a failed refresh", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "error",
            label: "Daemon unreachable",
            message:
              "Aethra could not reach the configured local IgnisPrompt daemon.",
            diagnosticKind: "daemon-unreachable",
            checkedAt: "2026-05-20T00:01:00Z",
          },
        ],
      }),
    ).toMatchObject({
      state: "daemon-unreachable",
      label: "Daemon unreachable",
      lastRefresh: "Last refresh failed.",
    });
  });

  it("bases diagnostics on a newer successful refresh over stale errors", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "error",
            label: "Daemon unreachable",
            message:
              "Aethra could not reach the configured local IgnisPrompt daemon.",
            diagnosticKind: "daemon-unreachable",
            checkedAt: "2026-05-20T00:01:00Z",
          },
          {
            status: "loaded",
            health: {
              status: "ok",
              service: "ignispromptd",
              version: "0.1.0",
              started_at: "2026-05-20T00:00:00Z",
              local_only: true,
              model_count: 1,
            },
            loadedAt: "2026-05-20T00:02:00Z",
          },
        ],
      }),
    ).toMatchObject({
      state: "live-local-connected",
      label: "Live-local connected",
      lastRefresh: "Last successful refresh: 2026-05-20T00:02:00Z.",
    });
  });

  it("bases diagnostics on a newer failed refresh after earlier success", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "loaded",
            health: {
              status: "ok",
              service: "ignispromptd",
              version: "0.1.0",
              started_at: "2026-05-20T00:00:00Z",
              local_only: true,
              model_count: 1,
            },
            loadedAt: "2026-05-20T00:01:00Z",
          },
          {
            status: "error",
            label: "Daemon unreachable",
            message:
              "Aethra could not reach the configured local IgnisPrompt daemon.",
            diagnosticKind: "daemon-unreachable",
            checkedAt: "2026-05-20T00:02:00Z",
          },
        ],
      }),
    ).toMatchObject({
      state: "daemon-unreachable",
      label: "Daemon unreachable",
      lastRefresh: "Last refresh failed.",
    });
  });

  it("builds invalid response diagnostics from schema failures", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "error",
            label: "Unsupported schema",
            message: "bad shape",
            diagnosticKind: "invalid-response-shape",
          },
        ],
      }),
    ).toMatchObject({
      state: "invalid-response-shape",
      label: "Invalid response shape",
    });
  });

  it("builds endpoint unavailable diagnostics from HTTP failures", () => {
    expect(
      buildLiveLocalDiagnostics({
        dataMode: "live-local",
        baseUrl: DEFAULT_AETHRA_BASE_URL,
        endpointStates: [
          {
            status: "error",
            label: "Endpoint unavailable",
            message: "The local daemon returned HTTP 404.",
            diagnosticKind: "endpoint-unavailable",
          },
        ],
      }),
    ).toMatchObject({
      state: "endpoint-unavailable",
      label: "Endpoint unavailable",
    });
  });

  it("labels displayed data sources for local daemon data and fallback states", () => {
    expect(
      formatLiveLocalDisplaySource(
        getLiveLocalDisplaySource("live-local", {
          status: "loaded",
          health: healthFixture,
          loadedAt: "2026-05-20T00:01:00Z",
        }),
      ),
    ).toBe("Local daemon data");
    expect(
      formatLiveLocalDisplaySource(
        getLiveLocalDisplaySource("live-local", { status: "not-loaded" }),
      ),
    ).toBe("Live local pending");
    expect(
      formatLiveLocalDisplaySource(
        getLiveLocalDisplaySource("fixture", { status: "not-loaded" }),
      ),
    ).toBe("Offline preview fixture");
  });

  it("loads all supported read-only daemon surfaces into a live-local snapshot", async () => {
    const calls: string[] = [];
    const snapshot = await loadLiveLocalDaemonSnapshot({
      loadedAt: "2026-05-20T00:01:00Z",
      sourceBaseUrl: "http://127.0.0.1:8765",
      client: {
        health: async () => {
          calls.push("health");
          return healthFixture;
        },
        versionStatus: async () => {
          calls.push("version");
          return versionStatusFixture;
        },
        models: async () => {
          calls.push("models");
          return { models: modelFixtures };
        },
        modelInventory: async () => {
          calls.push("model-inventory");
          return modelInventoryFixture;
        },
        modelReadiness: async () => {
          calls.push("model-readiness");
          return modelReadinessFixture;
        },
        routingPolicySummary: async () => {
          calls.push("routing-policy");
          return routingPolicySummaryFixture;
        },
        evidencePackages: async () => {
          calls.push("evidence-packages");
          return evidencePackageIndexFixture;
        },
        modelStatus: async () => {
          calls.push("model-status");
          return modelStatusFixture;
        },
        capabilities: async () => {
          calls.push("capabilities");
          return capabilitiesFixture;
        },
        runnerProcessStatus: async () => {
          calls.push("runner-process-status");
          return runnerProcessStatusFixture;
        },
        auditEvents: async () => {
          calls.push("audit-events");
          return auditEventFixtures;
        },
        sustainabilityMetrics: async (period = "30d") => {
          calls.push(`sustainability:${period}`);
          return sustainabilityMetricsFixture;
        },
        operationsSummary: async () => {
          calls.push("operations-summary");
          return operationsSummaryFixture;
        },
      },
    });

    expect(calls.sort()).toEqual([
      "audit-events",
      "capabilities",
      "evidence-packages",
      "health",
      "model-inventory",
      "model-readiness",
      "model-status",
      "models",
      "operations-summary",
      "routing-policy",
      "runner-process-status",
      "sustainability:30d",
      "version",
    ]);
    expect(snapshot.health.status).toBe("loaded");
    expect(snapshot.versionStatus.status).toBe("loaded");
    expect(snapshot.models.status).toBe("loaded");
    expect(snapshot.modelInventory.status).toBe("loaded");
    expect(snapshot.modelReadiness.status).toBe("loaded");
    expect(snapshot.routingPolicy.status).toBe("loaded");
    expect(snapshot.evidencePackages.status).toBe("loaded");
    expect(snapshot.modelStatus.status).toBe("loaded");
    expect(snapshot.capabilities.status).toBe("loaded");
    expect(snapshot.runnerProcessStatus.status).toBe("loaded");
    expect(snapshot.runnerProcessStatus).toMatchObject({
      sourceBaseUrl: "http://127.0.0.1:8765",
    });
    expect(snapshot.auditEvents.status).toBe("loaded");
    expect(snapshot.sustainabilityMetrics.status).toBe("loaded");
    expect(snapshot.operationsSummary.status).toBe("loaded");
    expect(snapshot.results.every((result) => result.status === "loaded")).toBe(
      true,
    );
  });

  it("keeps partial refresh failures isolated without replacing failed live state with fixtures", async () => {
    const snapshot = await loadLiveLocalDaemonSnapshot({
      loadedAt: "2026-05-20T00:01:00Z",
      sourceBaseUrl: "http://127.0.0.1:8765",
      client: {
        health: async () => healthFixture,
        versionStatus: async () => versionStatusFixture,
        models: async () => ({ models: modelFixtures }),
        modelInventory: async () => {
          throw new AethraApiError("http-error", "missing", { status: 404 });
        },
        modelReadiness: async () => {
          throw new AethraApiError("http-error", "missing", { status: 404 });
        },
        routingPolicySummary: async () => {
          throw new AethraApiError("http-error", "missing", { status: 404 });
        },
        evidencePackages: async () => {
          throw new AethraApiError("http-error", "missing", { status: 404 });
        },
        modelStatus: async () => modelStatusFixture,
        capabilities: async () => capabilitiesFixture,
        runnerProcessStatus: async () => {
          throw new AethraApiError("http-error", "missing", { status: 404 });
        },
        auditEvents: async () => auditEventFixtures,
        sustainabilityMetrics: async () => sustainabilityMetricsFixture,
        operationsSummary: async () => {
          throw new AethraApiError("http-error", "missing", { status: 404 });
        },
      },
    });

    expect(snapshot.health.status).toBe("loaded");
    expect(snapshot.modelInventory).toMatchObject({
      status: "error",
      label: "Endpoint unavailable",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.runnerProcessStatus).toMatchObject({
      status: "error",
      label: "Endpoint unavailable",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.results).toContainEqual({
      surface: "model-inventory",
      status: "failed",
      label: "Model inventory",
      message: "The local daemon returned HTTP 404.",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.modelReadiness).toMatchObject({
      status: "error",
      label: "Endpoint unavailable",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.results).toContainEqual({
      surface: "model-readiness",
      status: "failed",
      label: "Model readiness",
      message: "The local daemon returned HTTP 404.",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.routingPolicy).toMatchObject({
      status: "error",
      label: "Endpoint unavailable",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.results).toContainEqual({
      surface: "routing-policy",
      status: "failed",
      label: "Routing policy",
      message: "The local daemon returned HTTP 404.",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.evidencePackages).toMatchObject({
      status: "error",
      label: "Endpoint unavailable",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.results).toContainEqual({
      surface: "evidence-packages",
      status: "failed",
      label: "Evidence packages",
      message: "The local daemon returned HTTP 404.",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.operationsSummary).toMatchObject({
      status: "error",
      label: "Endpoint unavailable",
      diagnosticKind: "endpoint-unavailable",
    });
    expect(snapshot.results).toContainEqual({
      surface: "operations-summary",
      status: "failed",
      label: "Operations summary",
      message: "The local daemon returned HTTP 404.",
      diagnosticKind: "endpoint-unavailable",
    });
  });
});
