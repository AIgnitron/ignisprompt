export type HealthResponse = {
  status: string;
  service: string;
  version: string;
  started_at: string;
  local_only: boolean;
  model_count: number;
};

export type VersionStatusResponse = {
  service: string;
  version: string;
  release_channel: string;
  local_only: boolean;
  build_profile: string;
  git_commit: string | null;
  started_at: string;
  warnings: string[];
};

export type ModelManifest = {
  modelId: string;
  displayName: string;
  tier: number;
  domains: string[];
  format: string;
  quantization?: string | null;
  contextWindow?: number | null;
  localPath?: string | null;
  promptPack?: string | null;
  responseFormat?: string | null;
  sha256?: string | null;
  version?: string | null;
  installed: boolean;
  source?: string | null;
};

export type ModelRegistry = {
  models: ModelManifest[];
};

export type ModelStatusAvailability =
  | "configured"
  | "staged"
  | "runner-missing"
  | "model-file-missing"
  | "unavailable"
  | "unknown";

export type ModelStatusHint = {
  modelId: string;
  displayName: string;
  tier: number;
  domains: string[];
  configured: boolean;
  localPathDeclared: boolean;
  localPathExists: boolean;
  runnerConfigured: boolean;
  runnerKind: string;
  runnerExecutableExists: boolean;
  availability: ModelStatusAvailability;
  lastCheckedAt: string;
  warnings: string[];
};

export type ModelStatusResponse = {
  schemaVersion: string;
  generatedAt: string;
  source: "local-daemon";
  statusHints: ModelStatusHint[];
};

export type ModelInventoryFileStatus =
  | "present"
  | "ignored"
  | "unsupported"
  | "unknown";

export type ModelInventoryFile = {
  filename: string;
  relative_path: string;
  extension: string;
  size_bytes: number;
  size_mb: number;
  modified_at?: string;
  model_family?: string;
  quantization?: string;
  shard?: string;
  status: ModelInventoryFileStatus;
  boundary_note: string;
};

export type ModelInventorySummary = {
  total_files: number;
  total_size_bytes: number;
  gguf_files: number;
  safetensors_files: number;
  manifest_declared_count: number;
  present_count: number;
  unsupported_count: number;
  largest_file_mb: number;
  scanned_directory_count: number;
  scan_limited: boolean;
  notes: string[];
};

export type ModelInventoryResponse = {
  schema_version: string;
  generated_at: string;
  base_paths_scanned: string[];
  inventory_source: string;
  files: ModelInventoryFile[];
  summary: ModelInventorySummary;
  boundary_notes: string[];
};

export type ModelReadinessFileState =
  | "present"
  | "missing"
  | "unsupported"
  | "unknown";

export type ModelReadinessLevel =
  | "ready_hint"
  | "missing_file"
  | "unsupported_format"
  | "unknown";

export type ModelReadinessRunnerHint = {
  configured: boolean;
  kind: string;
  executable_exists: boolean;
  availability: ModelStatusAvailability;
};

export type ModelReadinessModel = {
  model_id: string;
  display_name: string;
  declared_path?: string;
  matched_inventory_file?: string;
  file_state: ModelReadinessFileState;
  format: string;
  size_bytes?: number;
  size_mb?: number;
  shard?: string;
  runner_hint: ModelReadinessRunnerHint;
  readiness_level: ModelReadinessLevel;
  notes: string[];
};

export type ModelReadinessSummary = {
  manifest_declared_count: number;
  inventory_file_count: number;
  ready_hint_count: number;
  missing_file_count: number;
  unsupported_format_count: number;
  unknown_count: number;
};

export type ModelReadinessResponse = {
  schema_version: string;
  generated_at: string;
  summary: ModelReadinessSummary;
  models: ModelReadinessModel[];
  warnings: string[];
  boundary_notes: string[];
};

export type CapabilityStatusValue =
  | "unknown"
  | "not_configured"
  | "configured"
  | "available"
  | "unavailable"
  | "disabled"
  | "blocked_by_policy"
  | "not_implemented";

export type CapabilityDataBoundary =
  | "on_device"
  | "local_process"
  | "local_network"
  | "private_enterprise"
  | "cloud_with_consent";

export type CapabilityStatus = {
  provider_id: string;
  display_name: string;
  tier: string;
  connector_type: string;
  status: CapabilityStatusValue;
  available: boolean;
  configured: boolean;
  data_boundary: CapabilityDataBoundary;
  reason: string;
  confidence: string;
  warnings: string[];
  last_checked?: string;
};

export type CapabilitiesResponse = {
  release_channel: string;
  local_only: boolean;
  cloud_enabled: boolean;
  routing_order: string[];
  capabilities: CapabilityStatus[];
};

export type RunnerProcessState = "unknown" | "stopped" | "running" | "failed";
export type RunnerActionAvailability = "none" | RunnerLifecycleAction;

export type RunnerProcessStatus = {
  runner_id: string;
  runner_kind: string;
  model_id: string | null;
  configured: boolean;
  executable_exists: boolean;
  process_state: RunnerProcessState;
  pid: number | null;
  local_endpoint: string | null;
  started_at: string | null;
  stopped_at: string | null;
  last_checked_at: string;
  last_error_summary: string | null;
  managed_by_ignisprompt: boolean;
  operator_mode_required: boolean;
  actions_allowed: RunnerActionAvailability[];
  warnings: string[];
};

