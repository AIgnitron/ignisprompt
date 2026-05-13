import { useState } from "react";
import { AuditEvents } from "./routes/AuditEvents";
import { ModelRunnerStatus } from "./routes/ModelRunnerStatus";
import { Overview } from "./routes/Overview";

type AethraRoute = "overview" | "audit-events" | "model-runner-status";

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
          <span>Routing Explorer</span>
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
          <strong>Fixture mode only.</strong>
          <span>
            This scaffold uses synthetic local fixtures and does not contact
            ignispromptd, cloud services, telemetry, analytics, or model
            providers.
          </span>
        </section>

        {activeRoute === "overview" ? <Overview /> : null}
        {activeRoute === "audit-events" ? <AuditEvents /> : null}
        {activeRoute === "model-runner-status" ? <ModelRunnerStatus /> : null}
      </main>
    </div>
  );
}
