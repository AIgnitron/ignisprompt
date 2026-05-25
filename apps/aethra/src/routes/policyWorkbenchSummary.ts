export type PolicyScenarioSummary = {
  id: string;
  name: string;
  category: string;
  syntheticSummary: string;
  expectedTier: string;
  expectedRoute: string;
  expectedLocalBehavior: string;
  warning: string;
  localNextStep: string;
  boundaryNote: string;
};

export type PolicyPackagePreview = {
  schemaVersion: string;
  packageMode: "local-preview";
  packageRoot: string;
  status: string;
  generatedFiles: string[];
  boundaryNotes: string[];
};

export type PolicyWorkbenchSummary = {
  scenarios: PolicyScenarioSummary[];
  packagePreview: PolicyPackagePreview;
  reportSnippet: string;
  boundaries: string[];
};

export const policyScenarios: PolicyScenarioSummary[] = [
  {
    id: "simple-local-task",
    name: "Simple local task",
    category: "simple local task",
    syntheticSummary:
      "Synthetic request for a short local summary using fixture-safe text.",
    expectedTier: "tier_1",
    expectedRoute: "local_stub",
    expectedLocalBehavior: "Route locally with no cloud call by default.",
    warning: "Route hints, not guarantees.",
    localNextStep: "Use route-explain for live local route shape when needed.",
    boundaryNote: "Policy preview only.",
  },
  {
    id: "legal-sensitive-task",
    name: "Legal-sensitive task",
    category: "legal-sensitive task",
    syntheticSummary:
      "Synthetic legal-sensitive classification request without real facts.",
    expectedTier: "tier_3",
    expectedRoute: "local_legal_runner_or_stub",
    expectedLocalBehavior:
      "Keep local and avoid formal legal guidance claims.",
    warning: "Not a legal service and no formal legal correctness claim.",
    localNextStep: "Review route explanation and local preview disclaimer.",
    boundaryNote: "Route hints, not formal legal guidance.",
  },
  {
    id: "adversarial-document-instruction",
    name: "Adversarial document instruction",
    category: "adversarial document instruction",
    syntheticSummary:
      "Synthetic document instruction attempts to override local policy.",
    expectedTier: "tier_3",
    expectedRoute: "fail_closed_or_local_review",
    expectedLocalBehavior:
      "Treat embedded instruction as untrusted input.",
    warning: "Route hints, not guarantees.",
    localNextStep:
      "Keep adversarial document instructions separated from operator guidance.",
    boundaryNote: "Local helper checks, not certification.",
  },
  {
    id: "sustainability-preview-request",
    name: "Sustainability preview request",
    category: "sustainability preview request",
    syntheticSummary:
      "Synthetic request for local proxy sustainability indicators.",
    expectedTier: "tier_2",
    expectedRoute: "local_metrics_preview",
    expectedLocalBehavior:
      "Show proxy-only sustainability indicators.",
    warning: "Not actual carbon accounting.",
    localNextStep:
      "Check sustainability methodology notes before sharing demo copy.",
    boundaryNote: "Proxy-only indicators.",
  },
  {
    id: "helper-workflow-request",
    name: "Evidence readiness operator helper request",
    category: "evidence/readiness/operator helper request",
    syntheticSummary:
      "Synthetic request for local helper workflow guidance.",
    expectedTier: "helper",
    expectedRoute: "local_helper_guidance",
    expectedLocalBehavior:
      "Provide copy-only local commands and structural checks.",
    warning: "Local helper checks, not certification.",
    localNextStep:
      "Run make policy-check with readiness, operator, and evidence checks.",
    boundaryNote: "Status hints, not controls.",
  },
  {
    id: "unsupported-cloud-required-request",
    name: "Unsupported cloud-required request",
    category: "unsupported/cloud-required request",
    syntheticSummary:
      "Synthetic request that would need cloud-only capabilities.",
    expectedTier: "unsupported",
    expectedRoute: "fail_closed",
    expectedLocalBehavior:
      "Fail closed unless an explicit future policy allows otherwise.",
    warning: "No cloud calls by default.",
    localNextStep:
      "Document unsupported scope instead of adding a cloud fallback.",
    boundaryNote: "Local preview only.",
  },
];

export const policyBoundaries = [
  "policy preview only",
  "synthetic scenarios only",
  "route hints, not guarantees",
  "local helper checks, not certification",
  "package validation is structural/local only",
  "not signed",
  "not production attestation",
  "no telemetry",
  "no cloud calls by default",
  "no global aggregation",
];

export function buildPolicyWorkbenchSummary(): PolicyWorkbenchSummary {
  return {
    scenarios: policyScenarios,
    packagePreview: {
      schemaVersion: "ignisprompt-policy-package-0.1",
      packageMode: "local-preview",
      packageRoot: "local-evidence/policy/demo",
      status: "policy_preview",
      generatedFiles: [
        "README.md",
        "manifest.json",
        "policy-scenarios.json",
        "policy-report.json",
        "policy-report.md",
      ],
      boundaryNotes: policyBoundaries,
    },
    reportSnippet: buildPolicyReportSnippet(policyScenarios),
    boundaries: policyBoundaries,
  };
}

export function buildPolicyReportSnippet(
  scenarios = policyScenarios,
): string {
  return [
    "# IgnisPrompt Local Policy Scenario Report",
    "",
    "Scope: policy preview only; synthetic scenarios only; route hints, not guarantees.",
    "Boundaries: local helper checks, not certification; package validation is structural/local only; not signed.",
    "",
    "Synthetic scenarios:",
    ...scenarios.map(
      (scenario) =>
        `- ${scenario.name}: ${scenario.category}; ${scenario.expectedRoute}; ${scenario.boundaryNote}`,
    ),
  ].join("\n");
}
