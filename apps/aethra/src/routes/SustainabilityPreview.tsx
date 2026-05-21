import { useState } from "react";
import {
  auditEventFixtures,
  healthFixture,
  modelFixtures,
  routeExplainFixture,
} from "../fixtures/aethraFixture";
import { sustainabilityMetricsFixture } from "../api/fixtures";
import type { SustainabilityMetricsResponse } from "../api/contracts";
import type {
  AethraDataMode,
  LiveSustainabilityMetricsState,
} from "../dataSource";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  buildSustainabilityJsonReportText,
  buildSustainabilityMarkdownReport,
  downloadTextFile,
  SustainabilityReportDataSource,
} from "./sustainabilityReport";
import { buildSustainabilitySummary } from "./sustainabilitySummary";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";

const fixtureSummary = buildSustainabilitySummary(
  healthFixture,
  auditEventFixtures,
  [routeExplainFixture],
  modelFixtures,
);

const periodOptions = ["7d", "30d", "90d"] as const;

type SustainabilityPreviewProps = {
  dataMode: AethraDataMode;
  liveSustainabilityMetricsState: LiveSustainabilityMetricsState;
  onLoadLiveSustainabilityMetrics: (period: string) => void;
};

export function SustainabilityPreview({
  dataMode,
  liveSustainabilityMetricsState,
  onLoadLiveSustainabilityMetrics,
}: SustainabilityPreviewProps) {
  const [period, setPeriod] = useState("30d");
  const isLiveMode = dataMode === "live-local";
  const isLiveLoaded =
    isLiveMode && liveSustainabilityMetricsState.status === "loaded";
  const metrics = isLiveLoaded
    ? liveSustainabilityMetricsState.metrics
    : sustainabilityMetricsFixture;
  const sourceLabel = isLiveLoaded
    ? "Live local metrics"
    : isLiveMode
      ? "Fixture fallback metrics"
      : "Fixture metrics";
  const reportDataSource: SustainabilityReportDataSource = isLiveLoaded
    ? "live-local"
    : "fixture";

  function exportMarkdownReport() {
    const generatedAt = new Date().toISOString();
    downloadTextFile(
      buildReportFilename("md", metrics.period, reportDataSource),
      buildSustainabilityMarkdownReport({
        generatedAt,
        dataSource: reportDataSource,
        metrics,
      }),
      "text/markdown;charset=utf-8",
    );
  }

  function exportJsonReport() {
    const generatedAt = new Date().toISOString();
    downloadTextFile(
      buildReportFilename("json", metrics.period, reportDataSource),
      buildSustainabilityJsonReportText({
        generatedAt,
        dataSource: reportDataSource,
        metrics,
      }),
      "application/json;charset=utf-8",
    );
  }

  return (
    <section id="sustainability-preview" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sustainability Preview</p>
          <h2>
            {isLiveLoaded
              ? "Live local: counterfactual proxy estimates"
              : "Preview only: proxy indicators"}
          </h2>
        </div>
        <div
          className="status-strip"
          aria-label="Sustainability Preview status"
        >
          <StatusBadge tone={isLiveLoaded ? "warning" : "neutral"}>
            {sourceLabel}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="warning">Methodology-dependent</StatusBadge>
        </div>
      </header>

      <SustainabilityLiveControl
        dataMode={dataMode}
        period={period}
        liveSustainabilityMetricsState={liveSustainabilityMetricsState}
        onPeriodChange={setPeriod}
        onLoadLiveSustainabilityMetrics={onLoadLiveSustainabilityMetrics}
        onExportMarkdown={exportMarkdownReport}
        onExportJson={exportJsonReport}
      />

      <div className="metric-grid" aria-label="Sustainability proxy metrics">
        <MetricCard
          label="requests_total"
          value={metrics.requests_total}
          detail={`${sourceLabel}; endpoint period ${metrics.period}`}
        />
        <MetricCard
          label="local_request_rate"
          value={formatRate(metrics.local_request_rate)}
          detail="Share of records where data stayed local"
        />
        <MetricCard
          label="estimated_cloud_cost_avoided_usd"
          value={formatUsd(metrics.estimated_cloud_cost_avoided_usd)}
          detail="Counterfactual proxy estimate"
        />
        <MetricCard
          label="estimated_carbon_avoided_kgco2e"
          value={formatKg(metrics.estimated_carbon_avoided_kgco2e)}
          detail="Methodology-dependent proxy estimate"
        />
        <MetricCard
          label="estimated_data_kept_local_gb"
          value={formatGb(metrics.estimated_data_kept_local_gb)}
          detail="Estimated request/response data kept local"
        />
      </div>

      <div className="sustainability-layout">
        <section className="panel" aria-label="Live sustainability metrics">
          <div className="panel-heading">
            <div>
              <h3>Routing-aware impact estimates</h3>
              <p className="muted">
                {isLiveLoaded
                  ? "Loaded manually from the configured local daemon"
                  : "Showing bundled fixture fallback data"}
              </p>
            </div>
            <StatusBadge tone="warning">Proxy only</StatusBadge>
          </div>
          <dl className="state-list">
            <div>
              <dt>period</dt>
              <dd>{metrics.period}</dd>
            </div>
            <div>
              <dt>baseline_provider</dt>
              <dd>{metrics.baseline_provider}</dd>
            </div>
            <div>
              <dt>baseline_model</dt>
              <dd>{metrics.baseline_model}</dd>
            </div>
            <div>
              <dt>methodology_version</dt>
              <dd>{metrics.methodology_version}</dd>
            </div>
            <div>
              <dt>confidence</dt>
              <dd>{metrics.confidence}</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-label="Tier breakdown">
          <div className="panel-heading">
            <h3>tier_breakdown</h3>
            <StatusBadge tone="neutral">Route metadata</StatusBadge>
          </div>
          {Object.keys(metrics.tier_breakdown).length > 0 ? (
            <dl className="state-list">
              {Object.entries(metrics.tier_breakdown)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([tier, count]) => (
                  <div key={tier}>
                    <dt>{tier}</dt>
                    <dd>{count}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <EmptyState
              {...localPreviewEmptyStates.sustainabilityTierBreakdownEmpty}
            />
          )}
        </section>

        <section className="panel" aria-label="Methodology disclaimer">
          <div className="panel-heading">
            <h3>Disclaimer</h3>
            <StatusBadge tone="warning">Always visible</StatusBadge>
          </div>
          <p className="explanation">{metrics.disclaimer}</p>
          <p className="explanation">
            Aethra presents these values as estimated, proxy, counterfactual,
            and methodology-dependent indicators. They are not measured energy
            use, measured carbon output, sustainability certification, or
            compliance evidence.
          </p>
        </section>

        <section className="panel" aria-label="Fixture proxy inputs">
          <div className="panel-heading">
            <h3>Fixture fallback inputs</h3>
            <StatusBadge tone="neutral">Demo-safe</StatusBadge>
          </div>
          <dl className="state-list">
            <div>
              <dt>local_only fixture</dt>
              <dd>{String(fixtureSummary.localOnlyStatus)}</dd>
            </div>
            <div>
              <dt>local audit records</dt>
              <dd>{fixtureSummary.localAuditEventCount}</dd>
            </div>
            <div>
              <dt>cloud-disallowed routes</dt>
              <dd>{fixtureSummary.cloudDisallowedRouteCount}</dd>
            </div>
            <div>
              <dt>cache hits</dt>
              <dd>{fixtureSummary.cacheHitCount}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}

type SustainabilityLiveControlProps = {
  dataMode: AethraDataMode;
  period: string;
  liveSustainabilityMetricsState: LiveSustainabilityMetricsState;
  onPeriodChange: (period: string) => void;
  onLoadLiveSustainabilityMetrics: (period: string) => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
};

function SustainabilityLiveControl({
  dataMode,
  period,
  liveSustainabilityMetricsState,
  onPeriodChange,
  onLoadLiveSustainabilityMetrics,
  onExportMarkdown,
  onExportJson,
}: SustainabilityLiveControlProps) {
  const isLiveMode = dataMode === "live-local";
  const canLoad =
    isLiveMode && liveSustainabilityMetricsState.status !== "loading";

  return (
    <section
      className="panel sustainability-live-control"
      aria-label="Live local sustainability metrics"
    >
      <div className="panel-heading">
        <div>
          <h3>Live local sustainability metrics</h3>
          <p className="muted">
            Manual read-only load from
            {" GET /v1/metrics/sustainability?period="}
            {period}
          </p>
        </div>
        <StatusBadge
          tone={
            liveSustainabilityMetricsState.status === "error"
              ? "warning"
              : liveSustainabilityMetricsState.status === "loaded" &&
                  isLiveMode
                ? "neutral"
                : "neutral"
          }
        >
          {getSustainabilityStateLabel(
            dataMode,
            liveSustainabilityMetricsState,
          )}
        </StatusBadge>
      </div>

      {isLiveMode && liveSustainabilityMetricsState.status === "not-loaded" ? (
        <EmptyState {...localPreviewEmptyStates.sustainabilityNotLoaded} />
      ) : null}
      {isLiveMode && liveSustainabilityMetricsState.status === "loading" ? (
        <p className="inline-notice">
          Loading live local sustainability metrics from the configured local
          daemon.
        </p>
      ) : null}
      {isLiveMode && liveSustainabilityMetricsState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveSustainabilityMetricsState.label,
            liveSustainabilityMetricsState.message,
            "Fixture fallback estimates remain visible.",
          )}
        />
      ) : null}

      <dl className="state-list">
        <div>
          <dt>Source</dt>
          <dd>
            {isLiveMode
              ? "GET /v1/metrics/sustainability"
              : "fixture sustainability metrics"}
          </dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {liveSustainabilityMetricsState.status === "loaded" && isLiveMode
              ? formatTimestamp(liveSustainabilityMetricsState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      <div className="sustainability-action-row">
        <label className="form-field sustainability-period-field">
          <span>Period</span>
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
            disabled={liveSustainabilityMetricsState.status === "loading"}
          >
            {periodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary-button"
          disabled={!canLoad}
          onClick={() => onLoadLiveSustainabilityMetrics(period)}
        >
          {liveSustainabilityMetricsState.status === "loading"
            ? "Loading metrics"
            : "Load live sustainability metrics"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onExportMarkdown}
        >
          Export Markdown
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onExportJson}
        >
          Export JSON
        </button>
      </div>
    </section>
  );
}

function getSustainabilityStateLabel(
  dataMode: AethraDataMode,
  liveSustainabilityMetricsState: LiveSustainabilityMetricsState,
): string {
  if (dataMode === "fixture") {
    return "Fixture metrics";
  }

  switch (liveSustainabilityMetricsState.status) {
    case "not-loaded":
      return "Live metrics not loaded";
    case "loading":
      return "Loading live metrics";
    case "loaded":
      return "Live metrics loaded";
    case "error":
      return liveSustainabilityMetricsState.label;
  }
}

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(6)}`;
}

function formatKg(value: number): string {
  return `${value.toFixed(6)} kgCO2e`;
}

function formatGb(value: number): string {
  return `${value.toFixed(6)} GB`;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildReportFilename(
  extension: "md" | "json",
  period: string,
  dataSource: SustainabilityReportDataSource,
): string {
  return `aethra-sustainability-report-${dataSource}-${period}.${extension}`;
}
