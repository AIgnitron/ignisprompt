export type HealthResponse = {
  status: string;
  service: string;
  version: string;
  started_at: string;
  local_only: boolean;
  model_count: number;
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
