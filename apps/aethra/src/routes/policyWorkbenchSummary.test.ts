import { describe, expect, it } from "vitest";
import {
  buildPolicyReportSnippet,
  buildPolicyWorkbenchSummary,
  filterPolicyScenariosByBoundaryNote,
  filterPolicyScenariosByExpectedTier,
  filterPolicyScenariosByLocalOnlyBehavior,
  groupPolicyScenariosByCategory,
  groupPolicyScenariosByExpectedTier,
  policyBoundaries,
  policyScenarios,
} from "./policyWorkbenchSummary";

describe("local policy workbench summaries", () => {
  it("builds synthetic policy scenarios and package preview metadata", () => {
    const summary = buildPolicyWorkbenchSummary();

    expect(summary.scenarios.map((scenario) => scenario.id)).toEqual([
      "basic-summarization",
      "legal-sensitive-task",
      "adversarial-document-instruction",
      "local-evidence-request",
      "local-readiness-request",
      "local-operator-request",
      "policy-package-request",
      "sustainability-preview-request",
      "unsupported-cloud-required-request",
      "ambiguous-sensitive-request",
    ]);
    expect(summary.scenarioGroups).toContainEqual({
      key: "local helper request",
      count: 4,
    });
    expect(summary.packagePreview.schemaVersion).toBe(
      "ignisprompt-policy-package-0.1",
    );
    expect(summary.packagePreview.packageRoot).toBe(
      "local-evidence/policy/demo",
    );
    expect(summary.packagePreview.generatedFiles).toEqual([
      "README.md",
      "manifest.json",
      "policy-scenarios.json",
      "policy-report.json",
      "policy-report.md",
    ]);
    expect(summary.packagePreview.boundaryNotes).toContain(
      "route hints, not guarantees",
    );
  });

  it("groups and filters scenarios by safe local-preview metadata", () => {
    expect(groupPolicyScenariosByCategory()).toContainEqual({
      key: "sensitive local task",
      count: 3,
    });
    expect(groupPolicyScenariosByExpectedTier()).toContainEqual({
      key: "helper",
      count: 4,
    });
    expect(filterPolicyScenariosByExpectedTier("tier_3").map((item) => item.id))
      .toEqual([
        "legal-sensitive-task",
        "adversarial-document-instruction",
        "ambiguous-sensitive-request",
      ]);
    expect(filterPolicyScenariosByLocalOnlyBehavior(true)).toHaveLength(
      policyScenarios.length,
    );
    expect(
      filterPolicyScenariosByBoundaryNote(
        "package validation is structural/local only.",
      ).map((item) => item.id),
    ).toEqual(["policy-package-request"]);
  });

  it("keeps policy summaries copy-safe and conservative", () => {
    const text = [
      buildPolicyReportSnippet(),
      ...policyScenarios.map((scenario) =>
        [
          scenario.name,
          scenario.syntheticSummary,
          scenario.expectedLocalBehavior,
          scenario.warning,
          scenario.localNextStep,
          scenario.boundaryNote,
        ].join(" "),
      ),
      ...policyBoundaries,
    ]
      .join(" ")
      .toLowerCase();

    expect(text).toContain("policy preview only");
    expect(text).toContain("synthetic scenarios only");
    expect(text).toContain("route hints, not guarantees");
    expect(text).toContain("local helper checks, not certification");
    expect(text).toContain("package validation is structural/local only");
    expect(text).toContain("not signed");
    expect(text).not.toContain("production readiness");
    expect(text).not.toContain("production deployment");
    expect(text).not.toContain("legal accuracy");
    expect(text).not.toContain("legal advice");
    expect(text).not.toContain("compliance certification");
    expect(text).not.toContain("security certification");
    expect(text).not.toContain("signed attestation");
    expect(text).not.toContain("tamper-evident");
    expect(text).not.toContain("cryptographic verification");
    expect(text).not.toContain("model controls");
    expect(text).not.toContain("runner controls");
    expect(text).not.toContain("prompt:");
    expect(text).not.toContain("real prompt");
    expect(text).not.toContain("raw user text");
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
