import { useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { StatusBadge } from "./components/StatusBadge";
import type { AethraDataMode } from "./dataSource";
import {
  DEFAULT_AETHRA_BASE_URL,
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
  const baseUrlValidation = validateLocalBaseUrl(baseUrlInput);
  const localBaseUrl = baseUrlValidation.ok
    ? baseUrlValidation.baseUrl
    : DEFAULT_AETHRA_BASE_URL;
  const baseUrlError = baseUrlValidation.ok
    ? undefined
    : baseUrlValidation.error;

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
                : "Live local mode is selected state only in this PR. Metadata fetching for health, models, and audit events comes later."}
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
          onDataModeChange={setDataMode}
          onBaseUrlInputChange={setBaseUrlInput}
        />

        {activeRoute === "overview" ? <Overview /> : null}
        {activeRoute === "routing-explorer" ? (
          <RoutingExplorer
            localBaseUrl={localBaseUrl}
            localBaseUrlError={baseUrlError}
          />
        ) : null}
        {activeRoute === "audit-events" ? <AuditEvents /> : null}
        {activeRoute === "model-runner-status" ? <ModelRunnerStatus /> : null}
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
  onDataModeChange: (dataMode: AethraDataMode) => void;
  onBaseUrlInputChange: (baseUrl: string) => void;
};

function DataSourceControl({
  dataMode,
  baseUrlInput,
  baseUrl,
  baseUrlError,
  onDataModeChange,
  onBaseUrlInputChange,
}: DataSourceControlProps) {
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
            "Fixture screens still use bundled data. Live metadata requests are not enabled yet."}
        </p>
      </div>
    </section>
  );
}
