import type {
  EvidenceBundlePreview,
  HealthResponse,
  ModelManifest,
  ModelStatusHint,
  VersionStatusResponse,
} from "../api/contracts";

export type ReadinessSource = "fixture" | "live-local" | "helper";

export type ReadinessCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  source: ReadinessSource;
  tone: "ok" | "neutral" | "warning";
};

export type ReadinessChecklistItem = {
  id: string;
  label: string;
  detail: string;
};

export type ReadinessCommand = {
  id: string;
  label: string;
  command: string;
  detail: string;
};

export type ReadinessDiagnosticCategory =
  | "daemon"
  | "endpoints"
  | "models"
  | "runner hints"
  | "audit"
  | "evidence workflow"
  | "security checks"
  | "aethra";

export type ReadinessDiagnostic = {
  id: string;
  label: string;
  category: ReadinessDiagnosticCategory;
  status: "ok" | "needs attention" | "status hint";
  severity: "required" | "advisory" | "info";
  localNextStep: string;
  boundaryNote: string;
  source: ReadinessSource;
};

export type ReadinessPackagePreview = {
  schemaVersion: string;
  packageMode: "local-preview";
  packageRoot: string;
  status: string;
  generatedFiles: string[];
  categories: Array<{
    category: ReadinessDiagnosticCategory;
    severity: ReadinessDiagnostic["severity"];
    status: ReadinessDiagnostic["status"];
  }>;
  localNextSteps: string[];
  boundaryNotes: string[];
};

export const localReadinessCommands: ReadinessCommand[] = [
  {
    id: "start-dev",
    label: "Start local daemon",
    command: "./scripts/start-dev.sh",
    detail: "Copy and run from the repo root when a local daemon is needed.",
  },
  {
    id: "health",
    label: "Check daemon health",
    command: "cargo run -p ignispromptctl -- health",
    detail: "Reads the local health endpoint from your terminal.",
  },
  {
    id: "doctor",
    label: "Run local doctor",
    command: "cargo run -p ignispromptctl -- doctor",
    detail: "Checks required local preview endpoints from your terminal.",
  },
  {
    id: "readiness",
    label: "Run local readiness summary",
    command: "cargo run -p ignispromptctl -- readiness",
    detail:
      "Summarizes local preview readiness with the same status hint boundaries.",
  },
  {
    id: "readiness-report",
    label: "Print local readiness report",
    command: "cargo run -p ignispromptctl -- readiness --markdown",
    detail:
      "Prints a copy-safe local preview readiness report for issue or demo notes.",
  },
  {
    id: "readiness-package",
    label: "Generate readiness package",
    command:
      "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo-readiness",
    detail:
      "Writes a local preview readiness package under ignored local-evidence/readiness/.",
  },
  {
    id: "readiness-package-list",
    label: "List readiness package",
    command:
      "cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo-readiness",
    detail: "Lists generated package files without calling the daemon.",
  },
  {
    id: "readiness-package-validate",
    label: "Validate readiness package",
    command:
      "cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo-readiness",
    detail: "Validates package files and conservative boundaries locally.",
  },
  {
    id: "dev-check",
    label: "Run development checks",
    command: "make dev-check",
    detail: "Runs local helper checks used during development.",
  },
  {
    id: "readiness-check",
    label: "Run readiness checks",
    command: "make readiness-check",
    detail: "Runs local readiness quality gates and report safety checks.",
  },
  {
    id: "evidence-check",
    label: "Run evidence checks",
    command: "make evidence-check",
    detail: "Runs local evidence workflow regression checks.",
  },
];

export const localPreviewReadinessChecklist: ReadinessChecklistItem[] = [
  {
    id: "fixture-default",
    label: "Fixture-backed by default",
    detail: "Bundled data renders without a daemon, model weights, or live calls.",
  },
  {
    id: "manual-live-local",
    label: "Manual live-local loading",
    detail: "Live endpoint data appears only after explicit manual refresh actions.",
  },
  {
    id: "read-only",
    label: "Read-only dashboard",
    detail: "Aethra displays status hints and does not change daemon state.",
  },
  {
    id: "helper-checks",
    label: "Local helper checks",
    detail:
      "Readiness, development, and evidence checks are command snippets, not certification.",
  },
  {
    id: "no-telemetry-cloud",
    label: "No telemetry or cloud calls by default",
    detail:
      "Local readiness review does not add telemetry or cloud calls by default.",
  },
  {
    id: "local-preview-boundary",
    label: "Local preview readiness",
    detail: "The checklist is for preview review, not production deployment.",
  },
];