export type RunnerProcessStatusSummary = {
  total: number;
  configured: number;
  running: number;
  failed: number;
  actions_available: number;
};

export type RunnerProcessStatusResponse = {
  schema_version: "ignisprompt-runner-process-status-v0.1";
  generated_at: string;
  runners: RunnerProcessStatus[];
  summary: RunnerProcessStatusSummary;
  boundaries: string[];
  next_steps: string[];
};

export type RunnerLifecycleAction = "start" | "stop";
export type RunnerLifecycleOutcome = "rejected";
export type RunnerLifecycleReasonCode =
  | "CONFIRMATION_REQUIRED"
  | "INVALID_RUNNER_ID"
  | "LIFECYCLE_CONTROLS_DISABLED"
  | "RUNNER_NOT_FOUND"
  | "RUNNER_NOT_MANAGED"
  | "UNSUPPORTED_RUNNER_KIND"
  | "ACTION_NOT_AVAILABLE"
  | "AUDIT_WRITE_FAILED";

export type RunnerLifecycleActionResponse = {
  schema_version: "ignisprompt-runner-lifecycle-action-v0.1";
  request_id: string;
  action: RunnerLifecycleAction;
  runner_id: string;
  accepted: false;
  outcome: RunnerLifecycleOutcome;
  reason_code: RunnerLifecycleReasonCode;
  message: string;
  audit_event_id: string | null;
  status: RunnerProcessStatus | null;
  boundaries: string[];
};

export type RunnerLifecycleHttpContext = {
  httpOk?: boolean;
};

export type OperationsDaemonSummary = {
  status: string;
  version: string;
  uptime_seconds: number;
  started_at: string;
  local_preview: boolean;
  local_only: boolean;
};

export type OperationsEndpointSummary = {
  health_available: boolean;
  models_available: boolean;
  model_inventory_available: boolean;
  model_readiness_available: boolean;
  routing_policy_available: boolean;
  evidence_packages_available: boolean;
  capabilities_available: boolean;
  status_models_available: boolean;
  status_version_available: boolean;
  audit_events_available: boolean;
  sustainability_available: boolean;
  operations_summary_available: boolean;
};

export type OperationsAuditSummary = {
  total_events: number;
  recent_event_count: number;
  recent_event_types: string[];
  latest_event_at?: string;
  audit_store_status: string;
};

export type OperationsActivitySummary = {
  recent_requests_observed: number;
  recent_routes_observed: number;
  recent_errors_observed: number;
  last_activity_at?: string;
};

export type OperationsBoundarySummary = {
  no_prompt_bodies: boolean;
  no_raw_request_text: boolean;
  no_secrets: boolean;
  no_telemetry: boolean;
  no_cloud_calls: boolean;
  read_only: boolean;
  notes: string[];
};

export type OperationsSummaryResponse = {
  schema_version: string;
  generated_at: string;
  daemon: OperationsDaemonSummary;
  endpoints: OperationsEndpointSummary;
  audit_summary: OperationsAuditSummary;
  activity_summary: OperationsActivitySummary;
  boundaries: OperationsBoundarySummary;
};

export type RoutingPolicySummary = {
  local_only: boolean;
  route_execution_required: boolean;
  prompt_submission_required: boolean;
  cloud_enabled: boolean;
  configured_model_count: number;
  legal_model_count: number;
  installed_legal_model_count: number;
  default_fallback_runner: string;
};

export type RoutingPolicyMode = {
  release_channel: string;
  local_preview: boolean;
  local_only_default: boolean;
  cloud_disabled_by_default: boolean;
  route_execution_in_summary: boolean;
};

export type RoutingPolicyCategory = {
  id: string;
  label: string;
  tier: string;
  status: string;
  behavior: string;
  data_boundary: string;
  notes: string[];
};

export type RoutingPolicyHint = {
  id: string;
  label: string;
  detail: string;
};

export type RoutingPolicySafetyBoundaries = {
  read_only: boolean;
  no_route_execution: boolean;
  no_model_execution: boolean;
  no_prompt_submission: boolean;
  no_policy_mutation: boolean;
  no_manifest_mutation: boolean;
  no_connector_mutation: boolean;
  no_runner_mutation: boolean;
  no_cloud_calls: boolean;
  no_telemetry: boolean;
  no_secrets: boolean;
  no_raw_prompts: boolean;
  notes: string[];
};

export type RoutingPolicySummaryResponse = {
  schema_version: string;
  generated_at: string;
  summary: RoutingPolicySummary;
  policy_mode: RoutingPolicyMode;
  route_categories: RoutingPolicyCategory[];
  decision_inputs: RoutingPolicyHint[];
  model_selection_hints: RoutingPolicyHint[];
  connector_policy_hints: RoutingPolicyHint[];
  audit_policy_hints: RoutingPolicyHint[];
  safety_boundaries: RoutingPolicySafetyBoundaries;
  warnings: string[];
  next_steps: string[];
};

export type EvidencePackageType =
  | "readiness_package"
  | "legal_bakeoff"
  | "golden_legal"
  | "demo_evidence_workflow"
  | "local_legal_review"
  | "attestation_like_preview"
  | "archive"
  | "unknown";

export type EvidencePackageRootSummary = {
  evidence_root_label: string;
  root_exists: boolean;
  package_count: number;
  scan_limit_reached: boolean;
  ignored_paths_summary: string[];
};

