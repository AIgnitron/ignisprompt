import { useEffect, useMemo, useState } from "react";
import { AuditEvent } from "../api/contracts";
import { auditEventFixtures } from "../api/fixtures";
import type { AethraDataMode, LiveAuditEventsState } from "../dataSource";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import {
  countAuditCacheHits,
  countAuditWarnings,
  findAuditEventByRequestId,
  toAuditEventRows,
} from "./auditEventSummary";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";

const initialSelectedRequestId = toAuditEventRows(auditEventFixtures)[0]
  ?.requestId;

type AuditEventsProps = {
  dataMode: AethraDataMode;
  liveAuditEventsState: LiveAuditEventsState;
  onLoadLiveAuditEvents: () => void;
};

export function AuditEvents({
  dataMode,
  liveAuditEventsState,
  onLoadLiveAuditEvents,
}: AuditEventsProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<
    string | undefined
  >(
    initialSelectedRequestId,
  );
  const isLiveAuditLoaded =
    dataMode === "live-local" && liveAuditEventsState.status === "loaded";
  const events = isLiveAuditLoaded
    ? liveAuditEventsState.events
    : auditEventFixtures;
  const rows = useMemo(() => toAuditEventRows(events), [events]);
  const selectedEvent =
    selectedRequestId === undefined
      ? undefined
      : findAuditEventByRequestId(events, selectedRequestId);
  const sourceLabel = isLiveAuditLoaded
    ? "Live local metadata"
    : dataMode === "live-local"
      ? "Fixture fallback"
      : "Fixture mode";

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedRequestId(undefined);
      return;
    }

    if (
      selectedRequestId === undefined ||
      !rows.some((row) => row.requestId === selectedRequestId)
    ) {
      setSelectedRequestId(rows[0].requestId);
    }
  }, [rows, selectedRequestId]);

  return (
    <section id="audit-events" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Audit Events</p>
          <h2>Local audit records</h2>
          <p className="page-subtitle">
            Inspect fixture or manually loaded route history, warnings, and
            local estimate fields.
          </p>
        </div>
        <div className="status-strip" aria-label="Audit metadata status">
          <StatusBadge tone={isLiveAuditLoaded ? "ok" : "neutral"}>
            {sourceLabel}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Review local process audit records from fixture data or a manual live-local refresh.",
          "Inspect route history, warnings, cache hints, and sustainability estimate fields.",
          "Audit events are local records for observability, not signed evidence or production deployment proof.",
        ]}
      />

      <AuditMetadataPanel
        dataMode={dataMode}
        liveAuditEventsState={liveAuditEventsState}
        onLoadLiveAuditEvents={onLoadLiveAuditEvents}
      />

      <div className="metric-grid" aria-label="Audit metadata metrics">
        <MetricCard
          label={isLiveAuditLoaded ? "Live events" : "Fixture events"}
          value={events.length}
          detail={
            isLiveAuditLoaded
              ? "Local daemon records returned by GET /v1/audit/events"
              : "Synthetic local process records"
          }
        />
        <MetricCard
          label="Warnings"
          value={countAuditWarnings(events)}
          detail="Warnings across displayed records"
        />
        <MetricCard
          label="Cache hits"
          value={countAuditCacheHits(events)}
          detail="Events with cache.hit=true"
        />
      </div>

      <div className="audit-layout">
        <AuditEventTable
          rows={rows}
          sourceLabel={sourceLabel}
          selectedRequestId={selectedRequestId}
          onSelect={setSelectedRequestId}
        />
        <AuditEventDetail
          event={selectedEvent}
          isLiveEvent={isLiveAuditLoaded}
        />
      </div>
    </section>
  );
}

type AuditMetadataPanelProps = {
  dataMode: AethraDataMode;
  liveAuditEventsState: LiveAuditEventsState;
  onLoadLiveAuditEvents: () => void;
};