export type LocalReadinessSummaryInput = {
  health: HealthResponse;
  healthSource: ReadinessSource;
  versionStatus: VersionStatusResponse;
  versionSource: ReadinessSource;
  models: ModelManifest[];
  modelsSource: ReadinessSource;
  statusHints: ModelStatusHint[];
  statusHintsSource: ReadinessSource;
  evidenceBundle: EvidenceBundlePreview;
};

export function buildLocalReadinessCards({
  health,
  healthSource,
  versionStatus,
  versionSource,
  models,
  modelsSource,
  statusHints,
  statusHintsSource,
  evidenceBundle,
}: LocalReadinessSummaryInput): ReadinessCard[] {
  const installedModels = models.filter((model) => model.installed).length;
  const runnerConfigured = statusHints.filter(
    (hint) => hint.runnerConfigured,
  ).length;
  const runnerExecutable = statusHints.filter(
    (hint) => hint.runnerExecutableExists,
  ).length;
  const missingHints = statusHints.filter(
    (hint) =>
      hint.availability === "model-file-missing" ||
      hint.availability === "runner-missing" ||
      hint.availability === "unavailable",
  ).length;

  return [
    {
      id: "daemon-health",
      label: "Daemon health",
      value: health.status,
      detail: `${health.service} ${health.version}; local_only=${String(
        health.local_only,
      )}.`,
      source: healthSource,
      tone: health.status.toLowerCase() === "ok" ? "ok" : "warning",
    },
    {
      id: "version-status",
      label: "Version/status",
      value: versionStatus.release_channel,
      detail: `${versionStatus.service} ${versionStatus.version}; build profile ${versionStatus.build_profile}.`,
      source: versionSource,
      tone: versionStatus.local_only ? "ok" : "warning",
    },
    {
      id: "configured-models",
      label: "Configured models",
      value: String(models.length),
      detail: `${installedModels} installed flag(s) from the model manifest.`,
      source: modelsSource,
      tone: models.length > 0 ? "neutral" : "warning",
    },
    {
      id: "model-runner-hints",
      label: "Model/runner status hints",
      value: `${statusHints.length} hint(s)`,
      detail: `${runnerConfigured} runner configured; ${runnerExecutable} runner executable found; ${missingHints} missing prerequisite hint(s).`,
      source: statusHintsSource,
      tone: missingHints > 0 ? "warning" : "neutral",
    },
    {
      id: "evidence-workflow",
      label: "Evidence workflow availability",
      value: evidenceBundle.validation.status,
      detail: `${evidenceBundle.manifest.generated_files.length} fixture file entries; audit events included=${String(
        evidenceBundle.manifest.audit_events_included,
      )}.`,
      source: "fixture",
      tone: evidenceBundle.validation.status === "validated" ? "ok" : "neutral",
    },
    {
      id: "security-evidence-checks",
      label: "Security/evidence checks",
      value: "local helper checks",
      detail:
        "Use make readiness-check, make dev-check, and make evidence-check as local helper checks only.",
      source: "helper",
      tone: "neutral",
    },
  ];
}

export function buildLocalReadinessDiagnostics(
  cards: ReadinessCard[],
): ReadinessDiagnostic[] {
  const cardDiagnostics = cards.map((card) => {
    const category = readinessDiagnosticCategory(card.id);
    return {
      id: card.id,
      label: card.label,
      category,
      status: readinessDiagnosticStatus(card),
      severity: readinessDiagnosticSeverity(card),
      localNextStep: readinessDiagnosticNextStep(card.id, card.tone),
      boundaryNote: readinessDiagnosticBoundaryNote(category),
      source: card.source,
    };
  });

  return [
    ...cardDiagnostics,
    {
      id: "audit-local-records",
      label: "Audit record handling",
      category: "audit",
      status: "status hint",
      severity: "advisory",
      localNextStep:
        "Use cargo run -p ignispromptctl -- audit-events with synthetic or non-sensitive local preview data when audit review is needed.",
      boundaryNote:
        "Audit summaries are local preview records and local helper checks, not certification.",
      source: "helper",
    },
    {
      id: "aethra-manual-loading",
      label: "Aethra manual loading",
      category: "aethra",
      status: "status hint",
      severity: "info",
      localNextStep:
        "Use explicit manual live-local refresh actions elsewhere in Aethra when live local data is needed.",
      boundaryNote:
        "Aethra remains read-only and does not poll, upload, persist, or execute commands.",
      source: "helper",
    },
  ];
}