export type EvidencePackageMetadata = {
  package_id: string;
  package_type: EvidencePackageType;
  display_name: string;
  relative_path: string;
  observed_at?: string;
  modified_at?: string;
  file_count: number;
  total_size_bytes: number;
  has_manifest: boolean;
  has_summary: boolean;
  has_report: boolean;
  has_validation_report: boolean;
  has_attestation_like_files: boolean;
  known_artifacts: string[];
  warnings: string[];
  boundary_notes: string[];
};

export type EvidencePackageAggregateSummary = {
  total_packages: number;
  packages_by_type: Record<string, number>;
  packages_with_manifests: number;
  packages_with_reports: number;
  packages_with_validation_like_files: number;
  packages_with_attestation_like_names: number;
  packages_with_warnings: number;
  latest_observed_package?: string;
  scan_was_partial: boolean;
};

export type EvidencePackageIndexResponse = {
  schema_version: string;
  generated_at: string;
  root_summary: EvidencePackageRootSummary;
  packages: EvidencePackageMetadata[];
  aggregate_summary: EvidencePackageAggregateSummary;
  warnings: string[];
  boundary_notes: string[];
  next_steps: string[];
};

export type ChatMessage = {
  role: string;
  content: string;
};

export type RouteExplainRequest = {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  metadata?: Record<string, unknown>;
};

export type RouteDecision = {
  tier: string;
  route_code: string;
  domain: string;
  model_id?: string | null;
  cloud_considered: boolean;
  cloud_allowed: boolean;
  data_left_device: boolean;
};

export type RouteExplainResponse = {
  request_id: string;
  decision: RouteDecision;
  explanation: string;
  warnings: string[];
};

export type CacheMetadata = {
  hit: boolean;
  kind: string;
};

export type LegalJsonMetadata = {
  status: string;
  schema_valid?: boolean;
  source?: string;
  error?: string;
};

export type CompletionOutputMetadata = {
  runner: string;
  legal_json?: LegalJsonMetadata | null;
};

export type AuditEvent = {
  request_id: string;
  timestamp: string;
  event_type: string;
  route_code: string;
  tier: string;
  domain: string;
  model_id?: string | null;
  data_left_device: boolean;
  explanation: string;
  warnings: string[];
  cache?: CacheMetadata;
  completion_output?: CompletionOutputMetadata;
  input_tokens_est?: number;
  output_tokens_est?: number;
  baseline_provider?: string;
  baseline_model?: string;
  estimated_cloud_cost_usd?: number;
  estimated_cloud_cost_avoided_usd?: number;
  estimated_local_energy_wh?: number;
  estimated_cloud_baseline_wh?: number;
  estimated_carbon_avoided_gco2e?: number;
  methodology_version?: string;
  confidence?: string;
};

export type SustainabilityMetricsResponse = {
  period: string;
  requests_total: number;
  local_request_rate: number;
  tier_breakdown: Record<string, number>;
  estimated_cloud_cost_avoided_usd: number;
  estimated_carbon_avoided_kgco2e: number;
  estimated_data_kept_local_gb: number;
  baseline_provider: string;
  baseline_model: string;
  methodology_version: string;
  confidence: string;
  disclaimer: string;
};

export type EvidenceBundleManifest = {
  bundle_schema_version: string;
  bundle_name: string;
  generated_at: string;
  generated_files: string[];
  included_endpoints: string[];
  audit_events_included: boolean;
  local_preview_boundary: string;
  non_certified_boundary: string;
  not_signed_boundary: string;
  not_production_attestation_boundary: string;
};

export type EvidenceBundleValidationSummary = {
  bundle_schema_version: string;
  validation_mode: string;
  status: string;
  required_files: string[];
  optional_files: string[];
  missing_files: string[];
  parsed_json_files: string[];
  placeholder_string_detected: boolean;
  safe_fields_redacted: boolean;
  note: string;
};

export type EvidenceBundleArchivePreview = {
  archive_name: string;
  archive_format: string;
  bundle_name: string;
  created_at: string;
  generated_files: string[];
  file_count: number;
  byte_size_estimate: number;
  includes_files_outside_bundle: boolean;
  symlinks_followed: boolean;
  signed: boolean;
  certified: boolean;
  tamper_evident: boolean;
  note: string;
};

