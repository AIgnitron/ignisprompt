import { describe, expect, it } from "vitest";
import {
  isAuditEventList,
  isCapabilitiesResponse,
  isEvidencePackageIndexResponse,
  isHealthResponse,
  isModelInventoryResponse,
  isModelReadinessResponse,
  isModelRegistry,
  isModelStatusResponse,
  isOperationsSummaryResponse,
  isRoutingPolicySummaryResponse,
  isSustainabilityMetricsResponse,
  isVersionStatusResponse,
} from "./contracts";
import {
  auditEventFixtures,
  capabilitiesFixture,
  evidencePackageIndexFixture,
  evidenceBundleFixture,
  healthFixture,
  modelFixtures,
  modelInventoryFixture,
  modelReadinessFixture,
  modelStatusFixture,
  operationsSummaryFixture,
  routingPolicySummaryFixture,
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
    expect(isModelReadinessResponse(modelReadinessFixture)).toBe(true);
    expect(isModelStatusResponse(modelStatusFixture)).toBe(true);
    expect(isCapabilitiesResponse(capabilitiesFixture)).toBe(true);
    expect(isOperationsSummaryResponse(operationsSummaryFixture)).toBe(true);
    expect(isRoutingPolicySummaryResponse(routingPolicySummaryFixture)).toBe(true);
    expect(isEvidencePackageIndexResponse(evidencePackageIndexFixture)).toBe(true);
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
    expect(keysOf(modelReadinessFixture)).toEqual([
      "boundary_notes",
      "generated_at",
      "models",
      "schema_version",
      "summary",
      "warnings",
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
    expect(keysOf(routingPolicySummaryFixture)).toEqual([
      "audit_policy_hints",
      "connector_policy_hints",
      "decision_inputs",
      "generated_at",
      "model_selection_hints",
      "next_steps",
      "policy_mode",
      "route_categories",
      "safety_boundaries",
      "schema_version",
      "summary",
      "warnings",
    ]);
    expect(keysOf(evidencePackageIndexFixture)).toEqual([
      "aggregate_summary",
      "boundary_notes",
      "generated_at",
      "next_steps",
      "packages",
      "root_summary",
      "schema_version",
      "warnings",
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

  it("locks local evidence package index fields as read-only metadata", () => {
    expect(keysOf(evidencePackageIndexFixture.root_summary)).toEqual([
      "evidence_root_label",
      "ignored_paths_summary",
      "package_count",
      "root_exists",
      "scan_limit_reached",
    ]);
    expect(keysOf(evidencePackageIndexFixture.packages[0])).toEqual([
      "boundary_notes",
      "display_name",
      "file_count",
      "has_attestation_like_files",
      "has_manifest",
      "has_report",
      "has_summary",
      "has_validation_report",
      "known_artifacts",
      "modified_at",
      "observed_at",
      "package_id",
      "package_type",
      "relative_path",
      "total_size_bytes",
      "warnings",
    ]);
    expect(keysOf(evidencePackageIndexFixture.aggregate_summary)).toEqual([
      "latest_observed_package",
      "packages_by_type",
      "packages_with_attestation_like_names",
      "packages_with_manifests",
      "packages_with_reports",
      "packages_with_validation_like_files",
      "packages_with_warnings",
      "scan_was_partial",
      "total_packages",
    ]);
    expect(evidencePackageIndexFixture.boundary_notes.join(" ")).toContain(
      "Read-only metadata only",
    );
    expect(evidencePackageIndexFixture.boundary_notes.join(" ")).toContain(
      "No package generation",
    );
    expect(
      isEvidencePackageIndexResponse({
        ...evidencePackageIndexFixture,
        packages: [
          {
            ...evidencePackageIndexFixture.packages[0],
            relative_path: "/Users/alice/local-evidence/readiness/demo",
          },
        ],
      }),
    ).toBe(false);
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

  it("locks local model readiness fields as read-only metadata", () => {
    expect(keysOf(modelReadinessFixture.summary)).toEqual([
      "inventory_file_count",
      "manifest_declared_count",
      "missing_file_count",
      "ready_hint_count",
      "unknown_count",
      "unsupported_format_count",
    ]);
    expect(keysOf(modelReadinessFixture.models[0])).toEqual([
      "declared_path",
      "display_name",
      "file_state",
      "format",
      "matched_inventory_file",
      "model_id",
      "notes",
      "readiness_level",
      "runner_hint",
      "size_bytes",
      "size_mb",
    ]);
    expect(keysOf(modelReadinessFixture.models[0].runner_hint)).toEqual([
      "availability",
      "configured",
      "executable_exists",
      "kind",
    ]);
    expect(modelReadinessFixture.boundary_notes.join(" ")).toContain(
      "No model execution",
    );
    expect(modelReadinessFixture.boundary_notes.join(" ")).toContain(
      "do not prove model quality",
    );
    expect(
      isModelReadinessResponse({
        ...modelReadinessFixture,
        summary: {
          ...modelReadinessFixture.summary,
          ready_hint_count: "1",
        },
      }),
    ).toBe(false);
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
      "evidence_packages_available",
      "health_available",
      "model_inventory_available",
      "model_readiness_available",
      "models_available",
      "operations_summary_available",
      "routing_policy_available",
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

  it("locks routing policy summary fields as read-only metadata", () => {
    expect(keysOf(routingPolicySummaryFixture.summary)).toEqual([
      "cloud_enabled",
      "configured_model_count",
      "default_fallback_runner",
      "installed_legal_model_count",
      "legal_model_count",
      "local_only",
      "prompt_submission_required",
      "route_execution_required",
    ]);
    expect(keysOf(routingPolicySummaryFixture.policy_mode)).toEqual([
      "cloud_disabled_by_default",
      "local_only_default",
      "local_preview",
      "release_channel",
      "route_execution_in_summary",
    ]);
    expect(keysOf(routingPolicySummaryFixture.route_categories[0])).toEqual([
      "behavior",
      "data_boundary",
      "id",
      "label",
      "notes",
      "status",
      "tier",
    ]);
    expect(keysOf(routingPolicySummaryFixture.safety_boundaries)).toEqual([
      "no_cloud_calls",
      "no_connector_mutation",
      "no_manifest_mutation",
      "no_model_execution",
      "no_policy_mutation",
      "no_prompt_submission",
      "no_raw_prompts",
      "no_route_execution",
      "no_runner_mutation",
      "no_secrets",
      "no_telemetry",
      "notes",
      "read_only",
    ]);
    expect(routingPolicySummaryFixture.summary.cloud_enabled).toBe(false);
    expect(routingPolicySummaryFixture.safety_boundaries.no_route_execution).toBe(
      true,
    );
    expect(
      isRoutingPolicySummaryResponse({
        ...routingPolicySummaryFixture,
        safety_boundaries: {
          ...routingPolicySummaryFixture.safety_boundaries,
          no_route_execution: "true",
        },
      }),
    ).toBe(false);
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
