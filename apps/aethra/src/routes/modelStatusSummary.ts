import type { ModelManifest, ModelStatusHint } from "../api/contracts";

const noExecutableInferenceWarning =
  "does not attempt executable inference";

export type CapabilityMatrixRow = {
  key: string;
  tier: string;
  providerName: string;
  status: string;
  available: string;
  configured: string;
  dataBoundary: string;
  reason: string;
  warnings: string;
};

export function describeLocalPathStatus(hint: ModelStatusHint): string {
  if (!hint.localPathDeclared) {
    return "not declared";
  }

  return hint.localPathExists ? "declared and found" : "declared, not found";
}

export function describeRunnerStatus(hint: ModelStatusHint): string {
  if (!hint.runnerConfigured) {
    return "not configured";
  }

  return `${hint.runnerKind}; executable ${
    hint.runnerExecutableExists ? "found" : "not found"
  }`;
}

export function describeExecutableInferenceStatus(
  hint: ModelStatusHint,
): string {
  return hint.warnings.some((warning) =>
    warning.includes(noExecutableInferenceWarning),
  )
    ? "not attempted by status check"
    : "not reported by status check";
}

export function formatAvailability(
  availability: ModelStatusHint["availability"],
): string {
  switch (availability) {
    case "configured":
      return "configured";
    case "staged":
      return "staged locally";
    case "runner-missing":
      return "runner missing";
    case "model-file-missing":
      return "model file missing";
    case "unavailable":
      return "unavailable";
    case "unknown":
      return "unknown";
  }
}

export function isAvailabilityUsable(
  availability: ModelStatusHint["availability"],
): boolean {
  return availability === "configured" || availability === "staged";
}

export function describeCapabilityReason(
  hint: ModelStatusHint,
): string {
  if (!hint.configured) {
    return "Manifest entry exists, but the local daemon did not report it as configured.";
  }

  switch (hint.availability) {
    case "configured":
      return "Configured locally; executable inference is still not implied by this status check.";
    case "staged":
      return "Local file and runner prerequisites appear staged for a future manual run.";
    case "runner-missing":
      return "A model entry exists, but the declared runner executable was not found.";
    case "model-file-missing":
      return "A model entry exists, but the declared local model file was not found.";
    case "unavailable":
      return "The local daemon reported the candidate as unavailable for use.";
    case "unknown":
      return "The local daemon could not classify this candidate beyond a conservative unknown state.";
  }
}

export function buildCapabilityMatrixRows(
  models: ModelManifest[],
  statusHints: ModelStatusHint[],
): CapabilityMatrixRow[] {
  return models.map((model) => {
    const hint = statusHints.find((entry) => entry.modelId === model.modelId);
    const source = model.source ?? "local manifest";
    const runner = hint?.runnerKind ?? "status hint unavailable";

    return {
      key: model.modelId,
      tier: `TIER_${model.tier}`,
      providerName: `${source} / ${model.displayName}`,
      status: hint ? formatAvailability(hint.availability) : "fixture pending",
      available: hint ? (isAvailabilityUsable(hint.availability) ? "yes" : "no") : "unknown",
      configured: hint ? (hint.configured ? "yes" : "no") : "manifest only",
      dataBoundary: "local only",
      reason: hint
        ? `${describeCapabilityReason(hint)} Runner: ${runner}.`
        : "Manifest metadata is available, but no status hint was provided for this entry.",
      warnings:
        hint && hint.warnings.length > 0
          ? hint.warnings.join(" ")
          : "none",
    };
  });
}
