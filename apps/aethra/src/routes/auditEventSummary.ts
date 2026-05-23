import { AuditEvent } from "../api/contracts";

export type AuditEventRow = {
  requestId: string;
  timestamp: string;
  eventType: string;
  routeCode: string;
  tier: string;
  domain: string;
  modelId: string;
  dataLeftDevice: boolean;
  warningCount: number;
  cacheHit: boolean;
  proxyEstimateCount: number;
};

export function toAuditEventRows(events: AuditEvent[]): AuditEventRow[] {
  return [...events]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .map((event) => ({
      requestId: event.request_id,
      timestamp: event.timestamp,
      eventType: event.event_type,
      routeCode: event.route_code,
      tier: event.tier,
      domain: event.domain,
      modelId: event.model_id ?? "none",
      dataLeftDevice: event.data_left_device,
      warningCount: event.warnings.length,
      cacheHit: event.cache?.hit === true,
      proxyEstimateCount: countProxyEstimateFields(event),
    }));
}

export function findAuditEventByRequestId(
  events: AuditEvent[],
  requestId: string,
): AuditEvent | undefined {
  return events.find((event) => event.request_id === requestId);
}

export function countAuditWarnings(events: AuditEvent[]): number {
  return events.reduce((count, event) => count + event.warnings.length, 0);
}

export function countAuditCacheHits(events: AuditEvent[]): number {
  return events.filter((event) => event.cache?.hit === true).length;
}

export function countProxyEstimateFields(event: AuditEvent): number {
  return [
    event.input_tokens_est,
    event.output_tokens_est,
    event.baseline_provider,
    event.baseline_model,
    event.estimated_cloud_cost_usd,
    event.estimated_cloud_cost_avoided_usd,
    event.estimated_local_energy_wh,
    event.estimated_cloud_baseline_wh,
    event.estimated_carbon_avoided_gco2e,
    event.methodology_version,
    event.confidence,
  ].filter((value) => value !== undefined).length;
}
