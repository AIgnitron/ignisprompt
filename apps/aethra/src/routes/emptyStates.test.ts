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
  });

  it("explains how to populate audit events", () => {
    expect(localPreviewEmptyStates.auditEventsNotLoaded.nextAction).toContain(
      "./scripts/smoke.sh",
    );
    expect(localPreviewEmptyStates.auditEventsNotLoaded.nextAction).toContain(
      "refresh audit events",
    );
  });

  it("keeps model status guidance scoped to local daemon hints", () => {
    expect(localPreviewEmptyStates.modelStatusNotLoaded.message).toContain(
      "Fixture hints remain available",
    );
    expect(localPreviewEmptyStates.modelStatusNotLoaded.detail).toContain(
      "not runner controls",
    );
  });

  it("describes sustainability metrics as manual local preview data", () => {
    expect(localPreviewEmptyStates.sustainabilityNotLoaded.nextAction).toContain(
      "refresh sustainability metrics",
    );
    expect(localPreviewEmptyStates.sustainabilityNotLoaded.detail).toContain(
      "not telemetry",
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
        "Start the daemon with ./scripts/start-dev.sh, confirm the loopback endpoint, then refresh manually.",
      detail: "Fixture data remains visible.",
    });
  });
});
