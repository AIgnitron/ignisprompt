import { useState } from "react";
import type {
  OperationsEndpointSummary,
  OperationsSummaryResponse,
  RoutingPolicySummaryResponse,
} from "../api/contracts";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import type {
  AethraDataMode,
  LiveAuditEventsState,
  LiveCapabilitiesState,
  LiveHealthState,
  LiveLocalDiagnostics,
  LiveModelInventoryState,
  LiveModelReadinessState,
  LiveModelStatusState,
  LiveModelsState,
  LiveOperationsSummaryState,
  LiveRoutingPolicySummaryState,
  LiveSustainabilityMetricsState,
  LiveVersionStatusState,
} from "../dataSource";
import {
  buildLiveLocalDiagnostics,
  formatLiveLocalDisplaySource,
  getLiveLocalDisplaySource,
} from "../dataSource";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  modelInventoryFixture,
  modelReadinessFixture,
  operationsSummaryFixture,
  routingPolicySummaryFixture,
  versionStatusFixture,
} from "../fixtures/aethraFixture";
import {
  buildOverviewSummary,
  getWarningExamples,
} from "./overviewSummary";
import {
  getAllLocalCommandsText,
  overviewLocalCommands,
  type LocalCommand,
} from "./localCommands";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";

const guidedDemoSteps = [
  {
    title: "Overview",
    detail:
      "Start with the local-preview guardrails, then use live-local mode only for manual refreshes.",
  },
  {
    title: "Local Demo Studio",
    detail:
      "Open the product story view before drilling into detailed routing or evidence panels.",
  },
  {
    title: "Routing Explorer",
    detail:
      "Compare candidate routes by tier and confirm cloud-disabled-by-default behavior.",
  },
  {
    title: "Audit Events",
    detail:
      "Inspect local audit history, warnings, and request IDs without leaving the browser.",
  },
  {
    title: "Model and Runner Status",
    detail:
      "Review capability-style local status hints as read-only prerequisites, not controls.",
  },
  {
    title: "Evidence Bundle",
    detail:
      "Review what is generated locally, what stays ignored by git, and what local validation does and does not mean.",
  },
  {
    title: "Sustainability Preview",
    detail:
      "Finish with methodology-dependent proxy metrics and local export helpers.",
  },
  {
    title: "Boundaries and supporting workflows",
    detail:
      "Use Local Readiness, Local Operator Console, Local Policy Workbench, and Local Command Center as supporting pages after the main story.",
  },
] as const;

type OverviewProps = {
  dataMode: AethraDataMode;
  baseUrl: string;
  baseUrlError?: string;
  liveHealthState: LiveHealthState;
  liveModelsState: LiveModelsState;
  liveModelInventoryState: LiveModelInventoryState;
  liveModelReadinessState: LiveModelReadinessState;
  liveRoutingPolicyState: LiveRoutingPolicySummaryState;
  liveModelStatusState: LiveModelStatusState;
  liveCapabilitiesState: LiveCapabilitiesState;
  liveVersionStatusState: LiveVersionStatusState;
  liveAuditEventsState: LiveAuditEventsState;
  liveSustainabilityMetricsState: LiveSustainabilityMetricsState;
  liveOperationsSummaryState: LiveOperationsSummaryState;
  onLoadLiveHealth: () => void;
  onLoadLiveVersionStatus: () => void;
};