export type EvidenceBundlePreview = {
  manifest: EvidenceBundleManifest;
  validation: EvidenceBundleValidationSummary;
  archivePreview?: EvidenceBundleArchivePreview | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string =>
  typeof value === "string";

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const modelStatusAvailabilityValues = new Set<ModelStatusAvailability>([
  "configured",
  "staged",
  "runner-missing",
  "model-file-missing",
  "unavailable",
  "unknown",
]);

const isModelStatusAvailability = (
  value: unknown,
): value is ModelStatusAvailability =>
  isString(value) &&
  modelStatusAvailabilityValues.has(value as ModelStatusAvailability);

const modelInventoryFileStatusValues = new Set<ModelInventoryFileStatus>([
  "present",
  "ignored",
  "unsupported",
  "unknown",
]);

const isModelInventoryFileStatus = (
  value: unknown,
): value is ModelInventoryFileStatus =>
  isString(value) &&
  modelInventoryFileStatusValues.has(value as ModelInventoryFileStatus);

const modelReadinessFileStateValues = new Set<ModelReadinessFileState>([
  "present",
  "missing",
  "unsupported",
  "unknown",
]);

const isModelReadinessFileState = (
  value: unknown,
): value is ModelReadinessFileState =>
  isString(value) &&
  modelReadinessFileStateValues.has(value as ModelReadinessFileState);

const modelReadinessLevelValues = new Set<ModelReadinessLevel>([
  "ready_hint",
  "missing_file",
  "unsupported_format",
  "unknown",
]);

const isModelReadinessLevel = (
  value: unknown,
): value is ModelReadinessLevel =>
  isString(value) && modelReadinessLevelValues.has(value as ModelReadinessLevel);

const capabilityStatusValues = new Set<CapabilityStatusValue>([
  "unknown",
  "not_configured",
  "configured",
  "available",
  "unavailable",
  "disabled",
  "blocked_by_policy",
  "not_implemented",
]);

const isCapabilityStatusValue = (
  value: unknown,
): value is CapabilityStatusValue =>
  isString(value) && capabilityStatusValues.has(value as CapabilityStatusValue);

const capabilityDataBoundaryValues = new Set<CapabilityDataBoundary>([
  "on_device",
  "local_process",
  "local_network",
  "private_enterprise",
  "cloud_with_consent",
]);

const isCapabilityDataBoundary = (
  value: unknown,
): value is CapabilityDataBoundary =>
  isString(value) &&
  capabilityDataBoundaryValues.has(value as CapabilityDataBoundary);

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || isString(value);

const isOptionalNullableString = (
  value: unknown,
): value is string | null | undefined =>
  value === undefined || value === null || isString(value);

const isOptionalNumber = (value: unknown): value is number | undefined =>
  value === undefined || isNumber(value);

const isOptionalNullableNumber = (
  value: unknown,
): value is number | null | undefined =>
  value === undefined || value === null || isNumber(value);

const runnerProcessStateValues = new Set<RunnerProcessState>([
  "unknown",
  "stopped",
  "running",
  "failed",
]);

const isRunnerProcessState = (value: unknown): value is RunnerProcessState =>
  isString(value) && runnerProcessStateValues.has(value as RunnerProcessState);

const runnerLifecycleActionValues = new Set<RunnerLifecycleAction>([
  "start",
  "stop",
]);

const isRunnerLifecycleAction = (
  value: unknown,
): value is RunnerLifecycleAction =>
  isString(value) &&
  runnerLifecycleActionValues.has(value as RunnerLifecycleAction);

export const isSafeRunnerLifecycleAction = (
  value: unknown,
): value is RunnerLifecycleAction => isRunnerLifecycleAction(value);

const runnerActionAvailabilityValues = new Set<RunnerActionAvailability>([
  "none",
  "start",
  "stop",
]);

const isRunnerActionAvailability = (
  value: unknown,
): value is RunnerActionAvailability =>
  isString(value) &&
  runnerActionAvailabilityValues.has(value as RunnerActionAvailability);

const isRunnerActionAvailabilityArray = (
  value: unknown,
): value is RunnerActionAvailability[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  if (!value.every(isRunnerActionAvailability)) {
    return false;
  }

  const uniqueValues = new Set(value);
  if (uniqueValues.size !== value.length) {
    return false;
  }

  return value.includes("none") ? value.length === 1 : true;
};

export function isSafeRunnerId(value: unknown): value is string {
  return (
    isString(value) &&
    value.length >= 1 &&
    value.length <= 128 &&
    /^[A-Za-z0-9._-]+$/.test(value)
  );
}

const runnerLifecycleOutcomeValues = new Set<RunnerLifecycleOutcome>(["rejected"]);

const isRunnerLifecycleOutcome = (
  value: unknown,
): value is RunnerLifecycleOutcome =>
  isString(value) &&
  runnerLifecycleOutcomeValues.has(value as RunnerLifecycleOutcome);

const runnerLifecycleReasonCodeValues = new Set<RunnerLifecycleReasonCode>([
  "CONFIRMATION_REQUIRED",
  "INVALID_RUNNER_ID",
  "LIFECYCLE_CONTROLS_DISABLED",
  "RUNNER_NOT_FOUND",
  "RUNNER_NOT_MANAGED",
  "UNSUPPORTED_RUNNER_KIND",
  "ACTION_NOT_AVAILABLE",
  "AUDIT_WRITE_FAILED",
]);

const isRunnerLifecycleReasonCode = (
  value: unknown,
): value is RunnerLifecycleReasonCode =>
  isString(value) &&
  runnerLifecycleReasonCodeValues.has(value as RunnerLifecycleReasonCode);

export function isHealthResponse(value: unknown): value is HealthResponse {
  return (
    isRecord(value) &&
    isString(value.status) &&
    isString(value.service) &&
    isString(value.version) &&
    isString(value.started_at) &&
    isBoolean(value.local_only) &&
    isNumber(value.model_count)
  );
}

export function isVersionStatusResponse(
  value: unknown,
): value is VersionStatusResponse {
  return (
    isRecord(value) &&
    isString(value.service) &&
    isString(value.version) &&
    isString(value.release_channel) &&
    isBoolean(value.local_only) &&
    isString(value.build_profile) &&
    (value.git_commit === null || isString(value.git_commit)) &&
    isString(value.started_at) &&
    isStringArray(value.warnings)
  );
}

export function isModelManifest(value: unknown): value is ModelManifest {
  return (
    isRecord(value) &&
    isString(value.modelId) &&
    isString(value.displayName) &&
    isNumber(value.tier) &&
    isStringArray(value.domains) &&
    isString(value.format) &&
    isOptionalNullableString(value.quantization) &&
    isOptionalNullableNumber(value.contextWindow) &&
    isOptionalNullableString(value.localPath) &&
    isOptionalNullableString(value.promptPack) &&
    isOptionalNullableString(value.responseFormat) &&
    isOptionalNullableString(value.sha256) &&
    isOptionalNullableString(value.version) &&
    isBoolean(value.installed) &&
    isOptionalNullableString(value.source)
  );
}

export function isModelRegistry(value: unknown): value is ModelRegistry {
  return (
    isRecord(value) &&
    Array.isArray(value.models) &&
    value.models.every(isModelManifest)
  );
}

export function isModelStatusHint(value: unknown): value is ModelStatusHint {
  return (
    isRecord(value) &&
    isString(value.modelId) &&
    isString(value.displayName) &&
    isNumber(value.tier) &&
    isStringArray(value.domains) &&
    isBoolean(value.configured) &&
    isBoolean(value.localPathDeclared) &&
    isBoolean(value.localPathExists) &&
    isBoolean(value.runnerConfigured) &&
    isString(value.runnerKind) &&
    isBoolean(value.runnerExecutableExists) &&
    isModelStatusAvailability(value.availability) &&
    isString(value.lastCheckedAt) &&
    isStringArray(value.warnings)
  );
}

export function isModelStatusResponse(
  value: unknown,
): value is ModelStatusResponse {
  return (
    isRecord(value) &&
    isString(value.schemaVersion) &&
    isString(value.generatedAt) &&
    value.source === "local-daemon" &&
    Array.isArray(value.statusHints) &&
    value.statusHints.every(isModelStatusHint)
  );
}

export function isModelInventoryFile(
  value: unknown,
): value is ModelInventoryFile {
  return (
    isRecord(value) &&
    isString(value.filename) &&
    isString(value.relative_path) &&
    isString(value.extension) &&
    isNumber(value.size_bytes) &&
    isNumber(value.size_mb) &&
    isOptionalString(value.modified_at) &&
    isOptionalString(value.model_family) &&
    isOptionalString(value.quantization) &&
    isOptionalString(value.shard) &&
    isModelInventoryFileStatus(value.status) &&
    isString(value.boundary_note)
  );
}

export function isModelInventorySummary(
  value: unknown,
): value is ModelInventorySummary {
  return (
    isRecord(value) &&
    isNumber(value.total_files) &&
    isNumber(value.total_size_bytes) &&
    isNumber(value.gguf_files) &&
    isNumber(value.safetensors_files) &&
    isNumber(value.manifest_declared_count) &&
    isNumber(value.present_count) &&
    isNumber(value.unsupported_count) &&
    isNumber(value.largest_file_mb) &&
    isNumber(value.scanned_directory_count) &&
    isBoolean(value.scan_limited) &&
    isStringArray(value.notes)
  );
}

export function isModelInventoryResponse(
  value: unknown,
): value is ModelInventoryResponse {
  return (
    isRecord(value) &&
    isString(value.schema_version) &&
    isString(value.generated_at) &&
    isStringArray(value.base_paths_scanned) &&
    isString(value.inventory_source) &&
    Array.isArray(value.files) &&
    value.files.every(isModelInventoryFile) &&
    isModelInventorySummary(value.summary) &&
    isStringArray(value.boundary_notes)
  );
}

export function isModelReadinessRunnerHint(
  value: unknown,
): value is ModelReadinessRunnerHint {
  return (
    isRecord(value) &&
    isBoolean(value.configured) &&
    isString(value.kind) &&
    isBoolean(value.executable_exists) &&
    isModelStatusAvailability(value.availability)
  );
}

export function isModelReadinessModel(
  value: unknown,
): value is ModelReadinessModel {
  return (
    isRecord(value) &&
    isString(value.model_id) &&
    isString(value.display_name) &&
    isOptionalString(value.declared_path) &&
    isOptionalString(value.matched_inventory_file) &&
    isModelReadinessFileState(value.file_state) &&
    isString(value.format) &&
    isOptionalNumber(value.size_bytes) &&
    isOptionalNumber(value.size_mb) &&
    isOptionalString(value.shard) &&
    isModelReadinessRunnerHint(value.runner_hint) &&
    isModelReadinessLevel(value.readiness_level) &&
    isStringArray(value.notes)
  );
}

export function isModelReadinessSummary(
  value: unknown,
): value is ModelReadinessSummary {
  return (
    isRecord(value) &&
    isNumber(value.manifest_declared_count) &&
    isNumber(value.inventory_file_count) &&
    isNumber(value.ready_hint_count) &&
    isNumber(value.missing_file_count) &&
    isNumber(value.unsupported_format_count) &&
    isNumber(value.unknown_count)
  );
}

export function isModelReadinessResponse(
  value: unknown,
): value is ModelReadinessResponse {
  return (
    isRecord(value) &&
    isString(value.schema_version) &&
    isString(value.generated_at) &&
    isModelReadinessSummary(value.summary) &&
    Array.isArray(value.models) &&
    value.models.every(isModelReadinessModel) &&
    isStringArray(value.warnings) &&
    isStringArray(value.boundary_notes)
  );
}

export function isCapabilityStatus(value: unknown): value is CapabilityStatus {
  return (
    isRecord(value) &&
    isString(value.provider_id) &&
    isString(value.display_name) &&
    isString(value.tier) &&
    isString(value.connector_type) &&
    isCapabilityStatusValue(value.status) &&
    isBoolean(value.available) &&
    isBoolean(value.configured) &&
    isCapabilityDataBoundary(value.data_boundary) &&
    isString(value.reason) &&
    isString(value.confidence) &&
    isStringArray(value.warnings) &&
    isOptionalString(value.last_checked)
  );
}

export function isCapabilitiesResponse(
  value: unknown,
): value is CapabilitiesResponse {
  return (
    isRecord(value) &&
    isString(value.release_channel) &&
    isBoolean(value.local_only) &&
    isBoolean(value.cloud_enabled) &&
    isStringArray(value.routing_order) &&
    Array.isArray(value.capabilities) &&
    value.capabilities.every(isCapabilityStatus)
  );
}

export function isRunnerProcessStatus(
  value: unknown,
): value is RunnerProcessStatus {
  return (
    isRecord(value) &&
    isSafeRunnerId(value.runner_id) &&
    isString(value.runner_kind) &&
    (value.model_id === null || isString(value.model_id)) &&
    isBoolean(value.configured) &&
    isBoolean(value.executable_exists) &&
    isRunnerProcessState(value.process_state) &&
    (value.pid === null || isNumber(value.pid)) &&
    (value.local_endpoint === null || isString(value.local_endpoint)) &&
    (value.started_at === null || isString(value.started_at)) &&
    (value.stopped_at === null || isString(value.stopped_at)) &&
    isString(value.last_checked_at) &&
    (value.last_error_summary === null || isString(value.last_error_summary)) &&
    isBoolean(value.managed_by_ignisprompt) &&
    isBoolean(value.operator_mode_required) &&
    isRunnerActionAvailabilityArray(value.actions_allowed) &&
    isStringArray(value.warnings)
  );
}

export function isRunnerProcessStatusSummary(
  value: unknown,
): value is RunnerProcessStatusSummary {
  return (
    isRecord(value) &&
    isNumber(value.total) &&
    isNumber(value.configured) &&
    isNumber(value.running) &&
    isNumber(value.failed) &&
    isNumber(value.actions_available)
  );
}

export function isRunnerProcessStatusResponse(
  value: unknown,
): value is RunnerProcessStatusResponse {
  return (
    isRecord(value) &&
    value.schema_version === "ignisprompt-runner-process-status-v0.1" &&
    isString(value.generated_at) &&
    Array.isArray(value.runners) &&
    value.runners.every(isRunnerProcessStatus) &&
    isRunnerProcessStatusSummary(value.summary) &&
    isStringArray(value.boundaries) &&
    isStringArray(value.next_steps)
  );
}

export function isRunnerLifecycleActionResponse(
  value: unknown,
  context: RunnerLifecycleHttpContext = {},
): value is RunnerLifecycleActionResponse {
  return (
    isRecord(value) &&
    value.schema_version === "ignisprompt-runner-lifecycle-action-v0.1" &&
    isString(value.request_id) &&
    isRunnerLifecycleAction(value.action) &&
    isSafeRunnerId(value.runner_id) &&
    value.accepted === false &&
    value.outcome === "rejected" &&
    context.httpOk !== true &&
    isRunnerLifecycleReasonCode(value.reason_code) &&
    (value.reason_code !== "AUDIT_WRITE_FAILED" ||
      value.audit_event_id === null) &&
    isString(value.message) &&
    (value.audit_event_id === null || isString(value.audit_event_id)) &&
    (value.status === null ||
      (isRunnerProcessStatus(value.status) &&
        value.status.runner_id === value.runner_id)) &&
    isStringArray(value.boundaries)
  );
}

export function isOperationsDaemonSummary(
  value: unknown,
): value is OperationsDaemonSummary {
  return (
    isRecord(value) &&
    isString(value.status) &&
    isString(value.version) &&
    isNumber(value.uptime_seconds) &&
    isString(value.started_at) &&
    isBoolean(value.local_preview) &&
    isBoolean(value.local_only)
  );
}

export function isOperationsEndpointSummary(
  value: unknown,
): value is OperationsEndpointSummary {
  return (
    isRecord(value) &&
    isBoolean(value.health_available) &&
    isBoolean(value.models_available) &&
    isBoolean(value.model_inventory_available) &&
    isBoolean(value.model_readiness_available) &&
    isBoolean(value.routing_policy_available) &&
    isBoolean(value.evidence_packages_available) &&
    isBoolean(value.capabilities_available) &&
    isBoolean(value.status_models_available) &&
    isBoolean(value.status_version_available) &&
    isBoolean(value.audit_events_available) &&
    isBoolean(value.sustainability_available) &&
    isBoolean(value.operations_summary_available)
  );
}

export function isRoutingPolicySummary(
  value: unknown,
): value is RoutingPolicySummary {
  return (
    isRecord(value) &&
    isBoolean(value.local_only) &&
    isBoolean(value.route_execution_required) &&
    isBoolean(value.prompt_submission_required) &&
    isBoolean(value.cloud_enabled) &&
    isNumber(value.configured_model_count) &&
    isNumber(value.legal_model_count) &&
    isNumber(value.installed_legal_model_count) &&
    isString(value.default_fallback_runner)
  );
}

export function isRoutingPolicyMode(value: unknown): value is RoutingPolicyMode {
  return (
    isRecord(value) &&
    isString(value.release_channel) &&
    isBoolean(value.local_preview) &&
    isBoolean(value.local_only_default) &&
    isBoolean(value.cloud_disabled_by_default) &&
    isBoolean(value.route_execution_in_summary)
  );
}

export function isRoutingPolicyCategory(
  value: unknown,
): value is RoutingPolicyCategory {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.label) &&
    isString(value.tier) &&
    isString(value.status) &&
    isString(value.behavior) &&
    isString(value.data_boundary) &&
    isStringArray(value.notes)
  );
}

