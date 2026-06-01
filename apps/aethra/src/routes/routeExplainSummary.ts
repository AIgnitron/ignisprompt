import { RouteExplainRequest, RouteExplainResponse } from "../api/contracts";
import { AethraApiError } from "../api/errors";

export type RouteExplainFixtureScenario = {
  id: string;
  label: string;
  description: string;
  response?: RouteExplainResponse;
  errorMessage?: string;
};

export type RouteLadderState =
  | "selected"
  | "skipped"
  | "blocked"
  | "unavailable"
  | "disabled"
  | "not-implemented";

export type RouteLadderItem = {
  id: string;
  tierLabel: string;
  title: string;
  state: RouteLadderState;
  reason: string;
};

export const sampleRoutePrompt =
  "Review this synthetic indemnification clause excerpt and identify which local routing tier IgnisPrompt would choose.";

const warningDecisionPattern =
  /ERR|ERROR|REJECT|FAIL|UNAVAILABLE|RAM_PRESSURE|MEMORY_PRESSURE/i;

const routeStateLabels: Record<RouteLadderState, string> = {
  selected: "selected",
  skipped: "skipped",
  blocked: "blocked",
  unavailable: "unavailable",
  disabled: "disabled",
  "not-implemented": "not implemented",
};

const rejectedTierPattern = /REJECT/i;

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

export function formatRouteLadderState(state: RouteLadderState): string {
  return routeStateLabels[state];
}

export function buildRouteStateLegend(): RouteLadderItem[] {
  return [
    {
      id: "legend-selected",
      tierLabel: "State",
      title: "Selected",
      state: "selected",
      reason: "IgnisPrompt reported this candidate as the chosen local route.",
    },
    {
      id: "legend-skipped",
      tierLabel: "State",
      title: "Skipped",
      state: "skipped",
      reason: "A candidate existed, but a different route was chosen first.",
    },
    {
      id: "legend-blocked",
      tierLabel: "State",
      title: "Blocked",
      state: "blocked",
      reason: "Policy or preflight checks stopped routing before this tier ran.",
    },
    {
      id: "legend-unavailable",
      tierLabel: "State",
      title: "Unavailable",
      state: "unavailable",
      reason: "A local prerequisite was missing, so the tier could not be used.",
    },
    {
      id: "legend-disabled",
      tierLabel: "State",
      title: "Disabled",
      state: "disabled",
      reason: "The path is intentionally off in the current local-preview mode.",
    },
    {
      id: "legend-not-implemented",
      tierLabel: "State",
      title: "Not implemented",
      state: "not-implemented",
      reason: "This UI does not claim a working route where the repo has none.",
    },
  ];
}

export function buildRouteLadder(
  response: RouteExplainResponse,
): RouteLadderItem[] {
  const selectedTier = response.decision.tier;
  const rejected = rejectedTierPattern.test(selectedTier);

  return [
    {
      id: "tier-1",
      tierLabel: "Tier 1",
      title: "Local cache candidate",
      state: rejected
        ? "blocked"
        : selectedTier === "TIER_1"
          ? "selected"
          : "skipped",
      reason: rejected
        ? "The request was rejected before cache candidate selection."
        : selectedTier === "TIER_1"
          ? "IgnisPrompt reported a cache-backed local route."
          : "No cache-backed route was reported for this request.",
    },
    {
      id: "tier-2",
      tierLabel: "Tier 2",
      title: "Local general candidate",
      state: rejected
        ? "blocked"
        : selectedTier === "TIER_2"
          ? "selected"
          : selectedTier === "TIER_3"
            ? "skipped"
            : "unavailable",
      reason: rejected
        ? "The request was rejected before general local routing."
        : selectedTier === "TIER_2"
          ? "IgnisPrompt selected a general local route for this request."
          : selectedTier === "TIER_3"
            ? "Domain routing continued to the local legal tier."
            : "No general local route was reported in this fixture path.",
    },
    {
      id: "tier-3",
      tierLabel: "Tier 3",
      title: "Local legal candidate",
      state: rejected
        ? "blocked"
        : selectedTier === "TIER_3"
          ? "selected"
          : "unavailable",
      reason: rejected
        ? "The request was rejected before the legal-local candidate could run."
        : selectedTier === "TIER_3"
          ? "IgnisPrompt selected the local legal route for this request."
          : "This response did not report a Tier 3 legal selection.",
    },
    {
      id: "cloud",
      tierLabel: "Cloud",
      title: "Cloud route candidate",
      state: response.decision.cloud_allowed
        ? "not-implemented"
        : "disabled",
      reason: response.decision.cloud_allowed
        ? "Cloud routing must not be assumed from this local-preview UI."
        : "Cloud routing is disabled by default and this response keeps cloud_allowed=false.",
    },
  ];
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
