import { useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { StatusBadge } from "./components/StatusBadge";
import { createIgnisPromptClient } from "./api/client";
import type {
  AethraDataMode,
  LiveHealthState,
  LiveModelsState,
} from "./dataSource";
import {
  DEFAULT_AETHRA_BASE_URL,
  describeHealthLoadError,
  describeModelsLoadError,
  validateLocalBaseUrl,
} from "./dataSource";
import { ModelRunnerStatus } from "./routes/ModelRunnerStatus";
import { Overview } from "./routes/Overview";
import { RoutingExplorer } from "./routes/RoutingExplorer";
import { SustainabilityPreview } from "./routes/SustainabilityPreview";

type AethraRoute =
  | "overview"
  | "routing-explorer"
  | "audit-events"
  | "model-runner-status"
  | "sustainability-preview";

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AethraRoute>("overview");
  const [dataMode, setDataMode] = useState<AethraDataMode>("fixture");
  const [baseUrlInput, setBaseUrlInput] = useState(DEFAULT_AETHRA_BASE_URL);
  const [liveHealthState, setLiveHealthState] = useState<LiveHealthState>({
    status: "not-loaded",
  });
  const [liveModelsState, setLiveModelsState] = useState<LiveModelsState>({
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
        label: "Local URL blocked",
        message: baseUrlError,
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
      });
    }
  }

  async function loadLiveModels() {
    if (baseUrlError) {
      setLiveModelsState({
        status: "error",
        label: "Local URL blocked",
        message: baseUrlError,
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
      });
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Aethra sections">
        <div>
          <p className="eyebrow">Aethra</p>
          <h1>Local AI Routing Observatory</h1>
        </div>
        <nav className="nav-list">
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
            Routing Explorer
          </button>
          <button
            type="button"
            aria-current={activeRoute === "audit-events" ? "page" : undefined}
            onClick={() => setActiveRoute("audit-events")}
          >
            Audit Events
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "model-runner-status" ? "page" : undefined
            }
            onClick={() => setActiveRoute("model-runner-status")}
          >
            Model / Runner Status
          </button>
          <button
            type="button"
            aria-current={
              activeRoute === "sustainability-preview" ? "page" : undefined
            }
            onClick={() => setActiveRoute("sustainability-preview")}
          >
            Sustainability Preview
          </button>
        </nav>
      </aside>

      <main className="workspace">
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
                : "Live local health and model metadata loading is manual and read-only. Audit event metadata fetching comes later."}
            </p>
          </div>
          <div className="mode-badges" aria-label="Aethra mode guarantees">
            <StatusBadge tone={dataMode === "fixture" ? "neutral" : "warning"}>
              {dataMode === "fixture" ? "Fixture mode" : "Live local mode"}
            </StatusBadge>
            <StatusBadge tone="neutral">read-only</StatusBadge>
            <StatusBadge tone="neutral">no telemetry</StatusBadge>
            <StatusBadge tone="neutral">no cloud calls by default</StatusBadge>
            <StatusBadge tone="neutral">model and runner status hints</StatusBadge>
            <StatusBadge tone="warning">
              proxy-only sustainability indicators
            </StatusBadge>
          </div>
        </section>

        <DataSourceControl
          dataMode={dataMode}
          baseUrlInput={baseUrlInput}
          baseUrl={localBaseUrl}
          baseUrlError={baseUrlError}
          liveHealthState={liveHealthState}
          onDataModeChange={setDataMode}
          onBaseUrlInputChange={setBaseUrlInput}
          onLoadLiveHealth={loadLiveHealth}
        />

        {activeRoute === "overview" ? (
          <Overview
            dataMode={dataMode}
            liveHealthState={liveHealthState}
            onLoadLiveHealth={loadLiveHealth}
          />
        ) : null}
        {activeRoute === "routing-explorer" ? (
          <RoutingExplorer
            localBaseUrl={localBaseUrl}
            localBaseUrlError={baseUrlError}
          />
        ) : null}
        {activeRoute === "audit-events" ? <AuditEvents /> : null}
        {activeRoute === "model-runner-status" ? (
          <ModelRunnerStatus
            dataMode={dataMode}
            liveModelsState={liveModelsState}
            onLoadLiveModels={loadLiveModels}
          />
        ) : null}
        {activeRoute === "sustainability-preview" ? (
          <SustainabilityPreview />
        ) : null}
      </main>
    </div>
  );
}

type DataSourceControlProps = {
  dataMode: AethraDataMode;
  baseUrlInput: string;
  baseUrl: string;
  baseUrlError?: string;
  liveHealthState: LiveHealthState;
  onDataModeChange: (dataMode: AethraDataMode) => void;
  onBaseUrlInputChange: (baseUrl: string) => void;
  onLoadLiveHealth: () => void;
};

function DataSourceControl({
  dataMode,
  baseUrlInput,
  baseUrl,
  baseUrlError,
  liveHealthState,
  onDataModeChange,
  onBaseUrlInputChange,
  onLoadLiveHealth,
}: DataSourceControlProps) {
  const canLoadHealth =
    dataMode === "live-local" &&
    !baseUrlError &&
    liveHealthState.status !== "loading";

  return (
    <section className="data-source-control" aria-label="Aethra data source">
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
        <span>Local daemon base URL</span>
        <input
          value={baseUrlInput}
          onChange={(event) => onBaseUrlInputChange(event.target.value)}
          placeholder={DEFAULT_AETHRA_BASE_URL}
          aria-invalid={baseUrlError ? "true" : undefined}
        />
      </label>

      <div className="data-source-status">
        <StatusBadge tone={baseUrlError ? "warning" : "neutral"}>
          {baseUrlError ? "Local URL blocked" : baseUrl}
        </StatusBadge>
        <p className="muted">
          {baseUrlError ??
            "Fixture screens use bundled data until live local health is manually loaded."}
        </p>
      </div>

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
    </section>
  );
}
