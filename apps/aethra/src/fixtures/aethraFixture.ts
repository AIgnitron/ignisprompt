export type HealthFixture = {
  status: string;
  service: string;
  version: string;
  started_at: string;
  local_only: boolean;
  model_count: number;
};

export type ModelManifestFixture = {
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
  installed: boolean;
  source?: string;
};

export type AuditEventFixture = {
  request_id: string;
  timestamp: string;
  event_type: string;
  route_code: string;
  tier: string;
  domain: string;
  model_id?: string;
  data_left_device: boolean;
  explanation: string;
  warnings: string[];
  cache?: {
    hit: boolean;
    kind: string;
  };
};

export const healthFixture: HealthFixture = {
  status: "ok",
  service: "ignispromptd",
  version: "0.1.0",
  started_at: "2026-05-13T03:11:36.513779Z",
  local_only: true,
  model_count: 1,
};

export const modelFixtures: ModelManifestFixture[] = [
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

export const auditEventFixtures: AuditEventFixture[] = [
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
  },
];
