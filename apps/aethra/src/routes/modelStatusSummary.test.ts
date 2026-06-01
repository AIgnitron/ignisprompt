import { describe, expect, it } from "vitest";
import { modelFixtures, modelStatusFixture } from "../api/fixtures";
import {
  buildCapabilityMatrixRows,
  describeCapabilityReason,
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

  it("builds capability matrix rows with conservative local-only reasons", () => {
    const rows = buildCapabilityMatrixRows(
      modelFixtures,
      modelStatusFixture.statusHints,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tier: "TIER_3",
      status: "model file missing",
      available: "no",
      configured: "yes",
      dataBoundary: "local only",
    });
    expect(rows[0].providerName).toContain("local-gguf");
    expect(rows[0].reason).toContain("declared local model file was not found");
    expect(rows[0].warnings).toContain("local hint");
  });

  it("describes conservative configured state without implying readiness", () => {
    const hint = {
      ...modelStatusFixture.statusHints[0],
      availability: "configured" as const,
    };

    expect(describeCapabilityReason(hint)).toContain(
      "executable inference is still not implied",
    );
  });
});
