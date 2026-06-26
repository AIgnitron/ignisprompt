import { afterEach, describe, expect, it, vi } from "vitest";
import { IgnisPromptClient } from "./client";
import { AethraApiError } from "./errors";
import type { RunnerLifecycleAction } from "./contracts";
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
  routeExplainFixture,
  routingPolicySummaryFixture,
  sustainabilityMetricsFixture,
  versionStatusFixture,
} from "./fixtures";

const runnerProcessStatusFixture = {
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

const runnerLifecycleRejectedFixture = {
  schema_version: "ignisprompt-runner-lifecycle-action-v0.1" as const,
  request_id: "runner-lifecycle-1",
  action: "start" as const,
  runner_id: "stub-legal-runner",
  accepted: false,
  outcome: "rejected" as const,
  reason_code: "LIFECYCLE_CONTROLS_DISABLED" as const,
  message: "Runner lifecycle action was rejected.",
  audit_event_id: null,
  status: runnerProcessStatusFixture.runners[0],
  boundaries: ["Unsupported or unmanaged runners fail closed."],
};

const impossibleAcceptedLifecycleFixture = {
  ...runnerLifecycleRejectedFixture,
  request_id: "runner-lifecycle-accepted-1",
  accepted: true,
  outcome: "accepted" as const,
  reason_code: "CONFIRMATION_REQUIRED" as const,
  message: "Runner lifecycle action was accepted.",
  audit_event_id: "audit-runner-lifecycle-1",
};

const runnerLifecycleAuditWriteFailedFixture = {
  ...runnerLifecycleRejectedFixture,
  request_id: "runner-lifecycle-audit-failed-1",
  reason_code: "AUDIT_WRITE_FAILED" as const,
  message: "Runner lifecycle action was rejected because audit write failed.",
};

function jsonResponse(value: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("IgnisPromptClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("reads health from the configured local base URL", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(healthFixture));
    const client = new IgnisPromptClient({
      baseUrl: "http://127.0.0.1:8765/",
      fetchImpl,
    });

    await expect(client.health()).resolves.toEqual(healthFixture);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/health",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads models and audit events with current response shapes", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ models: modelFixtures }))
      .mockResolvedValueOnce(jsonResponse(auditEventFixtures));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.models()).resolves.toEqual({ models: modelFixtures });
    await expect(client.auditEvents()).resolves.toEqual(auditEventFixtures);
  });

  it("reads model and runner status hints with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(modelStatusFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.modelStatus()).resolves.toEqual(modelStatusFixture);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/status/models",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads runner process status metadata with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(runnerProcessStatusFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.runnerProcessStatus()).resolves.toEqual(
      runnerProcessStatusFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/runners/status",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("sends guarded runner lifecycle start POSTs with exact confirmation body", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse(runnerLifecycleRejectedFixture, { status: 409 }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).resolves.toEqual(runnerLifecycleRejectedFixture);

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/runners/stub-legal-runner/start",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
        signal: expect.any(AbortSignal),
      }),
    );
    const requestInit = fetchImpl.mock.calls[0][1] as RequestInit;
    expect(requestInit.credentials).toBeUndefined();
    expect(requestInit.headers).not.toHaveProperty("Authorization");
    expect(JSON.parse(requestInit.body as string)).toEqual({ confirm: true });
    expect(requestInit.body as string).not.toContain("reason");
  });

  it("sends guarded runner lifecycle stop POSTs", async () => {
    const stopResponse = {
      ...runnerLifecycleRejectedFixture,
      action: "stop" as const,
    };
    const fetchImpl = vi.fn(async () => jsonResponse(stopResponse, { status: 409 }));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "stop"),
    ).resolves.toEqual(stopResponse);

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/runners/stub-legal-runner/stop",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      }),
    );
  });

  it("returns valid guarded 4xx lifecycle responses as typed data", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(runnerLifecycleRejectedFixture, { status: 409 }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).resolves.toEqual(runnerLifecycleRejectedFixture);
  });

  it("returns valid AUDIT_WRITE_FAILED 500 lifecycle responses as typed data", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(runnerLifecycleAuditWriteFailedFixture, { status: 500 }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).resolves.toEqual(runnerLifecycleAuditWriteFailedFixture);
  });

  it("rejects rejected lifecycle bodies returned with HTTP 2xx as contract drift", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(runnerLifecycleRejectedFixture),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).rejects.toMatchObject({ kind: "unexpected-shape" });
  });

  it("rejects impossible accepted lifecycle responses", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(impossibleAcceptedLifecycleFixture),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).rejects.toMatchObject({ kind: "unexpected-shape" });
  });

  it("rejects malformed 4xx lifecycle responses", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        {
          ...runnerLifecycleRejectedFixture,
          status: {
            ...runnerLifecycleRejectedFixture.status,
            actions_allowed: ["restart"],
          },
        },
        { status: 409 },
      ),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).rejects.toMatchObject({ kind: "http-error", status: 409 });
  });

  it("rejects invalid JSON lifecycle responses safely", async () => {
    const fetchImpl = vi.fn(async () => new Response("{nope", { status: 200 }));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).rejects.toMatchObject({ kind: "invalid-json" });
  });

  it("reports unreachable daemons for lifecycle requests", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("failed to fetch");
    });
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).rejects.toMatchObject({ kind: "unreachable-daemon" });
  });

  it("reports lifecycle request timeouts", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    const client = new IgnisPromptClient({ fetchImpl, timeoutMs: 10 });

    const assertion = expect(
      client.runnerLifecycleAction("stub-legal-runner", "start"),
    ).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    vi.useRealTimers();
  });

  it("rejects invalid runner IDs before fetch", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(runnerLifecycleRejectedFixture, { status: 409 }),
    );
    const client = new IgnisPromptClient({ fetchImpl });
    const invalidIds = [
      "",
      "stub legal runner",
      "stub/legal-runner",
      "stub\\legal-runner",
      "stub%legal-runner",
      "stub?legal-runner",
      "stub#legal-runner",
      "stub\nlegal-runner",
      "stub\u001blegal-runner",
      "a".repeat(129),
    ];

    for (const runnerId of invalidIds) {
      expect(() => client.runnerLifecycleAction(runnerId, "start")).toThrow(
        AethraApiError,
      );
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects invalid lifecycle actions before fetch", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(runnerLifecycleRejectedFixture, { status: 409 }),
    );
    const client = new IgnisPromptClient({ fetchImpl });
    const invalidActions = [
      "restart",
      "",
      "../stop",
    ] as unknown as RunnerLifecycleAction[];

    for (const action of invalidActions) {
      expect(() => client.runnerLifecycleAction("stub-legal-runner", action)).toThrow(
        AethraApiError,
      );
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads local model inventory with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(modelInventoryFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.modelInventory()).resolves.toEqual(
      modelInventoryFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/models/inventory",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads local model readiness with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(modelReadinessFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.modelReadiness()).resolves.toEqual(
      modelReadinessFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/models/readiness",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads connector and capability status metadata with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(capabilitiesFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.capabilities()).resolves.toEqual(capabilitiesFixture);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/capabilities",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads local operations summary metadata with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(operationsSummaryFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.operationsSummary()).resolves.toEqual(
      operationsSummaryFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/operations/summary",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads local routing policy summary metadata with the current response shape", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(routingPolicySummaryFixture),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.routingPolicySummary()).resolves.toEqual(
      routingPolicySummaryFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/routing/policy-summary",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads local evidence package index metadata with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(evidencePackageIndexFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.evidencePackages()).resolves.toEqual(
      evidencePackageIndexFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/evidence/packages",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reads daemon version status with the current response shape", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(versionStatusFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.versionStatus()).resolves.toEqual(versionStatusFixture);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/status/version",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects unsupported daemon version status response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...versionStatusFixture,
        warnings: "Local preview build; not production deployment.",
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.versionStatus()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("reads sustainability metrics as local-only counterfactual estimates", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(sustainabilityMetricsFixture),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.sustainabilityMetrics("30d")).resolves.toEqual(
      sustainabilityMetricsFixture,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("encodes sustainability metrics period query values", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(sustainabilityMetricsFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.sustainabilityMetrics("90d")).resolves.toEqual(
      sustainabilityMetricsFixture,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/metrics/sustainability?period=90d",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects unsupported sustainability metrics response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...sustainabilityMetricsFixture,
        disclaimer: undefined,
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.sustainabilityMetrics("7d")).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported model status availability strings", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...modelStatusFixture,
        statusHints: [
          {
            ...modelStatusFixture.statusHints[0],
            availability: "active",
          },
        ],
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.modelStatus()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported local model inventory response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...modelInventoryFixture,
        summary: {
          ...modelInventoryFixture.summary,
          total_files: "2",
        },
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.modelInventory()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported local model readiness response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...modelReadinessFixture,
        summary: {
          ...modelReadinessFixture.summary,
          ready_hint_count: "1",
        },
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.modelReadiness()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported local evidence package index response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...evidencePackageIndexFixture,
        packages: [
          {
            ...evidencePackageIndexFixture.packages[0],
            relative_path: "/Users/alice/local-evidence/readiness/demo",
          },
        ],
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.evidencePackages()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported capability status response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...capabilitiesFixture,
        cloud_enabled: "false",
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.capabilities()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported operations summary response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...operationsSummaryFixture,
        boundaries: {
          ...operationsSummaryFixture.boundaries,
          no_raw_request_text: "true",
        },
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.operationsSummary()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("rejects unsupported routing policy summary response shapes", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        ...routingPolicySummaryFixture,
        safety_boundaries: {
          ...routingPolicySummaryFixture.safety_boundaries,
          no_route_execution: "true",
        },
      }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.routingPolicySummary()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("accepts null optional model manifest fields from the daemon", async () => {
    const manifestWithNullOptionFields = {
      modelId: "fixture-null-option-fields",
      displayName: "Fixture Null Option Fields",
      tier: 1,
      domains: ["general"],
      format: "stub",
      quantization: null,
      contextWindow: null,
      localPath: null,
      promptPack: null,
      responseFormat: null,
      sha256: null,
      version: null,
      installed: false,
      source: null,
    };
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ models: [manifestWithNullOptionFields] }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.models()).resolves.toEqual({
      models: [manifestWithNullOptionFields],
    });
  });

  it("accepts audit events without optional cache, completion, and proxy estimate fields", async () => {
    const minimalAuditEvent = {
      request_id: "fixture-minimal-audit-001",
      timestamp: "2026-05-21T00:00:00Z",
      event_type: "route_explain",
      route_code: "DOMAIN_MODEL_SELECTED",
      tier: "TIER_3",
      domain: "legal",
      data_left_device: false,
      explanation: "Synthetic minimal local audit event.",
      warnings: [],
    };
    const fetchImpl = vi.fn(async () => jsonResponse([minimalAuditEvent]));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.auditEvents()).resolves.toEqual([minimalAuditEvent]);
  });

  it("sends route explain as an explicit POST action", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(routeExplainFixture));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(
      client.routeExplain({
        model: "ignisprompt/legal",
        messages: [{ role: "user", content: "Review this synthetic clause." }],
        metadata: { domain: "legal" },
      }),
    ).resolves.toEqual(routeExplainFixture);

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/route/explain",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "ignisprompt/legal",
          messages: [
            { role: "user", content: "Review this synthetic clause." },
          ],
          metadata: { domain: "legal" },
        }),
      }),
    );
  });

  it("reports HTTP errors with status", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: "nope" }, { status: 503 }),
    );
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.health()).rejects.toMatchObject({
      kind: "http-error",
      status: 503,
    });
  });

  it("reports invalid JSON responses", async () => {
    const fetchImpl = vi.fn(async () => new Response("{not-json", { status: 200 }));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.health()).rejects.toMatchObject({
      kind: "invalid-json",
    });
  });

  it("reports unexpected response shapes", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ status: "ok" }));
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.health()).rejects.toMatchObject({
      kind: "unexpected-shape",
    });
  });

  it("reports an unreachable local daemon", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("failed to fetch");
    });
    const client = new IgnisPromptClient({ fetchImpl });

    await expect(client.health()).rejects.toBeInstanceOf(AethraApiError);
    await expect(client.health()).rejects.toMatchObject({
      kind: "unreachable-daemon",
    });
  });

  it("reports request timeouts", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    const client = new IgnisPromptClient({ fetchImpl, timeoutMs: 10 });

    const assertion = expect(client.health()).rejects.toMatchObject({
      kind: "timeout",
    });
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    vi.useRealTimers();
  });
});
