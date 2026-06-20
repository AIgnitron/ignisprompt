import { useState } from "react";
import type {
  EvidencePackageIndexResponse,
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
  LiveEndpointState,
  LiveEvidencePackageIndexState,
  LiveHealthState,
  LiveLocalDiagnostics,
  LiveLocalSurfaceId,
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
  evidencePackageIndexFixture,
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

const suggestedReviewFlow = [
  {
    title: "Start daemon",
    detail: "Run the local daemon on the default loopback port.",
  },
  {
    title: "Refresh local daemon data",
    detail: "Use the primary manual refresh action in Aethra.",
  },
  {
    title: "Review daemon health/version",
    detail: "Confirm local connectivity and release metadata.",
  },
  {
    title: "Review models/readiness",
    detail: "Check manifests, inventory, readiness hints, and runner hints.",
  },
  {
    title: "Review routing policy",
    detail: "Inspect read-only route categories and decision inputs.",
  },
  {
    title: "Review evidence packages",
    detail: "Inspect safe package index metadata and boundaries.",
  },
  {
    title: "Review audit/operations",
    detail: "Check aggregate operations and visible local audit records.",
  },
  {
    title: "Review sustainability metrics",
    detail: "Treat estimates as proxy indicators, not measured reporting.",
  },
] as const;

const dashboardProves = [
  "local daemon connectivity",
  "local metadata visibility",
  "read-only governance surface",
  "fixture/demo data clearly separated from live-local state",
] as const;

const dashboardDoesNotDo = [
  "no route execution",
  "no prompt submission",
  "no model execution",
  "no mutation",
  "no upload/download/delete",
  "no compliance/certification claims",
] as const;

type OverviewDetailRoute =
  | "routing-explorer"
  | "audit-events"
  | "model-runner-status"
  | "evidence-bundle-viewer"
  | "sustainability-preview";

type OverviewProps = {
  dataMode: AethraDataMode;
  baseUrl: string;
  baseUrlError?: string;
  liveHealthState: LiveHealthState;
  liveModelsState: LiveModelsState;
  liveModelInventoryState: LiveModelInventoryState;
  liveModelReadinessState: LiveModelReadinessState;
  liveRoutingPolicyState: LiveRoutingPolicySummaryState;
  liveEvidencePackagesState: LiveEvidencePackageIndexState;
  liveModelStatusState: LiveModelStatusState;
  liveCapabilitiesState: LiveCapabilitiesState;
  liveVersionStatusState: LiveVersionStatusState;
  liveAuditEventsState: LiveAuditEventsState;
  liveSustainabilityMetricsState: LiveSustainabilityMetricsState;
  liveOperationsSummaryState: LiveOperationsSummaryState;
  onLoadLiveHealth: () => void;
  onLoadLiveVersionStatus: () => void;
  onNavigateToRoute: (route: OverviewDetailRoute) => void;
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
  liveEvidencePackagesState,
  liveModelStatusState,
  liveCapabilitiesState,
  liveVersionStatusState,
  liveAuditEventsState,
  liveSustainabilityMetricsState,
  liveOperationsSummaryState,
  onLoadLiveHealth,
  onLoadLiveVersionStatus,
  onNavigateToRoute,
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
  const liveEvidencePackages =
    dataMode === "live-local" && liveEvidencePackagesState.status === "loaded"
      ? liveEvidencePackagesState.index
      : undefined;
  const healthForStatus = liveHealth ?? healthFixture;
  const modelInventoryForSummary = liveModelInventory ?? modelInventoryFixture;
  const modelReadinessForSummary =
    liveModelReadiness ?? modelReadinessFixture;
  const operationsSummaryForDisplay =
    liveOperationsSummary ?? operationsSummaryFixture;
  const routingPolicyForDisplay =
    liveRoutingPolicy ?? routingPolicySummaryFixture;
  const evidencePackagesForDisplay =
    liveEvidencePackages ?? evidencePackageIndexFixture;
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
      ? "Live local audit events not loaded"
      : "Offline preview fixture audit events";
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
  const evidencePackagesSourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveEvidencePackagesState),
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
      liveEvidencePackagesState,
      liveModelStatusState,
      liveCapabilitiesState,
      liveAuditEventsState,
      liveSustainabilityMetricsState,
      liveOperationsSummaryState,
    ],
  });
  const liveSurfaces = buildOverviewLiveSurfaces({
    health: liveHealthState,
    versionStatus: liveVersionStatusState,
    models: liveModelsState,
    modelInventory: liveModelInventoryState,
    modelReadiness: liveModelReadinessState,
    routingPolicy: liveRoutingPolicyState,
    evidencePackages: liveEvidencePackagesState,
    modelStatus: liveModelStatusState,
    capabilities: liveCapabilitiesState,
    auditEvents: liveAuditEventsState,
    sustainabilityMetrics: liveSustainabilityMetricsState,
    operationsSummary: liveOperationsSummaryState,
  });
  const loadedSurfaces = liveSurfaces.filter((surface) => surface.status === "live local");
  const failedSurfaces = liveSurfaces.filter(
    (surface) => surface.status === "failed" || surface.status === "unavailable",
  );
  const notLoadedSurfaces = liveSurfaces.filter(
    (surface) => surface.status === "not loaded" || surface.status === "loading",
  );
  const liveSurfaceGroups = buildLiveSurfaceGroups(liveSurfaces);
  const overallStatus =
    loadedSurfaces.length > 0
      ? failedSurfaces.length > 0
        ? "partial load"
        : "live local"
      : failedSurfaces.length > 0
        ? "daemon unavailable"
        : "not loaded";
  const overallStatusTone =
    overallStatus === "live local"
      ? "ok"
      : overallStatus === "partial load" || overallStatus === "daemon unavailable"
        ? "warning"
        : "neutral";

  return (
    <section id="overview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>IgnisPrompt overview</h2>
          <p className="page-subtitle">
            Live Local Dashboard for IgnisPrompt daemon metadata, endpoint
            state, local commands, and read-only operational boundaries.
          </p>
        </div>
        <div className="status-strip" aria-label="Overview health status">
          <StatusBadge tone={liveHealth ? "ok" : "neutral"}>
            {liveHealth ? liveHealth.status.toUpperCase() : "NOT LOADED"}
          </StatusBadge>
          <StatusBadge tone="neutral">{baseUrl}</StatusBadge>
          <StatusBadge tone={liveHealth ? "ok" : "neutral"}>
            {healthSourceLabel}
          </StatusBadge>
        </div>
      </header>

      <PageHelp
        collapsible
        items={[
          "Use Refresh local daemon data to load read-only health, version, model, routing, evidence, audit, operations, and sustainability metadata from loopback endpoints.",
          "If the daemon is unavailable, Aethra shows not loaded, unavailable, or failed states instead of substituting fixture data into product status.",
          "Offline preview fixtures remain explicit and separate from live-local product state.",
        ]}
      />

      <section className="dashboard-front-door" aria-label="Live local dashboard summary">
        <div className="dashboard-status-card">
          <p className="eyebrow">Live Local Dashboard</p>
          <h3>What is happening now?</h3>
          <div className="dashboard-status-line">
            <StatusBadge tone={overallStatusTone}>{overallStatus}</StatusBadge>
            <span>
              {loadedSurfaces.length} live local / {failedSurfaces.length} failed
              or unavailable / {notLoadedSurfaces.length} not loaded
            </span>
          </div>
          <p className="muted">
            Primary state is local daemon metadata loaded by manual refresh.
            Aethra does not auto-load, poll, persist daemon responses, or blend
            fixture data into failed live surfaces.
          </p>
        </div>
        <div className="dashboard-proof-grid">
          <FactListPanel title="What this dashboard proves" items={dashboardProves} />
          <FactListPanel title="What this dashboard does not do" items={dashboardDoesNotDo} />
        </div>
      </section>

      <section className="overview-section-group" aria-label="Live local dashboard">
        <div className="section-heading">
          <p className="eyebrow">Status surfaces</p>
          <h3>Read-only local daemon metadata</h3>
          <p className="muted">
            Aethra is a read-only local-first dashboard. Start{" "}
            <code>ignispromptd</code>, keep the daemon at{" "}
            <code>http://127.0.0.1:8765</code> by default, then use the primary
            refresh action above. Aethra itself usually runs at{" "}
            <code>http://127.0.0.1:5173</code> during development.
          </p>
        </div>
        {baseUrlError ? (
          <div className="panel">
            <div className="panel-heading">
              <h3>Daemon URL blocked</h3>
              <StatusBadge tone="warning">failed</StatusBadge>
            </div>
            <p className="explanation">{baseUrlError}</p>
          </div>
        ) : null}
        <div className="surface-group-stack" aria-label="Grouped live local surface cards">
          {liveSurfaceGroups.map((group) => (
            <section className="surface-group" key={group.title}>
              <div className="surface-group-heading">
                <h4>{group.title}</h4>
                <span>{group.description}</span>
              </div>
              <div className="metric-grid live-surface-grid">
                {group.surfaces.map((surface) => (
                  <LiveSurfaceCardView
                    key={surface.id}
                    surface={surface}
                    onNavigateToRoute={onNavigateToRoute}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="overview-section-group" aria-label="Suggested review flow">
        <div className="section-heading">
          <p className="eyebrow">Suggested Review Flow</p>
          <h3>Demo-ready path through live-local state</h3>
          <p className="muted">
            This sequence keeps reviewers focused on local connectivity,
            metadata visibility, and read-only boundaries.
          </p>
        </div>
        <div className="panel" aria-label="Suggested review flow steps">
          <ol className="guided-demo-list review-flow-list">
            {suggestedReviewFlow.map((step, index) => (
              <li key={step.title}>
                <strong>
                  {index + 1}. {step.title}
                </strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="overview-section-group" aria-label="What is live">
        <div className="section-heading">
          <p className="eyebrow">What is live?</p>
          <h3>Current endpoint state</h3>
          <p className="muted">
            Successful surfaces stay visible independently. Failed surfaces keep
            safe errors instead of silently switching to fixtures.
          </p>
        </div>
        <div className="three-column">
          <SurfaceListPanel title="Loaded from local daemon" surfaces={loadedSurfaces} />
          <SurfaceListPanel title="Failed or unavailable" surfaces={failedSurfaces} />
          <SurfaceListPanel title="Not loaded yet" surfaces={notLoadedSurfaces} />
        </div>
      </section>

      <section className="overview-section-group" aria-label="Endpoint matrix">
        <div className="section-heading">
          <p className="eyebrow">Endpoint Matrix</p>
          <h3>Read-only local daemon surfaces</h3>
          <p className="muted">
            Each row maps a dashboard surface to a local daemon endpoint and a
            boundary. No route, model, package, or mutation action is exposed.
          </p>
        </div>
        <div className="panel table-panel endpoint-matrix-panel">
          <table className="data-table endpoint-matrix">
            <thead>
              <tr>
                <th>Surface</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Last loaded</th>
                <th>Detail page</th>
                <th>Boundary</th>
              </tr>
            </thead>
            <tbody>
              {liveSurfaces.map((surface) => (
                <tr key={surface.id}>
                  <td>{surface.label}</td>
                  <td><code>{surface.endpoint}</code></td>
                  <td>
                    <StatusBadge tone={statusTone(surface.status)}>
                      {surface.status}
                    </StatusBadge>
                  </td>
                  <td>{surface.lastLoaded}</td>
                  <td>{surface.detailLabel}</td>
                  <td>{surface.boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Start local daemon">
        <div className="section-heading">
          <p className="eyebrow">Start Local Daemon</p>
          <h3>Local commands</h3>
          <p className="muted">
            Aethra does not execute commands. Run these in your terminal when
            you want live-local data.
          </p>
        </div>
        <div className="overview-operations-grid">
          <CommandListPanel
            title="Start daemon"
            commands={[
              "cargo run -p ignispromptd",
              "cd apps/aethra && npm run dev",
            ]}
          />
          <CommandListPanel
            title="Next local commands"
            commands={[
              "cargo run -p ignispromptctl -- doctor --json",
              "cargo run -p ignispromptctl -- model-inventory --json",
              "cargo run -p ignispromptctl -- model-readiness --json",
              "cargo run -p ignispromptctl -- routing-policy --json",
              "cargo run -p ignispromptctl -- evidence-packages --json",
              "make demo-check",
              "make preview-release-check",
            ]}
          />
        </div>
      </section>

      {dataMode === "fixture" ? (
      <section className="overview-section-group" aria-label="Offline preview fixture operations">
        <div className="section-heading">
          <p className="eyebrow">Operations</p>
          <h3>Offline preview fixture summaries</h3>
          <p className="muted">
            These cards use bundled fixture data for local demo review. They
            are not live product state.
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
          <EvidencePackageIndexPanel
            index={evidencePackagesForDisplay}
            sourceLabel={evidencePackagesSourceLabel}
          />
          <LocalCommandsPanel />
        </div>
      </section>
      ) : null}

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

      {dataMode === "fixture" ? (
      <section className="overview-section-group" aria-label="Offline preview fixture dashboard">
        <div className="section-heading">
          <p className="eyebrow">Offline Preview Fixture</p>
          <h3>Fixture-only demo data</h3>
          <p className="muted">
            This section is not live product state. It remains available for
            tests and local demo review without a daemon.
          </p>
        </div>
      <div className="metric-grid" aria-label="Aethra offline preview fixture metrics">
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
          label="Evidence packages"
          value={evidencePackagesForDisplay.aggregate_summary.total_packages}
          detail={`Read-only package index from ${evidencePackagesSourceLabel}`}
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
              <dd>Live daemon failures are shown in the live dashboard, not replaced by this fixture section.</dd>
            </div>
            <div>
              <dt>Malformed data</dt>
              <dd>Covered by API contract guards and client tests, not live calls.</dd>
            </div>
          </dl>
        </section>
      </div>
      </section>
      ) : null}
    </section>
  );
}

type LiveSurfaceStatus =
  | "live local"
  | "not loaded"
  | "loading"
  | "unavailable"
  | "failed";

type LiveSurfaceCard = {
  id: LiveLocalSurfaceId;
  label: string;
  endpoint: string;
  status: LiveSurfaceStatus;
  value: string | number;
  summary: string;
  lastLoaded: string;
  boundary: string;
  detailRoute?: OverviewDetailRoute;
  detailLabel: string;
};

type LiveSurfaceGroup = {
  title: string;
  description: string;
  surfaces: LiveSurfaceCard[];
};

function buildLiveSurfaceGroups(
  surfaces: LiveSurfaceCard[],
): LiveSurfaceGroup[] {
  const byId = new Map(surfaces.map((surface) => [surface.id, surface]));
  const pick = (ids: LiveLocalSurfaceId[]) =>
    ids
      .map((id) => byId.get(id))
      .filter((surface): surface is LiveSurfaceCard => surface !== undefined);

  return [
    {
      title: "Core daemon status",
      description: "Connectivity, release metadata, and configured manifests.",
      surfaces: pick(["health", "version-status", "models"]),
    },
    {
      title: "Models and readiness",
      description: "Local file inventory, readiness hints, and runner status.",
      surfaces: pick([
        "model-inventory",
        "model-readiness",
        "model-status",
        "capabilities",
      ]),
    },
    {
      title: "Routing and operations",
      description: "Read-only routing policy and aggregate daemon activity.",
      surfaces: pick(["routing-policy", "operations-summary"]),
    },
    {
      title: "Evidence and audit",
      description: "Safe evidence package index metadata and audit records.",
      surfaces: pick(["evidence-packages", "audit-events"]),
    },
    {
      title: "Sustainability",
      description: "Methodology-dependent proxy indicators from local metadata.",
      surfaces: pick(["sustainability-metrics"]),
    },
  ].filter((group) => group.surfaces.length > 0);
}

function LiveSurfaceCardView({
  surface,
  onNavigateToRoute,
}: {
  surface: LiveSurfaceCard;
  onNavigateToRoute: (route: OverviewDetailRoute) => void;
}) {
  return (
    <article className="metric-card live-surface-card">
      <div className="live-surface-card-top">
        <span className="metric-label">{surface.label}</span>
        <StatusBadge tone={statusTone(surface.status)}>{surface.status}</StatusBadge>
      </div>
      <strong className="metric-value">{surface.value}</strong>
      <p>{surface.summary}</p>
      <dl className="compact-metadata-list">
        <div>
          <dt>Last loaded</dt>
          <dd>{surface.lastLoaded}</dd>
        </div>
        <div>
          <dt>Boundary</dt>
          <dd>{surface.boundary}</dd>
        </div>
      </dl>
      {surface.detailRoute ? (
        <button
          type="button"
          className="secondary-button compact-button"
          onClick={() => onNavigateToRoute(surface.detailRoute!)}
        >
          Open {surface.detailLabel}
        </button>
      ) : null}
    </article>
  );
}

function FactListPanel({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section className="panel compact-fact-panel">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function buildOverviewLiveSurfaces(input: {
  health: LiveHealthState;
  versionStatus: LiveVersionStatusState;
  models: LiveModelsState;
  modelInventory: LiveModelInventoryState;
  modelReadiness: LiveModelReadinessState;
  routingPolicy: LiveRoutingPolicySummaryState;
  evidencePackages: LiveEvidencePackageIndexState;
  modelStatus: LiveModelStatusState;
  capabilities: LiveCapabilitiesState;
  auditEvents: LiveAuditEventsState;
  sustainabilityMetrics: LiveSustainabilityMetricsState;
  operationsSummary: LiveOperationsSummaryState;
}): LiveSurfaceCard[] {
  return [
    {
      id: "health",
      label: "Health",
      endpoint: "/health",
      ...surfaceState(input.health),
      value: input.health.status === "loaded" ? input.health.health.status : "not loaded",
      summary:
        input.health.status === "loaded"
          ? `${input.health.health.service} ${input.health.health.version}; ${input.health.health.model_count} models reported.`
          : stateSummary(input.health),
      boundary: "Daemon status only; no route, model, or mutation action.",
      detailLabel: "Overview",
    },
    {
      id: "version-status",
      label: "Version status",
      endpoint: "/v1/status/version",
      ...surfaceState(input.versionStatus),
      value:
        input.versionStatus.status === "loaded"
          ? input.versionStatus.versionStatus.release_channel
          : "not loaded",
      summary:
        input.versionStatus.status === "loaded"
          ? `${input.versionStatus.versionStatus.service} ${input.versionStatus.versionStatus.version}.`
          : stateSummary(input.versionStatus),
      boundary: "Release metadata only; no update check or external lookup.",
      detailLabel: "Overview",
    },
    {
      id: "models",
      label: "Model manifests",
      endpoint: "/v1/models",
      ...surfaceState(input.models),
      value: input.models.status === "loaded" ? input.models.models.length : "not loaded",
      summary:
        input.models.status === "loaded"
          ? "Configured model manifest entries loaded from the daemon."
          : stateSummary(input.models),
      boundary: "Manifest metadata only; no model execution or downloads.",
      detailRoute: "model-runner-status",
      detailLabel: "Model / Runner Status",
    },
    {
      id: "model-inventory",
      label: "Local model inventory",
      endpoint: "/v1/models/inventory",
      ...surfaceState(input.modelInventory),
      value:
        input.modelInventory.status === "loaded"
          ? input.modelInventory.inventory.summary.total_files
          : "not loaded",
      summary:
        input.modelInventory.status === "loaded"
          ? `${formatBytes(input.modelInventory.inventory.summary.total_size_bytes)} observed as safe local file metadata.`
          : stateSummary(input.modelInventory),
      boundary: "Read-only file metadata; no contents, hashing, downloads, or deletes.",
      detailRoute: "model-runner-status",
      detailLabel: "Model / Runner Status",
    },
    {
      id: "model-readiness",
      label: "Local model readiness",
      endpoint: "/v1/models/readiness",
      ...surfaceState(input.modelReadiness),
      value:
        input.modelReadiness.status === "loaded"
          ? input.modelReadiness.readiness.summary.ready_hint_count
          : "not loaded",
      summary:
        input.modelReadiness.status === "loaded"
          ? `${input.modelReadiness.readiness.summary.missing_file_count} missing-file hints.`
          : stateSummary(input.modelReadiness),
      boundary: "Readiness hints only; no inference, quality, or legal claim.",
      detailRoute: "model-runner-status",
      detailLabel: "Model / Runner Status",
    },
    {
      id: "model-status",
      label: "Model/runner status hints",
      endpoint: "/v1/status/models",
      ...surfaceState(input.modelStatus),
      value:
        input.modelStatus.status === "loaded"
          ? input.modelStatus.statusHints.length
          : "not loaded",
      summary:
        input.modelStatus.status === "loaded"
          ? "Runner and local path hints loaded from the daemon."
          : stateSummary(input.modelStatus),
      boundary: "Status hints only; no runner start/stop controls.",
      detailRoute: "model-runner-status",
      detailLabel: "Model / Runner Status",
    },
    {
      id: "capabilities",
      label: "Capabilities/connectors",
      endpoint: "/v1/capabilities",
      ...surfaceState(input.capabilities),
      value:
        input.capabilities.status === "loaded"
          ? input.capabilities.capabilities.capabilities.length
          : "not loaded",
      summary:
        input.capabilities.status === "loaded"
          ? `Cloud enabled: ${String(input.capabilities.capabilities.cloud_enabled)}.`
          : stateSummary(input.capabilities),
      boundary: "Status metadata only; no connector enablement or cloud calls.",
      detailRoute: "model-runner-status",
      detailLabel: "Model / Runner Status",
    },
    {
      id: "operations-summary",
      label: "Operations summary",
      endpoint: "/v1/operations/summary",
      ...surfaceState(input.operationsSummary),
      value:
        input.operationsSummary.status === "loaded"
          ? input.operationsSummary.summary.activity_summary.recent_requests_observed
          : "not loaded",
      summary:
        input.operationsSummary.status === "loaded"
          ? `${countAvailableOperationEndpoints(input.operationsSummary.summary.endpoints)} endpoints available.`
          : stateSummary(input.operationsSummary),
      boundary: "Aggregate metadata only; no raw prompts or request bodies.",
      detailRoute: "audit-events",
      detailLabel: "Audit Events",
    },
    {
      id: "routing-policy",
      label: "Routing policy summary",
      endpoint: "/v1/routing/policy-summary",
      ...surfaceState(input.routingPolicy),
      value:
        input.routingPolicy.status === "loaded"
          ? input.routingPolicy.summary.route_categories.length
          : "not loaded",
      summary:
        input.routingPolicy.status === "loaded"
          ? "Read-only route categories and decision inputs loaded."
          : stateSummary(input.routingPolicy),
      boundary: "Policy metadata only; no route execution or prompt submission.",
      detailRoute: "routing-explorer",
      detailLabel: "Routing Explorer",
    },
    {
      id: "evidence-packages",
      label: "Evidence package index",
      endpoint: "/v1/evidence/packages",
      ...surfaceState(input.evidencePackages),
      value:
        input.evidencePackages.status === "loaded"
          ? input.evidencePackages.index.aggregate_summary.total_packages
          : "not loaded",
      summary:
        input.evidencePackages.status === "loaded"
          ? `${input.evidencePackages.index.aggregate_summary.packages_with_reports} packages include report-like names.`
          : stateSummary(input.evidencePackages),
      boundary: "Metadata only; no generation, validation claim, upload, or delete.",
      detailRoute: "evidence-bundle-viewer",
      detailLabel: "Evidence Bundle Viewer",
    },
    {
      id: "audit-events",
      label: "Audit events",
      endpoint: "/v1/audit/events",
      ...surfaceState(input.auditEvents),
      value:
        input.auditEvents.status === "loaded" ? input.auditEvents.events.length : "not loaded",
      summary:
        input.auditEvents.status === "loaded"
          ? "Local process audit event records loaded."
          : stateSummary(input.auditEvents),
      boundary: "Displayed records only; no raw prompt bodies or external redaction.",
      detailRoute: "audit-events",
      detailLabel: "Audit Events",
    },
    {
      id: "sustainability-metrics",
      label: "Sustainability metrics",
      endpoint: "/v1/metrics/sustainability?period=30d",
      ...surfaceState(input.sustainabilityMetrics),
      value:
        input.sustainabilityMetrics.status === "loaded"
          ? input.sustainabilityMetrics.metrics.requests_total
          : "not loaded",
      summary:
        input.sustainabilityMetrics.status === "loaded"
          ? "Counterfactual proxy estimates loaded from daemon audit metadata."
          : stateSummary(input.sustainabilityMetrics),
      boundary: "Proxy estimates only; not measured energy or compliance evidence.",
      detailRoute: "sustainability-preview",
      detailLabel: "Sustainability Preview",
    },
  ];
}

function surfaceState(state: LiveEndpointState): Pick<LiveSurfaceCard, "status" | "lastLoaded"> {
  if (state.status === "loaded") {
    return {
      status: "live local",
      lastLoaded: formatTimestamp(state.loadedAt),
    };
  }
  if (state.status === "loading") {
    return { status: "loading", lastLoaded: "loading" };
  }
  if (state.status === "error") {
    return {
      status: state.diagnosticKind === "endpoint-unavailable" ? "unavailable" : "failed",
      lastLoaded: state.checkedAt ? formatTimestamp(state.checkedAt) : "not loaded",
    };
  }
  return { status: "not loaded", lastLoaded: "not loaded" };
}

function stateSummary(state: LiveEndpointState): string {
  if (state.status === "error") {
    return state.message;
  }
  if (state.status === "loading") {
    return "Loading from the configured local daemon.";
  }
  return "Not loaded yet. Use Refresh local daemon data.";
}

function statusTone(status: LiveSurfaceStatus): "ok" | "neutral" | "warning" {
  if (status === "live local") {
    return "ok";
  }
  if (status === "failed" || status === "unavailable") {
    return "warning";
  }
  return "neutral";
}

function SurfaceListPanel({
  title,
  surfaces,
}: {
  title: string;
  surfaces: LiveSurfaceCard[];
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>{title}</h3>
        <StatusBadge tone={surfaces.length > 0 ? "neutral" : "ok"}>
          {surfaces.length}
        </StatusBadge>
      </div>
      {surfaces.length > 0 ? (
        <ul className="state-list compact-state-list">
          {surfaces.map((surface) => (
            <li key={surface.id}>
              <strong>{surface.label}</strong>
              <span>{surface.summary}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No surfaces in this state"
          message="Endpoint state will appear here after manual refresh."
        />
      )}
    </section>
  );
}

function CommandListPanel({
  title,
  commands,
}: {
  title: string;
  commands: string[];
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>{title}</h3>
        <StatusBadge tone="neutral">copy manually</StatusBadge>
      </div>
      <ul className="command-list">
        {commands.map((command) => (
          <li key={command}>
            <code>{command}</code>
          </li>
        ))}
      </ul>
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
          <dd>{availableEndpoints} / 12</dd>
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

type EvidencePackageIndexPanelProps = {
  index: EvidencePackageIndexResponse;
  sourceLabel: string;
};

function EvidencePackageIndexPanel({
  index,
  sourceLabel,
}: EvidencePackageIndexPanelProps) {
  const packageTypes = Object.keys(index.aggregate_summary.packages_by_type);
  const latestPackage =
    index.aggregate_summary.latest_observed_package ?? "none observed";

  return (
    <section className="panel" aria-label="Local evidence package index">
      <div className="panel-heading">
        <div>
          <h3>Local evidence packages</h3>
          <p className="muted">
            Read-only index metadata for local evidence folders and archives.
          </p>
        </div>
        <StatusBadge tone={sourceLabel === "Local daemon data" ? "ok" : "neutral"}>
          {sourceLabel}
        </StatusBadge>
      </div>

      <dl className="definition-grid diagnostics-grid">
        <div>
          <dt>Root</dt>
          <dd>{index.root_summary.evidence_root_label}</dd>
        </div>
        <div>
          <dt>Root exists</dt>
          <dd>{String(index.root_summary.root_exists)}</dd>
        </div>
        <div>
          <dt>Packages</dt>
          <dd>{index.aggregate_summary.total_packages}</dd>
        </div>
        <div>
          <dt>Types</dt>
          <dd>{packageTypes.length}</dd>
        </div>
        <div>
          <dt>With reports</dt>
          <dd>{index.aggregate_summary.packages_with_reports}</dd>
        </div>
        <div>
          <dt>Latest package</dt>
          <dd>{latestPackage}</dd>
        </div>
      </dl>

      <p className="muted diagnostics-note">
        Evidence package metadata is read-only. Aethra does not show file
        contents, generate packages, validate packages as certified, upload
        files, delete files, or claim attestation, compliance, legal accuracy,
        or deployment readiness.
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
        Offline preview fixture mode remains available without a daemon, but it
        is separate from live product state. Diagnostics are local-only,
        manual, non-persistent, and not telemetry.
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
  const isLiveLoaded = isLiveMode && liveVersionStatusState.status === "loaded";
  const versionStatus =
    isLiveLoaded
      ? liveVersionStatusState.versionStatus
      : dataMode === "fixture"
        ? versionStatusFixture
        : undefined;
  const sourceLabel =
    isLiveLoaded
      ? "Live local metadata"
      : isLiveMode
        ? "Live local not loaded"
        : "Offline preview fixture metadata";

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
            "Daemon version status remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {versionStatus ? (
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
      ) : null}

      {versionStatus ? (
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
      ) : null}

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
    return "Offline preview fixture release status";
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
  const isLiveLoaded = isLiveMode && liveHealthState.status === "loaded";
  const health =
    isLiveLoaded
      ? liveHealthState.health
      : dataMode === "fixture"
        ? healthFixture
        : undefined;
  const sourceLabel =
    isLiveLoaded
      ? "Live local metadata"
      : isLiveMode
        ? "Live local not loaded"
        : "Offline preview fixture metadata";

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
            "Health metadata remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {health ? (
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
      ) : null}

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
    return "Offline preview fixture health";
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
