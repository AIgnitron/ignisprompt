import { describe, expect, it } from "vitest";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  routeExplainFixture,
} from "../api/fixtures";
import {
  buildAvoidedCloudCallProxyCount,
  buildSustainabilitySummary,
  countCacheHits,
  countCloudDisallowedRouteDecisions,
  countFailClosedOrRejectedRecords,
  countLocalAuditEvents,
  getSustainabilityMethodologyLabels,
} from "./sustainabilitySummary";

describe("sustainability proxy summaries", () => {
  it("builds conservative proxy counts from existing fixtures", () => {
    const summary = buildSustainabilitySummary(
      healthFixture,
      auditEventFixtures,
      [routeExplainFixture],
      modelFixtures,
    );

    expect(summary).toMatchObject({
      localOnlyStatus: true,
      localAuditEventCount: 3,
      cloudDisallowedRouteCount: 1,
      failClosedOrRejectedCount: 0,
      cacheHitCount: 1,
      avoidedCloudCallProxyCount: 4,
      modelManifestCount: 1,
    });
  });

  it("counts local audit and cache proxy inputs", () => {
    expect(countLocalAuditEvents(auditEventFixtures)).toBe(3);
    expect(countCacheHits(auditEventFixtures)).toBe(1);
  });

  it("counts route decisions where cloud_allowed=false", () => {
    expect(countCloudDisallowedRouteDecisions([routeExplainFixture])).toBe(1);
  });

  it("counts fail-closed or rejected route codes when present", () => {
    const rejectedRoute = {
      ...routeExplainFixture,
      decision: {
        ...routeExplainFixture.decision,
        route_code: "REJECTED_EMPTY_MESSAGES",
      },
    };

    expect(
      countFailClosedOrRejectedRecords(auditEventFixtures, [rejectedRoute]),
    ).toBe(1);
  });

  it("builds avoided cloud call proxy only from local metadata", () => {
    expect(
      buildAvoidedCloudCallProxyCount(auditEventFixtures, [routeExplainFixture]),
    ).toBe(4);
  });

  it("keeps required conservative labels explicit", () => {
    expect(getSustainabilityMethodologyLabels()).toEqual([
      "Preview only",
      "Proxy indicators",
      "Derived from route and audit metadata",
      "Not measured energy use",
      "Not carbon accounting",
      "Not certified sustainability reporting",
      "Not ESG/compliance evidence",
    ]);
  });
});
