import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
} from "../fixtures/aethraFixture";
import {
  buildOverviewSummary,
  getWarningExamples,
} from "./overviewSummary";

const summary = buildOverviewSummary(
  healthFixture,
  modelFixtures,
  auditEventFixtures,
);
const warningExamples = getWarningExamples(auditEventFixtures);

export function Overview() {
  const latestEvent = summary.latestEvent;

  return (
    <section id="overview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Fixture-backed IgnisPrompt overview</h2>
        </div>
        <div className="status-strip" aria-label="Overview fixture status">
          <StatusBadge tone="ok">{healthFixture.status.toUpperCase()}</StatusBadge>
          <StatusBadge tone="neutral">
            {healthFixture.service} {healthFixture.version}
          </StatusBadge>
          <StatusBadge tone={healthFixture.local_only ? "ok" : "warning"}>
            {healthFixture.local_only ? "Local-only" : "Local-only off"}
          </StatusBadge>
          <StatusBadge tone="neutral">Fixture mode</StatusBadge>
        </div>
      </header>

      <div className="metric-grid" aria-label="Aethra fixture metrics">
        <MetricCard
          label="Models loaded"
          value={summary.modelCount}
          detail={`${healthFixture.model_count} reported by health fixture`}
        />
        <MetricCard
          label="Recent audit events"
          value={summary.auditEventCount}
          detail="Synthetic audit fixture records"
        />
        <MetricCard
          label="Data stayed local"
          value={summary.localEventCount}
          detail="Events where data_left_device=false"
        />
        <MetricCard
          label="Warnings"
          value={summary.warningCount}
          detail="Warnings across audit fixtures"
        />
        <MetricCard
          label="Cache hits"
          value={summary.cacheHitCount}
          detail="Fixture events with cache.hit=true"
        />
      </div>

      {latestEvent ? (
        <section className="panel" aria-label="Recent fixture route decision">
          <div className="panel-heading">
            <div>
              <h3>Recent route summary</h3>
              <p className="muted">Latest synthetic audit event by timestamp</p>
            </div>
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
              <dd>{latestEvent.model_id ?? "none"}</dd>
            </div>
            <div>
              <dt>Data left device</dt>
              <dd>{latestEvent.data_left_device ? "true" : "false"}</dd>
            </div>
          </dl>
          <p className="explanation">{latestEvent.explanation}</p>
        </section>
      ) : (
        <section className="panel" aria-label="Recent fixture route decision">
          <h3>Recent route summary</h3>
          <p className="muted">No synthetic audit events are available.</p>
        </section>
      )}

      <div className="two-column">
        <section className="panel" aria-label="Local-only posture summary">
          <div className="panel-heading">
            <h3>Local-only posture</h3>
            <StatusBadge tone="neutral">Fixture facts</StatusBadge>
          </div>
          <div className="fact-columns">
            <div>
              <h4>Observed from fixtures</h4>
              <ul>
                {summary.observedFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Dashboard-derived</h4>
              <ul>
                {summary.derivedFacts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="muted">
            These are synthetic fixture records, not signed audit evidence,
            certified sustainability metrics, compliance evidence, or legal
            advice.
          </p>
        </section>

        <section className="panel" aria-label="Fixture warning summary">
          <div className="panel-heading">
            <h3>Warnings</h3>
            <StatusBadge tone={summary.warningCount > 0 ? "warning" : "ok"}>
              {summary.warningCount}
            </StatusBadge>
          </div>
          {warningExamples.length > 0 ? (
            <ul className="warning-list">
              {warningExamples.map((warning, index) => (
                <li key={`${index}-${warning}`}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No warning examples are present in fixtures.</p>
          )}
        </section>

        <section className="panel" aria-label="Fixture state handling">
          <div className="panel-heading">
            <h3>Fixture state handling</h3>
            <StatusBadge tone="neutral">Read-only</StatusBadge>
          </div>
          <dl className="state-list">
            <div>
              <dt>Loaded fixture</dt>
              <dd>Overview renders from synthetic health, model, and audit data.</dd>
            </div>
            <div>
              <dt>Empty audit fixture</dt>
              <dd>The route and warning panels have explicit empty states.</dd>
            </div>
            <div>
              <dt>Unreachable daemon</dt>
              <dd>Not triggered here because fixture mode is the UI default.</dd>
            </div>
            <div>
              <dt>Malformed data</dt>
              <dd>Covered by API contract guards and client tests, not live calls.</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}
