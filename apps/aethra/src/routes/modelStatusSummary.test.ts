import { describe, expect, it } from "vitest";
import { modelStatusFixture } from "../api/fixtures";
import {
  describeExecutableInferenceStatus,
  describeLocalPathStatus,
  describeRunnerStatus,
  formatAvailability,
} from "./modelStatusSummary";

describe("model and runner status summaries", () => {
  it("distinguishes configured state, local file presence, runner executable presence, and inference status", () => {
    const hint = modelStatusFixture.statusHints[0];

    expect(hint.configured).toBe(true);
    expect(describeLocalPathStatus(hint)).toBe("declared, not found");
    expect(describeRunnerStatus(hint)).toBe(
      "stub-legal-runner; executable found",
    );
    expect(describeExecutableInferenceStatus(hint)).toBe(
      "not reported by status check",
    );
    expect(formatAvailability(hint.availability)).toBe("model file missing");
  });

  it("uses daemon warning language when executable inference was explicitly not attempted", () => {
    const hint = {
      ...modelStatusFixture.statusHints[0],
      warnings: [
        "Local file and runner presence are prerequisites only; this status check does not attempt executable inference.",
      ],
    };

    expect(describeExecutableInferenceStatus(hint)).toBe(
      "not attempted by status check",
    );
  });

  it("handles missing local path and runner configuration without implying controls", () => {
    const hint = {
      ...modelStatusFixture.statusHints[0],
      localPathDeclared: false,
      localPathExists: false,
      runnerConfigured: false,
      runnerExecutableExists: false,
      runnerKind: "none",
      availability: "configured" as const,
    };

    expect(describeLocalPathStatus(hint)).toBe("not declared");
    expect(describeRunnerStatus(hint)).toBe("not configured");
    expect(formatAvailability(hint.availability)).toBe("configured");
  });
});
