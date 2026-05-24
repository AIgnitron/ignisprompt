export type EmptyStateCopy = {
  title: string;
  message: string;
  nextAction?: string;
  detail?: string;
};

export const localPreviewEmptyStates = {
  fixtureModeActive: {
    title: "Fixture mode is active",
    message: "This is demo-safe and does not require a daemon.",
    nextAction:
      "Use the guided demo path to move through route inspection, audit records, model and runner hints, evidence workflow, and sustainability preview when you want a fuller walkthrough.",
    detail:
      "Aethra does not auto-load, poll, persist, or send telemetry for fixture data.",
  },
  liveHealthNotLoaded: {
    title: "No live health loaded",
    message:
      "Aethra is showing fixture health values until you manually refresh live-local metadata.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh live health from the guided demo path.",
    detail:
      "Confirm the daemon is reachable on the local health endpoint before refreshing.",
  },
  liveVersionNotLoaded: {
    title: "No live daemon version status loaded",
    message:
      "Aethra is showing fixture release status values until you manually refresh.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh daemon version status from the guided demo path.",
    detail:
      "Daemon version status is support/debugging metadata, not telemetry or an update checker.",
  },
  auditEventsNotLoaded: {
    title: "No live audit events loaded",
    message:
      "Fixture audit records remain visible until live-local audit events are manually refreshed.",
    nextAction:
      "Run ./scripts/smoke.sh or send a local route request, then refresh audit events from the guided demo path.",
    detail:
      "Live-local audit loading requires the local daemon and does not poll automatically.",
  },
  auditEventsEmpty: {
    title: "No audit events yet",
    message: "The local daemon returned a valid empty audit event list.",
    nextAction:
      "Run ./scripts/smoke.sh or send a local route request, then refresh audit events from the guided demo path.",
  },
  modelMetadataNotLoaded: {
    title: "No live model metadata loaded",
    message:
      "Aethra is showing fixture manifest hints until live-local model metadata is manually refreshed.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh live models from the guided demo path.",
  },
  modelStatusNotLoaded: {
    title: "No live model status loaded",
    message:
      "Fixture hints remain available; live-local status requires the daemon.",
    nextAction:
      "Start ./scripts/start-dev.sh, then refresh model and runner status hints from the guided demo path.",
    detail:
      "Status hints are local daemon metadata only, not runner controls or a production signal.",
  },
  modelStatusEmpty: {
    title: "No model status hints yet",
    message: "The local daemon returned a valid empty status hint list.",
    nextAction:
      "Confirm model manifests and runner settings locally, then refresh status hints from the guided demo path.",
  },
  sustainabilityNotLoaded: {
    title: "No live sustainability metrics loaded",
    message:
      "Aethra is showing fixture fallback estimates until metrics are manually refreshed.",
    nextAction:
      "Start the daemon, run smoke checks, then refresh sustainability metrics from the guided demo path.",
    detail:
      "These are methodology-dependent proxy estimates and are not telemetry.",
  },
  sustainabilityTierBreakdownEmpty: {
    title: "No route tier breakdown available",
    message:
      "The loaded sustainability metrics did not include any route tier counts.",
    nextAction:
      "Run smoke checks or local route requests, then refresh sustainability metrics from the guided demo path.",
  },
  routingNoResult: {
    title: "No route result selected",
    message:
      "Fixture mode can show a synthetic route explanation without a daemon.",
    nextAction:
      "Choose a fixture result, or follow the guided demo path and then explicitly confirm a local route request.",
  },
  routingLiveError: {
    title: "Live local route inspection did not run",
    message:
      "The local daemon may be unavailable, the loopback URL may be blocked, or preflight validation may have stopped the request.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh and confirm the local health endpoint before retrying from the guided demo path.",
  },
  recentRouteSummaryEmpty: {
    title: "No fixture route summary available",
    message:
      "The bundled audit fixtures did not include a recent route decision to summarize.",
    nextAction:
      "Fixture mode remains available; live-local route results require an explicit local request from the guided demo path.",
  },
  warningsEmpty: {
    title: "No fixture warnings shown",
    message:
      "The currently loaded fixture records do not include warning examples.",
    nextAction:
      "Live-local warnings appear only after manual local requests or refreshed audit events return them from the guided demo path.",
  },
} satisfies Record<string, EmptyStateCopy>;

export function buildLiveErrorEmptyState(
  label: string,
  message: string,
  fallback: string,
): EmptyStateCopy {
  return {
    title: label,
    message,
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, confirm the local endpoint, then refresh from the guided demo path.",
    detail: fallback,
  };
}
