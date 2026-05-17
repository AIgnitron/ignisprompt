import {
  AuditEvent,
  HealthResponse,
  ModelRegistry,
  ModelStatusResponse,
  RouteExplainRequest,
  RouteExplainResponse,
  SustainabilityMetricsResponse,
  isAuditEventList,
  isHealthResponse,
  isModelRegistry,
  isModelStatusResponse,
  isRouteExplainResponse,
  isSustainabilityMetricsResponse,
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

  modelStatus(): Promise<ModelStatusResponse> {
    return this.request("/v1/status/models", isModelStatusResponse);
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
}

export function createIgnisPromptClient(
  options: IgnisPromptClientOptions = {},
): IgnisPromptClient {
  return new IgnisPromptClient(options);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}