export function isRoutingPolicyHint(value: unknown): value is RoutingPolicyHint {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.label) &&
    isString(value.detail)
  );
}

export function isRoutingPolicySafetyBoundaries(
  value: unknown,
): value is RoutingPolicySafetyBoundaries {
  return (
    isRecord(value) &&
    isBoolean(value.read_only) &&
    isBoolean(value.no_route_execution) &&
    isBoolean(value.no_model_execution) &&
    isBoolean(value.no_prompt_submission) &&
    isBoolean(value.no_policy_mutation) &&
    isBoolean(value.no_manifest_mutation) &&
    isBoolean(value.no_connector_mutation) &&
    isBoolean(value.no_runner_mutation) &&
    isBoolean(value.no_cloud_calls) &&
    isBoolean(value.no_telemetry) &&
    isBoolean(value.no_secrets) &&
    isBoolean(value.no_raw_prompts) &&
    isStringArray(value.notes)
  );
}

export function isRoutingPolicySummaryResponse(
  value: unknown,
): value is RoutingPolicySummaryResponse {
  return (
    isRecord(value) &&
    isString(value.schema_version) &&
    isString(value.generated_at) &&
    isRoutingPolicySummary(value.summary) &&
    isRoutingPolicyMode(value.policy_mode) &&
    Array.isArray(value.route_categories) &&
    value.route_categories.every(isRoutingPolicyCategory) &&
    Array.isArray(value.decision_inputs) &&
    value.decision_inputs.every(isRoutingPolicyHint) &&
    Array.isArray(value.model_selection_hints) &&
    value.model_selection_hints.every(isRoutingPolicyHint) &&
    Array.isArray(value.connector_policy_hints) &&
    value.connector_policy_hints.every(isRoutingPolicyHint) &&
    Array.isArray(value.audit_policy_hints) &&
    value.audit_policy_hints.every(isRoutingPolicyHint) &&
    isRoutingPolicySafetyBoundaries(value.safety_boundaries) &&
    isStringArray(value.warnings) &&
    isStringArray(value.next_steps)
  );
}

