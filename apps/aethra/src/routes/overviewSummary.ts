import { AuditEvent, HealthResponse, ModelManifest } from "../api/contracts";

export type OverviewSummary = {
  modelCount: number;
  auditEventCount: number;
  localEventCount: number;
  warningCount: number;
  cacheHitCount: number;
  latestEvent?: AuditEvent;
  observedFacts: string[];
  derivedFacts: string[];
};

export function buildOverviewSummary(
  health: HealthResponse,
  models: ModelManifest[],
  auditEvents: AuditEvent[],
): OverviewSummary {
  return {
    modelCount: models.length,
    auditEventCount: auditEvents.length,
    localEventCount: countLocalEvents(auditEvents),
    warningCount: countWarnings(auditEvents),
    cacheHitCount: countCacheHits(auditEvents),
    latestEvent: getLatestAuditEvent(auditEvents),
    observedFacts: [
      `${health.service} ${health.version} reports status ${health.status}.`,
      `The health fixture reports local_only=${String(health.local_only)}.`,
      `The health fixture reports model_count=${health.model_count}.`,
    ],
    derivedFacts: [
      `${auditEvents.length} audit events are present in the synthetic fixture set.`,
      `${countLocalEvents(
        auditEvents,
      )} fixture events report data_left_device=false.`,
      `${countWarnings(auditEvents)} warnings are present across fixture events.`,
    ],
  };
}

export function countLocalEvents(auditEvents: AuditEvent[]): number {
  return auditEvents.filter((event) => !event.data_left_device).length;
}

export function countWarnings(auditEvents: AuditEvent[]): number {
  return auditEvents.reduce(
    (count, event) => count + event.warnings.length,
    0,
  );
}

export function countCacheHits(auditEvents: AuditEvent[]): number {
  return auditEvents.filter((event) => event.cache?.hit === true).length;
}

export function getLatestAuditEvent(
  auditEvents: AuditEvent[],
): AuditEvent | undefined {
  return [...auditEvents].sort((left, right) =>
    right.timestamp.localeCompare(left.timestamp),
  )[0];
}

export function getWarningExamples(auditEvents: AuditEvent[]): string[] {
  return auditEvents.flatMap((event) => event.warnings);
}
