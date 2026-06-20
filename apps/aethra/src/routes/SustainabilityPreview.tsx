import { useEffect, useState } from "react";
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
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
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
const emptySustainabilityMetrics: SustainabilityMetricsResponse = {
  ...sustainabilityMetricsFixture,
  period: "30d",
  requests_total: 0,
  local_request_rate: 0,
  tier_breakdown: {},
  estimated_cloud_cost_avoided_usd: 0,
  estimated_carbon_avoided_kgco2e: 0,
  estimated_data_kept_local_gb: 0,
  disclaimer:
    "Live local sustainability metrics have not been loaded. Aethra does not substitute offline preview fixtures into live product state.",
};

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
    : isLiveMode
      ? emptySustainabilityMetrics
      : sustainabilityMetricsFixture;
  const sourceLabel = isLiveLoaded
    ? "Local daemon metrics"
    : isLiveMode
      ? "Live local metrics not loaded"
      : "Offline preview fixture metrics";
  const [methodologyCopyStatus, setMethodologyCopyStatus] = useState<
    "idle" | "copied" | "error"
  >("idle");

  useEffect(() => {
    setMethodologyCopyStatus("idle");
  }, [metrics.methodology_version]);

  async function copyMethodologyVersion() {
    if (!globalThis.navigator?.clipboard?.writeText) {
      setMethodologyCopyStatus("error");
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(
        metrics.methodology_version,
      );
      setMethodologyCopyStatus("copied");
    } catch {
      setMethodologyCopyStatus("error");
    }
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
          <p className="page-subtitle">
            Review methodology-dependent estimates from read-only live-local
            metrics or explicitly labeled offline preview fixtures.
          </p>
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

      <PageHelp
        collapsible
        items={[
          "Review estimated, methodology-dependent proxy indicators from manual live-local metrics or explicit offline preview fixture mode.",
          "Aethra does not expose file download or report export actions from this live-local dashboard.",
          "These values are not measured energy use, not actual carbon accounting, and not formal sustainability reporting.",
        ]}
      />

      <SustainabilityLiveControl
        dataMode={dataMode}
        period={period}
        liveSustainabilityMetricsState={liveSustainabilityMetricsState}
        onPeriodChange={setPeriod}
        onLoadLiveSustainabilityMetrics={onLoadLiveSustainabilityMetrics}
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
                  : isLiveMode
                    ? "No live local metrics loaded"
                    : "Showing bundled offline preview fixture data"}
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
              <dd className="metadata-copy-value">
                <code>{metrics.methodology_version}</code>
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={copyMethodologyVersion}
                >
                  Copy
                </button>
              </dd>
            </div>
            <div>
              <dt>confidence</dt>
              <dd>{metrics.confidence}</dd>
            </div>
          </dl>
          {methodologyCopyStatus !== "idle" ? (
            <p
              className={`copy-feedback copy-feedback-${
                methodologyCopyStatus === "copied" ? "ok" : "warning"
              }`}
            >
              {methodologyCopyStatus === "copied"
                ? "Copied methodology version"
                : "Clipboard unavailable; select the methodology version."}
            </p>
          ) : null}
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

        {dataMode === "fixture" ? (
        <section className="panel" aria-label="Offline preview fixture proxy inputs">
          <div className="panel-heading">
            <h3>Offline preview fixture inputs</h3>
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
        ) : null}
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
};

function SustainabilityLiveControl({
  dataMode,
  period,
  liveSustainabilityMetricsState,
  onPeriodChange,
  onLoadLiveSustainabilityMetrics,
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
            "Sustainability metrics remain unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      <dl className="state-list">
        <div>
          <dt>Source</dt>
          <dd>
            {isLiveMode
              ? "GET /v1/metrics/sustainability"
              : "offline preview fixture sustainability metrics"}
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
        <div className="manual-refresh-card sustainability-refresh-card">
          <span>Manual live-local refresh action</span>
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
        </div>

        <div className="report-export-card">
          <span>Read-only dashboard boundary</span>
          <p>
            This dashboard displays aggregate sustainability metadata only. It
            does not generate downloadable reports, upload metrics, or expose
            raw prompts, raw audit text, PII, or machine identifiers.
          </p>
          <p>
            Estimates are methodology-dependent proxy/counterfactual indicators,
            not certified sustainability reporting and not ESG certification.
          </p>
        </div>
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