export function isEvidencePackageType(
  value: unknown,
): value is EvidencePackageType {
  return (
    value === "readiness_package" ||
    value === "legal_bakeoff" ||
    value === "golden_legal" ||
    value === "demo_evidence_workflow" ||
    value === "local_legal_review" ||
    value === "attestation_like_preview" ||
    value === "archive" ||
    value === "unknown"
  );
}

export function isEvidencePackageRootSummary(
  value: unknown,
): value is EvidencePackageRootSummary {
  return (
    isRecord(value) &&
    isString(value.evidence_root_label) &&
    isBoolean(value.root_exists) &&
    isNumber(value.package_count) &&
    isBoolean(value.scan_limit_reached) &&
    isStringArray(value.ignored_paths_summary)
  );
}

function isSafeEvidenceRelativePath(value: string): boolean {
  return (
    value.startsWith("local-evidence/") &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !value.includes("\\")
  );
}

export function isEvidencePackageMetadata(
  value: unknown,
): value is EvidencePackageMetadata {
  return (
    isRecord(value) &&
    isString(value.package_id) &&
    isEvidencePackageType(value.package_type) &&
    isString(value.display_name) &&
    isString(value.relative_path) &&
    isSafeEvidenceRelativePath(value.relative_path) &&
    isOptionalString(value.observed_at) &&
    isOptionalString(value.modified_at) &&
    isNumber(value.file_count) &&
    isNumber(value.total_size_bytes) &&
    isBoolean(value.has_manifest) &&
    isBoolean(value.has_summary) &&
    isBoolean(value.has_report) &&
    isBoolean(value.has_validation_report) &&
    isBoolean(value.has_attestation_like_files) &&
    isStringArray(value.known_artifacts) &&
    isStringArray(value.warnings) &&
    isStringArray(value.boundary_notes)
  );
}

