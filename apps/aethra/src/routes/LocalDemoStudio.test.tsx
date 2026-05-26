import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalDemoStudio } from "./LocalDemoStudio";

describe("local demo studio route", () => {
  it("renders expected demo story sections and package preview", () => {
    const markup = renderToStaticMarkup(<LocalDemoStudio />);

    expect(markup).toContain("Aethra local demo studio");
    expect(markup).toContain("Local preview demo story mode");
    expect(markup).toContain("Local readiness");
    expect(markup).toContain("Operator workflow");
    expect(markup).toContain("Evidence workflow");
    expect(markup).toContain("Policy scenarios");
    expect(markup).toContain("Aethra review");
    expect(markup).toContain("Export package summary");
    expect(markup).toContain("Demo package preview");
    expect(markup).toContain("local-evidence/demo-studio/demo");
    expect(markup).toContain("demo-summary.json");
    expect(markup).toContain("demo-report.md");
    expect(markup).toContain("Copy-safe demo report snippet");
    expect(markup).toContain("Local demo boundary reminders");
    expect(markup).toContain("local preview demo only");
    expect(markup).toContain("route/status/package values are hints, not guarantees");
    expect(markup).toContain("local helper checks, not certification");
    expect(markup).toContain("package validation is structural/local only");
    expect(markup).toContain("not signed");
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
