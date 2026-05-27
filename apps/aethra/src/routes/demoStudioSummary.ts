export type DemoStoryStep = {
  id: string;
  name: string;
  sourceSurface: string;
  summary: string;
  talkingPoint: string;
  localNextStep: string;
  boundaryNote: string;
};

export type DemoPackagePreview = {
  schemaVersion: string;
  packageMode: "local-preview";
  packageRoot: string;
  status: string;
  generatedFiles: string[];
  boundaryNotes: string[];
};

export type DemoStudioSummary = {
  storySteps: DemoStoryStep[];
  packagePreview: DemoPackagePreview;
  reportSnippet: string;
  boundaries: string[];
};

export const demoStoryStepIds = [
  "local-readiness",
  "operator-workflow",
  "evidence-workflow",
  "policy-scenarios",
  "aethra-review",
  "export-package-summary",
] as const;

export const demoPackageGeneratedFiles = [
  "README.md",
  "manifest.json",
  "demo-summary.json",
  "demo-report.json",
  "demo-report.md",
] as const;

export const requiredDemoBoundaryTerms = [
  "local preview demo only",
  "synthetic story steps only",
  "route/status/package values are hints, not guarantees",
  "local helper checks, not certification",
  "package validation is structural/local only",
  "not signed",
  "no cryptographic validation",
  "not tamper evident",
  "no telemetry",
  "no cloud calls by default",
  "no global aggregation",
  "Aethra is fixture-backed by default with manual live-local loading",
] as const;

export const demoStorySteps: DemoStoryStep[] = [
  {
    id: "local-readiness",
    name: "Local readiness",
    sourceSurface: "Local Readiness",
    summary: "Show local preview readiness status hints before the demo story.",
    talkingPoint: "Readiness values are local preview status hints, not controls.",
    localNextStep: "Run make readiness-check before a public local preview walkthrough.",
    boundaryNote: "Status hints, not controls.",
  },
  {
    id: "operator-workflow",
    name: "Operator workflow",
    sourceSurface: "Local Operator Console",
    summary: "Review copy-only command recipes and local operator package status.",
    talkingPoint:
      "Commands are safe snippets for a terminal and are not executed by Aethra.",
    localNextStep: "Run make operator-check and keep packages under local-evidence/operator/.",
    boundaryNote: "Local helper checks, not certification.",
  },
  {
    id: "evidence-workflow",
    name: "Evidence workflow",
    sourceSurface: "Evidence Bundle Viewer",
    summary: "Show local evidence bundle workflow shape without generated evidence contents.",
    talkingPoint: "Evidence bundles are local helper output and are not signed.",
    localNextStep: "Run make evidence-check and keep output under local-evidence/.",
    boundaryNote: "Package validation is structural/local only.",
  },
  {
    id: "policy-scenarios",
    name: "Policy scenarios",
    sourceSurface: "Local Policy Workbench",
    summary: "Show synthetic policy scenarios and route hints.",
    talkingPoint: "Policy scenarios are synthetic route hints, not guarantees.",
    localNextStep: "Run make policy-check and review policy package validation locally.",
    boundaryNote: "Route hints, not guarantees.",
  },
  {
    id: "aethra-review",
    name: "Aethra review",
    sourceSurface: "Aethra fixture-backed dashboard",
    summary:
      "Walk through read-only fixture-backed views with manual live-local loading only when selected.",
    talkingPoint:
      "Aethra observes local preview state and does not change routing or runner behavior.",
    localNextStep:
      "Use fixture mode by default and switch to live-local only for manual local checks.",
    boundaryNote: "Fixture-backed by default with manual live-local loading.",
  },
  {
    id: "export-package-summary",
    name: "Export package summary",
    sourceSurface: "ignispromptctl demo-summary",
    summary: "Generate a copy-safe demo summary or local demo package.",
    talkingPoint: "Demo packages are local-only helper outputs and are not signed.",
    localNextStep:
      "Run cargo run -p ignispromptctl -- demo-summary --package-output local-evidence/demo-studio/demo.",
    boundaryNote: "Local preview demo only.",
  },
];

export const demoBoundaries = [...requiredDemoBoundaryTerms];

export function buildDemoStudioSummary(): DemoStudioSummary {
  return {
    storySteps: demoStorySteps,
    packagePreview: {
      schemaVersion: "ignisprompt-demo-package-0.1",
      packageMode: "local-preview",
      packageRoot: "local-evidence/demo-studio/demo",
      status: "demo_guidance",
      generatedFiles: [...demoPackageGeneratedFiles],
      boundaryNotes: [
        "local preview demo only",
        "package validation is structural/local only",
        "not signed",
        "no cryptographic validation",
        "not tamper evident",
      ],
    },
    reportSnippet: buildDemoReportSnippet(),
    boundaries: demoBoundaries,
  };
}

export function buildDemoReportSnippet(steps = demoStorySteps): string {
  return [
    "# IgnisPrompt Local Demo Summary",
    "",
    "Scope: local preview demo only; synthetic story steps only; route/status/package values are hints, not guarantees.",
    "Boundaries: local helper checks, not certification; package validation is structural/local only; not signed; no cryptographic validation; not tamper evident.",
    `Step count: ${steps.length}`,
    "",
    "Demo story:",
    ...steps.map(
      (step, index) =>
        `${index + 1}. ${step.name}: ${step.talkingPoint} Next: ${step.localNextStep}`,
    ),
  ].join("\n");
}