function AuditMetadataPanel({
  dataMode,
  liveAuditEventsState,
  onLoadLiveAuditEvents,
}: AuditMetadataPanelProps) {
  const isLiveMode = dataMode === "live-local";

  return (
    <section className="panel" aria-label="Audit metadata source">
      <div className="panel-heading">
        <div>
          <h3>Audit event metadata</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/audit/events from the configured local daemon."
              : "Fixture mode uses bundled synthetic audit event metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveAuditEventsState.status === "error"
              ? "warning"
              : liveAuditEventsState.status === "loaded" && isLiveMode
                ? "ok"
                : "neutral"
          }
        >
          {getAuditEventsStateLabel(dataMode, liveAuditEventsState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveAuditEventsState.status === "not-loaded" ? (
        <EmptyState {...localPreviewEmptyStates.auditEventsNotLoaded} />
      ) : null}

      {isLiveMode && liveAuditEventsState.status === "loading" ? (
        <p className="explanation">
          Loading read-only audit event metadata from the configured local
          daemon.
        </p>
      ) : null}

      {isLiveMode && liveAuditEventsState.status === "loaded" &&
      liveAuditEventsState.events.length === 0 ? (
        <EmptyState {...localPreviewEmptyStates.auditEventsEmpty} />
      ) : null}

      {isLiveMode && liveAuditEventsState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveAuditEventsState.label,
            liveAuditEventsState.message,
            "Fixture audit records remain clearly labeled below.",
          )}
        />
      ) : null}

      <dl className="definition-grid audit-metadata-grid">
        <div>
          <dt>Source</dt>
          <dd>
            {isLiveMode && liveAuditEventsState.status === "loaded"
              ? "Live local metadata"
              : isLiveMode
                ? "Fixture fallback"
                : "Fixture metadata"}
          </dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>{isLiveMode ? "GET /v1/audit/events" : "fixture records"}</dd>
        </div>
        <div>
          <dt>Event records</dt>
          <dd>
            {liveAuditEventsState.status === "loaded" && isLiveMode
              ? liveAuditEventsState.events.length
              : auditEventFixtures.length}
          </dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {liveAuditEventsState.status === "loaded" && isLiveMode
              ? formatTimestamp(liveAuditEventsState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      {isLiveMode ? (
        <div className="manual-refresh-card audit-action-row">
          <span>Manual live-local refresh action</span>
          <button
            type="button"
            className="secondary-button"
            disabled={liveAuditEventsState.status === "loading"}
            onClick={onLoadLiveAuditEvents}
          >
            {liveAuditEventsState.status === "loading"
              ? "Loading audit events"
              : "Refresh live audit events"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

type AuditEventTableProps = {
  rows: ReturnType<typeof toAuditEventRows>;
  sourceLabel: string;
  selectedRequestId?: string;
  onSelect: (requestId: string) => void;
};

function AuditEventTable({
  rows,
  sourceLabel,
  selectedRequestId,
  onSelect,
}: AuditEventTableProps) {
  if (rows.length === 0) {
    return (
      <section className="panel" aria-label="Audit event table">
        <h3>Recent audit events</h3>
        <EmptyState
          title="No audit events are available"
          message={`No audit events are available from ${sourceLabel}.`}
          nextAction={
            sourceLabel === "Live local metadata"
              ? localPreviewEmptyStates.auditEventsEmpty.nextAction
              : "Fixture mode remains available; live-local audit events require a manual refresh."
          }
        />
      </section>
    );
  }

  return (
    <section className="panel audit-table-panel" aria-label="Audit event table">
      <div className="panel-heading">
        <div>
          <h3>Recent audit events</h3>
          <p className="muted">Newest records first from {sourceLabel}</p>
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
  isLiveEvent: boolean;
};

function AuditEventDetail({ event, isLiveEvent }: AuditEventDetailProps) {
  if (!event) {
    return (
      <aside className="panel detail-panel" aria-label="Audit event detail">
        <h3>Event detail</h3>
        <EmptyState
          title="No audit event selected"
          message="There is no audit event detail to inspect yet."
          nextAction="Select an audit event row, or load live-local audit events after local daemon activity."
        />
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
          <p className="muted">No warnings are present in this audit event.</p>
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
        This is {isLiveEvent ? "a local daemon record" : "synthetic fixture data"}.
        It is not signed, immutable, tamper-evident, encrypted, replicated,
        certified, or compliance evidence.
      </p>
    </aside>
  );
}

function getAuditEventsStateLabel(
  dataMode: AethraDataMode,
  liveAuditEventsState: LiveAuditEventsState,
): string {
  if (dataMode === "fixture") {
    return "Fixture audit events";
  }

  switch (liveAuditEventsState.status) {
    case "not-loaded":
      return "Live audit events not loaded";
    case "loading":
      return "Loading live audit events";
    case "loaded":
      return liveAuditEventsState.events.length === 0
        ? "No live audit events"
        : "Live audit events loaded";
    case "error":
      return liveAuditEventsState.label;
  }
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}
