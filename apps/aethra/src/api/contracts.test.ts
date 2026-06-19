import { describe, expect, it } from "vitest";
import {
  isAuditEventList,
  isCapabilitiesResponse,
  isHealthResponse,
  isModelInventoryResponse,
  isModelRegistry,
  isModelStatusResponse,
  isOperationsSummaryResponse,
  isSustainabilityMetricsResponse,
  isVersionStatusResponse,
} from "./contracts";
import {
  auditEventFixtures,
  capabilitiesFixture,
  evidenceBundleFixture,
  healthFixture,
  modelFixtures,
  modelInventoryFixture,
  modelStatusFixture,
  operationsSummaryFixture,
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
    expect(isModelInventoryResponse(modelInventoryFixture)).toBe(true);
    expect(isModelStatusResponse(modelStatusFixture)).toBe(true);
    expect(isCapabilitiesResponse(capabilitiesFixture)).toBe(true);
    expect(isOperationsSummaryResponse(operationsSummaryFixture)).toBe(true);
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
    expect(keysOf(modelInventoryFixture)).toEqual([
      "base_paths_scanned",
      "boundary_notes",
      "files",
      "generated_at",
      "inventory_source",
      "schema_version",
      "summary",
    ]);
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
    expect(keysOf(operationsSummaryFixture)).toEqual([
      "activity_summary",
      "audit_summary",
      "boundaries",
      "daemon",
      "endpoints",
      "generated_at",
      "schema_version",
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

  it("locks local model inventory fields as read-only metadata", () => {
    expect(keysOf(modelInventoryFixture.summary)).toEqual([
      "gguf_files",
      "largest_file_mb",
      "manifest_declared_count",
      "notes",
      "present_count",
      "safetensors_files",
      "scan_limited",
      "scanned_directory_count",
      "total_files",
      "total_size_bytes",
      "unsupported_count",
    ]);
    expect(keysOf(modelInventoryFixture.files[0])).toEqual([
      "boundary_note",
      "extension",
      "filename",
      "model_family",
      "quantization",
      "relative_path",
      "size_bytes",
      "size_mb",
      "status",
    ]);
    expect(modelInventoryFixture.boundary_notes.join(" ")).toContain(
      "does not execute models",
    );
    expect(modelInventoryFixture.boundary_notes.join(" ")).toContain(
      "does not prove model quality",
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

  it("locks operations summary fields as aggregate read-only metadata", () => {
    expect(keysOf(operationsSummaryFixture.daemon)).toEqual([
      "local_only",
      "local_preview",
      "started_at",
      "status",
      "uptime_seconds",
      "version",
    ]);
    expect(keysOf(operationsSummaryFixture.endpoints)).toEqual([
      "audit_events_available",
      "capabilities_available",
      "health_available",
      "model_inventory_available",
      "models_available",
      "operations_summary_available",
      "status_models_available",
      "status_version_available",
      "sustainability_available",
    ]);
    expect(keysOf(operationsSummaryFixture.audit_summary)).toEqual([
      "audit_store_status",
      "latest_event_at",
      "recent_event_count",
      "recent_event_types",
      "total_events",
    ]);
    expect(keysOf(operationsSummaryFixture.activity_summary)).toEqual([
      "last_activity_at",
      "recent_errors_observed",
      "recent_requests_observed",
      "recent_routes_observed",
    ]);
    expect(keysOf(operationsSummaryFixture.boundaries)).toEqual([
      "no_cloud_calls",
      "no_prompt_bodies",
      "no_raw_request_text",
      "no_secrets",
      "no_telemetry",
      "notes",
      "read_only",
    ]);
    expect(operationsSummaryFixture.boundaries.no_raw_request_text).toBe(true);
    expect(operationsSummaryFixture.boundaries.no_telemetry).toBe(true);
    expect(operationsSummaryFixture.boundaries.no_cloud_calls).toBe(true);
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