export function buildLocalReadinessPackagePreview(
  diagnostics: ReadinessDiagnostic[],
): ReadinessPackagePreview {
  return {
    schemaVersion: "ignisprompt-readiness-package-0.1",
    packageMode: "local-preview",
    packageRoot: "local-evidence/readiness/demo-readiness",
    status: diagnostics.some((item) => item.status === "needs attention")
      ? "needs_attention"
      : "local_preview_ready",
    generatedFiles: [
      "README.md",
      "manifest.json",
      "readiness-summary.json",
      "readiness-report.json",
      "readiness-report.md",
    ],
    categories: diagnostics.map((item) => ({
      category: item.category,
      severity: item.severity,
      status: item.status,
    })),
    localNextSteps: diagnostics
      .map((item) => item.localNextStep)
      .filter((step, index, steps) => steps.indexOf(step) === index),
    boundaryNotes: [
      "local preview readiness only",
      "status hints, not controls",
      "local helper checks, not certification",
      "manual live-local loading",
      "no telemetry",
      "no cloud calls by default",
      "no global aggregation",
      "no external assurance or integrity claim",
    ],
  };
}

function readinessDiagnosticCategory(
  cardId: string,
): ReadinessDiagnosticCategory {
  switch (cardId) {
    case "daemon-health":
      return "daemon";
    case "version-status":
      return "endpoints";
    case "configured-models":
      return "models";
    case "model-runner-hints":
      return "runner hints";
    case "evidence-workflow":
      return "evidence workflow";
    case "security-evidence-checks":
      return "security checks";
    default:
      return "endpoints";
  }
}

function readinessDiagnosticStatus(
  card: ReadinessCard,
): ReadinessDiagnostic["status"] {
  if (card.tone === "ok") {
    return "ok";
  }

  if (card.tone === "warning") {
    return "needs attention";
  }

  return "status hint";
}

function readinessDiagnosticSeverity(
  card: ReadinessCard,
): ReadinessDiagnostic["severity"] {
  if (card.tone === "warning") {
    return "required";
  }

  if (card.source === "helper") {
    return "advisory";
  }

  return "info";
}

function readinessDiagnosticNextStep(cardId: string, tone: ReadinessCard["tone"]): string {
  if (tone !== "warning") {
    return "No local action needed for this status hint.";
  }

  switch (cardId) {
    case "daemon-health":
      return "Start the local daemon with ./scripts/start-dev.sh, then rerun cargo run -p ignispromptctl -- readiness.";
    case "version-status":
      return "Confirm the daemon is the current local preview build, then retry manual live-local loading.";
    case "configured-models":
      return "Review local model manifest configuration; model weights are optional and must stay under ignored models/ paths.";
    case "model-runner-hints":
      return "Review model and runner status hints as prerequisites only; Aethra remains read-only.";
    default:
      return "Run make readiness-check and review local preview readiness output.";
  }
}

function readinessDiagnosticBoundaryNote(
  category: ReadinessDiagnosticCategory,
): string {
  switch (category) {
    case "runner hints":
      return "status hints, not controls";
    case "evidence workflow":
    case "security checks":
    case "audit":
      return "local helper checks, not certification";
    case "aethra":
      return "manual live-local loading; no telemetry and no cloud calls by default";
    default:
      return "local preview readiness only";
  }
}

export function getReadinessSourceLabel(source: ReadinessSource): string {
  switch (source) {
    case "fixture":
      return "Fixture-backed";
    case "live-local":
      return "Manual live-local";
    case "helper":
      return "Local helper";
  }
}

export function getAllReadinessCommandsText(
  commands = localReadinessCommands,
): string {
  return commands.map((item) => item.command).join("\n");
}
