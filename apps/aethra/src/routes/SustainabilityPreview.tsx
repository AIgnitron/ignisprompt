import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  routeExplainFixture,
} from "../fixtures/aethraFixture";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { buildSustainabilitySummary } from "./sustainabilitySummary";

const summary = buildSustainabilitySummary(
  healthFixture,
  auditEventFixtures,
  [routeExplainFixture],
  modelFixtures,
);

export function SustainabilityPreview() {
  return (
    <section id="sustainability-preview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sustainability Preview</p>
          <h2>Preview only: proxy indicators</h2>
        </div>
        <div
          className="status-strip"
          aria-label="Sustainability Preview status"
        >
          <StatusBadge tone="neutral">Fixture mode</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="warning">Proxy indicators</StatusBadge>
        </div>
      </header>

      <div className="metric-grid" aria-label="Sustainability proxy metrics">
        <MetricCard
          label="Local-only status"
          value={summary.localOnlyStatus ? "true" : "false"}
          detail="From health fixture metadata"
        />
        <MetricCard
          label="Data stayed local"
          value={summary.localAuditEventCount}
          detail="Audit events where data_left_device=false"
        />
        <MetricCard
          label="Cloud disallowed"
          value={summary.cloudDisallowedRouteCount}
          detail="Route fixture decisions with cloud_allowed=false"
        />
        <MetricCard
          label="Rejected routes"
          value={summary.failClosedOrRejectedCount}
          detail="Fail-closed or rejected route codes if present"
        />
        <MetricCard
          label="Cache hits"
          value={summary.cacheHitCount}
          detail="Audit fixtures with cache.hit=true"
        />
      </div>

      <div className="sustainability-layout">
        <section className="panel" aria-label="Avoided cloud call proxy">
          <div className="panel-heading">
            <div>
              <h3>Avoided cloud call proxy</h3>
              <p className="muted">
                Derived from route and audit metadata in synthetic fixtures
              </p>
            </div>
            <StatusBadge tone="neutral">Proxy only</StatusBadge>
          </div>
          <p className="proxy-value">{summary.avoidedCloudCallProxyCount}</p>
          <p className="explanation">
            This proxy counts local audit records and local route fixture
            decisions that did not allow cloud routing. It is not measured energy
            use, not carbon accounting, not certified sustainability reporting,
            and not ESG/compliance evidence.
          </p>
        </section>

        <section className="panel" aria-label="Sustainability methodology limits">
          <div className="panel-heading">
            <h3>Methodology limits</h3>
            <StatusBadge tone="warning">Conservative labels</StatusBadge>
          </div>
          <ul className="status-hint-list">
            {summary.methodologyLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-label="Fixture inputs">
          <div className="panel-heading">
            <h3>Fixture inputs</h3>
            <StatusBadge tone="neutral">Metadata only</StatusBadge>
          </div>
          <dl className="state-list">
            <div>
              <dt>Health fixture</dt>
              <dd>local_only={String(healthFixture.local_only)}</dd>
            </div>
            <div>
              <dt>Audit fixtures</dt>
              <dd>{auditEventFixtures.length} synthetic local records</dd>
            </div>
            <div>
              <dt>Route fixture</dt>
              <dd>
                cloud_allowed=
                {String(routeExplainFixture.decision.cloud_allowed)}
              </dd>
            </div>
            <div>
              <dt>Model fixtures</dt>
              <dd>{summary.modelManifestCount} manifest-derived entries</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-label="Insufficient data states">
          <div className="panel-heading">
            <h3>Insufficient data states</h3>
            <StatusBadge tone="neutral">No hidden data</StatusBadge>
          </div>
          <p className="explanation">
            If fixtures do not include a field, Aethra leaves the proxy at zero
            or describes the input as unavailable. This screen does not infer
            device energy use, provider energy use, carbon impact, or
            compliance status from missing data.
          </p>
        </section>
      </div>
    </section>
  );
}
