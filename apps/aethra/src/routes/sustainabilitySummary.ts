import {
  AuditEvent,
  HealthResponse,
  ModelManifest,
  RouteExplainResponse,
} from "../api/contracts";

export type SustainabilitySummary = {
  localOnlyStatus: boolean;
  localAuditEventCount: number;
  cloudDisallowedRouteCount: number;
  failClosedOrRejectedCount: number;
  cacheHitCount: number;
  avoidedCloudCallProxyCount: number;
  modelManifestCount: number;
  methodologyLabels: string[];
};

const rejectedRouteCodePattern = /REJECT|FAIL_CLOSED|FAIL-?CLOSED/i;

export function buildSustainabilitySummary(
  health: HealthResponse,
  auditEvents: AuditEvent[],
  routeResponses: RouteExplainResponse[],
  models: ModelManifest[],
): SustainabilitySummary {
  const localAuditEventCount = countLocalAuditEvents(auditEvents);
  const cloudDisallowedRouteCount =
    countCloudDisallowedRouteDecisions(routeResponses);
  const failClosedOrRejectedCount = countFailClosedOrRejectedRecords(
    auditEvents,
    routeResponses,
  );

  return {
    localOnlyStatus: health.local_only,
    localAuditEventCount,
    cloudDisallowedRouteCount,
    failClosedOrRejectedCount,
    cacheHitCount: countCacheHits(auditEvents),
    avoidedCloudCallProxyCount: buildAvoidedCloudCallProxyCount(
      auditEvents,
      routeResponses,
    ),
    modelManifestCount: models.length,
    methodologyLabels: getSustainabilityMethodologyLabels(),
  };
}

export function countLocalAuditEvents(auditEvents: AuditEvent[]): number {
  return auditEvents.filter((event) => event.data_left_device === false).length;
}

export function countCloudDisallowedRouteDecisions(
  routeResponses: RouteExplainResponse[],
): number {
  return routeResponses.filter(
    (response) => response.decision.cloud_allowed === false,
  ).length;
}

export function countCacheHits(auditEvents: AuditEvent[]): number {
  return auditEvents.filter((event) => event.cache?.hit === true).length;
}

export function countFailClosedOrRejectedRecords(
  auditEvents: AuditEvent[],
  routeResponses: RouteExplainResponse[],
): number {
  const rejectedAuditEvents = auditEvents.filter((event) =>
    rejectedRouteCodePattern.test(event.route_code),
  ).length;
  const rejectedRouteResponses = routeResponses.filter((response) =>
    rejectedRouteCodePattern.test(response.decision.route_code),
  ).length;

  return rejectedAuditEvents + rejectedRouteResponses;
}

export function buildAvoidedCloudCallProxyCount(
  auditEvents: AuditEvent[],
  routeResponses: RouteExplainResponse[],
): number {
  const localRouteAuditEvents = auditEvents.filter(
    (event) =>
      event.data_left_device === false &&
      !rejectedRouteCodePattern.test(event.route_code),
  ).length;
  const cloudDisallowedLocalRoutes = routeResponses.filter(
    (response) =>
      response.decision.cloud_allowed === false &&
      response.decision.data_left_device === false &&
      !rejectedRouteCodePattern.test(response.decision.route_code),
  ).length;

  return localRouteAuditEvents + cloudDisallowedLocalRoutes;
}

export function getSustainabilityMethodologyLabels(): string[] {
  return [
    "Preview only",
    "Proxy indicators",
    "Derived from route and audit metadata",
    "Not measured energy use",
    "Not carbon accounting",
    "Not certified sustainability reporting",
    "Not ESG/compliance evidence",
  ];
}
