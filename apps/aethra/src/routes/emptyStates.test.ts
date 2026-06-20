import { describe, expect, it } from "vitest";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";

describe("local preview empty state copy", () => {
  it("keeps fixture mode explicitly demo-safe", () => {
    expect(localPreviewEmptyStates.fixtureModeActive.message).toContain(
      "demo-safe",
    );
    expect(localPreviewEmptyStates.fixtureModeActive.message).toContain(
      "does not require a daemon",
    );
    expect(localPreviewEmptyStates.fixtureModeActive.nextAction).toContain(
      "suggested review flow",
    );
  });

  it("explains how to populate audit events", () => {
    expect(localPreviewEmptyStates.auditEventsNotLoaded.nextAction).toContain(
      "./scripts/smoke.sh",
    );
    expect(localPreviewEmptyStates.auditEventsNotLoaded.nextAction).toContain(
      "refresh audit events",
    );
    expect(localPreviewEmptyStates.auditEventsNotLoaded.nextAction).toContain(
      "suggested review flow",
    );
  });

  it("keeps model status guidance scoped to local daemon hints", () => {
    expect(localPreviewEmptyStates.modelStatusNotLoaded.message).toContain(
      "not showing live model and runner status hints",
    );
    expect(localPreviewEmptyStates.modelStatusNotLoaded.detail).toContain(
      "not runner controls",
    );
    expect(localPreviewEmptyStates.modelStatusNotLoaded.nextAction).toContain(
      "suggested review flow",
    );
  });

  it("describes sustainability metrics as manual local preview data", () => {
    expect(localPreviewEmptyStates.sustainabilityNotLoaded.nextAction).toContain(
      "refresh sustainability metrics",
    );
    expect(localPreviewEmptyStates.sustainabilityNotLoaded.detail).toContain(
      "not telemetry",
    );
    expect(localPreviewEmptyStates.sustainabilityNotLoaded.nextAction).toContain(
      "suggested review flow",
    );
  });

  it("builds live error copy with a manual refresh next action", () => {
    expect(
      buildLiveErrorEmptyState(
        "Daemon unreachable",
        "Aethra could not reach the daemon.",
        "Fixture data remains visible.",
      ),
    ).toEqual({
      title: "Daemon unreachable",
      message: "Aethra could not reach the daemon.",
      nextAction:
        "Start the daemon with ./scripts/start-dev.sh, confirm the local endpoint, then refresh from the suggested review flow.",
      detail: "Fixture data remains visible.",
    });
  });

  it("keeps empty states away from production readiness claims", () => {
    const values = Object.values(localPreviewEmptyStates)
      .flatMap((entry) => {
        const parts = [entry.title, entry.message, entry.nextAction];
        const detail = "detail" in entry ? entry.detail : undefined;

        if (detail) {
          parts.push(detail);
        }

        return parts;
      })
      .filter((value): value is string => Boolean(value));

    for (const value of values) {
      expect(value).not.toContain("signed attestation");
      expect(value).not.toContain("tamper-evident");
      expect(value).not.toContain("production attestation");
      expect(value).not.toContain("production readiness");
    }
  });
});
