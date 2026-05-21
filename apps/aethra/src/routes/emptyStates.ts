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
      "Switch to live-local mode only when you want to manually refresh local daemon metadata.",
    detail:
      "Aethra does not auto-load, poll, persist, or send telemetry for fixture data.",
  },
  liveHealthNotLoaded: {
    title: "No live health loaded",
    message:
      "Aethra is showing fixture health values until you manually refresh live-local metadata.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh live health.",
    detail: "Confirm the daemon is reachable at http://127.0.0.1:8765/health.",
  },
  liveVersionNotLoaded: {
    title: "No live daemon version status loaded",
    message:
      "Aethra is showing fixture release status values until you manually refresh.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh daemon version status.",
    detail:
      "Daemon version status is support/debugging metadata, not telemetry or an update checker.",
  },
  auditEventsNotLoaded: {
    title: "No live audit events loaded",
    message:
      "Fixture audit records remain visible until live-local audit events are manually refreshed.",
    nextAction:
      "Run ./scripts/smoke.sh or send a local route request, then refresh audit events.",
    detail:
      "Live-local audit loading requires the local daemon and does not poll automatically.",
  },
  auditEventsEmpty: {
    title: "No audit events yet",
    message: "The local daemon returned a valid empty audit event list.",
    nextAction:
      "Run ./scripts/smoke.sh or send a local route request, then refresh audit events.",
  },
  modelMetadataNotLoaded: {
    title: "No live model metadata loaded",
    message:
      "Aethra is showing fixture manifest hints until live-local model metadata is manually refreshed.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh live models.",
  },
  modelStatusNotLoaded: {
    title: "No live model status loaded",
    message:
      "Fixture hints remain available; live-local status requires the daemon.",
    nextAction:
      "Start ./scripts/start-dev.sh, then refresh model and runner status hints.",
    detail:
      "Status hints are local daemon metadata only, not runner controls or production readiness claims.",
  },
  modelStatusEmpty: {
    title: "No model status hints yet",
    message: "The local daemon returned a valid empty status hint list.",
    nextAction:
      "Confirm model manifests and runner settings locally, then refresh status hints.",
  },
  sustainabilityNotLoaded: {
    title: "No live sustainability metrics loaded",
    message:
      "Aethra is showing fixture fallback estimates until metrics are manually refreshed.",
    nextAction:
      "Start the daemon, run smoke checks, then refresh sustainability metrics.",
    detail:
      "These are methodology-dependent proxy estimates and are not telemetry.",
  },
  sustainabilityTierBreakdownEmpty: {
    title: "No route tier breakdown available",
    message:
      "The loaded sustainability metrics did not include any route tier counts.",
    nextAction:
      "Run smoke checks or local route requests, then refresh sustainability metrics.",
  },
  routingNoResult: {
    title: "No route result selected",
    message:
      "Fixture mode can show a synthetic route explanation without a daemon.",
    nextAction:
      "Choose a fixture result, or explicitly confirm and run a local route request.",
  },
  routingLiveError: {
    title: "Live local route inspection did not run",
    message:
      "The local daemon may be unavailable, the loopback URL may be blocked, or preflight validation may have stopped the request.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh and confirm http://127.0.0.1:8765/health before retrying.",
  },
  recentRouteSummaryEmpty: {
    title: "No fixture route summary available",
    message:
      "The bundled audit fixtures did not include a recent route decision to summarize.",
    nextAction:
      "Fixture mode remains available; live-local route results require an explicit local request.",
  },
  warningsEmpty: {
    title: "No fixture warnings shown",
    message:
      "The currently loaded fixture records do not include warning examples.",
    nextAction:
      "Live-local warnings appear only after manual local requests or refreshed audit events return them.",
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
      "Start the daemon with ./scripts/start-dev.sh, confirm the loopback endpoint, then refresh manually.",
    detail: fallback,
  };
}
