import {
  AuditEvent,
  CapabilitiesResponse,
  EvidencePackageIndexResponse,
  HealthResponse,
  ModelInventoryResponse,
  ModelReadinessResponse,
  ModelRegistry,
  ModelStatusResponse,
  OperationsSummaryResponse,
  RunnerLifecycleAction,
  RunnerLifecycleActionResponse,
  RunnerProcessStatusResponse,
  RoutingPolicySummaryResponse,
  RouteExplainRequest,
  RouteExplainResponse,
  SustainabilityMetricsResponse,
  VersionStatusResponse,
  isAuditEventList,
  isCapabilitiesResponse,
  isEvidencePackageIndexResponse,
  isHealthResponse,
  isModelInventoryResponse,
  isModelReadinessResponse,
  isModelRegistry,
  isModelStatusResponse,
  isOperationsSummaryResponse,
  isRunnerLifecycleActionResponse,
  isRunnerProcessStatusResponse,
  isSafeRunnerLifecycleAction,
  isSafeRunnerId,
  isRoutingPolicySummaryResponse,
  isRouteExplainResponse,
  isSustainabilityMetricsResponse,
  isVersionStatusResponse,
} from "./contracts";
import { AethraApiError } from "./errors";

export const DEFAULT_IGNISPROMPT_BASE_URL = "http://127.0.0.1:8765";
const DEFAULT_TIMEOUT_MS = 5000;

type JsonGuard<T> = (value: unknown) => value is T;

export type IgnisPromptClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export class IgnisPromptClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: IgnisPromptClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ?? DEFAULT_IGNISPROMPT_BASE_URL,
    );
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  health(): Promise<HealthResponse> {
    return this.request("/health", isHealthResponse);
  }

  models(): Promise<ModelRegistry> {
    return this.request("/v1/models", isModelRegistry);
  }

  modelInventory(): Promise<ModelInventoryResponse> {
    return this.request("/v1/models/inventory", isModelInventoryResponse);
  }

  modelReadiness(): Promise<ModelReadinessResponse> {
    return this.request("/v1/models/readiness", isModelReadinessResponse);
  }

  modelStatus(): Promise<ModelStatusResponse> {
    return this.request("/v1/status/models", isModelStatusResponse);
  }

  capabilities(): Promise<CapabilitiesResponse> {
    return this.request("/v1/capabilities", isCapabilitiesResponse);
  }

  runnerProcessStatus(): Promise<RunnerProcessStatusResponse> {
    return this.request("/v1/runners/status", isRunnerProcessStatusResponse);
  }

  runnerLifecycleAction(
    runnerId: string,
    action: RunnerLifecycleAction,
  ): Promise<RunnerLifecycleActionResponse> {
    if (!isSafeRunnerLifecycleAction(action)) {
      throw new AethraApiError(
        "unexpected-shape",
        "Runner lifecycle action must be start or stop.",
      );
    }

    if (!isSafeRunnerId(runnerId)) {
      throw new AethraApiError(
        "unexpected-shape",
        "Runner ID does not match the local daemon runner identifier rules.",
      );
    }

    return this.requestLifecycleAction(
      `/v1/runners/${encodeURIComponent(runnerId)}/${action}`,
    );
  }

  operationsSummary(): Promise<OperationsSummaryResponse> {
    return this.request(
      "/v1/operations/summary",
      isOperationsSummaryResponse,
    );
  }

  routingPolicySummary(): Promise<RoutingPolicySummaryResponse> {
    return this.request(
      "/v1/routing/policy-summary",
      isRoutingPolicySummaryResponse,
    );
  }

  evidencePackages(): Promise<EvidencePackageIndexResponse> {
    return this.request("/v1/evidence/packages", isEvidencePackageIndexResponse);
  }

  versionStatus(): Promise<VersionStatusResponse> {
    return this.request("/v1/status/version", isVersionStatusResponse);
  }

  auditEvents(): Promise<AuditEvent[]> {
    return this.request("/v1/audit/events", isAuditEventList);
  }

  sustainabilityMetrics(period = "30d"): Promise<SustainabilityMetricsResponse> {
    return this.request(
      `/v1/metrics/sustainability?period=${encodeURIComponent(period)}`,
      isSustainabilityMetricsResponse,
    );
  }

  routeExplain(request: RouteExplainRequest): Promise<RouteExplainResponse> {
    return this.request("/v1/route/explain", isRouteExplainResponse, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  private async request<T>(
    path: string,
    guard: JsonGuard<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AethraApiError(
          "timeout",
          `IgnisPrompt request timed out after ${this.timeoutMs}ms.`,
          { cause: error },
        );
      }

      throw new AethraApiError(
        "unreachable-daemon",
        "Unable to reach the local IgnisPrompt daemon.",
        { cause: error },
      );
    } finally {
      globalThis.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new AethraApiError(
        "http-error",
        `IgnisPrompt returned HTTP ${response.status}.`,
        { status: response.status },
      );
    }

    let value: unknown;
    try {
      value = await response.json();
    } catch (error) {
      throw new AethraApiError(
        "invalid-json",
        "IgnisPrompt returned a response that was not valid JSON.",
        { cause: error },
      );
    }

    if (!guard(value)) {
      throw new AethraApiError(
        "unexpected-shape",
        "IgnisPrompt returned JSON that did not match the expected response shape.",
      );
    }

    return value;
  }

  private async requestLifecycleAction(
    path: string,
  ): Promise<RunnerLifecycleActionResponse> {
    const value = await this.requestAllowingContractRejection(
      path,
      (value, context) => isRunnerLifecycleActionResponse(value, context),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: true }),
      },
    );
    return value;
  }

  private async requestAllowingContractRejection<T>(
    path: string,
    guard: JsonGuard<T> | ((value: unknown, context: { httpOk: boolean }) => value is T),
    init: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AethraApiError(
          "timeout",
          `IgnisPrompt request timed out after ${this.timeoutMs}ms.`,
          { cause: error },
        );
      }

      throw new AethraApiError(
        "unreachable-daemon",
        "Unable to reach the local IgnisPrompt daemon.",
        { cause: error },
      );
    } finally {
      globalThis.clearTimeout(timeoutId);
    }

    let value: unknown;
    try {
      value = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new AethraApiError(
          "http-error",
          `IgnisPrompt returned HTTP ${response.status}.`,
          { status: response.status, cause: error },
        );
      }
      throw new AethraApiError(
        "invalid-json",
        "IgnisPrompt returned a response that was not valid JSON.",
        { cause: error },
      );
    }

    if (guard(value, { httpOk: response.ok })) {
      return value;
    }

    if (!response.ok) {
      throw new AethraApiError(
        "http-error",
        `IgnisPrompt returned HTTP ${response.status}.`,
        { status: response.status },
      );
    }

    throw new AethraApiError(
      "unexpected-shape",
      "IgnisPrompt returned JSON that did not match the expected response shape.",
    );
  }
}

export function createIgnisPromptClient(
  options: IgnisPromptClientOptions = {},
): IgnisPromptClient {
  return new IgnisPromptClient(options);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}
