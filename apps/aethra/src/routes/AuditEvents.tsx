import { useMemo, useState } from "react";
import { AuditEvent } from "../api/contracts";
import { auditEventFixtures } from "../api/fixtures";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  countAuditCacheHits,
  countAuditWarnings,
  findAuditEventByRequestId,
  toAuditEventRows,
} from "./auditEventSummary";

const initialSelectedRequestId = toAuditEventRows(auditEventFixtures)[0]
  ?.requestId;

export function AuditEvents() {
  const [selectedRequestId, setSelectedRequestId] = useState(
    initialSelectedRequestId,
  );
  const rows = useMemo(() => toAuditEventRows(auditEventFixtures), []);
  const selectedEvent =
    selectedRequestId === undefined
      ? undefined
      : findAuditEventByRequestId(auditEventFixtures, selectedRequestId);

  return (
    <section id="audit-events" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Audit Events</p>
          <h2>Fixture-backed local audit records</h2>
        </div>
        <div className="status-strip" aria-label="Audit fixture status">
          <StatusBadge tone="neutral">Fixture mode</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
        </div>
      </header>

      <div className="metric-grid" aria-label="Audit fixture metrics">
        <MetricCard
          label="Fixture events"
          value={auditEventFixtures.length}
          detail="Synthetic local process records"
        />
        <MetricCard
          label="Warnings"
          value={countAuditWarnings(auditEventFixtures)}
          detail="Warnings across fixture events"
        />
        <MetricCard
          label="Cache hits"
          value={countAuditCacheHits(auditEventFixtures)}
          detail="Events with cache.hit=true"
        />
      </div>

      <div className="audit-layout">
        <AuditEventTable
          rows={rows}
          selectedRequestId={selectedRequestId}
          onSelect={setSelectedRequestId}
        />
        <AuditEventDetail event={selectedEvent} />
      </div>
    </section>
  );
}

type AuditEventTableProps = {
  rows: ReturnType<typeof toAuditEventRows>;
  selectedRequestId?: string;
  onSelect: (requestId: string) => void;
};

function AuditEventTable({
  rows,
  selectedRequestId,
  onSelect,
}: AuditEventTableProps) {
  if (rows.length === 0) {
    return (
      <section className="panel" aria-label="Audit event table">
        <h3>Recent audit events</h3>
        <p className="muted">No synthetic audit events are available.</p>
      </section>
    );
  }

  return (
    <section className="panel audit-table-panel" aria-label="Audit event table">
      <div className="panel-heading">
        <div>
          <h3>Recent audit events</h3>
          <p className="muted">Newest synthetic fixture events first</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Route</th>
              <th>Tier</th>
              <th>Domain</th>
              <th>Model</th>
              <th>Data left</th>
              <th>Warnings</th>
              <th>Cache</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.requestId}
                className={
                  row.requestId === selectedRequestId ? "selected-row" : ""
                }
              >
                <td>
                  <button
                    type="button"
                    className="table-link"
                    onClick={() => onSelect(row.requestId)}
                  >
                    {formatTimestamp(row.timestamp)}
                  </button>
                </td>
                <td>{row.eventType}</td>
                <td>{row.routeCode}</td>
                <td>{row.tier}</td>
                <td>{row.domain}</td>
                <td>{row.modelId}</td>
                <td>{String(row.dataLeftDevice)}</td>
                <td>{row.warningCount}</td>
                <td>{row.cacheHit ? "hit" : "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type AuditEventDetailProps = {
  event?: AuditEvent;
};

function AuditEventDetail({ event }: AuditEventDetailProps) {
  if (!event) {
    return (
      <aside className="panel detail-panel" aria-label="Audit event detail">
        <h3>Event detail</h3>
        <p className="muted">Select a synthetic audit event to inspect it.</p>
      </aside>
    );
  }

  return (
    <aside className="panel detail-panel" aria-label="Audit event detail">
      <div className="panel-heading">
        <div>
          <h3>Event detail</h3>
          <p className="muted">{event.request_id}</p>
        </div>
        <StatusBadge tone={event.warnings.length > 0 ? "warning" : "ok"}>
          {event.warnings.length} warnings
        </StatusBadge>
      </div>

      <p className="explanation">{event.explanation}</p>

      <section className="detail-section">
        <h4>Warnings</h4>
        {event.warnings.length > 0 ? (
          <ul className="warning-list">
            {event.warnings.map((warning, index) => (
              <li key={`${event.request_id}-${index}`}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">No warnings are present in this fixture event.</p>
        )}
      </section>

      {event.cache ? (
        <section className="detail-section">
          <h4>Cache metadata</h4>
          <dl className="state-list">
            <div>
              <dt>Hit</dt>
              <dd>{String(event.cache.hit)}</dd>
            </div>
            <div>
              <dt>Kind</dt>
              <dd>{event.cache.kind}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {event.completion_output ? (
        <section className="detail-section">
          <h4>Completion output metadata</h4>
          <pre className="raw-json">
            {JSON.stringify(event.completion_output, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className="detail-section">
        <h4>Raw event JSON</h4>
        <pre className="raw-json">{JSON.stringify(event, null, 2)}</pre>
      </section>

      <p className="muted">
        This is synthetic fixture data. It is not signed, immutable, encrypted,
        replicated, or certified audit evidence.
      </p>
    </aside>
  );
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}
