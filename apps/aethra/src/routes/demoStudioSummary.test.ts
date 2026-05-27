import { describe, expect, it } from "vitest";
import {
  buildDemoReportSnippet,
  buildDemoStudioSummary,
  demoBoundaries,
  demoPackageGeneratedFiles,
  demoStorySteps,
  demoStoryStepIds,
  requiredDemoBoundaryTerms,
} from "./demoStudioSummary";

describe("local demo studio summaries", () => {
  it("builds safe demo story steps and package preview metadata", () => {
    const summary = buildDemoStudioSummary();

    expect(summary.storySteps.map((step) => step.id)).toEqual([
      ...demoStoryStepIds,
    ]);
    expect(summary.packagePreview.schemaVersion).toBe(
      "ignisprompt-demo-package-0.1",
    );
    expect(summary.packagePreview.packageRoot).toBe(
      "local-evidence/demo-studio/demo",
    );
    expect(summary.packagePreview.generatedFiles).toEqual([
      ...demoPackageGeneratedFiles,
    ]);
    expect(summary.packagePreview.boundaryNotes).toContain("not signed");
  });

  it("keeps the structured Aethra fixture contract aligned with CLI demo expectations", () => {
    const summary = buildDemoStudioSummary();

    expect(summary.storySteps).toHaveLength(demoStoryStepIds.length);
    expect(summary.boundaries).toEqual([...requiredDemoBoundaryTerms]);
    expect(summary.packagePreview.packageMode).toBe("local-preview");
    expect(summary.packagePreview.status).toBe("demo_guidance");

    for (const term of requiredDemoBoundaryTerms) {
      expect(summary.boundaries).toContain(term);
    }

    const reportSnippet = buildDemoReportSnippet().toLowerCase();
    for (const term of summary.packagePreview.boundaryNotes) {
      expect(reportSnippet).toContain(term.toLowerCase());
    }
  });

  it("keeps demo snippets conservative and copy-safe", () => {
    const text = [
      buildDemoReportSnippet(),
      ...demoStorySteps.map((step) =>
        [
          step.name,
          step.sourceSurface,
          step.summary,
          step.talkingPoint,
          step.localNextStep,
          step.boundaryNote,
        ].join(" "),
      ),
      ...demoBoundaries,
    ]
      .join(" ")
      .toLowerCase();

    expect(text).toContain("local preview demo only");
    expect(text).toContain("synthetic story steps only");
    expect(text).toContain("route/status/package values are hints, not guarantees");
    expect(text).toContain("local helper checks, not certification");
    expect(text).toContain("package validation is structural/local only");
    expect(text).toContain("not signed");
    expect(text).toContain("no cryptographic validation");
    expect(text).toContain("not tamper evident");
    expect(text).not.toContain("production readiness");
    expect(text).not.toContain("production deployment");
    expect(text).not.toContain("legal accuracy");
    expect(text).not.toContain("legal advice");
    expect(text).not.toContain("compliance certification");
    expect(text).not.toContain("security certification");
    expect(text).not.toContain(["esg", "certification"].join(" "));
    expect(text).not.toContain("signed attestation");
    expect(text).not.toContain("tamper-evident");
    expect(text).not.toContain("cryptographic verification");
    expect(text).not.toContain("model controls");
    expect(text).not.toContain("runner controls");
    expect(text).not.toContain("prompt:");
    expect(text).not.toContain("real prompt");
    expect(text).not.toContain("raw user text");
    expect(text).not.toContain("raw audit");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("api_key");
    expect(text).not.toContain("api key");
    expect(text).not.toContain("127.0.0.1");
    expect(text).not.toContain("localhost");
    expect(text).not.toContain("hostname");
    expect(text).not.toContain("username");
    expect(text).not.toContain("machine identifier");
    expect(text).not.toContain("/users/");
    expect(text).not.toContain("/home/");
  });
});
