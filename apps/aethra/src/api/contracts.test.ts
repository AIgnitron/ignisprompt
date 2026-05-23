import { describe, expect, it } from "vitest";
import {
  isAuditEventList,
  isHealthResponse,
  isModelRegistry,
  isModelStatusResponse,
  isSustainabilityMetricsResponse,
  isVersionStatusResponse,
} from "./contracts";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  modelStatusFixture,
  sustainabilityMetricsFixture,
  versionStatusFixture,
} from "./fixtures";

function keysOf(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort();
}

describe("Aethra fixture contract shapes", () => {
  it("keeps fixture data compatible with current local-preview daemon responses", () => {
    expect(isHealthResponse(healthFixture)).toBe(true);
    expect(isVersionStatusResponse(versionStatusFixture)).toBe(true);
    expect(isModelRegistry({ models: modelFixtures })).toBe(true);
    expect(isModelStatusResponse(modelStatusFixture)).toBe(true);
    expect(isAuditEventList(auditEventFixtures)).toBe(true);
    expect(isSustainabilityMetricsResponse(sustainabilityMetricsFixture)).toBe(
      true,
    );
  });

  it("locks local-preview endpoint top-level fixture keys consumed by Aethra", () => {
    expect(keysOf(healthFixture)).toEqual([
      "local_only",
      "model_count",
      "service",
      "started_at",
      "status",
      "version",
    ]);
    expect(keysOf(versionStatusFixture)).toEqual([
      "build_profile",
      "git_commit",
      "local_only",
      "release_channel",
      "service",
      "started_at",
      "version",
      "warnings",
    ]);
    expect(keysOf({ models: modelFixtures })).toEqual(["models"]);
    expect(keysOf(modelStatusFixture)).toEqual([
      "generatedAt",
      "schemaVersion",
      "source",
      "statusHints",
    ]);
    expect(keysOf(sustainabilityMetricsFixture)).toEqual([
      "baseline_model",
      "baseline_provider",
      "confidence",
      "disclaimer",
      "estimated_carbon_avoided_kgco2e",
      "estimated_cloud_cost_avoided_usd",
      "estimated_data_kept_local_gb",
      "local_request_rate",
      "methodology_version",
      "period",
      "requests_total",
      "tier_breakdown",
    ]);
  });

  it("locks model and runner status hint fields as read-only status hints", () => {
    expect(keysOf(modelStatusFixture.statusHints[0])).toEqual([
      "availability",
      "configured",
      "displayName",
      "domains",
      "lastCheckedAt",
      "localPathDeclared",
      "localPathExists",
      "modelId",
      "runnerConfigured",
      "runnerExecutableExists",
      "runnerKind",
      "tier",
      "warnings",
    ]);
    expect(modelStatusFixture.statusHints[0].warnings.join(" ")).toContain(
      "local hint",
    );
  });

  it("locks audit fixture fields including optional Aethra proxy estimate fields", () => {
    const event = auditEventFixtures[0] as Record<string, unknown>;

    expect(keysOf(event)).toEqual([
      "baseline_model",
      "baseline_provider",
      "confidence",
      "data_left_device",
      "domain",
      "estimated_carbon_avoided_gco2e",
      "estimated_cloud_baseline_wh",
      "estimated_cloud_cost_avoided_usd",
      "estimated_cloud_cost_usd",
      "estimated_local_energy_wh",
      "event_type",
      "explanation",
      "input_tokens_est",
      "methodology_version",
      "model_id",
      "output_tokens_est",
      "request_id",
      "route_code",
      "tier",
      "timestamp",
      "warnings",
    ]);
  });
});
