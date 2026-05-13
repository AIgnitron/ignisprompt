import { Overview } from "./routes/Overview";

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Aethra sections">
        <div>
          <p className="eyebrow">Aethra</p>
          <h1>Local observability scaffold</h1>
        </div>
        <nav className="nav-list">
          <a href="#overview" aria-current="page">
            Overview
          </a>
          <span>Routing Explorer</span>
          <span>Audit Events</span>
          <span>Model / Runner Status</span>
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

        <Overview />
      </main>
    </div>
  );
}
