import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalDemoStudio } from "./LocalDemoStudio";
import { buildDemoStudioSummary } from "./demoStudioSummary";

describe("local demo studio route", () => {
  it("renders expected demo story sections and package preview", () => {
    const markup = renderToStaticMarkup(<LocalDemoStudio />);
    const summary = buildDemoStudioSummary();

    expect(markup).toContain("Aethra local demo studio");
    expect(markup).toContain("Local preview demo story mode");

    for (const [index, step] of summary.storySteps.entries()) {
      expect(markup).toContain(`Step ${index + 1}`);
      expect(markup).toContain(step.name);
      expect(markup).toContain(step.summary);
      expect(markup).toContain(`Surface: ${step.sourceSurface}`);
      expect(markup).toContain(`Talking point: ${step.talkingPoint}`);
      expect(markup).toContain(`Next step: ${step.localNextStep}`);
      expect(markup).toContain(`Boundary: ${step.boundaryNote}`);
    }

    expect(markup).toContain("Demo package preview");
    expect(markup).toContain(summary.packagePreview.packageRoot);
    expect(markup).toContain(summary.packagePreview.schemaVersion);
    expect(markup).toContain(summary.packagePreview.packageMode);
    expect(markup).toContain(summary.packagePreview.status);
    for (const fileName of summary.packagePreview.generatedFiles) {
      expect(markup).toContain(fileName);
    }

    expect(markup).toContain("Copy-safe demo report snippet");
    expect(markup).toContain("Local demo boundary reminders");
    for (const boundary of summary.boundaries) {
      expect(markup).toContain(boundary);
    }
  });

  it("avoids unsafe claims and sensitive default rendering", () => {
    const markup = renderToStaticMarkup(<LocalDemoStudio />);
    const lowerMarkup = markup.toLowerCase();

    expect(lowerMarkup).not.toContain("production readiness");
    expect(lowerMarkup).not.toContain("production deployment");
    expect(lowerMarkup).not.toContain("legal accuracy");
    expect(lowerMarkup).not.toContain("compliance certification");
    expect(lowerMarkup).not.toContain("security certification");
    expect(lowerMarkup).not.toContain(["esg", "certification"].join(" "));
    expect(lowerMarkup).not.toContain("signed attestation");
    expect(lowerMarkup).not.toContain("tamper-evident");
    expect(lowerMarkup).not.toContain("cryptographic verification");
    expect(lowerMarkup).not.toContain("model controls");
    expect(lowerMarkup).not.toContain("runner controls");
    expect(lowerMarkup).not.toContain("prompt:");
    expect(lowerMarkup).not.toContain("raw user text");
    expect(lowerMarkup).not.toContain("raw audit");
    expect(lowerMarkup).not.toContain("secret");
    expect(lowerMarkup).not.toContain("api_key");
    expect(lowerMarkup).not.toContain("api key");
    expect(lowerMarkup).not.toContain("127.0.0.1");
    expect(lowerMarkup).not.toContain("localhost");
    expect(lowerMarkup).not.toContain("hostname");
    expect(lowerMarkup).not.toContain("username");
    expect(lowerMarkup).not.toContain("machine identifier");
    expect(lowerMarkup).not.toContain("/users/");
    expect(lowerMarkup).not.toContain("/home/");
    expect(lowerMarkup).not.toContain("file picker");
    expect(lowerMarkup).not.toContain("cloud upload");
    expect(lowerMarkup).not.toContain("telemetry enabled");
  });
});
