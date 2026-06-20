import { useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { EvidenceBundleViewer } from "./routes/EvidenceBundleViewer";
import { LocalCommandCenter } from "./routes/LocalCommandCenter";
import { LocalDemoStudio } from "./routes/LocalDemoStudio";
import { LocalOperatorConsole } from "./routes/LocalOperatorConsole";
import { LocalPolicyWorkbench } from "./routes/LocalPolicyWorkbench";
import { LocalReadiness } from "./routes/LocalReadiness";
import { StatusBadge } from "./components/StatusBadge";
import { createIgnisPromptClient } from "./api/client";
import type {
  AethraDataMode,
  LiveAuditEventsState,
  LiveCapabilitiesState,
  LiveHealthState,
  LiveLocalRefreshState,
  LiveLocalSurfaceId,
  LiveModelInventoryState,
  LiveModelReadinessState,
  LiveModelStatusState,
  LiveModelsState,
  LiveOperationsSummaryState,
  LiveRoutingPolicySummaryState,
  LiveSustainabilityMetricsState,
  LiveVersionStatusState,
} from "./dataSource";
import {
  DEFAULT_AETHRA_BASE_URL,
  describeAuditEventsLoadError,
  describeCapabilitiesLoadError,
  describeHealthLoadError,
  describeModelInventoryLoadError,
  describeModelStatusLoadError,
  describeModelsLoadError,
  describeSustainabilityMetricsLoadError,
  describeVersionStatusLoadError,
  loadLiveLocalDaemonSnapshot,
  localUrlBlockedDescription,
  resolveAethraBaseUrlInput,
} from "./dataSource";
import { ModelRunnerStatus } from "./routes/ModelRunnerStatus";
import { Overview } from "./routes/Overview";
import { RoutingExplorer } from "./routes/RoutingExplorer";
import { SustainabilityPreview } from "./routes/SustainabilityPreview";

type AethraRoute =
  | "overview"
  | "local-readiness"
  | "local-demo-studio"
  | "local-operator-console"
  | "local-policy-workbench"
  | "local-command-center"
  | "routing-explorer"
  | "audit-events"
  | "model-runner-status"
  | "evidence-bundle-viewer"
  | "sustainability-preview";

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AethraRoute>("overview");
  const [isDataSourceExpanded, setIsDataSourceExpanded] = useState(false);
  const [dataMode, setDataMode] = useState<AethraDataMode>("fixture");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [liveHealthState, setLiveHealthState] = useState<LiveHealthState>({
    status: "not-loaded",
  });
  const [liveModelsState, setLiveModelsState] = useState<LiveModelsState>({
    status: "not-loaded",
  });
  const [liveModelInventoryState, setLiveModelInventoryState] =
    useState<LiveModelInventoryState>({
      status: "not-loaded",
    });
  const [liveModelReadinessState, setLiveModelReadinessState] =
    useState<LiveModelReadinessState>({
      status: "not-loaded",
    });
  const [liveRoutingPolicyState, setLiveRoutingPolicyState] =
    useState<LiveRoutingPolicySummaryState>({
      status: "not-loaded",
    });
  const [liveModelStatusState, setLiveModelStatusState] =
    useState<LiveModelStatusState>({
      status: "not-loaded",
    });
  const [liveCapabilitiesState, setLiveCapabilitiesState] =
    useState<LiveCapabilitiesState>({
      status: "not-loaded",
    });
  const [liveVersionStatusState, setLiveVersionStatusState] =
    useState<LiveVersionStatusState>({
      status: "not-loaded",
    });
  const [liveAuditEventsState, setLiveAuditEventsState] =
    useState<LiveAuditEventsState>({
      status: "not-loaded",
    });
  const [liveSustainabilityMetricsState, setLiveSustainabilityMetricsState] =
    useState<LiveSustainabilityMetricsState>({
      status: "not-loaded",
    });
  const [liveOperationsSummaryState, setLiveOperationsSummaryState] =
    useState<LiveOperationsSummaryState>({
      status: "not-loaded",
    });
  const [liveLocalRefreshState, setLiveLocalRefreshState] =
    useState<LiveLocalRefreshState>({
      status: "idle",
    });
  const baseUrlValidation = resolveAethraBaseUrlInput(baseUrlInput);
  const localBaseUrl = baseUrlValidation.ok
    ? baseUrlValidation.baseUrl
    : DEFAULT_AETHRA_BASE_URL;
  const baseUrlError = baseUrlValidation.ok
    ? undefined
    : baseUrlValidation.error;

  async function loadLiveHealth() {
    if (baseUrlError) {
      setLiveHealthState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveHealthState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const health = await client.health();
      setLiveHealthState({
        status: "loaded",
        health,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveHealthState({
        status: "error",
        ...describeHealthLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveModels() {
    if (baseUrlError) {
      setLiveModelsState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveModelsState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const registry = await client.models();
      setLiveModelsState({
        status: "loaded",
        models: registry.models,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveModelsState({
        status: "error",
        ...describeModelsLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveModelInventory() {
    if (baseUrlError) {
      setLiveModelInventoryState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveModelInventoryState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const inventory = await client.modelInventory();
      setLiveModelInventoryState({
        status: "loaded",
        inventory,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveModelInventoryState({
        status: "error",
        ...describeModelInventoryLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveModelStatus() {
    if (baseUrlError) {
      setLiveModelStatusState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveModelStatusState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const modelStatus = await client.modelStatus();
      setLiveModelStatusState({
        status: "loaded",
        statusHints: modelStatus.statusHints,
        schemaVersion: modelStatus.schemaVersion,
        source: modelStatus.source,
        generatedAt: modelStatus.generatedAt,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveModelStatusState({
        status: "error",
        ...describeModelStatusLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveCapabilities() {
    if (baseUrlError) {
      setLiveCapabilitiesState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveCapabilitiesState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const capabilities = await client.capabilities();
      setLiveCapabilitiesState({
        status: "loaded",
        capabilities,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveCapabilitiesState({
        status: "error",
        ...describeCapabilitiesLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveVersionStatus() {
    if (baseUrlError) {
      setLiveVersionStatusState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveVersionStatusState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const versionStatus = await client.versionStatus();
      setLiveVersionStatusState({
        status: "loaded",
        versionStatus,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveVersionStatusState({
        status: "error",
        ...describeVersionStatusLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveAuditEvents() {
    if (baseUrlError) {
      setLiveAuditEventsState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveAuditEventsState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const events = await client.auditEvents();
      setLiveAuditEventsState({
        status: "loaded",
        events,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveAuditEventsState({
        status: "error",
        ...describeAuditEventsLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function loadLiveSustainabilityMetrics(period: string) {
    if (baseUrlError) {
      setLiveSustainabilityMetricsState({
        status: "error",
        period,
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    setLiveSustainabilityMetricsState({ status: "loading", period });
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const metrics = await client.sustainabilityMetrics(period);
      setLiveSustainabilityMetricsState({
        status: "loaded",
        metrics,
        loadedAt: new Date().toISOString(),
      });
    } catch (error) {
      setLiveSustainabilityMetricsState({
        status: "error",
        period,
        ...describeSustainabilityMetricsLoadError(error),
        checkedAt: new Date().toISOString(),
      });
    }
  }

  async function refreshLiveLocalDaemonData() {
    setDataMode("live-local");
    const requestedAt = new Date().toISOString();

    if (baseUrlError) {
      const blocked = {
        status: "error" as const,
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: requestedAt,
      };
      setLiveHealthState(blocked);
      setLiveVersionStatusState(blocked);
      setLiveModelsState(blocked);
      setLiveModelInventoryState(blocked);
      setLiveModelReadinessState(blocked);
      setLiveRoutingPolicyState(blocked);
      setLiveModelStatusState(blocked);
      setLiveCapabilitiesState(blocked);
      setLiveAuditEventsState(blocked);
      setLiveSustainabilityMetricsState({
        ...blocked,
        period: "30d",
      });
      setLiveOperationsSummaryState(blocked);
      setLiveLocalRefreshState({
        status: "complete",
        requestedAt,
        completedAt: requestedAt,
        results: [
          "health",
          "version-status",
          "models",
          "model-inventory",
          "model-readiness",
          "routing-policy",
          "model-status",
          "capabilities",
          "audit-events",
          "sustainability-metrics",
          "operations-summary",
        ].map((surface) => ({
          surface: surface as LiveLocalSurfaceId,
          status: "failed",
          label: "Local URL blocked",
          message: baseUrlError,
          diagnosticKind: "invalid-local-url",
        })),
      });
      return;
    }

    setLiveLocalRefreshState({ status: "loading", requestedAt });
    setLiveHealthState({ status: "loading" });
    setLiveVersionStatusState({ status: "loading" });
    setLiveModelsState({ status: "loading" });
    setLiveModelInventoryState({ status: "loading" });
    setLiveModelReadinessState({ status: "loading" });
    setLiveRoutingPolicyState({ status: "loading" });
    setLiveModelStatusState({ status: "loading" });
    setLiveCapabilitiesState({ status: "loading" });
    setLiveAuditEventsState({ status: "loading" });
    setLiveSustainabilityMetricsState({ status: "loading", period: "30d" });
    setLiveOperationsSummaryState({ status: "loading" });

    const loadedAt = new Date().toISOString();
    const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
    const snapshot = await loadLiveLocalDaemonSnapshot({
      client,
      loadedAt,
      sustainabilityPeriod: "30d",
    });

    setLiveHealthState(snapshot.health);
    setLiveVersionStatusState(snapshot.versionStatus);
    setLiveModelsState(snapshot.models);
    setLiveModelInventoryState(snapshot.modelInventory);
    setLiveModelReadinessState(snapshot.modelReadiness);
    setLiveRoutingPolicyState(snapshot.routingPolicy);
    setLiveModelStatusState(snapshot.modelStatus);
    setLiveCapabilitiesState(snapshot.capabilities);
    setLiveAuditEventsState(snapshot.auditEvents);
    setLiveSustainabilityMetricsState(snapshot.sustainabilityMetrics);
    setLiveOperationsSummaryState(snapshot.operationsSummary);
    setLiveLocalRefreshState({
      status: "complete",
      requestedAt,
      completedAt: loadedAt,
      results: snapshot.results,
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Aethra sections">
        <div>
          <p className="eyebrow">Aethra</p>
          <h1>Local AI Routing Observatory</h1>
          <p className="sidebar-note">
            The local-preview front door for routing, audit, local status
            hints, package review, and conservative sustainability signals.
          </p>
        </div>
        <nav className="nav-list">
          <span className="nav-group-label">Front door</span>
          <button
            type="button"
            aria-current={activeRoute === "overview" ? "page" : undefined}
            onClick={() => setActiveRoute("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "local-demo-studio" ? "page" : undefined
            }
            onClick={() => setActiveRoute("local-demo-studio")}
          >
            Local demo studio
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "routing-explorer" ? "page" : undefined
            }
            onClick={() => setActiveRoute("routing-explorer")}
          >
            Route explorer
          </button>
          <button
            type="button"
            aria-current={activeRoute === "audit-events" ? "page" : undefined}
            onClick={() => setActiveRoute("audit-events")}
          >
            Audit events
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "model-runner-status" ? "page" : undefined
            }
            onClick={() => setActiveRoute("model-runner-status")}
          >
            Model and runner status
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "evidence-bundle-viewer" ? "page" : undefined
            }
            onClick={() => setActiveRoute("evidence-bundle-viewer")}
          >
            Evidence bundle
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "sustainability-preview" ? "page" : undefined
            }
            onClick={() => setActiveRoute("sustainability-preview")}
          >
            Sustainability preview
          </button>
          <span className="nav-group-label">Supporting workflows</span>
          <button
            type="button"
            aria-current={
              activeRoute === "local-readiness" ? "page" : undefined
            }
            onClick={() => setActiveRoute("local-readiness")}
          >
            Local readiness
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "local-operator-console" ? "page" : undefined
            }
            onClick={() => setActiveRoute("local-operator-console")}
          >
            Local operator console
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "local-policy-workbench" ? "page" : undefined
            }
            onClick={() => setActiveRoute("local-policy-workbench")}
          >
            Local policy workbench
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "local-command-center" ? "page" : undefined
            }
            onClick={() => setActiveRoute("local-command-center")}
          >
            Local command center
          </button>
        </nav>
      </aside>

      <main className="workspace">
        {activeRoute === "overview" ? <LocalPreviewBanner /> : null}

        {activeRoute === "overview" ? (
          <section className="mode-strip" aria-label="Aethra data mode boundaries">
            <div className="mode-copy">
              <p className="eyebrow">Data mode</p>
              <h2>
                {dataMode === "fixture"
                  ? "offline preview ready"
                  : "live local selected"}
              </h2>
              <p>
                {dataMode === "fixture"
                  ? "Use Refresh local daemon data when ignispromptd is running. Aethra observes IgnisPrompt state without changing routing, runners, models, or audit policy."
                  : "Live local metadata loading is manual and read-only for health, daemon version status, models, local model inventory, model readiness, routing policy summary, capabilities, model and runner status hints, audit events, operations summary, and sustainability metrics."}
              </p>
            </div>
            <div className="mode-badges" aria-label="Aethra mode guarantees">
              <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
                {dataMode === "fixture" ? "Offline preview" : "Live local mode"}
              </StatusBadge>
              <StatusBadge tone="neutral">read-only</StatusBadge>
              <StatusBadge tone="neutral">fixture fallback</StatusBadge>
              <StatusBadge tone="neutral">manual live-local refresh</StatusBadge>
              <StatusBadge tone="neutral">no telemetry</StatusBadge>
              <StatusBadge tone="neutral">no cloud calls by default</StatusBadge>
              <StatusBadge tone="warning">no model or runner controls</StatusBadge>
              <StatusBadge tone="warning">
                proxy-only sustainability indicators
              </StatusBadge>
            </div>
          </section>
        ) : null}

        <DataSourceControl
          activeRoute={activeRoute}
          dataMode={dataMode}
          baseUrlInput={baseUrlInput}
          baseUrl={localBaseUrl}
          baseUrlError={baseUrlError}
          liveHealthState={liveHealthState}
          liveLocalRefreshState={liveLocalRefreshState}
          isExpanded={isDataSourceExpanded}
          onDataModeChange={setDataMode}
          onBaseUrlInputChange={setBaseUrlInput}
          onLoadLiveHealth={loadLiveHealth}
          onRefreshLiveLocalData={refreshLiveLocalDaemonData}
          onExpandedChange={setIsDataSourceExpanded}
        />

        {activeRoute === "overview" ? (
          <Overview
            dataMode={dataMode}
            baseUrl={localBaseUrl}
            baseUrlError={baseUrlError}
            liveHealthState={liveHealthState}
            liveModelsState={liveModelsState}
            liveModelInventoryState={liveModelInventoryState}
            liveModelReadinessState={liveModelReadinessState}
            liveRoutingPolicyState={liveRoutingPolicyState}
            liveModelStatusState={liveModelStatusState}
            liveCapabilitiesState={liveCapabilitiesState}
            liveVersionStatusState={liveVersionStatusState}
            liveAuditEventsState={liveAuditEventsState}
            liveSustainabilityMetricsState={liveSustainabilityMetricsState}
            liveOperationsSummaryState={liveOperationsSummaryState}
            onLoadLiveHealth={loadLiveHealth}
            onLoadLiveVersionStatus={loadLiveVersionStatus}
          />
        ) : null}
        {activeRoute === "local-readiness" ? (
          <LocalReadiness
            dataMode={dataMode}
            liveHealthState={liveHealthState}
            liveModelsState={liveModelsState}
            liveModelStatusState={liveModelStatusState}
            liveVersionStatusState={liveVersionStatusState}
          />
        ) : null}
        {activeRoute === "local-command-center" ? <LocalCommandCenter /> : null}
        {activeRoute === "local-demo-studio" ? <LocalDemoStudio /> : null}
        {activeRoute === "local-operator-console" ? (
          <LocalOperatorConsole />
        ) : null}
        {activeRoute === "local-policy-workbench" ? (
          <LocalPolicyWorkbench />
        ) : null}
        {activeRoute === "routing-explorer" ? (
          <RoutingExplorer
            dataMode={dataMode}
            localBaseUrl={localBaseUrl}
            localBaseUrlError={baseUrlError}
            liveRoutingPolicyState={liveRoutingPolicyState}
          />
        ) : null}
        {activeRoute === "audit-events" ? (
          <AuditEvents
            dataMode={dataMode}
            liveAuditEventsState={liveAuditEventsState}
            liveOperationsSummaryState={liveOperationsSummaryState}
            onLoadLiveAuditEvents={loadLiveAuditEvents}
          />
        ) : null}
        {activeRoute === "evidence-bundle-viewer" ? (
          <EvidenceBundleViewer />
        ) : null}
        {activeRoute === "model-runner-status" ? (
          <ModelRunnerStatus
            dataMode={dataMode}
            liveModelsState={liveModelsState}
            liveModelInventoryState={liveModelInventoryState}
            liveModelReadinessState={liveModelReadinessState}
            liveModelStatusState={liveModelStatusState}
            liveCapabilitiesState={liveCapabilitiesState}
            onLoadLiveModels={loadLiveModels}
            onLoadLiveModelInventory={loadLiveModelInventory}
            onLoadLiveModelStatus={loadLiveModelStatus}
            onLoadLiveCapabilities={loadLiveCapabilities}
          />
        ) : null}
        {activeRoute === "sustainability-preview" ? (
          <SustainabilityPreview
            dataMode={dataMode}
            liveSustainabilityMetricsState={liveSustainabilityMetricsState}
            onLoadLiveSustainabilityMetrics={loadLiveSustainabilityMetrics}
          />
        ) : null}
      </main>
    </div>
  );
}

function LocalPreviewBanner() {
  return (
    <section className="preview-banner" aria-label="Local preview boundary">
      <div>
        <p className="eyebrow">Local Preview</p>
        <h2>Local daemon observability with offline preview fallback</h2>
        <p>
          Refresh local daemon data when <code>ignispromptd</code> is running.
          Offline preview fixtures remain available. Aethra is read-only, sends
          no telemetry, makes no cloud calls by default, and exists for
          local-preview observability only.
        </p>
      </div>
      <div className="preview-banner-badges" aria-label="Local preview guardrails">
        <StatusBadge tone="neutral">Local daemon data</StatusBadge>
        <StatusBadge tone="neutral">Fixture fallback</StatusBadge>
        <StatusBadge tone="neutral">Manual refresh</StatusBadge>
        <StatusBadge tone="neutral">Read-only dashboard</StatusBadge>
        <StatusBadge tone="neutral">No telemetry</StatusBadge>
        <StatusBadge tone="neutral">No cloud calls by default</StatusBadge>
        <StatusBadge tone="warning">No model or runner controls</StatusBadge>
      </div>
      <div className="preview-banner-boundaries">
        <p>Not legal advice.</p>
        <p>Not compliance claims, not security assurance, and not ESG reporting evidence.</p>
        <p>Not signed attestation or tamper-evident audit evidence.</p>
      </div>
    </section>
  );
}

type DataSourceControlProps = {
  activeRoute: AethraRoute;
  dataMode: AethraDataMode;
  baseUrlInput: string;
  baseUrl: string;
  baseUrlError?: string;
  liveHealthState: LiveHealthState;
  liveLocalRefreshState: LiveLocalRefreshState;
  isExpanded: boolean;
  onDataModeChange: (dataMode: AethraDataMode) => void;
  onBaseUrlInputChange: (baseUrl: string) => void;
  onLoadLiveHealth: () => void;
  onRefreshLiveLocalData: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
};

function DataSourceControl({
  activeRoute,
  dataMode,
  baseUrlInput,
  baseUrl,
  baseUrlError,
  liveHealthState,
  liveLocalRefreshState,
  isExpanded,
  onDataModeChange,
  onBaseUrlInputChange,
  onLoadLiveHealth,
  onRefreshLiveLocalData,
  onExpandedChange,
}: DataSourceControlProps) {
  const canLoadHealth =
    dataMode === "live-local" &&
    !baseUrlError &&
    liveHealthState.status !== "loading";
  const canRefreshLocalData =
    !baseUrlError && liveLocalRefreshState.status !== "loading";
  const isOverviewRoute = activeRoute === "overview";
  const refreshSummary =
    liveLocalRefreshState.status === "complete"
      ? summarizeLiveLocalRefresh(liveLocalRefreshState)
      : undefined;

  return (
    <section className="data-source-control" aria-label="Aethra data source">
      <div className="data-source-compact-row">
        <div className="data-source-intro">
          <p className="eyebrow">Local preview</p>
          <h3>Prefer local daemon data with fixture fallback</h3>
          <p className="muted">
            Refresh local daemon metadata when <code>ignispromptd</code> is
            running; offline preview fixtures remain available when it is not.
          </p>
        </div>
        <div className="data-source-compact-badges" aria-label="Aethra compact boundaries">
          <StatusBadge tone="neutral">Local preview</StatusBadge>
          <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
            {dataMode === "fixture" ? "Offline preview" : "Live-local selected"}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="neutral">No telemetry</StatusBadge>
          <StatusBadge tone="neutral">No cloud calls by default</StatusBadge>
        </div>
      </div>

      <details
        className="data-source-details"
        open={isExpanded}
        onToggle={(event) =>
          onExpandedChange((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary>
          <span>{isOverviewRoute ? "Local preview and live-local setup" : "Live-local setup"}</span>
          <span className="page-help-summary-note">
            {isExpanded ? "Expanded" : "Collapsed"}
          </span>
        </summary>

        <div className="data-source-details-grid">
          <div className="data-source-explainer">
            <p className="muted">
              Aethra can load real local-preview metadata from a running
              IgnisPrompt daemon and falls back to bundled offline preview data
              for unavailable sections. Aethra does not poll, persist live-local
              state, execute commands, or change routing.
            </p>
            <ul className="data-source-boundary-list">
              <li>Local daemon data when manually refreshed</li>
              <li>Fixture fallback for offline preview</li>
              <li>No polling</li>
              <li>No persistence of live-local state</li>
              <li>No command execution</li>
              <li>No routing changes</li>
              <li>No model or runner controls</li>
            </ul>
          </div>

          <div className="mode-toggle" aria-label="Select Aethra data mode">
            <button
              type="button"
              aria-pressed={dataMode === "fixture"}
              onClick={() => onDataModeChange("fixture")}
            >
              Fixture
            </button>
            <button
              type="button"
              aria-pressed={dataMode === "live-local"}
              onClick={() => onDataModeChange("live-local")}
            >
              Live local
            </button>
          </div>

          <label className="base-url-field">
            <span>IgnisPrompt daemon base URL</span>
            <input
              value={baseUrlInput}
              onChange={(event) => onBaseUrlInputChange(event.target.value)}
              placeholder="http://127.0.0.1:8765"
              aria-invalid={baseUrlError ? "true" : undefined}
            />
            <p className="muted">
              Use the running <code>ignispromptd</code> loopback server, usually
              <code> http://127.0.0.1:8765</code>. This field is not the Aethra
              dev server URL such as <code>http://127.0.0.1:5173</code>.
            </p>
          </label>

          <div className="data-source-status">
            <StatusBadge tone={baseUrlError ? "warning" : "neutral"}>
              {baseUrlError ? "Local URL blocked" : baseUrl}
            </StatusBadge>
            <p className="muted">
              {baseUrlError ??
                "Refresh uses the daemon base URL above for read-only local metadata and never polls or persists state."}
            </p>
          </div>

          <div className="manual-refresh-card">
            <span>Primary local daemon refresh</span>
            <button
              type="button"
              className="primary-button"
              disabled={!canRefreshLocalData}
              onClick={onRefreshLiveLocalData}
            >
              {liveLocalRefreshState.status === "loading"
                ? "Refreshing local daemon data"
                : "Refresh local daemon data"}
            </button>
            <p className="muted refresh-card-note">
              Loads health, version, models, local model inventory,
              model readiness, routing policy summary, capabilities, status
              hints, audit events, operations summary, and 30d sustainability
              metrics from read-only GET endpoints. Route execution and model
              execution are not included.
            </p>
          </div>

          {refreshSummary ? (
            <div
              className="refresh-receipt"
              aria-label="Local daemon refresh receipt"
            >
              <StatusBadge tone={refreshSummary.failed > 0 ? "warning" : "ok"}>
                {refreshSummary.loaded} loaded / {refreshSummary.failed} failed
              </StatusBadge>
              <p className="muted">
                Last local daemon refresh completed at{" "}
                {formatTimestamp(refreshSummary.completedAt)}. Failed
                sections keep fixture fallback visible.
              </p>
              {refreshSummary.failedLabels.length > 0 ? (
                <p className="muted">
                  Fixture fallback still shown for:{" "}
                  {refreshSummary.failedLabels.join(", ")}.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="manual-refresh-card">
            <span>Health-only check</span>
            <button
              type="button"
              className="secondary-button health-load-button"
              disabled={!canLoadHealth}
              onClick={onLoadLiveHealth}
            >
              {liveHealthState.status === "loading"
                ? "Loading health"
                : "Load live health"}
            </button>
          </div>
        </div>
      </details>
    </section>
  );
}

function summarizeLiveLocalRefresh(refreshState: Extract<
  LiveLocalRefreshState,
  { status: "complete" }
>) {
  const loaded = refreshState.results.filter(
    (result) => result.status === "loaded",
  );
  const failed = refreshState.results.filter(
    (result) => result.status === "failed",
  );

  return {
    loaded: loaded.length,
    failed: failed.length,
    failedLabels: failed.map((result) => result.label),
    completedAt: refreshState.completedAt,
  };
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
