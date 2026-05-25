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
  type ReadinessDiagnostic,
} from "./localReadinessSummary";

export type OperatorSummaryCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "neutral" | "warning";
};

export type OperatorCommandRecipe = {
  id: string;
  label: string;
  command: string;
  detail: string;
};

export type OperatorBoundary = {
  id: string;
  label: string;
  detail: string;
};

export type OperatorPackagePreview = {
  schemaVersion: string;
  packageMode: "local-preview";
  packageRoot: string;
  status: string;
  generatedFiles: string[];
  sections: string[];
  commands: string[];
  boundaryNotes: string[];
};

export type OperatorConsoleSummary = {
  cards: OperatorSummaryCard[];
  diagnostics: ReadinessDiagnostic[];
  commands: OperatorCommandRecipe[];
  boundaries: OperatorBoundary[];
  packagePreview: OperatorPackagePreview;
};

export const operatorCommandRecipes: OperatorCommandRecipe[] = [
  {
    id: "start-dev",
    label: "Start local daemon",
    command: "./scripts/start-dev.sh",
    detail: "Copy into a terminal from the repo root when a daemon is needed.",
  },
  {
    id: "doctor",
    label: "Run local doctor",
    command: "cargo run -p ignispromptctl -- doctor",
    detail: "Checks local daemon endpoint shape from your terminal.",
  },
  {
    id: "readiness",
    label: "Run readiness summary",
    command: "cargo run -p ignispromptctl -- readiness",
    detail: "Summarizes local preview readiness with status hint boundaries.",
  },
  {
    id: "readiness-json",
    label: "Run readiness JSON",
    command: "cargo run -p ignispromptctl -- readiness --json",
    detail: "Prints safe structured readiness diagnostics.",
  },
  {
    id: "readiness-package-output",
    label: "Generate readiness package",
    command:
      "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo",
    detail: "Writes a local-only readiness package under ignored paths.",
  },
  {
    id: "readiness-package-list",
    label: "List readiness package",
    command:
      "cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo",
    detail: "Lists package files without daemon calls.",
  },
  {
    id: "readiness-package-validate",
    label: "Validate readiness package",
    command:
      "cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo",
    detail: "Runs structural/local package validation.",
  },
  {
    id: "readiness-check",
    label: "Run readiness quality gate",
    command: "make readiness-check",
    detail: "Runs local readiness and report safety checks.",
  },
  {
    id: "operator-package-output",
    label: "Generate operator package",
    command:
      "cargo run -p ignispromptctl -- operator-summary --package-output local-evidence/operator/demo",
    detail: "Writes a local-only operator package under ignored paths.",
  },
  {
    id: "operator-package-list",
    label: "List operator package",
    command:
      "cargo run -p ignispromptctl -- operator-summary --package-list local-evidence/operator/demo",
    detail: "Lists operator package files without daemon calls.",
  },
  {
    id: "operator-package-validate",
    label: "Validate operator package",
    command:
      "cargo run -p ignispromptctl -- operator-summary --package-validate local-evidence/operator/demo",
    detail: "Runs structural/local operator package validation.",
  },
  {
    id: "policy-scenarios",
    label: "Inspect policy scenarios",
    command: "cargo run -p ignispromptctl -- policy-scenarios",
    detail: "Reviews synthetic local-preview policy route hints.",
  },
  {
    id: "policy-scenarios-json",
    label: "Inspect policy scenario JSON",
    command: "cargo run -p ignispromptctl -- policy-scenarios --json",
    detail: "Prints safe structured policy scenario guidance.",
  },
  {
    id: "policy-package-output",
    label: "Generate policy package",
    command:
      "cargo run -p ignispromptctl -- policy-scenarios --package-output local-evidence/policy/demo",
    detail: "Writes a local-only policy package under ignored paths.",
  },
  {
    id: "policy-package-validate",
    label: "Validate policy package",
    command:
      "cargo run -p ignispromptctl -- policy-scenarios --package-validate local-evidence/policy/demo",
    detail: "Runs structural/local policy package validation.",
  },
  {
    id: "policy-check",
    label: "Run policy quality gate",
    command: "make policy-check",
    detail: "Runs deterministic local policy workbench checks.",
  },
  {
    id: "evidence-check",
    label: "Run evidence quality gate",
    command: "make evidence-check",
    detail: "Runs local evidence workflow regression checks.",
  },
  {
    id: "demo-self-test",
    label: "Run demo workflow self-test",
    command: "./scripts/demo-local-evidence-workflow.sh --self-test",
    detail: "Verifies demo workflow command construction and ignored paths.",
  },
];