export function isEvidencePackageAggregateSummary(
  value: unknown,
): value is EvidencePackageAggregateSummary {
  return (
    isRecord(value) &&
    isNumber(value.total_packages) &&
    isRecord(value.packages_by_type) &&
    Object.values(value.packages_by_type).every(isNumber) &&
    isNumber(value.packages_with_manifests) &&
    isNumber(value.packages_with_reports) &&
    isNumber(value.packages_with_validation_like_files) &&
    isNumber(value.packages_with_attestation_like_names) &&
    isNumber(value.packages_with_warnings) &&
    isOptionalString(value.latest_observed_package) &&
    isBoolean(value.scan_was_partial)
  );
}

export function isEvidencePackageIndexResponse(
  value: unknown,
): value is EvidencePackageIndexResponse {
  return (
    isRecord(value) &&
    isString(value.schema_version) &&
    isString(value.generated_at) &&
    isEvidencePackageRootSummary(value.root_summary) &&
    Array.isArray(value.packages) &&
    value.packages.every(isEvidencePackageMetadata) &&
    isEvidencePackageAggregateSummary(value.aggregate_summary) &&
    isStringArray(value.warnings) &&
    isStringArray(value.boundary_notes) &&
    isStringArray(value.next_steps)
  );
}

export function isOperationsAuditSummary(
  value: unknown,
): value is OperationsAuditSummary {
  return (
    isRecord(value) &&
    isNumber(value.total_events) &&
    isNumber(value.recent_event_count) &&
    isStringArray(value.recent_event_types) &&
    isOptionalString(value.latest_event_at) &&
    isString(value.audit_store_status)
  );
}

