export type EmptyStateCopy = {
  title: string;
  message: string;
  nextAction?: string;
  detail?: string;
};

export const localPreviewEmptyStates = {
  fixtureModeActive: {
    title: "Fixture mode is active",
    message: "Fixture data is available for local review.",
    nextAction:
      "Use the suggested review flow to move through daemon status, models, routing policy, evidence packages, audit records, and sustainability preview.",
    detail: "Details are in Help.",
  },
  liveHealthNotLoaded: {
    title: "No live health loaded",
    message:
      "Aethra is not showing live daemon health until you manually refresh live-local metadata.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh live health from the suggested review flow.",
    detail:
      "Confirm the daemon is reachable on the local health endpoint before refreshing.",
  },
  liveVersionNotLoaded: {
    title: "No live daemon version status loaded",
    message:
      "Aethra is not showing live daemon version status until you manually refresh.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh daemon version status from the suggested review flow.",
    detail: "Daemon version status is support metadata. Details are in Help.",
  },
  auditEventsNotLoaded: {
    title: "No live audit events loaded",
    message:
      "Aethra is not showing live audit records until audit events are manually refreshed.",
    nextAction:
      "Run ./scripts/smoke.sh if you need local audit records, then refresh audit events from the suggested review flow.",
    detail: "Details are in Help.",
  },
  auditEventsEmpty: {
    title: "No audit events yet",
    message: "The local daemon returned a valid empty audit event list.",
    nextAction:
      "Run ./scripts/smoke.sh if you need local audit records, then refresh audit events from the suggested review flow.",
  },
  modelMetadataNotLoaded: {
    title: "No live model metadata loaded",
    message:
      "Aethra is not showing live model manifest metadata until it is manually refreshed.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh, then refresh live models from the suggested review flow.",
  },
  modelStatusNotLoaded: {
    title: "No live model status loaded",
    message:
      "Aethra is not showing live model and runner status hints until they are manually refreshed.",
    nextAction:
      "Start ./scripts/start-dev.sh, then refresh model and runner status hints from the suggested review flow.",
    detail:
      "Status hints are local daemon metadata only, not runner controls or a production signal.",
  },
  modelStatusEmpty: {
    title: "No model status hints yet",
    message: "The local daemon returned a valid empty status hint list.",
    nextAction:
      "Confirm model manifests and runner settings locally, then refresh status hints from the suggested review flow.",
  },
  sustainabilityNotLoaded: {
    title: "No live sustainability metrics loaded",
    message:
      "Aethra is not showing live sustainability metrics until they are manually refreshed.",
    nextAction:
      "Start the daemon, run smoke checks if needed, then refresh sustainability metrics from the suggested review flow.",
    detail: "Methodology details are in Help.",
  },
  sustainabilityTierBreakdownEmpty: {
    title: "No route tier breakdown available",
    message:
      "The loaded sustainability metrics did not include any route tier counts.",
    nextAction:
      "Run smoke checks if you need route metadata, then refresh sustainability metrics from the suggested review flow.",
  },
  routingNoResult: {
    title: "No route result selected",
    message:
      "Fixture mode can show a synthetic route explanation without a daemon.",
    nextAction:
      "Choose a fixture-backed route example or load read-only routing policy metadata from the suggested review flow.",
  },
  routingLiveError: {
    title: "Routing policy metadata did not load",
    message:
      "The local daemon may be unavailable, the loopback URL may be blocked, or the routing policy endpoint may be unavailable.",
    nextAction:
      "Start the daemon with ./scripts/start-dev.sh and confirm the local health endpoint before retrying from the suggested review flow.",
  },
  recentRouteSummaryEmpty: {
    title: "No fixture route summary available",
    message:
      "The bundled audit fixtures did not include a recent route decision to summarize.",
    nextAction:
      "Fixture mode remains available; live-local routing policy metadata can be loaded from the suggested review flow.",
  },
  warningsEmpty: {
    title: "No fixture warnings shown",
    message:
      "The currently loaded fixture records do not include warning examples.",
    nextAction:
      "Live-local warnings appear only after refreshed audit events return them from the suggested review flow.",
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
      "Start the daemon with ./scripts/start-dev.sh, confirm the local endpoint, then refresh from the suggested review flow.",
    detail: fallback,
  };
}
