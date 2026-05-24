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
    id: "dev-check",
    label: "Run development checks",
    command: "make dev-check",
    detail: "Runs local helper checks used during development.",
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
    detail: "Development and evidence checks are command snippets, not certification.",
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
        "Use make dev-check and make evidence-check as local helper checks only.",
      source: "helper",
      tone: "neutral",
    },
  ];
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
