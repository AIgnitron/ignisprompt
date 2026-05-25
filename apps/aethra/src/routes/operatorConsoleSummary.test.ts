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
      "Local policy workbench",
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
      "cargo run -p ignispromptctl -- operator-summary --package-output local-evidence/operator/demo",
      "cargo run -p ignispromptctl -- operator-summary --package-list local-evidence/operator/demo",
      "cargo run -p ignispromptctl -- operator-summary --package-validate local-evidence/operator/demo",
      "cargo run -p ignispromptctl -- policy-scenarios",
      "cargo run -p ignispromptctl -- policy-scenarios --json",
      "cargo run -p ignispromptctl -- policy-scenarios --package-output local-evidence/policy/demo",
      "cargo run -p ignispromptctl -- policy-scenarios --package-validate local-evidence/policy/demo",
      "make policy-check",
      "make evidence-check",
      "./scripts/demo-local-evidence-workflow.sh --self-test",
    ]);

    const commandsText = getAllOperatorCommandsText();
    expect(commandsText).toContain("make readiness-check");
    expect(commandsText).toContain("make policy-check");
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

  it("builds a conservative operator package preview", () => {
    const summary = buildOperatorConsoleSummary();
    const previewText = [
      summary.packagePreview.schemaVersion,
      summary.packagePreview.packageRoot,
      summary.packagePreview.status,
      summary.packagePreview.generatedFiles.join(" "),
      summary.packagePreview.boundaryNotes.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    expect(summary.packagePreview.schemaVersion).toBe(
      "ignisprompt-operator-package-0.1",
    );
    expect(summary.packagePreview.packageRoot).toBe(
      "local-evidence/operator/demo",
    );
    expect(summary.packagePreview.generatedFiles).toEqual([
      "README.md",
      "manifest.json",
      "operator-summary.json",
      "operator-report.json",
      "operator-report.md",
    ]);
    expect(previewText).toContain("local preview operator workflow only");
    expect(previewText).toContain("status hints, not controls");
    expect(previewText).toContain("local helper checks, not certification");
    expect(previewText).toContain("package validation is structural/local only");
    expect(previewText).toContain("not signed");
    expect(previewText).not.toContain("production readiness");
    expect(previewText).not.toContain("legal accuracy");
    expect(previewText).not.toContain("compliance certification");
    expect(previewText).not.toContain("tamper-evident");
    expect(previewText).not.toContain("cryptographic verification");
  });
});
