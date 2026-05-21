import { RouteExplainRequest, RouteExplainResponse } from "../api/contracts";
import { AethraApiError } from "../api/errors";

export type RouteExplainFixtureScenario = {
  id: string;
  label: string;
  description: string;
  response?: RouteExplainResponse;
  errorMessage?: string;
};

export const sampleRoutePrompt =
  "Review this synthetic indemnification clause excerpt and identify which local routing tier IgnisPrompt would choose.";

const warningDecisionPattern =
  /ERR|ERROR|REJECT|FAIL|UNAVAILABLE|RAM_PRESSURE|MEMORY_PRESSURE/i;

export function buildRouteExplainRequest(
  prompt: string,
  model: string,
  domain: string,
): RouteExplainRequest {
  const trimmedModel = model.trim();
  const trimmedDomain = domain.trim();

  return {
    ...(trimmedModel.length > 0 ? { model: trimmedModel } : {}),
    messages: [{ role: "user", content: prompt.trim() }],
    ...(trimmedDomain.length > 0
      ? { metadata: { domain: trimmedDomain } }
      : {}),
  };
}

export function validateRoutePrompt(prompt: string): string | undefined {
  if (prompt.trim().length === 0) {
    return "Enter synthetic or non-sensitive text before running route inspection.";
  }

  return undefined;
}

export function describeRouteExplainError(error: unknown): string {
  if (error instanceof AethraApiError) {
    switch (error.kind) {
      case "unreachable-daemon":
        return "Unable to reach the local IgnisPrompt daemon. Confirm it is running on the configured localhost URL.";
      case "timeout":
        return "The local route-explain request timed out.";
      case "http-error":
        return `IgnisPrompt returned HTTP ${error.status ?? "error"}.`;
      case "invalid-json":
        return "IgnisPrompt returned invalid JSON.";
      case "unexpected-shape":
        return "IgnisPrompt returned JSON that did not match the expected route-explain shape.";
    }
  }

  return "The local route-explain request failed.";
}

export function isWarningRouteDecision(
  response: RouteExplainResponse,
): boolean {
  return (
    warningDecisionPattern.test(response.decision.tier) ||
    warningDecisionPattern.test(response.decision.route_code)
  );
}

export function buildRouteDecisionCopyText(
  response: RouteExplainResponse,
): string {
  return `${JSON.stringify(
    {
      request_id: response.request_id,
      decision: response.decision,
      explanation: response.explanation,
      warnings: response.warnings,
    },
    null,
    2,
  )}\n`;
}

export function buildRouteFixtureScenarios(
  successResponse: RouteExplainResponse,
): RouteExplainFixtureScenario[] {
  return [
    {
      id: "success",
      label: "Fixture: local legal route",
      description: "Tier 3 selected with no cloud route considered.",
      response: successResponse,
    },
    {
      id: "warning",
      label: "Fixture: warning preserved",
      description: "Document instruction warning with local policy unchanged.",
      response: {
        ...successResponse,
        request_id: "fixture-route-warning-001",
        explanation:
          "Synthetic fixture: IgnisPrompt kept local routing policy unchanged while treating a document-contained instruction as untrusted content.",
        warnings: [
          "Document-contained instruction was detected and treated as untrusted content. Routing policy and audit behavior were not modified.",
        ],
      },
    },
    {
      id: "fail-closed",
      label: "Fixture: fail closed",
      description: "Rejected before routing; no cloud route considered.",
      response: {
        request_id: "fixture-route-fail-closed-001",
        decision: {
          tier: "REJECTED",
          route_code: "REJECTED_EMPTY_MESSAGES",
          domain: "unknown",
          model_id: null,
          cloud_considered: false,
          cloud_allowed: false,
          data_left_device: false,
        },
        explanation:
          "Synthetic fixture: IgnisPrompt rejected the request before routing and did not consider a cloud route.",
        warnings: ["Synthetic fixture warning: request rejected before routing."],
      },
    },
    {
      id: "preflight-rejection",
      label: "Fixture: preflight rejection",
      description: "Client-side rejection before a local POST.",
      errorMessage:
        "Enter synthetic or non-sensitive text before running route inspection.",
    },
  ];
}
