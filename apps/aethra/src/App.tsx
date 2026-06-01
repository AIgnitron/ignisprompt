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
  LiveHealthState,
  LiveModelStatusState,
  LiveModelsState,
  LiveSustainabilityMetricsState,
  LiveVersionStatusState,
} from "./dataSource";
import {
  DEFAULT_AETHRA_BASE_URL,
  describeAuditEventsLoadError,
  describeHealthLoadError,
  describeModelStatusLoadError,
  describeModelsLoadError,
  describeSustainabilityMetricsLoadError,
  describeVersionStatusLoadError,
  localUrlBlockedDescription,
  validateLocalBaseUrl,
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
  const [liveModelStatusState, setLiveModelStatusState] =
    useState<LiveModelStatusState>({
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
  const baseUrlValidation = validateLocalBaseUrl(baseUrlInput);
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
                  ? "fixture-backed by default"
                  : "live local selected"}
              </h2>
              <p>
                {dataMode === "fixture"
                  ? "Live local actions are explicit and local. Aethra observes IgnisPrompt state without changing routing, runners, models, or audit policy."
                  : "Live local metadata loading is manual and read-only for health, daemon version status, models, model and runner status hints, audit events, and sustainability metrics."}
              </p>
            </div>
            <div className="mode-badges" aria-label="Aethra mode guarantees">
              <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
                {dataMode === "fixture" ? "Fixture mode" : "Live local mode"}
              </StatusBadge>
              <StatusBadge tone="neutral">read-only</StatusBadge>
              <StatusBadge tone="neutral">fixture-backed by default</StatusBadge>
              <StatusBadge tone="neutral">manual live-local loading only</StatusBadge>
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
          isExpanded={isDataSourceExpanded}
          onDataModeChange={setDataMode}
          onBaseUrlInputChange={setBaseUrlInput}
          onLoadLiveHealth={loadLiveHealth}
          onExpandedChange={setIsDataSourceExpanded}
        />

        {activeRoute === "overview" ? (
          <Overview
            dataMode={dataMode}
            baseUrl={localBaseUrl}
            baseUrlError={baseUrlError}
            liveHealthState={liveHealthState}
            liveModelsState={liveModelsState}
            liveModelStatusState={liveModelStatusState}
            liveVersionStatusState={liveVersionStatusState}
            liveAuditEventsState={liveAuditEventsState}
            liveSustainabilityMetricsState={liveSustainabilityMetricsState}
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
            localBaseUrl={localBaseUrl}
            localBaseUrlError={baseUrlError}
          />
        ) : null}
        {activeRoute === "audit-events" ? (
          <AuditEvents
            dataMode={dataMode}
            liveAuditEventsState={liveAuditEventsState}
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
            liveModelStatusState={liveModelStatusState}
            onLoadLiveModels={loadLiveModels}
            onLoadLiveModelStatus={loadLiveModelStatus}
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
        <h2>Fixture-first observability for local IgnisPrompt review</h2>
        <p>
          Fixture mode is the default. Live-local loading is manual. Aethra is
          read-only, sends no telemetry, makes no cloud calls by default, and
          exists for local-preview observability only.
        </p>
      </div>
      <div className="preview-banner-badges" aria-label="Local preview guardrails">
        <StatusBadge tone="neutral">Fixture default</StatusBadge>
        <StatusBadge tone="neutral">Manual live-local</StatusBadge>
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
  isExpanded: boolean;
  onDataModeChange: (dataMode: AethraDataMode) => void;
  onBaseUrlInputChange: (baseUrl: string) => void;
  onLoadLiveHealth: () => void;
  onExpandedChange: (isExpanded: boolean) => void;
};

function DataSourceControl({
  activeRoute,
  dataMode,
  baseUrlInput,
  baseUrl,
  baseUrlError,
  liveHealthState,
  isExpanded,
  onDataModeChange,
  onBaseUrlInputChange,
  onLoadLiveHealth,
  onExpandedChange,
}: DataSourceControlProps) {
  const canLoadHealth =
    dataMode === "live-local" &&
    !baseUrlError &&
    liveHealthState.status !== "loading";
  const isOverviewRoute = activeRoute === "overview";

  return (
    <section className="data-source-control" aria-label="Aethra data source">
      <div className="data-source-compact-row">
        <div className="data-source-intro">
          <p className="eyebrow">Local preview</p>
          <h3>Fixture mode first, live-local only when manually requested</h3>
          <p className="muted">
            Aethra opens in fixture mode using bundled demo data.
          </p>
        </div>
        <div className="data-source-compact-badges" aria-label="Aethra compact boundaries">
          <StatusBadge tone="neutral">Local preview</StatusBadge>
          <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
            {dataMode === "fixture" ? "Fixture mode by default" : "Live-local selected"}
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
              Aethra opens in fixture mode using bundled demo data. To inspect a
              running local IgnisPrompt daemon, start <code>ignispromptd</code> and
              manually load metadata from the daemon base URL. Aethra does not poll,
              persist live-local state, execute commands, or change routing.
            </p>
            <ul className="data-source-boundary-list">
              <li>Fixture-backed by default</li>
              <li>Manual live-local loading only</li>
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
              frontend URL such as <code>http://127.0.0.1:5173</code>.
            </p>
          </label>

          <div className="data-source-status">
            <StatusBadge tone={baseUrlError ? "warning" : "neutral"}>
              {baseUrlError ? "Local URL blocked" : baseUrl}
            </StatusBadge>
            <p className="muted">
              {baseUrlError ??
                "Manual live-local loads use the daemon base URL above and never poll or persist state."}
            </p>
          </div>

          <div className="manual-refresh-card">
            <span>Manual live-local refresh action</span>
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