export function Overview({
  dataMode,
  baseUrl,
  baseUrlError,
  liveHealthState,
  liveModelsState,
  liveModelInventoryState,
  liveModelReadinessState,
  liveRoutingPolicyState,
  liveModelStatusState,
  liveCapabilitiesState,
  liveVersionStatusState,
  liveAuditEventsState,
  liveSustainabilityMetricsState,
  liveOperationsSummaryState,
  onLoadLiveHealth,
  onLoadLiveVersionStatus,
}: OverviewProps) {
  const liveHealth =
    dataMode === "live-local" && liveHealthState.status === "loaded"
      ? liveHealthState.health
      : undefined;
  const liveModels =
    dataMode === "live-local" && liveModelsState.status === "loaded"
      ? liveModelsState.models
      : undefined;
  const liveAuditEvents =
    dataMode === "live-local" && liveAuditEventsState.status === "loaded"
      ? liveAuditEventsState.events
      : undefined;
  const liveModelInventory =
    dataMode === "live-local" && liveModelInventoryState.status === "loaded"
      ? liveModelInventoryState.inventory
      : undefined;
  const liveModelReadiness =
    dataMode === "live-local" && liveModelReadinessState.status === "loaded"
      ? liveModelReadinessState.readiness
      : undefined;
  const liveOperationsSummary =
    dataMode === "live-local" && liveOperationsSummaryState.status === "loaded"
      ? liveOperationsSummaryState.summary
      : undefined;
  const liveRoutingPolicy =
    dataMode === "live-local" && liveRoutingPolicyState.status === "loaded"
      ? liveRoutingPolicyState.summary
      : undefined;
  const healthForStatus = liveHealth ?? healthFixture;
  const modelInventoryForSummary = liveModelInventory ?? modelInventoryFixture;
  const modelReadinessForSummary =
    liveModelReadiness ?? modelReadinessFixture;
  const operationsSummaryForDisplay =
    liveOperationsSummary ?? operationsSummaryFixture;
  const routingPolicyForDisplay =
    liveRoutingPolicy ?? routingPolicySummaryFixture;
  const modelsForSummary = liveModels ?? modelFixtures;
  const auditEventsForSummary = liveAuditEvents ?? auditEventFixtures;
  const summary = buildOverviewSummary(
    healthForStatus,
    modelsForSummary,
    auditEventsForSummary,
  );
  const latestEvent = summary.latestEvent;
  const warningExamples = getWarningExamples(auditEventsForSummary);
  const healthSourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveHealthState),
  );
  const auditSourceLabel = liveAuditEvents
    ? "Local daemon audit events"
    : dataMode === "live-local"
      ? "Fixture fallback audit events"
      : "Offline preview audit events";
  const inventorySourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveModelInventoryState),
  );
  const readinessSourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveModelReadinessState),
  );
  const operationsSourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveOperationsSummaryState),
  );
  const routingPolicySourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveRoutingPolicyState),
  );
  const endpointsAvailableCount = countAvailableOperationEndpoints(
    operationsSummaryForDisplay.endpoints,
  );
  const diagnostics = buildLiveLocalDiagnostics({
    dataMode,
    baseUrl,
    baseUrlError,
    endpointStates: [
      liveHealthState,
      liveVersionStatusState,
      liveModelsState,
      liveModelInventoryState,
      liveModelReadinessState,
      liveRoutingPolicyState,
      liveModelStatusState,
      liveCapabilitiesState,
      liveAuditEventsState,
      liveSustainabilityMetricsState,
      liveOperationsSummaryState,
    ],
  });

  return (
    <section id="overview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>IgnisPrompt overview</h2>
          <p className="page-subtitle">
            Local preview status, diagnostics, commands, local daemon metadata,
            and fixture fallback routing context.
          </p>
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

      <PageHelp
        defaultOpen
        collapsible
        items={[
          "Review local preview status, local daemon metadata, fixture fallback data, diagnostics, and copyable local commands.",
          "Use Refresh local daemon data to load read-only health, version, model, local model inventory, model readiness, routing policy, capability, audit, and sustainability metadata from loopback endpoints.",
          "Read displayed route, warning, and local-only summaries before moving to detailed pages.",
        ]}
      />

      <section className="overview-section-group" aria-label="Guided demo path">
        <div className="section-heading">
          <p className="eyebrow">Guided Demo Path</p>
          <h3>Recommended safe walkthrough</h3>
          <p className="muted">
            Fixture-backed by default, live-local loading is manual, and the
            dashboard stays read-only.
          </p>
        </div>
        <div className="panel" aria-label="Recommended demo steps">
          <ol className="guided-demo-list">
            {guidedDemoSteps.map((step, index) => (
              <li key={step.title}>
                <strong>
                  {index + 1}. {step.title}
                </strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
          <p className="muted">
            This path keeps the front-door story focused on overview, routing,
            audit, status hints, package review, sustainability, and explicit
            non-claims before the supporting workflow pages.
          </p>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Local preview operations">
        <div className="section-heading">
          <p className="eyebrow">Operations</p>
          <h3>Status, diagnostics, and local commands</h3>
          <p className="muted">
            Live-local actions are manual and read-only; fixture mode remains
            available while you debug daemon setup.
          </p>
        </div>
        <div className="overview-operations-grid">
          <LiveLocalDiagnosticsPanel diagnostics={diagnostics} />
          <OperationsSummaryPanel
            summary={operationsSummaryForDisplay}
            sourceLabel={operationsSourceLabel}
          />
          <RoutingPolicySummaryPanel
            summary={routingPolicyForDisplay}
            sourceLabel={routingPolicySourceLabel}
          />
          <LocalCommandsPanel />
        </div>
      </section>

      <section className="overview-section-group" aria-label="Manual live-local metadata">
        <div className="section-heading">
          <p className="eyebrow">Manual refresh</p>
          <h3>Live-local metadata actions</h3>
          <p className="muted">
            These actions load individual loopback endpoints on demand. Aethra
            does not poll or persist live-local state.
          </p>
        </div>
        <div className="overview-metadata-grid">
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
        </div>
      </section>

      <div className="metric-grid" aria-label="Aethra fixture metrics">
        <MetricCard
          label="Models loaded"
          value={summary.modelCount}
          detail={`${healthForStatus.model_count} reported by ${healthSourceLabel}`}
        />
        <MetricCard
          label="Local model files"
          value={modelInventoryForSummary.summary.total_files}
          detail={`${formatBytes(modelInventoryForSummary.summary.total_size_bytes)} observed via ${inventorySourceLabel}`}
        />
        <MetricCard
          label="Ready model hints"
          value={modelReadinessForSummary.summary.ready_hint_count}
          detail={`Read-only readiness hints from ${readinessSourceLabel}`}
        />
        <MetricCard
          label="Recent audit events"
          value={summary.auditEventCount}
          detail={liveAuditEvents ? "Local daemon records" : "Offline preview records"}
        />
        <MetricCard
          label="Operations endpoints"
          value={endpointsAvailableCount}
          detail={`Available read-only surfaces from ${operationsSourceLabel}`}
        />
        <MetricCard
          label="Policy categories"
          value={routingPolicyForDisplay.route_categories.length}
          detail={`Routing policy metadata from ${routingPolicySourceLabel}`}
        />
        <MetricCard
          label="Recent local activity"
          value={operationsSummaryForDisplay.activity_summary.recent_requests_observed}
          detail={`Aggregate requests observed via ${operationsSourceLabel}`}
        />
        <MetricCard
          label="Data stayed local"
          value={summary.localEventCount}
          detail="Events where data_left_device=false"
        />
        <MetricCard
          label="Warnings"
          value={summary.warningCount}
          detail={`Warnings across ${auditSourceLabel}`}
        />
        <MetricCard
          label="Cache hits"
          value={summary.cacheHitCount}
          detail={liveAuditEvents ? "Local daemon records with cache.hit=true" : "Fixture records with cache.hit=true"}
        />
      </div>

      {latestEvent ? (
        <section className="panel" aria-label="Recent local route decision">
          <div className="panel-heading">
            <div>
              <h3>Recent route summary</h3>
              <p className="muted">Latest displayed audit event by timestamp from {auditSourceLabel}</p>
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
        <section className="panel" aria-label="Recent local route decision">
          <h3>Recent route summary</h3>
          <EmptyState {...localPreviewEmptyStates.recentRouteSummaryEmpty} />
        </section>
      )}

      <div className="two-column">
        <section className="panel" aria-label="Local-only posture summary">
          <div className="panel-heading">
            <h3>Local-only posture</h3>
            <StatusBadge tone="neutral">
              {liveAuditEvents ? "Local daemon records" : "Offline preview facts"}
            </StatusBadge>
          </div>
          <div className="fact-columns">
            <div>
              <h4>{liveAuditEvents ? "Observed from local daemon data" : "Observed from offline preview"}</h4>
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
            These are displayed local-preview records, not signed audit evidence,
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

function formatBytes(sizeBytes: number): string {
  if (sizeBytes >= 1_073_741_824) {
    return `${(sizeBytes / 1_073_741_824).toFixed(2)} GB`;
  }

  if (sizeBytes >= 1_048_576) {
    return `${(sizeBytes / 1_048_576).toFixed(2)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${(sizeBytes / 1024).toFixed(2)} KB`;
  }

  return `${sizeBytes} B`;
}

function countAvailableOperationEndpoints(
  endpoints: OperationsEndpointSummary,
): number {
  return Object.values(endpoints).filter(Boolean).length;
}

type OperationsSummaryPanelProps = {
  summary: OperationsSummaryResponse;
  sourceLabel: string;
};

function OperationsSummaryPanel({
  summary,
  sourceLabel,
}: OperationsSummaryPanelProps) {
  const availableEndpoints = countAvailableOperationEndpoints(summary.endpoints);
  const latestEventAt = summary.audit_summary.latest_event_at
    ? formatTimestamp(summary.audit_summary.latest_event_at)
    : "none";

  return (
    <section className="panel" aria-label="Local operations summary">
      <div className="panel-heading">
        <div>
          <h3>Local operations summary</h3>
          <p className="muted">
            Read-only aggregate daemon activity and endpoint availability.
          </p>
        </div>
        <StatusBadge tone={sourceLabel === "Local daemon data" ? "ok" : "neutral"}>
          {sourceLabel}
        </StatusBadge>
      </div>

      <dl className="definition-grid diagnostics-grid">
        <div>
          <dt>Daemon status</dt>
          <dd>{summary.daemon.status}</dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{summary.daemon.version}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>{summary.daemon.uptime_seconds}s</dd>
        </div>
        <div>
          <dt>Endpoints available</dt>
          <dd>{availableEndpoints} / 11</dd>
        </div>
        <div>
          <dt>Audit events</dt>
          <dd>
            {summary.audit_summary.total_events} total /{" "}
            {summary.audit_summary.recent_event_count} recent
          </dd>
        </div>
        <div>
          <dt>Recent local activity</dt>
          <dd>{summary.activity_summary.recent_requests_observed}</dd>
        </div>
        <div>
          <dt>Latest local audit event</dt>
          <dd>{latestEventAt}</dd>
        </div>
        <div>
          <dt>Recent event types</dt>
          <dd>
            {summary.audit_summary.recent_event_types.length > 0
              ? summary.audit_summary.recent_event_types.join(", ")
              : "none"}
          </dd>
        </div>
      </dl>

      <p className="muted diagnostics-note">
        Operations metadata is aggregate and read-only. Aethra does not show raw
        prompts, raw request bodies, secrets, telemetry, cloud activity, route
        execution, model execution, or connector mutation.
      </p>
    </section>
  );
}

type RoutingPolicySummaryPanelProps = {
  summary: RoutingPolicySummaryResponse;
  sourceLabel: string;
};

function RoutingPolicySummaryPanel({
  summary,
  sourceLabel,
}: RoutingPolicySummaryPanelProps) {
  return (
    <section className="panel" aria-label="Local routing policy summary">
      <div className="panel-heading">
        <div>
          <h3>Local routing policy summary</h3>
          <p className="muted">
            Read-only policy metadata for route categories, decision inputs, and
            local-preview boundaries.
          </p>
        </div>
        <StatusBadge tone={sourceLabel === "Local daemon data" ? "ok" : "neutral"}>
          {sourceLabel}
        </StatusBadge>
      </div>

      <dl className="definition-grid diagnostics-grid">
        <div>
          <dt>Policy mode</dt>
          <dd>{summary.policy_mode.release_channel}</dd>
        </div>
        <div>
          <dt>Route categories</dt>
          <dd>{summary.route_categories.length}</dd>
        </div>
        <div>
          <dt>Legal models</dt>
          <dd>{summary.summary.installed_legal_model_count}</dd>
        </div>
        <div>
          <dt>Cloud enabled</dt>
          <dd>{String(summary.summary.cloud_enabled)}</dd>
        </div>
      </dl>

      <p className="muted diagnostics-note">
        Routing policy metadata is read-only. Aethra does not execute routes,
        submit prompts, execute models, mutate policy, mutate manifests, mutate
        connectors, call cloud services, or send telemetry.
      </p>
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
        {overviewLocalCommands.map((item) => (
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
        <div className="manual-refresh-card version-status-action-row">
          <span>Manual live-local refresh action</span>
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
        <div className="manual-refresh-card health-action-row">
          <span>Manual live-local refresh action</span>
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
