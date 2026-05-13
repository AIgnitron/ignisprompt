import { useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { ModelRunnerStatus } from "./routes/ModelRunnerStatus";
import { Overview } from "./routes/Overview";
import { RoutingExplorer } from "./routes/RoutingExplorer";

type AethraRoute =
  | "overview"
  | "routing-explorer"
  | "audit-events"
  | "model-runner-status";

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AethraRoute>("overview");

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Aethra sections">
        <div>
          <p className="eyebrow">Aethra</p>
          <h1>Local observability scaffold</h1>
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
          <span>Sustainability Preview</span>
        </nav>
      </aside>

      <main className="workspace">
        <section className="notice" aria-label="Fixture mode notice">
          <strong>Fixture mode by default.</strong>
          <span>
            Most screens use synthetic local fixtures. Routing Explorer can make
            one explicit local route-explain request when selected; no cloud
            services, telemetry, analytics, or model providers are contacted.
          </span>
        </section>

        {activeRoute === "overview" ? <Overview /> : null}
        {activeRoute === "routing-explorer" ? <RoutingExplorer /> : null}
        {activeRoute === "audit-events" ? <AuditEvents /> : null}
        {activeRoute === "model-runner-status" ? <ModelRunnerStatus /> : null}
      </main>
    </div>
  );
}
