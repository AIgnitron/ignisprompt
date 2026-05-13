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
  quantization?: string;
  contextWindow?: number;
  localPath?: string;
  promptPack?: string;
  responseFormat?: string;
  sha256?: string;
  version?: string;
  installed: boolean;
  source?: string;
};

export type ModelRegistry = {
  models: ModelManifest[];
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

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || isString(value);

const isOptionalNullableString = (
  value: unknown,
): value is string | null | undefined =>
  value === undefined || value === null || isString(value);

const isOptionalNumber = (value: unknown): value is number | undefined =>
  value === undefined || isNumber(value);

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
    isOptionalString(value.quantization) &&
    isOptionalNumber(value.contextWindow) &&
    isOptionalString(value.localPath) &&
    isOptionalString(value.promptPack) &&
    isOptionalString(value.responseFormat) &&
    isOptionalString(value.sha256) &&
    isOptionalString(value.version) &&
    isBoolean(value.installed) &&
    isOptionalString(value.source)
  );
}

export function isModelRegistry(value: unknown): value is ModelRegistry {
  return (
    isRecord(value) &&
    Array.isArray(value.models) &&
    value.models.every(isModelManifest)
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
      isCompletionOutputMetadata(value.completion_output))
  );
}

export function isAuditEventList(value: unknown): value is AuditEvent[] {
  return Array.isArray(value) && value.every(isAuditEvent);
}
