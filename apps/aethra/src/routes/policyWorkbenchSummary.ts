export type PolicyScenarioSummary = {
  id: string;
  name: string;
  group: string;
  category: string;
  syntheticSummary: string;
  expectedTier: string;
  expectedRoute: string;
  expectedLocalOnly: boolean;
  failClosedExpected: boolean;
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
  scenarioGroups: PolicyScenarioGroup[];
  packagePreview: PolicyPackagePreview;
  reportSnippet: string;
  boundaries: string[];
};

export type PolicyScenarioGroup = {
  key: string;
  count: number;
};

export const policyScenarios: PolicyScenarioSummary[] = [
  {
    id: "basic-summarization",
    name: "Basic summarization",
    group: "local task",
    category: "basic summarization",
    syntheticSummary:
      "Synthetic request for a short local summary using fixture-safe text.",
    expectedTier: "tier_1",
    expectedRoute: "local_stub",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior: "Route locally with no cloud call by default.",
    warning: "Route hints, not guarantees.",
    localNextStep: "Use route-explain for live local route shape when needed.",
    boundaryNote: "Policy preview only.",
  },
  {
    id: "legal-sensitive-task",
    name: "Legal-sensitive task",
    group: "sensitive local task",
    category: "legal-sensitive task",
    syntheticSummary:
      "Synthetic legal-sensitive classification request without real facts.",
    expectedTier: "tier_3",
    expectedRoute: "local_legal_runner_or_stub",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior:
      "Keep local and avoid formal legal guidance claims.",
    warning: "Not a legal service and no formal legal correctness claim.",
    localNextStep: "Review route explanation and local preview disclaimer.",
    boundaryNote: "Route hints, not formal legal guidance.",
  },
  {
    id: "adversarial-document-instruction",
    name: "Adversarial document instruction",
    group: "sensitive local task",
    category: "adversarial document instruction",
    syntheticSummary:
      "Synthetic document instruction attempts to override local policy.",
    expectedTier: "tier_3",
    expectedRoute: "fail_closed_or_local_review",
    expectedLocalOnly: true,
    failClosedExpected: true,
    expectedLocalBehavior:
      "Treat embedded instruction as untrusted input.",
    warning: "Route hints, not guarantees.",
    localNextStep:
      "Keep adversarial document instructions separated from operator guidance.",
    boundaryNote: "Local helper checks, not certification.",
  },
  {
    id: "local-evidence-request",
    name: "Local evidence request",
    group: "local helper request",
    category: "local evidence request",
    syntheticSummary:
      "Synthetic request for local evidence bundle workflow guidance.",
    expectedTier: "helper",
    expectedRoute: "local_evidence_guidance",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior:
      "Provide local evidence workflow guidance without package contents.",
    warning: "Local helper checks, not certification.",
    localNextStep: "Run make evidence-check and keep outputs under local-evidence/.",
    boundaryNote: "Local helper checks, not certification.",
  },
  {
    id: "local-readiness-request",
    name: "Local readiness request",
    group: "local helper request",
    category: "local readiness request",
    syntheticSummary:
      "Synthetic request for local readiness summary guidance.",
    expectedTier: "helper",
    expectedRoute: "local_readiness_guidance",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior:
      "Provide readiness status hints and local next steps.",
    warning: "Status hints, not controls.",
    localNextStep: "Run make readiness-check before sharing local preview notes.",
    boundaryNote: "Status hints, not controls.",
  },
  {
    id: "local-operator-request",
    name: "Local operator request",
    group: "local helper request",
    category: "local operator request",
    syntheticSummary:
      "Synthetic request for local operator workflow guidance.",
    expectedTier: "helper",
    expectedRoute: "local_operator_guidance",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior: "Provide copy-only operator workflow commands.",
    warning: "Local helper checks, not certification.",
    localNextStep: "Run make operator-check and treat commands as copy-only.",
    boundaryNote: "Status hints, not controls.",
  },
  {
    id: "policy-package-request",
    name: "Policy package request",
    group: "local helper request",
    category: "policy package request",
    syntheticSummary:
      "Synthetic request for policy package generation guidance.",
    expectedTier: "helper",
    expectedRoute: "local_policy_package_guidance",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior:
      "Write only under ignored local-evidence/policy/ paths.",
    warning: "Package validation is structural/local only.",
    localNextStep:
      "Run policy-scenarios package output, list, and validate commands.",
    boundaryNote: "Package validation is structural/local only.",
  },
  {
    id: "sustainability-preview-request",
    name: "Sustainability preview request",
    group: "local preview request",
    category: "sustainability preview request",
    syntheticSummary:
      "Synthetic request for local proxy sustainability indicators.",
    expectedTier: "tier_2",
    expectedRoute: "local_metrics_preview",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior:
      "Show proxy-only sustainability indicators.",
    warning: "Not actual carbon accounting.",
    localNextStep:
      "Check sustainability methodology notes before sharing demo copy.",
    boundaryNote: "Proxy-only indicators.",
  },
  {
    id: "unsupported-cloud-required-request",
    name: "Unsupported cloud-required request",
    group: "unsupported request",
    category: "unsupported/cloud-required request",
    syntheticSummary:
      "Synthetic request that would need cloud-only capabilities.",
    expectedTier: "unsupported",
    expectedRoute: "fail_closed",
    expectedLocalOnly: true,
    failClosedExpected: true,
    expectedLocalBehavior:
      "Fail closed unless an explicit future policy allows otherwise.",
    warning: "No cloud calls by default.",
    localNextStep:
      "Document unsupported scope instead of adding a cloud fallback.",
    boundaryNote: "Local preview only.",
  },
  {
    id: "ambiguous-sensitive-request",
    name: "Ambiguous sensitive request",
    group: "sensitive local task",
    category: "ambiguous request",
    syntheticSummary:
      "Synthetic ambiguous request with sensitive-sounding context.",
    expectedTier: "tier_3",
    expectedRoute: "conservative_local_review",
    expectedLocalOnly: true,
    failClosedExpected: false,
    expectedLocalBehavior:
      "Prefer conservative local review over broad automation.",
    warning: "Route hints, not guarantees.",
    localNextStep:
      "Ask for clearer local-preview scope before expanding automation.",
    boundaryNote: "Policy preview only.",
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
    scenarioGroups: groupPolicyScenariosByCategory(policyScenarios),
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

export function groupPolicyScenariosByCategory(
  scenarios = policyScenarios,
): PolicyScenarioGroup[] {
  return groupPolicyScenariosBy(scenarios, (scenario) => scenario.group);
}

export function groupPolicyScenariosByExpectedTier(
  scenarios = policyScenarios,
): PolicyScenarioGroup[] {
  return groupPolicyScenariosBy(scenarios, (scenario) => scenario.expectedTier);
}

export function filterPolicyScenariosByExpectedTier(
  expectedTier: string,
  scenarios = policyScenarios,
): PolicyScenarioSummary[] {
  return scenarios.filter((scenario) => scenario.expectedTier === expectedTier);
}

export function filterPolicyScenariosByLocalOnlyBehavior(
  expectedLocalOnly: boolean,
  scenarios = policyScenarios,
): PolicyScenarioSummary[] {
  return scenarios.filter(
    (scenario) => scenario.expectedLocalOnly === expectedLocalOnly,
  );
}

export function filterPolicyScenariosByBoundaryNote(
  boundaryNote: string,
  scenarios = policyScenarios,
): PolicyScenarioSummary[] {
  return scenarios.filter(
    (scenario) => scenario.boundaryNote.toLowerCase() === boundaryNote.toLowerCase(),
  );
}

function groupPolicyScenariosBy(
  scenarios: PolicyScenarioSummary[],
  keySelector: (scenario: PolicyScenarioSummary) => string,
): PolicyScenarioGroup[] {
  const groups = new Map<string, number>();
  for (const scenario of scenarios) {
    const key = keySelector(scenario);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function buildPolicyReportSnippet(
  scenarios = policyScenarios,
): string {
  return [
    "# IgnisPrompt Local Policy Scenario Report",
    "",
    "Scope: policy preview only; synthetic scenarios only; route hints, not guarantees.",
    "Boundaries: local helper checks, not certification; package validation is structural/local only; not signed.",
    `Scenario count: ${scenarios.length}`,
    "",
    "Synthetic scenarios:",
    ...scenarios.map(
      (scenario) =>
        `- ${scenario.name}: ${scenario.category}; ${scenario.expectedRoute}; ${scenario.boundaryNote}`,
    ),
  ].join("\n");
}
