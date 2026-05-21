import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import type {
  AethraDataMode,
  LiveAuditEventsState,
  LiveHealthState,
  LiveLocalDiagnostics,
  LiveModelStatusState,
  LiveModelsState,
  LiveSustainabilityMetricsState,
  LiveVersionStatusState,
} from "../dataSource";
import { buildLiveLocalDiagnostics } from "../dataSource";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  versionStatusFixture,
} from "../fixtures/aethraFixture";
import {
  buildOverviewSummary,
  getWarningExamples,
} from "./overviewSummary";
import {
  getAllLocalCommandsText,
  localCommands,
  type LocalCommand,
} from "./localCommands";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";

const summary = buildOverviewSummary(
  healthFixture,
  modelFixtures,
  auditEventFixtures,
);
const warningExamples = getWarningExamples(auditEventFixtures);

type OverviewProps = {
  dataMode: AethraDataMode;
  baseUrl: string;
  baseUrlError?: string;
  liveHealthState: LiveHealthState;
  liveModelsState: LiveModelsState;
  liveModelStatusState: LiveModelStatusState;
  liveVersionStatusState: LiveVersionStatusState;
  liveAuditEventsState: LiveAuditEventsState;
  liveSustainabilityMetricsState: LiveSustainabilityMetricsState;
  onLoadLiveHealth: () => void;
  onLoadLiveVersionStatus: () => void;
};

export function Overview({
  dataMode,
  baseUrl,
  baseUrlError,
  liveHealthState,
  liveModelsState,
  liveModelStatusState,
  liveVersionStatusState,
  liveAuditEventsState,
  liveSustainabilityMetricsState,
  onLoadLiveHealth,
  onLoadLiveVersionStatus,
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
  const diagnostics = buildLiveLocalDiagnostics({
    dataMode,
    baseUrl,
    baseUrlError,
    endpointStates: [
      liveHealthState,
      liveVersionStatusState,
      liveModelsState,
      liveModelStatusState,
      liveAuditEventsState,
      liveSustainabilityMetricsState,
    ],
  });

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

      <LiveLocalDiagnosticsPanel diagnostics={diagnostics} />

      <LocalCommandsPanel />

      <HealthMetadataPanel
        dataMode={dataMode}
        liveHealthState={liveHealthState}
        onLoadLiveHealth={onLoadLiveHealth}
      />

      <VersionStatusPanel
        dataMode={dataMode}
        liveVersionStatusState={liveVersionStatusState}
        onLoadLiveVersionStatus={onLoadLiveVersionStatus}
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
          <EmptyState {...localPreviewEmptyStates.recentRouteSummaryEmpty} />
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
            <EmptyState {...localPreviewEmptyStates.warningsEmpty} />
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

type CopyStatus =
  | {
      id: string;
      message: string;
      tone: "ok" | "warning";
    }
  | undefined;

function LocalCommandsPanel() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>();

  async function copyCommand(id: string, command: string) {
    if (!globalThis.navigator?.clipboard?.writeText) {
      setCopyStatus({
        id,
        message: "Clipboard unavailable; select the command text.",
        tone: "warning",
      });
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(command);
      setCopyStatus({ id, message: "Copied", tone: "ok" });
    } catch {
      setCopyStatus({
        id,
        message: "Copy failed; select the command text.",
        tone: "warning",
      });
    }
  }

  return (
    <section className="panel" aria-label="Copy local commands">
      <div className="panel-heading">
        <div>
          <h3>Local Commands</h3>
          <p className="muted">
            Local preview helpers. These commands run in your terminal.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => copyCommand("all", getAllLocalCommandsText())}
        >
          Copy all commands
        </button>
      </div>

      {copyStatus?.id === "all" ? (
        <p className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
          {copyStatus.message}
        </p>
      ) : null}

      <div className="command-list">
        {localCommands.map((item) => (
          <LocalCommandRow
            key={item.id}
            item={item}
            copyStatus={copyStatus}
            onCopy={copyCommand}
          />
        ))}
      </div>

      <p className="muted local-commands-note">
        Aethra only copies text to your clipboard. It does not execute commands,
        call telemetry, contact cloud services, call GitHub, check for updates,
        poll endpoints, or persist command state.
      </p>
    </section>
  );
}

type LocalCommandRowProps = {
  item: LocalCommand;
  copyStatus: CopyStatus;
  onCopy: (id: string, command: string) => void;
};

