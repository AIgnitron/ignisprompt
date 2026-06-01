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
  "overview",
  "routing-explorer",
  "audit-events",
  "model-runner-status",
  "evidence-and-demo-package",
  "sustainability-preview",
  "boundaries-and-non-claims",
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
  "generated locally under ignored local-evidence paths",
  "read-only dashboard",
  "manual live-local loading only",
  "not signed",
  "no cryptographic validation",
  "not tamper evident",
  "no telemetry",
  "no cloud calls by default",
  "no global aggregation",
  "no model or runner controls",
  "not legal advice",
  "not compliance claims, not security assurance, and not esg reporting evidence",
  "Aethra is fixture-backed by default with manual live-local loading",
] as const;

export const demoStorySteps: DemoStoryStep[] = [
  {
    id: "overview",
    name: "Overview",
    sourceSurface: "Overview",
    summary: "Start with the product front door, local-preview boundaries, and live-local diagnostics.",
    talkingPoint: "Aethra is fixture-backed by default and live-local loading stays manual.",
    localNextStep: "Confirm fixture mode first, then use manual live-local loads only when needed.",
    boundaryNote: "Read-only dashboard.",
  },
  {
    id: "routing-explorer",
    name: "Routing explorer",
    sourceSurface: "Routing Explorer",
    summary: "Show candidate routes by tier, then explain why the selected local route won.",
    talkingPoint: "Route decisions are policy signals from IgnisPrompt, not guarantees or controls.",
    localNextStep: "Use fixture route examples before any explicit local route-explain request.",
    boundaryNote: "No cloud calls by default.",
  },
  {
    id: "audit-events",
    name: "Audit events",
    sourceSurface: "Audit Events",
    summary: "Review local audit records that explain what happened after a route decision.",
    talkingPoint: "Audit review is read-only and stays local to the current preview flow.",
    localNextStep: "Use local synthetic requests and verify audit history without exposing sensitive text.",
    boundaryNote: "Manual live-local loading only.",
  },
  {
    id: "model-runner-status",
    name: "Model and runner status",
    sourceSurface: "Model / Runner Status",
    summary: "Show capability and connector-style status hints without adding any controls.",
    talkingPoint: "Availability, configured, and warning fields are hints only and do not prove inference readiness.",
    localNextStep: "Refresh live-local status hints only when the daemon is already running locally.",
    boundaryNote: "No model or runner controls.",
  },
  {
    id: "evidence-and-demo-package",
    name: "Evidence and demo package preview",
    sourceSurface: "Evidence Bundle Viewer and Local Demo Studio",
    summary: "Show what can be generated locally under ignored paths and what local validation means.",
    talkingPoint: "Package previews are structural/local review only and are not signed evidence.",
    localNextStep: "Run make demo-check and make evidence-check before relying on package previews.",
    boundaryNote: "Generated locally under ignored local-evidence paths.",
  },
  {
    id: "sustainability-preview",
    name: "Sustainability preview",
    sourceSurface: "Sustainability Preview",
    summary: "Close with proxy-only sustainability estimates and conservative methodology notes.",
    talkingPoint: "These values are methodology-dependent proxies, not certification or measured energy use.",
    localNextStep: "Keep sustainability screenshots paired with the local-preview disclaimer language.",
    boundaryNote: "Local helper checks, not certification.",
  },
  {
    id: "boundaries-and-non-claims",
    name: "Boundaries and non-claims",
    sourceSurface: "Across Aethra",
    summary: "End by restating the hard boundaries that keep this product surface conservative.",
    talkingPoint: "Aethra is not legal advice, not certification, and not signed attestation evidence.",
    localNextStep: "Use Local Readiness, Local Operator Console, Local Policy Workbench, and Local Command Center as supporting workflow surfaces.",
    boundaryNote: "Not legal advice.",
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
        "generated locally under ignored local-evidence paths",
        "read-only dashboard",
        "manual live-local loading only",
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
    "Boundaries: local helper checks, not certification; package validation is structural/local only; generated locally under ignored local-evidence paths; read-only dashboard; manual live-local loading only; no telemetry; no cloud calls by default; no model or runner controls; not legal advice; not compliance claims, not security assurance, and not esg reporting evidence; not signed; no cryptographic validation; not tamper evident.",
    `Step count: ${steps.length}`,
    "",
    "Demo story:",
    ...steps.map(
      (step, index) =>
        `${index + 1}. ${step.name}: ${step.talkingPoint} Next: ${step.localNextStep}`,
    ),
  ].join("\n");
}
