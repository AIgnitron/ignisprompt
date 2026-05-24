import { describe, expect, it } from "vitest";
import {
  buildOperatorConsoleSummary,
  getAllOperatorCommandsText,
  operatorBoundaries,
  operatorCommandRecipes,
} from "./operatorConsoleSummary";

describe("local operator console summaries", () => {
  it("builds expected operator cards from fixture-backed readiness data", () => {
    const summary = buildOperatorConsoleSummary();

    expect(summary.cards.map((card) => card.label)).toEqual([
      "Daemon and endpoint readiness",
      "CLI readiness package",
      "Evidence bundle workflow",
      "Aethra demo path",
      "Local safety boundaries",
      "Suggested next local commands",
    ]);
    expect(summary.cards.find((card) => card.id === "cli-readiness-package")?.detail).toContain(
      "structural/local only",
    );
    expect(summary.diagnostics.map((item) => item.category)).toEqual(
      expect.arrayContaining(["daemon", "evidence workflow", "aethra"]),
    );
  });

  it("lists copy-only command recipes without host-specific values", () => {
    expect(operatorCommandRecipes.map((item) => item.command)).toEqual([
      "./scripts/start-dev.sh",
      "cargo run -p ignispromptctl -- doctor",
      "cargo run -p ignispromptctl -- readiness",
      "cargo run -p ignispromptctl -- readiness --json",
      "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo",
      "cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo",
      "cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo",
      "make readiness-check",
      "make evidence-check",
      "./scripts/demo-local-evidence-workflow.sh --self-test",
    ]);

    const commandsText = getAllOperatorCommandsText();
    expect(commandsText).toContain("make readiness-check");
    expect(commandsText).not.toContain("127.0.0.1");
    expect(commandsText).not.toContain("localhost");
    expect(commandsText).not.toContain("/Users/");
  });

  it("keeps boundary language conservative", () => {
    const text = operatorBoundaries
      .map((item) => `${item.label} ${item.detail}`)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("status hints, not controls");
    expect(text).toContain("local helper checks, not certification");
    expect(text).toContain("structural/local package validation only");
    expect(text).toContain("not signed");
    expect(text).toContain("no telemetry");
    expect(text).not.toContain("production readiness");
    expect(text).not.toContain("production deployment");
    expect(text).not.toContain("legal accuracy");
    expect(text).not.toContain("compliance certification");
    expect(text).not.toContain("security certification");
    expect(text).not.toContain("signed attestation");
    expect(text).not.toContain("tamper-evident");
    expect(text).not.toContain("cryptographic verification");
    expect(text).not.toContain("model controls");
    expect(text).not.toContain("runner controls");
  });
});
