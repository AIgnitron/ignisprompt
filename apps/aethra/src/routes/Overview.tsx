import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
} from "../fixtures/aethraFixture";

const latestEvent = auditEventFixtures[0];
const warningCount = auditEventFixtures.reduce(
  (count, event) => count + event.warnings.length,
  0,
);
const localEventCount = auditEventFixtures.filter(
  (event) => !event.data_left_device,
).length;

export function Overview() {
  return (
    <section id="overview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Fixture-backed IgnisPrompt observability</h2>
        </div>
        <StatusBadge tone="neutral">MVP scaffold</StatusBadge>
      </header>

      <div className="metric-grid" aria-label="Aethra fixture metrics">
        <MetricCard
          label="Daemon status"
          value={healthFixture.status.toUpperCase()}
          detail={`${healthFixture.service} ${healthFixture.version}`}
        />
        <MetricCard
          label="Local-only mode"
          value={healthFixture.local_only ? "Enabled" : "Disabled"}
          detail="Fixture value from /health shape"
        />
        <MetricCard
          label="Loaded manifests"
          value={modelFixtures.length}
          detail={`${healthFixture.model_count} reported by health fixture`}
        />
        <MetricCard
          label="Local audit events"
          value={localEventCount}
          detail="Proxy count where data_left_device=false"
        />
      </div>

      <section className="panel" aria-label="Recent fixture route decision">
        <div className="panel-heading">
          <h3>Recent route decision</h3>
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
            <dd>{latestEvent.model_id}</dd>
          </div>
          <div>
            <dt>Data left device</dt>
            <dd>{latestEvent.data_left_device ? "true" : "false"}</dd>
          </div>
        </dl>
        <p className="explanation">{latestEvent.explanation}</p>
      </section>

      <div className="two-column">
        <section className="panel" aria-label="Fixture model summary">
          <div className="panel-heading">
            <h3>Model manifest hint</h3>
            <StatusBadge tone="neutral">Manifest-derived</StatusBadge>
          </div>
          <p className="model-name">{modelFixtures[0].displayName}</p>
          <p className="muted">
            Aethra does not verify local model files or runner readiness in this
            scaffold.
          </p>
        </section>

        <section className="panel" aria-label="Fixture warning summary">
          <div className="panel-heading">
            <h3>Warnings</h3>
            <StatusBadge tone={warningCount > 0 ? "warning" : "ok"}>
              {warningCount}
            </StatusBadge>
          </div>
          <p className="muted">
            Warnings are displayed from synthetic audit fixtures. IgnisPrompt
            remains the source of routing and audit behavior.
          </p>
        </section>
      </div>
    </section>
  );
}