export function isOperationsActivitySummary(
  value: unknown,
): value is OperationsActivitySummary {
  return (
    isRecord(value) &&
    isNumber(value.recent_requests_observed) &&
    isNumber(value.recent_routes_observed) &&
    isNumber(value.recent_errors_observed) &&
    isOptionalString(value.last_activity_at)
  );
}

export function isOperationsBoundarySummary(
  value: unknown,
): value is OperationsBoundarySummary {
  return (
    isRecord(value) &&
    isBoolean(value.no_prompt_bodies) &&
    isBoolean(value.no_raw_request_text) &&
    isBoolean(value.no_secrets) &&
    isBoolean(value.no_telemetry) &&
    isBoolean(value.no_cloud_calls) &&
    isBoolean(value.read_only) &&
    isStringArray(value.notes)
  );
}

export function isOperationsSummaryResponse(
  value: unknown,
): value is OperationsSummaryResponse {
  return (
    isRecord(value) &&
    isString(value.schema_version) &&
    isString(value.generated_at) &&
    isOperationsDaemonSummary(value.daemon) &&
    isOperationsEndpointSummary(value.endpoints) &&
    isOperationsAuditSummary(value.audit_summary) &&
    isOperationsActivitySummary(value.activity_summary) &&
    isOperationsBoundarySummary(value.boundaries)
  );
}

export function isRouteDecision(value: unknown): value is RouteDecision {
  return (
    isRecord(value) &&
    isString(value.tier) &&
    isString(value.route_code) &&
    isString(value.domain) &&
    isOptionalNullableString(value.model_id) &&
    isBoolean(value.cloud_considered) &&
    isBoolean(value.cloud_allowed) &&
    isBoolean(value.data_left_device)
  );
}

export function isRouteExplainResponse(
  value: unknown,
): value is RouteExplainResponse {
  return (
    isRecord(value) &&
    isString(value.request_id) &&
    isRouteDecision(value.decision) &&
    isString(value.explanation) &&
    isStringArray(value.warnings)
  );
}

export function isCacheMetadata(value: unknown): value is CacheMetadata {
  return (
    isRecord(value) &&
    isBoolean(value.hit) &&
    isString(value.kind)
  );
}

export function isLegalJsonMetadata(value: unknown): value is LegalJsonMetadata {
  return (
    isRecord(value) &&
    isString(value.status) &&
    (value.schema_valid === undefined || isBoolean(value.schema_valid)) &&
    isOptionalString(value.source) &&
    isOptionalString(value.error)
  );
}

export function isCompletionOutputMetadata(
  value: unknown,
): value is CompletionOutputMetadata {
  return (
    isRecord(value) &&
    isString(value.runner) &&
    (value.legal_json === undefined ||
      value.legal_json === null ||
      isLegalJsonMetadata(value.legal_json))
  );
}

export function isAuditEvent(value: unknown): value is AuditEvent {
  return (
    isRecord(value) &&
    isString(value.request_id) &&
    isString(value.timestamp) &&
    isString(value.event_type) &&
    isString(value.route_code) &&
    isString(value.tier) &&
    isString(value.domain) &&
    isOptionalNullableString(value.model_id) &&
    isBoolean(value.data_left_device) &&
    isString(value.explanation) &&
    isStringArray(value.warnings) &&
    (value.cache === undefined || isCacheMetadata(value.cache)) &&
    (value.completion_output === undefined ||
      isCompletionOutputMetadata(value.completion_output)) &&
    isOptionalNumber(value.input_tokens_est) &&
    isOptionalNumber(value.output_tokens_est) &&
    isOptionalString(value.baseline_provider) &&
    isOptionalString(value.baseline_model) &&
    isOptionalNumber(value.estimated_cloud_cost_usd) &&
    isOptionalNumber(value.estimated_cloud_cost_avoided_usd) &&
    isOptionalNumber(value.estimated_local_energy_wh) &&
    isOptionalNumber(value.estimated_cloud_baseline_wh) &&
    isOptionalNumber(value.estimated_carbon_avoided_gco2e) &&
    isOptionalString(value.methodology_version) &&
    isOptionalString(value.confidence)
  );
}

export function isAuditEventList(value: unknown): value is AuditEvent[] {
  return Array.isArray(value) && value.every(isAuditEvent);
}

export function isSustainabilityMetricsResponse(
  value: unknown,
): value is SustainabilityMetricsResponse {
  return (
    isRecord(value) &&
    isString(value.period) &&
    isNumber(value.requests_total) &&
    isNumber(value.local_request_rate) &&
    isRecord(value.tier_breakdown) &&
    Object.values(value.tier_breakdown).every(isNumber) &&
    isNumber(value.estimated_cloud_cost_avoided_usd) &&
    isNumber(value.estimated_carbon_avoided_kgco2e) &&
    isNumber(value.estimated_data_kept_local_gb) &&
    isString(value.baseline_provider) &&
    isString(value.baseline_model) &&
    isString(value.methodology_version) &&
    isString(value.confidence) &&
    isString(value.disclaimer)
  );
}
