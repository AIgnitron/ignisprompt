import {
  AuditEvent,
  HealthResponse,
  ModelManifest,
  ModelStatusResponse,
  RouteExplainResponse,
  SustainabilityMetricsResponse,
  VersionStatusResponse,
} from "./contracts";

export const healthFixture: HealthResponse = {
  status: "ok",
  service: "ignispromptd",
  version: "0.1.0",
  started_at: "2026-05-13T03:11:36.513779Z",
  local_only: true,
  model_count: 1,
};

export const versionStatusFixture: VersionStatusResponse = {
  service: "ignispromptd",
  version: "0.1.0",
  release_channel: "local-preview",
  local_only: true,
  build_profile: "debug",
  git_commit: null,
  started_at: "2026-05-13T03:11:36.513779Z",
  warnings: ["Local preview build; not production deployment."],
};

export const modelFixtures: ModelManifest[] = [
  {
    modelId: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
    displayName: "Qwen2.5 0.5B Instruct Q4_K_M Local Legal Adapter",
    tier: 3,
    domains: ["legal", "contracts", "compliance"],
    format: "gguf",
    quantization: "q4_k_m",
    contextWindow: 8192,
    localPath: "./models/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    promptPack: "legal-contract-review-compact-v0.1.md",
    responseFormat: "schema",
    installed: true,
    source: "local-gguf",
  },
];

export const modelStatusFixture: ModelStatusResponse = {
  schemaVersion: "v0.1",
  generatedAt: "2026-05-15T00:00:00Z",
  source: "local-daemon",
  statusHints: [
    {
      modelId: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
      displayName: "Qwen2.5 0.5B Instruct Q4_K_M Local Legal Adapter",
      tier: 3,
      domains: ["legal", "contracts", "compliance"],
      configured: true,
      localPathDeclared: true,
      localPathExists: false,
      runnerConfigured: true,
      runnerKind: "stub-legal-runner",
      runnerExecutableExists: true,
      availability: "model-file-missing",
      lastCheckedAt: "2026-05-15T00:00:00Z",
      warnings: [
        "Status is a local hint, not a production readiness, legal accuracy, or compliance claim.",
      ],
    },
  ],
};

export const auditEventFixtures: AuditEvent[] = [
  {
    request_id: "fixture-route-001",
    timestamp: "2026-05-13T03:11:37.361724Z",
    event_type: "route_explain",
    route_code: "DOMAIN_MODEL_SELECTED",
    tier: "TIER_3",
    domain: "legal",
    model_id: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
    data_left_device: false,
    explanation:
      "Synthetic fixture: IgnisPrompt selected a local Tier 3 legal route and did not consider a cloud route.",
    warnings: [],
    input_tokens_est: 28,
    output_tokens_est: 31,
    baseline_provider: "openai",
    baseline_model: "gpt-4.1-mini",
    estimated_cloud_cost_usd: 0.000012,
    estimated_cloud_cost_avoided_usd: 0.000012,
    estimated_local_energy_wh: 0.00059,
    estimated_cloud_baseline_wh: 0.00295,
    estimated_carbon_avoided_gco2e: 0.000944,
    methodology_version: "aethra-impact-0.1",
    confidence: "low",
  },
  {
    request_id: "fixture-warning-001",
    timestamp: "2026-05-13T03:12:02.398248Z",
    event_type: "route_explain",
    route_code: "DOMAIN_MODEL_SELECTED",
    tier: "TIER_3",
    domain: "legal",
    model_id: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
    data_left_device: false,
    explanation:
      "Synthetic fixture: a document-contained instruction was treated as untrusted content.",
    warnings: [
      "Document-contained instruction was detected and treated as untrusted content. Routing policy and audit behavior were not modified.",
    ],
    input_tokens_est: 34,
    output_tokens_est: 25,
    baseline_provider: "openai",
    baseline_model: "gpt-4.1-mini",
    estimated_cloud_cost_usd: 0.000012,
    estimated_cloud_cost_avoided_usd: 0.000012,
    estimated_local_energy_wh: 0.00059,
    estimated_cloud_baseline_wh: 0.00295,
    estimated_carbon_avoided_gco2e: 0.000944,
    methodology_version: "aethra-impact-0.1",
    confidence: "low",
  },
  {
    request_id: "fixture-cache-001",
    timestamp: "2026-05-13T03:13:10.100000Z",
    event_type: "chat_completion",
    route_code: "DOMAIN_MODEL_SELECTED",
    tier: "TIER_3",
    domain: "legal",
    model_id: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
    data_left_device: false,
    explanation:
      "Synthetic fixture: a prior safe local completion was reused from exact-match cache metadata.",
    warnings: [],
    cache: {
      hit: true,
      kind: "tier_1_exact_match_v0_1",
    },
    input_tokens_est: 30,
    output_tokens_est: 20,
    baseline_provider: "openai",
    baseline_model: "gpt-4.1-mini",
    estimated_cloud_cost_usd: 0.00001,
    estimated_cloud_cost_avoided_usd: 0.00001,
    estimated_local_energy_wh: 0.0005,
    estimated_cloud_baseline_wh: 0.0025,
    estimated_carbon_avoided_gco2e: 0.0008,
    methodology_version: "aethra-impact-0.1",
    confidence: "low",
  },
];

export const sustainabilityMetricsFixture: SustainabilityMetricsResponse = {
  period: "30d",
  requests_total: 3,
  local_request_rate: 1,
  tier_breakdown: {
    TIER_3: 3,
  },
  estimated_cloud_cost_avoided_usd: 0.000034,
  estimated_carbon_avoided_kgco2e: 0.000003,
  estimated_data_kept_local_gb: 0,
  baseline_provider: "openai",
  baseline_model: "gpt-4.1-mini",
  methodology_version: "aethra-impact-0.1",
  confidence: "low",
  disclaimer:
    "Demo data: Aethra sustainability values are local-only counterfactual proxy estimates. They are methodology-dependent, not measured energy use, not actual carbon accounting, not sustainability certification, and not compliance evidence.",
};

export const routeExplainFixture: RouteExplainResponse = {
  request_id: "fixture-route-explain-001",
  decision: {
    tier: "TIER_3",
    route_code: "DOMAIN_MODEL_SELECTED",
    domain: "legal",
    model_id: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
    cloud_considered: false,
    cloud_allowed: false,
    data_left_device: false,
  },
  explanation:
    "Synthetic fixture: IgnisPrompt selected a local Tier 3 legal route for route inspection.",
  warnings: [],
};
