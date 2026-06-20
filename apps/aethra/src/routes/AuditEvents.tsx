import { useEffect, useMemo, useState } from "react";
import { AuditEvent, OperationsSummaryResponse } from "../api/contracts";
import { auditEventFixtures, operationsSummaryFixture } from "../api/fixtures";
import type {
  AethraDataMode,
  LiveAuditEventsState,
  LiveOperationsSummaryState,
} from "../dataSource";
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
const emptyOperationsSummary: OperationsSummaryResponse = {
  ...operationsSummaryFixture,
  audit_summary: {
    ...operationsSummaryFixture.audit_summary,
    total_events: 0,
    recent_event_count: 0,
    recent_event_types: [],
    latest_event_at: undefined,
  },
  activity_summary: {
    ...operationsSummaryFixture.activity_summary,
    recent_requests_observed: 0,
    recent_routes_observed: 0,
    recent_errors_observed: 0,
    last_activity_at: undefined,
  },
};

type AuditFilter = "all" | "warnings" | "cache-hit";

type AuditEventsProps = {
  dataMode: AethraDataMode;
  liveAuditEventsState: LiveAuditEventsState;
  liveOperationsSummaryState: LiveOperationsSummaryState;
  onLoadLiveAuditEvents: () => void;
};

export function AuditEvents({
  dataMode,
  liveAuditEventsState,
  liveOperationsSummaryState,
  onLoadLiveAuditEvents,
}: AuditEventsProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<
    string | undefined
  >(
    initialSelectedRequestId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const isLiveAuditLoaded =
    dataMode === "live-local" && liveAuditEventsState.status === "loaded";
  const events = isLiveAuditLoaded
    ? liveAuditEventsState.events
    : dataMode === "fixture"
      ? auditEventFixtures
      : [];
  const rows = useMemo(() => toAuditEventRows(events), [events]);
  const visibleRows = useMemo(
    () => filterAuditRows(rows, searchQuery, auditFilter),
    [auditFilter, rows, searchQuery],
  );
  const selectedEvent =
    selectedRequestId === undefined
      ? undefined
      : findAuditEventByRequestId(events, selectedRequestId);
  const sourceLabel = isLiveAuditLoaded
    ? "Local daemon data"
    : dataMode === "live-local"
      ? "Live local not loaded"
      : "Offline preview fixture";
  const operationsSummary =
    dataMode === "live-local" && liveOperationsSummaryState.status === "loaded"
      ? liveOperationsSummaryState.summary
      : dataMode === "fixture"
        ? operationsSummaryFixture
        : emptyOperationsSummary;
  const operationsSourceLabel =
    dataMode === "live-local" && liveOperationsSummaryState.status === "loaded"
      ? "Local daemon data"
      : dataMode === "live-local"
        ? "Live local not loaded"
        : "Offline preview fixture";

  useEffect(() => {
    if (visibleRows.length === 0) {
      setSelectedRequestId(undefined);
      return;
    }

    if (
      selectedRequestId === undefined ||
      !visibleRows.some((row) => row.requestId === selectedRequestId)
    ) {
      setSelectedRequestId(visibleRows[0].requestId);
    }
  }, [selectedRequestId, visibleRows]);

  return (
    <section id="audit-events" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Audit Events</p>
          <h2>Local audit records</h2>
          <p className="page-subtitle">
            Inspect manually loaded local route history, warnings, and local
            estimate fields. Offline preview fixtures are explicit.
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
        items={["See Help for audit data source details and product limits."]}
      />

      <AuditMetadataPanel
        dataMode={dataMode}
        liveAuditEventsState={liveAuditEventsState}
        onLoadLiveAuditEvents={onLoadLiveAuditEvents}
      />

      <AuditOperationsSummaryPanel
        summary={operationsSummary}
        sourceLabel={operationsSourceLabel}
      />

      <div className="metric-grid" aria-label="Audit metadata metrics">
        <MetricCard
          label={isLiveAuditLoaded ? "Live events" : "Fixture events"}
          value={events.length}
          detail={
            isLiveAuditLoaded
              ? "Local daemon records returned by GET /v1/audit/events"
              : "Offline preview local process records"
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
          rows={visibleRows}
          totalRows={rows.length}
          sourceLabel={sourceLabel}
          selectedRequestId={selectedRequestId}
          searchQuery={searchQuery}
          auditFilter={auditFilter}
          onSearchChange={setSearchQuery}
          onFilterChange={setAuditFilter}
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
                ? "Live local not loaded"
                : "Offline preview fixture metadata"}
          </dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>{isLiveMode ? "GET /v1/audit/events" : "offline preview fixture records"}</dd>
        </div>
        <div>
          <dt>Event records</dt>
          <dd>
            {liveAuditEventsState.status === "loaded" && isLiveMode
              ? liveAuditEventsState.events.length
              : dataMode === "fixture"
                ? auditEventFixtures.length
                : 0}
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

type AuditOperationsSummaryPanelProps = {
  summary: OperationsSummaryResponse;
  sourceLabel: string;
};

function AuditOperationsSummaryPanel({
  summary,
  sourceLabel,
}: AuditOperationsSummaryPanelProps) {
  const latestEventAt = summary.audit_summary.latest_event_at
    ? formatTimestamp(summary.audit_summary.latest_event_at)
    : "none";
  const eventTypes =
    summary.audit_summary.recent_event_types.length > 0
      ? summary.audit_summary.recent_event_types.join(", ")
      : "none";

  return (
    <section className="panel" aria-label="Audit operations summary">
      <div className="panel-heading">
        <div>
          <h3>Audit summary</h3>
          <p className="muted">
            Aggregate local operations metadata. Raw prompts and request bodies
            are not shown.
          </p>
        </div>
        <StatusBadge tone={sourceLabel === "Local daemon data" ? "ok" : "neutral"}>
          {sourceLabel}
        </StatusBadge>
      </div>

      <dl className="definition-grid audit-metadata-grid">
        <div>
          <dt>Total events</dt>
          <dd>{summary.audit_summary.total_events}</dd>
        </div>
        <div>
          <dt>Recent events</dt>
          <dd>{summary.audit_summary.recent_event_count}</dd>
        </div>
        <div>
          <dt>Latest event</dt>
          <dd>{latestEventAt}</dd>
        </div>
        <div>
          <dt>Recent event types</dt>
          <dd>{eventTypes}</dd>
        </div>
        <div>
          <dt>Audit store</dt>
          <dd>{summary.audit_summary.audit_store_status}</dd>
        </div>
        <div>
          <dt>Warning or error records</dt>
          <dd>{summary.activity_summary.recent_errors_observed}</dd>
        </div>
      </dl>

    </section>
  );
}

type AuditEventTableProps = {
  rows: ReturnType<typeof toAuditEventRows>;
  totalRows: number;
  sourceLabel: string;
  selectedRequestId?: string;
  searchQuery: string;
  auditFilter: AuditFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: AuditFilter) => void;
  onSelect: (requestId: string) => void;
};

function AuditEventTable({
  rows,
  totalRows,
  sourceLabel,
  selectedRequestId,
  searchQuery,
  auditFilter,
  onSearchChange,
  onFilterChange,
  onSelect,
}: AuditEventTableProps) {
  if (totalRows === 0) {
    return (
      <section className="panel" aria-label="Audit event table">
        <h3>Recent audit events</h3>
        <EmptyState
          title="No audit events are available"
          message={`No audit events are available from ${sourceLabel}.`}
          nextAction={
            sourceLabel === "Local daemon data"
              ? localPreviewEmptyStates.auditEventsEmpty.nextAction
              : sourceLabel === "Live local not loaded"
                ? "Run Refresh local daemon data to load GET /v1/audit/events."
                : "Offline preview fixture mode shows synthetic audit records only."
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
          <p className="muted">
            Newest records first from {sourceLabel}. These rows summarize
            local route decisions, warnings, and route explanation metadata.
          </p>
        </div>
      </div>
      <div className="audit-filter-bar" aria-label="Audit event filters">
        <label className="form-field">
          <span>Search local audit records</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="request ID, route, tier, domain, model"
          />
        </label>
        <label className="form-field">
          <span>Filter displayed records</span>
          <select
            value={auditFilter}
            onChange={(event) =>
              onFilterChange(event.target.value as AuditFilter)
            }
          >
            <option value="all">All audit events</option>
            <option value="warnings">Warnings only</option>
            <option value="cache-hit">Cache hits only</option>
          </select>
        </label>
      </div>
      <p className="muted audit-filter-summary">
        Showing {rows.length} of {totalRows} local-preview records. Filters run
        in the browser and do not load new daemon data.
      </p>
      {rows.length === 0 ? (
        <EmptyState
          title="No audit events match the current filters"
          message="The selected search text or filter did not match the displayed local audit records."
          nextAction="Clear the search text, choose All audit events, or manually refresh live-local audit events after local daemon activity."
        />
      ) : null}
      {rows.length === 0 ? null : (
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
              <th>Proxy estimates</th>
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
                <td>{row.proxyEstimateCount}</td>
                <td>{row.cacheHit ? "hit" : "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}

type AuditEventDetailProps = {
  event?: AuditEvent;
  isLiveEvent: boolean;
};

function AuditEventDetail({ event, isLiveEvent }: AuditEventDetailProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    setCopyStatus("idle");
  }, [event?.request_id]);

  async function copyRequestId(requestId: string) {
    if (!globalThis.navigator?.clipboard?.writeText) {
      setCopyStatus("error");
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(requestId);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

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
          <p className="muted">Selected local audit event</p>
        </div>
        <StatusBadge tone={event.warnings.length > 0 ? "warning" : "ok"}>
          {event.warnings.length} warnings
        </StatusBadge>
      </div>

      <div className="copy-detail-row">
        <div>
          <span>request_id</span>
          <code>{event.request_id}</code>
        </div>
        <button
          type="button"
          className="secondary-button compact-button"
          onClick={() => copyRequestId(event.request_id)}
        >
          Copy
        </button>
      </div>
      {copyStatus !== "idle" ? (
        <p
          className={`copy-feedback copy-feedback-${
            copyStatus === "copied" ? "ok" : "warning"
          }`}
        >
          {copyStatus === "copied"
            ? "Copied request ID"
            : "Clipboard unavailable; select the request ID."}
        </p>
      ) : null}

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
        This is {isLiveEvent ? "a local daemon record" : "offline preview fixture data"}.
      </p>
    </aside>
  );
}

function getAuditEventsStateLabel(
  dataMode: AethraDataMode,
  liveAuditEventsState: LiveAuditEventsState,
): string {
  if (dataMode === "fixture") {
    return "Offline preview fixture audit events";
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

function filterAuditRows(
  rows: ReturnType<typeof toAuditEventRows>,
  searchQuery: string,
  auditFilter: AuditFilter,
): ReturnType<typeof toAuditEventRows> {
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();

  return rows.filter((row) => {
    if (auditFilter === "warnings" && row.warningCount === 0) {
      return false;
    }

    if (auditFilter === "cache-hit" && !row.cacheHit) {
      return false;
    }

    if (normalizedSearch.length === 0) {
      return true;
    }

    return [
      row.requestId,
      row.eventType,
      row.routeCode,
      row.tier,
      row.domain,
      row.modelId,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedSearch);
  });
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}
