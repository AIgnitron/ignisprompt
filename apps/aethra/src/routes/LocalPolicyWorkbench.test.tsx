import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalPolicyWorkbench } from "./LocalPolicyWorkbench";

describe("local policy workbench route", () => {
  it("renders expected policy sections and package preview", () => {
    const markup = renderToStaticMarkup(<LocalPolicyWorkbench />);

    expect(markup).toContain("Aethra local policy workbench");
    expect(markup).toContain("Synthetic policy scenario hints");
    expect(markup).toContain("Basic summarization");
    expect(markup).toContain("Legal-sensitive task");
    expect(markup).toContain("Adversarial document instruction");
    expect(markup).toContain("Local evidence request");
    expect(markup).toContain("Local readiness request");
    expect(markup).toContain("Local operator request");
    expect(markup).toContain("Policy package request");
    expect(markup).toContain("Sustainability preview request");
    expect(markup).toContain("Unsupported cloud-required request");
    expect(markup).toContain("Ambiguous sensitive request");
    expect(markup).toContain("Scenario grouping helpers");
    expect(markup).toContain("local helper request");
    expect(markup).toContain("Policy package preview");
    expect(markup).toContain("local-evidence/policy/demo");
    expect(markup).toContain("policy-scenarios.json");
    expect(markup).toContain("policy-report.md");
    expect(markup).toContain("Copy-safe policy report snippet");
    expect(markup).toContain("policy preview only");
    expect(markup).toContain("synthetic scenarios only");
    expect(markup).toContain("route hints, not guarantees");
    expect(markup).toContain("local helper checks, not certification");
    expect(markup).toContain("package validation is structural/local only");
    expect(markup).toContain("not signed");
  });

  it("avoids unsafe claims and sensitive default rendering", () => {
    const markup = renderToStaticMarkup(<LocalPolicyWorkbench />);
    const lowerMarkup = markup.toLowerCase();

    expect(lowerMarkup).not.toContain("production readiness");
    expect(lowerMarkup).not.toContain("production deployment");
    expect(lowerMarkup).not.toContain("legal accuracy");
    expect(lowerMarkup).not.toContain("legal advice");
    expect(lowerMarkup).not.toContain("compliance certification");
    expect(lowerMarkup).not.toContain("security certification");
    expect(lowerMarkup).not.toContain(["esg", "certification"].join(" "));
    expect(lowerMarkup).not.toContain("signed attestation");
    expect(lowerMarkup).not.toContain("tamper-evident");
    expect(lowerMarkup).not.toContain("cryptographic verification");
    expect(lowerMarkup).not.toContain("model controls");
    expect(lowerMarkup).not.toContain("runner controls");
    expect(lowerMarkup).not.toContain("prompt:");
    expect(lowerMarkup).not.toContain("real prompt");
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
