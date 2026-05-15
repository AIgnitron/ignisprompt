import { useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { StatusBadge } from "./components/StatusBadge";
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
            <h2>fixture-backed by default</h2>
            <p>
              Live local actions are explicit and local. Aethra observes
              IgnisPrompt state without changing routing, runners, models, or
              audit policy.
            </p>
          </div>
          <div className="mode-badges" aria-label="Aethra mode guarantees">
            <StatusBadge tone="neutral">read-only</StatusBadge>
            <StatusBadge tone="neutral">no telemetry</StatusBadge>
            <StatusBadge tone="neutral">no cloud calls by default</StatusBadge>
            <StatusBadge tone="neutral">model and runner status hints</StatusBadge>
            <StatusBadge tone="warning">
              proxy-only sustainability indicators
            </StatusBadge>
          </div>
        </section>

        {activeRoute === "overview" ? <Overview /> : null}
        {activeRoute === "routing-explorer" ? <RoutingExplorer /> : null}
        {activeRoute === "audit-events" ? <AuditEvents /> : null}
        {activeRoute === "model-runner-status" ? <ModelRunnerStatus /> : null}
        {activeRoute === "sustainability-preview" ? (
          <SustainabilityPreview />
        ) : null}
      </main>
    </div>
  );
}
