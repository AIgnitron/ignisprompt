import { describe, expect, it } from "vitest";
import { auditEventFixtures, healthFixture, modelFixtures } from "../api/fixtures";
import {
  buildOverviewSummary,
  countCacheHits,
  countLocalEvents,
  countWarnings,
  getLatestAuditEvent,
  getWarningExamples,
} from "./overviewSummary";

describe("overview fixture summaries", () => {
  it("counts local events, warnings, and cache hits", () => {
    expect(countLocalEvents(auditEventFixtures)).toBe(3);
    expect(countWarnings(auditEventFixtures)).toBe(1);
    expect(countCacheHits(auditEventFixtures)).toBe(1);
  });

  it("selects the latest audit event by timestamp", () => {
    expect(getLatestAuditEvent(auditEventFixtures)?.request_id).toBe(
      "fixture-cache-001",
    );
  });

  it("builds an overview summary from raw fixture contracts", () => {
    const summary = buildOverviewSummary(
      healthFixture,
      modelFixtures,
      auditEventFixtures,
    );

    expect(summary.modelCount).toBe(1);
    expect(summary.auditEventCount).toBe(3);
    expect(summary.latestEvent?.route_code).toBe("DOMAIN_MODEL_SELECTED");
    expect(summary.observedFacts).toContain(
      "ignispromptd 0.1.0 reports status ok.",
    );
    expect(summary.derivedFacts).toContain(
      "3 fixture events report data_left_device=false.",
    );
  });

  it("extracts warning examples", () => {
    expect(getWarningExamples(auditEventFixtures)).toEqual([
      "Document-contained instruction was detected and treated as untrusted content. Routing policy and audit behavior were not modified.",
    ]);
  });

  it("handles an empty audit fixture set", () => {
    const summary = buildOverviewSummary(healthFixture, modelFixtures, []);

    expect(summary.auditEventCount).toBe(0);
    expect(summary.localEventCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.cacheHitCount).toBe(0);
    expect(summary.latestEvent).toBeUndefined();
  });
});