function LocalCommandRow({
  item,
  copyStatus,
  onCopy,
}: LocalCommandRowProps) {
  return (
    <div className="command-row">
      <div className="command-copy">
        <strong>{item.label}</strong>
        <code>{item.command}</code>
        <span>{item.detail}</span>
        {copyStatus?.id === item.id ? (
          <span className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
            {copyStatus.message}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="secondary-button"
        onClick={() => onCopy(item.id, item.command)}
      >
        Copy command
      </button>
    </div>
  );
}

type LiveLocalDiagnosticsPanelProps = {
  diagnostics: LiveLocalDiagnostics;
};

function LiveLocalDiagnosticsPanel({
  diagnostics,
}: LiveLocalDiagnosticsPanelProps) {
  return (
    <section className="panel" aria-label="Live-local connection diagnostics">
      <div className="panel-heading">
        <div>
          <h3>Live-local connection diagnostics</h3>
          <p className="muted">
            Manual, local loopback connection state for local preview loading.
          </p>
        </div>
        <StatusBadge tone={diagnosticsTone(diagnostics.state)}>
          {diagnostics.label}
        </StatusBadge>
      </div>

      <dl className="definition-grid diagnostics-grid">
        <div>
          <dt>Connection state</dt>
          <dd>{diagnostics.state}</dd>
        </div>
        <div>
          <dt>Last refresh</dt>
          <dd>{diagnostics.lastRefresh}</dd>
        </div>
        <div>
          <dt>Next action</dt>
          <dd>{diagnostics.nextAction}</dd>
        </div>
      </dl>

      <p className="explanation">{diagnostics.detail}</p>
      <p className="muted diagnostics-note">
        Fixture mode remains available without a daemon. Diagnostics are
        local-only, manual, non-persistent, and not telemetry.
      </p>
    </section>
  );
}

function diagnosticsTone(
  state: LiveLocalDiagnostics["state"],
): "ok" | "neutral" | "warning" {
  switch (state) {
    case "live-local-connected":
    case "last-refresh-succeeded":
      return "ok";
    case "daemon-unreachable":
    case "endpoint-unavailable":
    case "invalid-response-shape":
    case "last-refresh-failed":
      return "warning";
    case "fixture-mode-active":
    case "live-local-ready":
      return "neutral";
  }
}

type VersionStatusPanelProps = {
  dataMode: AethraDataMode;
  liveVersionStatusState: LiveVersionStatusState;
  onLoadLiveVersionStatus: () => void;
};

function VersionStatusPanel({
  dataMode,
  liveVersionStatusState,
  onLoadLiveVersionStatus,
}: VersionStatusPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const versionStatus =
    isLiveMode && liveVersionStatusState.status === "loaded"
      ? liveVersionStatusState.versionStatus
      : versionStatusFixture;
  const sourceLabel =
    isLiveMode && liveVersionStatusState.status === "loaded"
      ? "Live local metadata"
      : isLiveMode
        ? "Fixture fallback"
        : "Fixture metadata";

  return (
    <section className="panel" aria-label="Daemon version status">
      <div className="panel-heading">
        <div>
          <h3>Daemon version status</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/status/version from the configured local daemon."
              : "Fixture mode uses bundled local preview release status metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveVersionStatusState.status === "error"
              ? "warning"
              : liveVersionStatusState.status === "loaded" && isLiveMode
                ? "ok"
                : "neutral"
          }
        >
          {getVersionStatusStateLabel(dataMode, liveVersionStatusState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveVersionStatusState.status === "not-loaded" ? (
        <EmptyState {...localPreviewEmptyStates.liveVersionNotLoaded} />
      ) : null}

      {isLiveMode && liveVersionStatusState.status === "loading" ? (
        <p className="explanation">
          Loading support/debugging metadata from the configured local daemon.
        </p>
      ) : null}

      {isLiveMode && liveVersionStatusState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveVersionStatusState.label,
            liveVersionStatusState.message,
            "Fixture daemon version status values remain clearly labeled below.",
          )}
        />
      ) : null}

      <dl className="definition-grid version-status-grid">
        <div>
          <dt>Source</dt>
          <dd>{sourceLabel}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{versionStatus.service}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{versionStatus.version}</dd>
        </div>
        <div>
          <dt>Release channel</dt>
          <dd>{versionStatus.release_channel}</dd>
        </div>
        <div>
          <dt>Local only</dt>
          <dd>{String(versionStatus.local_only)}</dd>
        </div>
        <div>
          <dt>Build profile</dt>
          <dd>{versionStatus.build_profile}</dd>
        </div>
        <div>
          <dt>Git commit</dt>
          <dd>{versionStatus.git_commit ?? "not embedded"}</dd>
        </div>
        <div>
          <dt>Started at</dt>
          <dd>{formatTimestamp(versionStatus.started_at)}</dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {liveVersionStatusState.status === "loaded" && isLiveMode
              ? formatTimestamp(liveVersionStatusState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      <div className="detail-section">
        <h4>Warnings</h4>
        {versionStatus.warnings.length > 0 ? (
          <ul className="status-hint-list">
            {versionStatus.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">No warning metadata reported.</p>
        )}
      </div>

      <p className="muted version-status-note">
        Daemon version status is local preview support/debugging metadata. Aethra
        does not use it for telemetry, update checks, external release lookups,
        or GitHub API calls.
      </p>

      {isLiveMode ? (
        <div className="button-row version-status-action-row">
          <button
            type="button"
            className="secondary-button"
            disabled={liveVersionStatusState.status === "loading"}
            onClick={onLoadLiveVersionStatus}
          >
            {liveVersionStatusState.status === "loading"
              ? "Loading version status"
              : "Refresh daemon version status"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function getVersionStatusStateLabel(
  dataMode: AethraDataMode,
  liveVersionStatusState: LiveVersionStatusState,
): string {
  if (dataMode === "fixture") {
    return "Fixture release status";
  }

  switch (liveVersionStatusState.status) {
    case "not-loaded":
      return "Version status not loaded";
    case "loading":
      return "Loading version status";
    case "loaded":
      return "Version status loaded";
    case "error":
      return liveVersionStatusState.label;
  }
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
        <EmptyState {...localPreviewEmptyStates.liveHealthNotLoaded} />
      ) : null}

      {isLiveMode && liveHealthState.status === "loading" ? (
        <p className="explanation">
          Loading read-only health metadata from the configured local daemon.
        </p>
      ) : null}

      {isLiveMode && liveHealthState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveHealthState.label,
            liveHealthState.message,
            "Fixture health values remain clearly labeled below.",
          )}
        />
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
