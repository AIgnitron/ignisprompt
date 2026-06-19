import { describe, expect, it } from "vitest";
import {
  isAuditEventList,
  isCapabilitiesResponse,
  isHealthResponse,
  isModelRegistry,
  isModelStatusResponse,
  isSustainabilityMetricsResponse,
  isVersionStatusResponse,
} from "./contracts";
import {
  auditEventFixtures,
  capabilitiesFixture,
  evidenceBundleFixture,
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
    expect(isCapabilitiesResponse(capabilitiesFixture)).toBe(true);
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
    expect(keysOf(capabilitiesFixture)).toEqual([
      "capabilities",
      "cloud_enabled",
      "local_only",
      "release_channel",
      "routing_order",
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

  it("locks capability status fields as read-only status metadata", () => {
    expect(keysOf(capabilitiesFixture.capabilities[0])).toEqual([
      "available",
      "confidence",
      "configured",
      "connector_type",
      "data_boundary",
      "display_name",
      "last_checked",
      "provider_id",
      "reason",
      "status",
      "tier",
      "warnings",
    ]);
    expect(capabilitiesFixture.cloud_enabled).toBe(false);
    expect(
      capabilitiesFixture.capabilities.find(
        (capability) => capability.provider_id === "cloud-disabled",
      ),
    ).toMatchObject({
      status: "disabled",
      available: false,
      configured: false,
      data_boundary: "cloud_with_consent",
    });
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

  it("locks evidence bundle fixture fields for the local workflow viewer", () => {
    expect(keysOf(evidenceBundleFixture.manifest)).toEqual([
      "audit_events_included",
      "bundle_name",
      "bundle_schema_version",
      "generated_at",
      "generated_files",
      "included_endpoints",
      "local_preview_boundary",
      "non_certified_boundary",
      "not_production_attestation_boundary",
      "not_signed_boundary",
    ]);
    expect(keysOf(evidenceBundleFixture.validation)).toEqual([
      "bundle_schema_version",
      "missing_files",
      "note",
      "optional_files",
      "parsed_json_files",
      "placeholder_string_detected",
      "required_files",
      "safe_fields_redacted",
      "status",
      "validation_mode",
    ]);
    expect(keysOf(evidenceBundleFixture.archivePreview ?? {})).toEqual([
      "archive_format",
      "archive_name",
      "bundle_name",
      "byte_size_estimate",
      "certified",
      "created_at",
      "file_count",
      "generated_files",
      "includes_files_outside_bundle",
      "note",
      "signed",
      "symlinks_followed",
      "tamper_evident",
    ]);
  });
});
