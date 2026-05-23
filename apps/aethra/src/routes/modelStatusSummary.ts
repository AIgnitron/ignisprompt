import type { ModelStatusHint } from "../api/contracts";

const noExecutableInferenceWarning =
  "does not attempt executable inference";

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
