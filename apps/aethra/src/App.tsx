import { useEffect, useRef, useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { EvidenceBundleViewer } from "./routes/EvidenceBundleViewer";
import { Help } from "./routes/Help";
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
  LiveEvidencePackageIndexState,
  LiveHealthState,
  LiveLocalRefreshState,
  LiveLocalSurfaceId,
  LiveModelInventoryState,
  LiveModelReadinessState,
  LiveModelStatusState,
  LiveModelsState,
  LiveOperationsSummaryState,
  LiveRunnerProcessStatusState,
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
  describeRunnerProcessStatusLoadError,
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
  | "sustainability-preview"
  | "help";

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AethraRoute>("overview");
  const [isDataSourceExpanded, setIsDataSourceExpanded] = useState(false);
  const [dataMode, setDataMode] = useState<AethraDataMode>("live-local");
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
  const [liveEvidencePackagesState, setLiveEvidencePackagesState] =
    useState<LiveEvidencePackageIndexState>({
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
  const [liveRunnerProcessStatusState, setLiveRunnerProcessStatusState] =
    useState<LiveRunnerProcessStatusState>({
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
  const [
    runnerLifecycleRefreshRequired,
    setRunnerLifecycleRefreshRequired,
  ] = useState(false);
  const baseUrlValidation = resolveAethraBaseUrlInput(baseUrlInput);
  const localBaseUrl = baseUrlValidation.ok
    ? baseUrlValidation.baseUrl
    : DEFAULT_AETHRA_BASE_URL;
  const baseUrlError = baseUrlValidation.ok
    ? undefined
    : baseUrlValidation.error;
  const currentLocalBaseUrlRef = useRef(localBaseUrl);
  const liveLocalRefreshGenerationRef = useRef(0);
  const runnerProcessStatusGenerationRef = useRef(0);
  currentLocalBaseUrlRef.current = localBaseUrl;

  useEffect(() => {
    liveLocalRefreshGenerationRef.current += 1;
    runnerProcessStatusGenerationRef.current += 1;
    resetLiveLocalEndpointStates();
  }, [localBaseUrl]);

  function resetLiveLocalEndpointStates() {
    setRunnerLifecycleRefreshRequired(false);
    setLiveLocalRefreshState({ status: "idle" });
    setLiveHealthState({ status: "not-loaded" });
    setLiveVersionStatusState({ status: "not-loaded" });
    setLiveModelsState({ status: "not-loaded" });
    setLiveModelInventoryState({ status: "not-loaded" });
    setLiveModelReadinessState({ status: "not-loaded" });
    setLiveRoutingPolicyState({ status: "not-loaded" });
    setLiveEvidencePackagesState({ status: "not-loaded" });
    setLiveModelStatusState({ status: "not-loaded" });
    setLiveCapabilitiesState({ status: "not-loaded" });
    setLiveRunnerProcessStatusState({ status: "not-loaded" });
    setLiveAuditEventsState({ status: "not-loaded" });
    setLiveSustainabilityMetricsState({ status: "not-loaded" });
    setLiveOperationsSummaryState({ status: "not-loaded" });
  }

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

  async function loadLiveRunnerProcessStatus() {
    if (baseUrlError) {
      setLiveRunnerProcessStatusState({
        status: "error",
        ...localUrlBlockedDescription(baseUrlError),
        checkedAt: new Date().toISOString(),
      });
      return;
    }

    const requestGeneration = ++runnerProcessStatusGenerationRef.current;
    const sourceBaseUrl = localBaseUrl;
    setLiveRunnerProcessStatusState({ status: "loading" });
    try {
      const client = createIgnisPromptClient({ baseUrl: sourceBaseUrl });
      const runnerProcessStatus = await client.runnerProcessStatus();
      if (
        runnerProcessStatusGenerationRef.current !== requestGeneration ||
        currentLocalBaseUrlRef.current !== sourceBaseUrl
      ) {
        return;
      }
      setLiveRunnerProcessStatusState({
        status: "loaded",
        runnerProcessStatus,
        loadedAt: new Date().toISOString(),
        sourceBaseUrl,
      });
      setRunnerLifecycleRefreshRequired(false);
    } catch (error) {
      if (
        runnerProcessStatusGenerationRef.current !== requestGeneration ||
        currentLocalBaseUrlRef.current !== sourceBaseUrl
      ) {
        return;
      }
      setLiveRunnerProcessStatusState({
        status: "error",
        ...describeRunnerProcessStatusLoadError(error),
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
      setLiveEvidencePackagesState(blocked);
      setLiveModelStatusState(blocked);
      setLiveCapabilitiesState(blocked);
      setLiveRunnerProcessStatusState(blocked);
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
          "evidence-packages",
          "model-status",
          "capabilities",
          "runner-process-status",
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

    const requestGeneration = ++liveLocalRefreshGenerationRef.current;
    const runnerProcessStatusGeneration = ++runnerProcessStatusGenerationRef.current;
    const sourceBaseUrl = localBaseUrl;
    setLiveLocalRefreshState({ status: "loading", requestedAt });
    setLiveHealthState({ status: "loading" });
    setLiveVersionStatusState({ status: "loading" });
    setLiveModelsState({ status: "loading" });
    setLiveModelInventoryState({ status: "loading" });
    setLiveModelReadinessState({ status: "loading" });
    setLiveRoutingPolicyState({ status: "loading" });
    setLiveEvidencePackagesState({ status: "loading" });
    setLiveModelStatusState({ status: "loading" });
    setLiveCapabilitiesState({ status: "loading" });
    setLiveRunnerProcessStatusState({ status: "loading" });
    setLiveAuditEventsState({ status: "loading" });
    setLiveSustainabilityMetricsState({ status: "loading", period: "30d" });
    setLiveOperationsSummaryState({ status: "loading" });

    const loadedAt = new Date().toISOString();
    const client = createIgnisPromptClient({ baseUrl: sourceBaseUrl });
    const snapshot = await loadLiveLocalDaemonSnapshot({
      client,
      loadedAt,
      sourceBaseUrl,
      sustainabilityPeriod: "30d",
    });

    if (
      liveLocalRefreshGenerationRef.current !== requestGeneration ||
      currentLocalBaseUrlRef.current !== sourceBaseUrl
    ) {
      return;
    }

    setLiveHealthState(snapshot.health);
    setLiveVersionStatusState(snapshot.versionStatus);
    setLiveModelsState(snapshot.models);
    setLiveModelInventoryState(snapshot.modelInventory);
    setLiveModelReadinessState(snapshot.modelReadiness);
    setLiveRoutingPolicyState(snapshot.routingPolicy);
    setLiveEvidencePackagesState(snapshot.evidencePackages);
    setLiveModelStatusState(snapshot.modelStatus);
    setLiveCapabilitiesState(snapshot.capabilities);
    if (
      runnerProcessStatusGenerationRef.current === runnerProcessStatusGeneration
    ) {
      setLiveRunnerProcessStatusState(snapshot.runnerProcessStatus);
      if (snapshot.runnerProcessStatus.status === "loaded") {
        setRunnerLifecycleRefreshRequired(false);
      }
    }
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
          <span className="nav-group-label">Aethra</span>
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
              activeRoute === "routing-explorer" ? "page" : undefined
            }
            onClick={() => setActiveRoute("routing-explorer")}
          >
            Routing
          </button>
          <button
            type="button"
            aria-current={activeRoute === "audit-events" ? "page" : undefined}
            onClick={() => setActiveRoute("audit-events")}
          >
            Audit
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "model-runner-status" ? "page" : undefined
            }
            onClick={() => setActiveRoute("model-runner-status")}
          >
            Models
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "evidence-bundle-viewer" ? "page" : undefined
            }
            onClick={() => setActiveRoute("evidence-bundle-viewer")}
          >
            Evidence
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "sustainability-preview" ? "page" : undefined
            }
            onClick={() => setActiveRoute("sustainability-preview")}
          >
            Sustainability
          </button>
          <button
            type="button"
            aria-current={activeRoute === "help" ? "page" : undefined}
            onClick={() => setActiveRoute("help")}
          >
            Help
          </button>
          <span className="nav-group-label">Supporting workflows</span>
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
        {activeRoute === "overview" ? (
          <section className="mode-strip" aria-label="Aethra data mode">
            <div className="mode-copy">
              <p className="eyebrow">Data source</p>
              <h2>
                {dataMode === "fixture"
                  ? "offline preview fixture selected"
                  : "live local selected"}
              </h2>
              <p>
                {dataMode === "fixture"
                  ? "Offline preview fixtures are labeled separately from live-local product state."
                  : "Refresh local daemon data to load the local dashboard surfaces."}
              </p>
            </div>
            <div className="mode-badges" aria-label="Aethra mode guarantees">
              <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
                {dataMode === "fixture" ? "Offline preview fixture" : "Live local mode"}
              </StatusBadge>
              <StatusBadge tone="neutral">read-only</StatusBadge>
              <StatusBadge tone="neutral">manual refresh only</StatusBadge>
            </div>
          </section>
        ) : null}

        {activeRoute === "overview" ? (
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
        ) : activeRoute === "help" ? null : (
          <CompactDataSourceStatus
            dataMode={dataMode}
            baseUrl={localBaseUrl}
            baseUrlError={baseUrlError}
            liveLocalRefreshState={liveLocalRefreshState}
            onNavigateToOverview={() => setActiveRoute("overview")}
            onNavigateToHelp={() => setActiveRoute("help")}
          />
        )}

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
            liveEvidencePackagesState={liveEvidencePackagesState}
            liveModelStatusState={liveModelStatusState}
            liveCapabilitiesState={liveCapabilitiesState}
            liveVersionStatusState={liveVersionStatusState}
            liveAuditEventsState={liveAuditEventsState}
            liveSustainabilityMetricsState={liveSustainabilityMetricsState}
            liveOperationsSummaryState={liveOperationsSummaryState}
            onLoadLiveHealth={loadLiveHealth}
            onLoadLiveVersionStatus={loadLiveVersionStatus}
            onNavigateToRoute={setActiveRoute}
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
          <EvidenceBundleViewer
            dataMode={dataMode}
            liveEvidencePackagesState={liveEvidencePackagesState}
          />
        ) : null}
        {activeRoute === "model-runner-status" ? (
          <ModelRunnerStatus
            dataMode={dataMode}
            liveModelsState={liveModelsState}
            liveModelInventoryState={liveModelInventoryState}
            liveModelReadinessState={liveModelReadinessState}
            liveModelStatusState={liveModelStatusState}
            liveCapabilitiesState={liveCapabilitiesState}
            liveRunnerProcessStatusState={liveRunnerProcessStatusState}
            localBaseUrl={localBaseUrl}
            runnerLifecycleRefreshRequired={runnerLifecycleRefreshRequired}
            onLoadLiveModels={loadLiveModels}
            onLoadLiveModelInventory={loadLiveModelInventory}
            onLoadLiveModelStatus={loadLiveModelStatus}
            onLoadLiveCapabilities={loadLiveCapabilities}
            onLoadLiveRunnerProcessStatus={loadLiveRunnerProcessStatus}
            onRunnerLifecycleAttempt={() =>
              setRunnerLifecycleRefreshRequired(true)
            }
          />
        ) : null}
        {activeRoute === "sustainability-preview" ? (
          <SustainabilityPreview
            dataMode={dataMode}
            liveSustainabilityMetricsState={liveSustainabilityMetricsState}
            onLoadLiveSustainabilityMetrics={loadLiveSustainabilityMetrics}
          />
        ) : null}
        {activeRoute === "help" ? <Help /> : null}
      </main>
    </div>
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
          <h3>Live local daemon dashboard</h3>
          <p className="muted">
            Refresh local daemon metadata when <code>ignispromptd</code> is
            running. Missing or failed endpoints stay visible as unavailable
            product states.
          </p>
        </div>
        <div className="data-source-compact-badges" aria-label="Aethra compact boundaries">
          <StatusBadge tone="neutral">Local preview</StatusBadge>
          <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
            {dataMode === "fixture" ? "Offline preview fixture" : "Live-local selected"}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
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
              Aethra loads real local-preview metadata from a running
              IgnisPrompt daemon only when you manually refresh. Failed or
              unavailable surfaces remain marked as failed or not loaded; they
              are not silently replaced with fixtures.
            </p>
            <ul className="data-source-boundary-list">
              <li>Local daemon data when manually refreshed</li>
              <li>Offline preview fixtures are opt-in and labeled</li>
              <li>Details are available in Help</li>
            </ul>
          </div>

          <div className="mode-toggle" aria-label="Select Aethra data mode">
            <button
              type="button"
              aria-pressed={dataMode === "fixture"}
              onClick={() => onDataModeChange("fixture")}
            >
              Offline preview fixture
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
                "Refresh uses the daemon base URL above for read-only local metadata."}
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
              Loads the supported read-only local daemon surfaces.
            </p>
          </div>

          {refreshSummary ? (
            <div
              className="refresh-receipt"
              aria-label="Local daemon refresh receipt"
            >
              <StatusBadge tone={refreshSummary.failed > 0 || refreshSummary.unavailable > 0 ? "warning" : "ok"}>
                {refreshSummary.loaded} loaded / {refreshSummary.failed + refreshSummary.unavailable} failed
              </StatusBadge>
              <p className="muted">
                Last local daemon refresh completed at{" "}
                {formatTimestamp(refreshSummary.completedAt)}.
              </p>
              <p className="muted">
                Attempted {refreshSummary.attempted} endpoints:{" "}
                {refreshSummary.loaded} loaded, {refreshSummary.unavailable} unavailable,{" "}
                {refreshSummary.failed} failed, {refreshSummary.notLoaded} not loaded.
              </p>
              {refreshSummary.failedResults.length > 0 ? (
                <p className="muted">
                  Failed surfaces:{" "}
                  {refreshSummary.failedResults
                    .map((result) => `${result.label}: ${result.message}`)
                    .join("; ")}
                </p>
              ) : null}
              <ul className="refresh-result-list" aria-label="Per-endpoint refresh status">
                {refreshSummary.results.map((result) => (
                  <li key={result.surface}>
                    <strong>{result.label}</strong>:{" "}
                    {result.status === "loaded"
                      ? "live local"
                      : result.diagnosticKind === "endpoint-unavailable"
                        ? "unavailable"
                        : "failed"}
                  </li>
                ))}
              </ul>
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

type CompactDataSourceStatusProps = {
  dataMode: AethraDataMode;
  baseUrl: string;
  baseUrlError?: string;
  liveLocalRefreshState: LiveLocalRefreshState;
  onNavigateToOverview: () => void;
  onNavigateToHelp: () => void;
};

function CompactDataSourceStatus({
  dataMode,
  baseUrl,
  baseUrlError,
  liveLocalRefreshState,
  onNavigateToOverview,
  onNavigateToHelp,
}: CompactDataSourceStatusProps) {
  const refreshSummary =
    liveLocalRefreshState.status === "complete"
      ? summarizeLiveLocalRefresh(liveLocalRefreshState)
      : undefined;

  return (
    <section className="compact-source-strip" aria-label="Aethra data source status">
      <div className="compact-source-copy">
        <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
          {dataMode === "fixture" ? "offline preview fixture" : "live local"}
        </StatusBadge>
        <StatusBadge tone={baseUrlError ? "warning" : "neutral"}>
          {baseUrlError ? "failed" : baseUrl}
        </StatusBadge>
        {refreshSummary ? (
          <StatusBadge
            tone={refreshSummary.failed > 0 || refreshSummary.unavailable > 0 ? "warning" : "ok"}
          >
            {refreshSummary.loaded} loaded
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral">not loaded</StatusBadge>
        )}
      </div>
      <div className="compact-source-actions">
        <button type="button" className="secondary-button" onClick={onNavigateToOverview}>
          Overview
        </button>
        <button type="button" className="secondary-button" onClick={onNavigateToHelp}>
          Help
        </button>
      </div>
    </section>
  );
}

function summarizeLiveLocalRefresh(refreshState: Extract<
  LiveLocalRefreshState,
  { status: "complete" }
>) {
  const totalSurfaces = 13;
  const loaded = refreshState.results.filter(
    (result) => result.status === "loaded",
  );
  const failedResults = refreshState.results.filter(
    (result): result is Extract<typeof result, { status: "failed" }> =>
      result.status === "failed",
  );
  const unavailable = failedResults.filter(
    (result) => result.diagnosticKind === "endpoint-unavailable",
  );
  const failed = failedResults.filter(
    (result) => result.diagnosticKind !== "endpoint-unavailable",
  );

  return {
    attempted: refreshState.results.length,
    loaded: loaded.length,
    failed: failed.length,
    unavailable: unavailable.length,
    notLoaded: Math.max(totalSurfaces - refreshState.results.length, 0),
    failedResults,
    results: refreshState.results,
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
