import { describe, expect, it } from "vitest";
import { AethraApiError } from "../api/errors";
import { routeExplainFixture } from "../api/fixtures";
import {
  buildRouteLadder,
  buildRouteExplainRequest,
  buildRouteStateLegend,
  buildRouteDecisionCopyText,
  buildRouteFixtureScenarios,
  describeRouteExplainError,
  formatRouteLadderState,
  isWarningRouteDecision,
  validateRoutePrompt,
} from "./routeExplainSummary";

describe("route explain helpers", () => {
  it("builds a route explain request with optional model and domain hints", () => {
    expect(
      buildRouteExplainRequest(
        " Review this synthetic clause. ",
        " ignisprompt/legal ",
        " legal ",
      ),
    ).toEqual({
      model: "ignisprompt/legal",
      messages: [{ role: "user", content: "Review this synthetic clause." }],
      metadata: { domain: "legal" },
    });
  });

  it("omits blank optional hints", () => {
    expect(buildRouteExplainRequest("Synthetic text", " ", " ")).toEqual({
      messages: [{ role: "user", content: "Synthetic text" }],
    });
  });

  it("validates blank prompt input before route inspection", () => {
    expect(validateRoutePrompt("  ")).toBe(
      "Enter synthetic or non-sensitive text before running route inspection.",
    );
    expect(validateRoutePrompt("Synthetic text")).toBeUndefined();
  });

  it("describes known API error kinds", () => {
    expect(
      describeRouteExplainError(
        new AethraApiError("unreachable-daemon", "no daemon"),
      ),
    ).toContain("Unable to reach");
    expect(
      describeRouteExplainError(new AethraApiError("timeout", "slow")),
    ).toContain("timed out");
    expect(
      describeRouteExplainError(
        new AethraApiError("http-error", "bad", { status: 503 }),
      ),
    ).toContain("HTTP 503");
    expect(
      describeRouteExplainError(new AethraApiError("invalid-json", "bad")),
    ).toContain("invalid JSON");
    expect(
      describeRouteExplainError(
        new AethraApiError("unexpected-shape", "bad"),
      ),
    ).toContain("expected route-explain shape");
  });

  it("builds representative fixture scenarios", () => {
    const scenarios = buildRouteFixtureScenarios(routeExplainFixture);

    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "success",
      "warning",
      "fail-closed",
      "preflight-rejection",
    ]);
    expect(scenarios[1].response?.warnings).toHaveLength(1);
    expect(scenarios[2].response?.decision.route_code).toBe(
      "REJECTED_EMPTY_MESSAGES",
    );
    expect(scenarios[3].errorMessage).toContain("non-sensitive text");
  });

  it("formats route decision copy payloads without request text", () => {
    const payload = buildRouteDecisionCopyText(routeExplainFixture);
    const parsed = JSON.parse(payload);

    expect(parsed).toEqual({
      request_id: routeExplainFixture.request_id,
      decision: routeExplainFixture.decision,
      explanation: routeExplainFixture.explanation,
      warnings: routeExplainFixture.warnings,
    });
    expect(payload).not.toContain("messages");
  });

  it("marks rejected and error route decisions as warning decisions", () => {
    expect(isWarningRouteDecision(routeExplainFixture)).toBe(false);
    expect(
      isWarningRouteDecision({
        ...routeExplainFixture,
        decision: {
          ...routeExplainFixture.decision,
          tier: "ERR",
          route_code: "LEGAL_MODEL_UNAVAILABLE",
        },
        warnings: [],
      }),
    ).toBe(true);
    expect(
      isWarningRouteDecision({
        ...routeExplainFixture,
        decision: {
          ...routeExplainFixture.decision,
          tier: "REJECTED",
          route_code: "REJECTED_EMPTY_MESSAGES",
        },
        warnings: [],
      }),
    ).toBe(true);
  });

  it("builds a conservative route ladder with cloud disabled by default", () => {
    const ladder = buildRouteLadder(routeExplainFixture);

    expect(ladder.map((item) => item.state)).toEqual([
      "skipped",
      "skipped",
      "selected",
      "disabled",
    ]);
    expect(ladder[2].reason).toContain("selected the local legal route");
    expect(ladder[3].reason).toContain("cloud_allowed=false");
    expect(formatRouteLadderState(ladder[3].state)).toBe("disabled");
  });

  it("documents all route ladder state labels without claiming missing routes", () => {
    const legend = buildRouteStateLegend();

    expect(legend.map((item) => item.state)).toEqual([
      "selected",
      "skipped",
      "blocked",
      "unavailable",
      "disabled",
      "not-implemented",
    ]);
    expect(legend[5].reason).toContain("does not claim a working route");
  });
});
