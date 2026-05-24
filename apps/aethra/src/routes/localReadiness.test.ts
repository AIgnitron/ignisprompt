import { describe, expect, it } from "vitest";
import {
  evidenceBundleFixture,
  healthFixture,
  modelFixtures,
  modelStatusFixture,
  versionStatusFixture,
} from "../api/fixtures";
import {
  buildLocalReadinessCards,
  buildLocalReadinessDiagnostics,
  buildLocalReadinessPackagePreview,
  getAllReadinessCommandsText,
  localPreviewReadinessChecklist,
  localReadinessCommands,
} from "./localReadinessSummary";

describe("local readiness summaries", () => {
  it("builds conservative readiness cards from fixture-backed contracts", () => {
    const cards = buildLocalReadinessCards({
      health: healthFixture,
      healthSource: "fixture",
      versionStatus: versionStatusFixture,
      versionSource: "fixture",
      models: modelFixtures,
      modelsSource: "fixture",
      statusHints: modelStatusFixture.statusHints,
      statusHintsSource: "fixture",
      evidenceBundle: evidenceBundleFixture,
    });

    expect(cards.map((card) => card.label)).toEqual([
      "Daemon health",
      "Version/status",
      "Configured models",
      "Model/runner status hints",
      "Evidence workflow availability",
      "Security/evidence checks",
    ]);
    expect(cards.find((card) => card.id === "model-runner-hints")?.detail).toContain(
      "missing prerequisite hint(s)",
    );
    expect(cards.find((card) => card.id === "security-evidence-checks")?.value).toBe(
      "local helper checks",
    );
  });

  it("keeps empty or missing readiness data conservative", () => {
    const cards = buildLocalReadinessCards({
      health: { ...healthFixture, status: "unknown", model_count: 0 },
      healthSource: "fixture",
      versionStatus: { ...versionStatusFixture, local_only: false },
      versionSource: "fixture",
      models: [],
      modelsSource: "fixture",
      statusHints: [],
      statusHintsSource: "fixture",
      evidenceBundle: {
        ...evidenceBundleFixture,
        validation: { ...evidenceBundleFixture.validation, status: "not-run" },
      },
    });

    expect(cards.find((card) => card.id === "daemon-health")?.tone).toBe(
      "warning",
    );
    expect(cards.find((card) => card.id === "version-status")?.tone).toBe(
      "warning",
    );
    expect(cards.find((card) => card.id === "configured-models")?.tone).toBe(
      "warning",
    );
    expect(cards.find((card) => card.id === "model-runner-hints")?.value).toBe(
      "0 hint(s)",
    );
  });

  it("builds local readiness diagnostic drilldown hints", () => {
    const cards = buildLocalReadinessCards({
      health: { ...healthFixture, status: "unknown", model_count: 0 },
      healthSource: "fixture",
      versionStatus: versionStatusFixture,
      versionSource: "fixture",
      models: [],
      modelsSource: "fixture",
      statusHints: [],
      statusHintsSource: "fixture",
      evidenceBundle: evidenceBundleFixture,
    });
    const diagnostics = buildLocalReadinessDiagnostics(cards);

    expect(diagnostics.map((item) => item.category)).toEqual(
      expect.arrayContaining([
        "daemon",
        "endpoints",
        "models",
        "runner hints",
        "audit",
        "evidence workflow",
        "security checks",
        "aethra",
      ]),
    );
    expect(diagnostics.find((item) => item.id === "daemon-health")).toMatchObject({
      status: "needs attention",
      severity: "required",
      localNextStep: expect.stringContaining("./scripts/start-dev.sh"),
    });
    expect(
      diagnostics.find((item) => item.id === "model-runner-hints")
        ?.boundaryNote,
    ).toContain("status hints, not controls");
    expect(
      diagnostics.find((item) => item.id === "audit-local-records")
        ?.boundaryNote,
    ).toContain("not certification");
  });

  it("lists only safe copy-only readiness commands", () => {
    expect(localReadinessCommands.map((command) => command.command)).toEqual([
      "./scripts/start-dev.sh",
      "cargo run -p ignispromptctl -- health",
      "cargo run -p ignispromptctl -- doctor",
      "cargo run -p ignispromptctl -- readiness",
      "cargo run -p ignispromptctl -- readiness --markdown",
      "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo-readiness",
      "cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo-readiness",
      "cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo-readiness",
      "make dev-check",
      "make readiness-check",
      "make evidence-check",
    ]);
    expect(getAllReadinessCommandsText()).toContain("make evidence-check");
  });

  it("uses local preview checklist language without control claims", () => {
    const checklistText = localPreviewReadinessChecklist
      .map((item) => `${item.label} ${item.detail}`)
      .join(" ");

    expect(checklistText).toContain("Fixture-backed by default");
    expect(checklistText).toContain("Manual live-local loading");
    expect(checklistText).toContain("status hints");
    expect(checklistText).toContain("No telemetry or cloud calls by default");
    expect(checklistText).toContain("not certification");
    expect(checklistText).not.toContain("control plane");
    expect(checklistText).not.toContain("continuous monitoring");
  });

  it("builds a fixture-backed readiness package preview", () => {
    const cards = buildLocalReadinessCards({
      health: healthFixture,
      healthSource: "fixture",
      versionStatus: versionStatusFixture,
      versionSource: "fixture",
      models: modelFixtures,
      modelsSource: "fixture",
      statusHints: modelStatusFixture.statusHints,
      statusHintsSource: "fixture",
      evidenceBundle: evidenceBundleFixture,
    });
    const diagnostics = buildLocalReadinessDiagnostics(cards);
    const preview = buildLocalReadinessPackagePreview(diagnostics);
    const previewText = [
      preview.schemaVersion,
      preview.packageRoot,
      preview.status,
      preview.generatedFiles.join(" "),
      preview.boundaryNotes.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    expect(preview.schemaVersion).toBe("ignisprompt-readiness-package-0.1");
    expect(preview.packageRoot).toBe("local-evidence/readiness/demo-readiness");
    expect(preview.generatedFiles).toEqual([
      "README.md",
      "manifest.json",
      "readiness-summary.json",
      "readiness-report.json",
      "readiness-report.md",
    ]);
    expect(preview.boundaryNotes).toContain("status hints, not controls");
    expect(preview.boundaryNotes).toContain("local helper checks, not certification");
    expect(previewText).not.toContain("production deployment");
    expect(previewText).not.toContain("legal accuracy");
    expect(previewText).not.toContain("compliance certification");
    expect(previewText).not.toContain("tamper-evident");
    expect(previewText).not.toContain("cryptographic verification");
  });
});
