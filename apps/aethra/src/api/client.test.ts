import { describe, expect, it, vi } from "vitest";
import { IgnisPromptClient } from "./client";
import { AethraApiError } from "./errors";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  modelStatusFixture,
  routeExplainFixture,
  sustainabilityMetricsFixture,
  versionStatusFixture,
} from "./fixtures";

function jsonResponse(value: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("IgnisPromptClient", () => {
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
