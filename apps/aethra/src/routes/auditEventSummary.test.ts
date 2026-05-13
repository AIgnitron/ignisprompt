import { describe, expect, it } from "vitest";
import { auditEventFixtures } from "../api/fixtures";
import {
  countAuditCacheHits,
  countAuditWarnings,
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

  it("handles an empty fixture set", () => {
    expect(toAuditEventRows([])).toEqual([]);
    expect(countAuditWarnings([])).toBe(0);
    expect(countAuditCacheHits([])).toBe(0);
  });
});