export const operatorBoundaries: OperatorBoundary[] = [
  {
    id: "local-preview-only",
    label: "Local preview only",
    detail: "Use operator results as local preview guidance only.",
  },
  {
    id: "status-hints",
    label: "Status hints, not controls",
    detail: "Readiness, model, and runner values are review inputs only.",
  },
  {
    id: "helper-checks",
    label: "Local helper checks, not certification",
    detail: "Quality gates are deterministic local helpers.",
  },
  {
    id: "package-validation",
    label: "Structural/local package validation only",
    detail:
      "Readiness packages, operator packages, and archives are local-only and not signed.",
  },
  {
    id: "local-data",
    label: "No telemetry or cloud calls by default",
    detail: "Aethra uses fixture data by default and manual live-local loading.",
  },
  {
    id: "copy-only",
    label: "Copy-only command recipes",
    detail: "Aethra does not execute, upload, poll, or persist operator data.",
  },
];

export function buildOperatorConsoleSummary(): OperatorConsoleSummary {
  const readinessCards = buildLocalReadinessCards({
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
  const diagnostics = buildLocalReadinessDiagnostics(readinessCards);
  const packagePreview = buildLocalReadinessPackagePreview(diagnostics);
  const operatorPackagePreview = buildOperatorPackagePreview(diagnostics);
  const warningCount = diagnostics.filter(
    (item) => item.status === "needs attention",
  ).length;

  return {
    cards: [
      {
        id: "daemon-endpoints",
        label: "Daemon and endpoint readiness",
        value: warningCount > 0 ? "needs attention" : "status hints",
        detail:
          "Fixture-backed local preview readiness summarizes daemon, endpoint, model, and runner hints.",
        tone: warningCount > 0 ? "warning" : "neutral",
      },
      {
        id: "cli-readiness-package",
        label: "CLI readiness package",
        value: packagePreview.status,
        detail:
          "Package validation is structural/local only; generated paths stay under ignored local-evidence/readiness/.",
        tone:
          packagePreview.status === "local_preview_ready" ? "ok" : "warning",
      },
      {
        id: "evidence-bundle-workflow",
        label: "Evidence bundle workflow",
        value: evidenceBundleFixture.validation.status,
        detail: `${evidenceBundleFixture.manifest.generated_files.length} fixture file entries; archive and package previews are not signed.`,
        tone:
          evidenceBundleFixture.validation.status === "validated"
            ? "ok"
            : "neutral",
      },
      {
        id: "aethra-demo-path",
        label: "Aethra demo path",
        value: "fixture-backed default",
        detail:
          "Use Local Readiness, Local Command Center, and Evidence Bundle views for read-only demo review.",
        tone: "neutral",
      },
      {
        id: "local-safety-boundaries",
        label: "Local safety boundaries",
        value: "copy-only guidance",
        detail:
          "No telemetry, no global aggregation, no uploads, and no cloud calls by default.",
        tone: "neutral",
      },
      {
        id: "policy-workbench",
        label: "Local policy workbench",
        value: "synthetic scenarios",
        detail:
          "Policy route summaries are local-preview hints, not guarantees; package validation is structural/local only.",
        tone: "neutral",
      },
      {
        id: "suggested-local-commands",
        label: "Suggested next local commands",
        value: `${operatorCommandRecipes.length} recipes`,
        detail:
          "Use make operator-check, readiness-check, evidence-check, and demo self-test before sharing local preview notes.",
        tone: "neutral",
      },
    ],
    diagnostics,
    commands: operatorCommandRecipes,
    boundaries: operatorBoundaries,
    packagePreview: operatorPackagePreview,
  };
}

export function buildOperatorPackagePreview(
  diagnostics: ReadinessDiagnostic[],
): OperatorPackagePreview {
  return {
    schemaVersion: "ignisprompt-operator-package-0.1",
    packageMode: "local-preview",
    packageRoot: "local-evidence/operator/demo",
    status: diagnostics.some((item) => item.status === "needs attention")
      ? "needs_attention"
      : "operator_guidance",
    generatedFiles: [
      "README.md",
      "manifest.json",
      "operator-summary.json",
      "operator-report.json",
      "operator-report.md",
    ],
    sections: [
      "local preview readiness",
      "CLI readiness package",
      "evidence bundle workflow",
      "Aethra demo path",
      "local safety boundaries",
    ],
    commands: operatorCommandRecipes.map((item) => item.command),
    boundaryNotes: [
      "local preview operator workflow only",
      "status hints, not controls",
      "local helper checks, not certification",
      "package validation is structural/local only",
      "not signed",
      "not production attestation",
      "no telemetry",
      "no cloud calls by default",
      "no global aggregation",
    ],
  };
}

export function getAllOperatorCommandsText(
  commands = operatorCommandRecipes,
): string {
  return commands.map((item) => item.command).join("\n");
}
