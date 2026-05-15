import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import type { AethraDataMode, LiveHealthState } from "../dataSource";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
} from "../fixtures/aethraFixture";
import {
  buildOverviewSummary,
  getWarningExamples,
} from "./overviewSummary";

const summary = buildOverviewSummary(
  healthFixture,
  modelFixtures,
  auditEventFixtures,
);
const warningExamples = getWarningExamples(auditEventFixtures);

type OverviewProps = {
  dataMode: AethraDataMode;
  liveHealthState: LiveHealthState;
  onLoadLiveHealth: () => void;
};

export function Overview({
  dataMode,
  liveHealthState,
  onLoadLiveHealth,
}: OverviewProps) {
  const latestEvent = summary.latestEvent;
  const liveHealth =
    dataMode === "live-local" && liveHealthState.status === "loaded"
      ? liveHealthState.health
      : undefined;
  const healthForStatus = liveHealth ?? healthFixture;
  const healthSourceLabel = liveHealth
    ? "Live local health"
    : dataMode === "live-local"
      ? "Fixture fallback"
      : "Fixture mode";

  return (
    <section id="overview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>IgnisPrompt overview</h2>
        </div>
        <div className="status-strip" aria-label="Overview health status">
          <StatusBadge tone="ok">{healthForStatus.status.toUpperCase()}</StatusBadge>
          <StatusBadge tone="neutral">
            {healthForStatus.service} {healthForStatus.version}
          </StatusBadge>
          <StatusBadge tone={healthForStatus.local_only ? "ok" : "warning"}>
            {healthForStatus.local_only ? "Local-only" : "Local-only off"}
          </StatusBadge>
          <StatusBadge tone={liveHealth ? "ok" : "neutral"}>
            {healthSourceLabel}
          </StatusBadge>
        </div>
      </header>

      <HealthMetadataPanel
        dataMode={dataMode}
        liveHealthState={liveHealthState}
        onLoadLiveHealth={onLoadLiveHealth}
      />

      <div className="metric-grid" aria-label="Aethra fixture metrics">
        <MetricCard
          label="Models loaded"
          value={summary.modelCount}
          detail={`${healthFixture.model_count} reported by health fixture`}
        />
        <MetricCard
          label="Recent audit events"
          value={summary.auditEventCount}
          detail="Synthetic audit fixture records"
        />
        <MetricCard
          label="Data stayed local"
          value={summary.localEventCount}
          detail="Events where data_left_device=false"
        />
        <MetricCard
          label="Warnings"
          value={summary.warningCount}
          detail="Warnings across audit fixtures"
        />
        <MetricCard
          label="Cache hits"
          value={summary.cacheHitCount}
          detail="Fixture events with cache.hit=true"
        />
      </div>

      {latestEvent ? (
        <section className="panel" aria-label="Recent fixture route decision">
          <div className="panel-heading">
            <div>
              <h3>Recent route summary</h3>
              <p className="muted">Latest synthetic audit event by timestamp</p>
            </div>
            <StatusBadge tone="ok">{latestEvent.tier}</StatusBadge>
          </div>
          <dl className="definition-grid">
            <div>
              <dt>Route code</dt>
              <dd>{latestEvent.route_code}</dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{latestEvent.domain}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{latestEvent.model_id ?? "none"}</dd>
            </div>
            <div>
              <dt>Data left device</dt>
              <dd>{latestEvent.data_left_device ? "true" : "false"}</dd>
            </div>
          </dl>
          <p className="explanation">{latestEvent.explanation}</p>
        </section>
      ) : (
        <section className="panel" aria-label="Recent fixture route decision">
          <h3>Recent route summary</h3>
          <p className="muted">No synthetic audit events are available.</p>
        </section>
      )}

      <div className="two-column">
        <section className="panel" aria-label="Local-only posture summary">
          <div className="panel-heading">
            <h3>Local-only posture</h3>
            <StatusBadge tone="neutral">Fixture facts</StatusBadge>
          </div>
          <div className="fact-columns">
            <div>
              <h4>Observed from fixtures</h4>
              <ul>
                {summary.observedFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Dashboard-derived</h4>
              <ul>
                {summary.derivedFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="muted">
            These are synthetic fixture records, not signed audit evidence,
            certified sustainability metrics, compliance evidence, or legal
            advice.
          </p>
        </section>

        <section className="panel" aria-label="Fixture warning summary">
          <div className="panel-heading">
            <h3>Warnings</h3>
            <StatusBadge tone={summary.warningCount > 0 ? "warning" : "ok"}>
              {summary.warningCount}
            </StatusBadge>
          </div>
          {warningExamples.length > 0 ? (
            <ul className="warning-list">
              {warningExamples.map((warning, index) => (
                <li key={`${index}-${warning}`}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No warning examples are present in fixtures.</p>
          )}
        </section>

        <section className="panel" aria-label="Fixture state handling">
          <div className="panel-heading">
            <h3>Fixture state handling</h3>
            <StatusBadge tone="neutral">Read-only</StatusBadge>
          </div>
          <dl className="state-list">
            <div>
              <dt>Loaded fixture</dt>
              <dd>Overview renders from synthetic health, model, and audit data.</dd>
            </div>
            <div>
              <dt>Empty audit fixture</dt>
              <dd>The route and warning panels have explicit empty states.</dd>
            </div>
            <div>
              <dt>Unreachable daemon</dt>
              <dd>Not triggered here because fixture mode is the UI default.</dd>
            </div>
            <div>
              <dt>Malformed data</dt>
              <dd>Covered by API contract guards and client tests, not live calls.</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}

type HealthMetadataPanelProps = {
  dataMode: AethraDataMode;
  liveHealthState: LiveHealthState;
  onLoadLiveHealth: () => void;
};

function HealthMetadataPanel({
  dataMode,
  liveHealthState,
  onLoadLiveHealth,
}: HealthMetadataPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const health =
    isLiveMode && liveHealthState.status === "loaded"
      ? liveHealthState.health
      : healthFixture;
  const sourceLabel =
    isLiveMode && liveHealthState.status === "loaded"
      ? "Live local metadata"
      : isLiveMode
        ? "Fixture fallback"
        : "Fixture metadata";

  return (
    <section className="panel" aria-label="Health metadata source">
      <div className="panel-heading">
        <div>
          <h3>Health metadata</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /health from the configured local daemon."
              : "Fixture mode uses bundled synthetic health metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveHealthState.status === "error"
              ? "warning"
              : liveHealthState.status === "loaded" && isLiveMode
                ? "ok"
                : "neutral"
          }
        >
          {getHealthStateLabel(dataMode, liveHealthState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveHealthState.status === "not-loaded" ? (
        <p className="explanation">
          Live local health is not loaded yet. Aethra is showing fixture health
          values until you manually refresh.
        </p>
      ) : null}

      {isLiveMode && liveHealthState.status === "loading" ? (
        <p className="explanation">
          Loading read-only health metadata from the configured local daemon.
        </p>
      ) : null}

      {isLiveMode && liveHealthState.status === "error" ? (
        <p className="explanation">
          {liveHealthState.label}: {liveHealthState.message} Fixture health
          values remain clearly labeled below.
        </p>
      ) : null}

      <dl className="definition-grid health-grid">
        <div>
          <dt>Source</dt>
          <dd>{sourceLabel}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{health.service}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{health.version}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{health.status}</dd>
        </div>
        <div>
          <dt>Started at</dt>
          <dd>{formatTimestamp(health.started_at)}</dd>
        </div>
        <div>
          <dt>Local only</dt>
          <dd>{String(health.local_only)}</dd>
        </div>
        <div>
          <dt>Model count</dt>
          <dd>{health.model_count}</dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {liveHealthState.status === "loaded" && isLiveMode
              ? formatTimestamp(liveHealthState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      {isLiveMode ? (
        <div className="button-row health-action-row">
          <button
            type="button"
            className="secondary-button"
            disabled={liveHealthState.status === "loading"}
            onClick={onLoadLiveHealth}
          >
            {liveHealthState.status === "loading"
              ? "Loading health"
              : "Refresh live health"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function getHealthStateLabel(
  dataMode: AethraDataMode,
  liveHealthState: LiveHealthState,
): string {
  if (dataMode === "fixture") {
    return "Fixture health";
  }

  switch (liveHealthState.status) {
    case "not-loaded":
      return "Live health not loaded";
    case "loading":
      return "Loading live health";
    case "loaded":
      return "Live health loaded";
    case "error":
      return liveHealthState.label;
  }
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}
