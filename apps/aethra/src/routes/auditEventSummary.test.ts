import { describe, expect, it } from "vitest";
import { auditEventFixtures } from "../api/fixtures";
import {
  countAuditCacheHits,
  countAuditWarnings,
  countProxyEstimateFields,
  findAuditEventByRequestId,
  toAuditEventRows,
} from "./auditEventSummary";

describe("audit event fixture summaries", () => {
  it("builds rows sorted by newest timestamp first", () => {
    const rows = toAuditEventRows(auditEventFixtures);

    expect(rows.map((row) => row.requestId)).toEqual([
      "fixture-cache-001",
      "fixture-warning-001",
      "fixture-route-001",
    ]);
    expect(rows[0]).toMatchObject({
      eventType: "chat_completion",
      routeCode: "DOMAIN_MODEL_SELECTED",
      tier: "TIER_3",
      domain: "legal",
      dataLeftDevice: false,
      warningCount: 0,
      proxyEstimateCount: 11,
      cacheHit: true,
    });
  });

  it("finds an event by request id", () => {
    expect(
      findAuditEventByRequestId(auditEventFixtures, "fixture-warning-001")
        ?.warnings,
    ).toHaveLength(1);
  });

  it("counts warnings and cache hits", () => {
    expect(countAuditWarnings(auditEventFixtures)).toBe(1);
    expect(countAuditCacheHits(auditEventFixtures)).toBe(1);
  });

  it("summarizes request IDs, route signals, warning metadata, and proxy estimates", () => {
    const rows = toAuditEventRows(auditEventFixtures);
    const warningRow = rows.find(
      (row) => row.requestId === "fixture-warning-001",
    );

    expect(warningRow).toMatchObject({
      requestId: "fixture-warning-001",
      routeCode: "DOMAIN_MODEL_SELECTED",
      tier: "TIER_3",
      domain: "legal",
      warningCount: 1,
      proxyEstimateCount: 11,
    });
    expect(countProxyEstimateFields(auditEventFixtures[1])).toBe(11);
  });

  it("handles missing optional audit fields without proxy estimate metadata", () => {
    const minimalEvent = {
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

    expect(toAuditEventRows([minimalEvent])[0]).toMatchObject({
      requestId: "fixture-minimal-audit-001",
      modelId: "none",
      warningCount: 0,
      cacheHit: false,
      proxyEstimateCount: 0,
    });
    expect(countProxyEstimateFields(minimalEvent)).toBe(0);
  });

  it("handles an empty fixture set", () => {
    expect(toAuditEventRows([])).toEqual([]);
    expect(countAuditWarnings([])).toBe(0);
    expect(countAuditCacheHits([])).toBe(0);
  });
});
