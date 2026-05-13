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

const rejectedRouteCodePattern =
  /ERR|ERROR|REJECT|FAIL|FAIL_CLOSED|FAIL-?CLOSED|UNAVAILABLE|RAM_PRESSURE|MEMORY_PRESSURE/i;

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
  const rejectedRequestIds = new Set<string>();

  for (const event of auditEvents) {
    if (isRejectedRouteCode(event.route_code)) {
      rejectedRequestIds.add(event.request_id);
    }
  }

  for (const response of routeResponses) {
    if (
      isRejectedRouteCode(response.decision.route_code) ||
      isRejectedRouteCode(response.decision.tier)
    ) {
      rejectedRequestIds.add(response.request_id);
    }
  }

  return rejectedRequestIds.size;
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

function isRejectedRouteCode(routeCode: string): boolean {
  return rejectedRouteCodePattern.test(routeCode);
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
