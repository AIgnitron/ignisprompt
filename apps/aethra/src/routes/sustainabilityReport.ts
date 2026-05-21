import type { SustainabilityMetricsResponse } from "../api/contracts";

export type SustainabilityReportDataSource = "fixture" | "live-local";

export type SustainabilityReportInput = {
  generatedAt: string;
  dataSource: SustainabilityReportDataSource;
  metrics: SustainabilityMetricsResponse;
};

export type SustainabilityJsonReport = {
  report_schema_version: "aethra-sustainability-report-0.1";
  generated_at: string;
  source: SustainabilityReportDataSource;
  period: string;
  summary: {
    requests_total: number;
    local_request_rate: number;
  };
  estimates: {
    estimated_cloud_cost_avoided_usd: number;
    estimated_carbon_avoided_kgco2e: number;
    estimated_data_kept_local_gb: number;
  };
  tier_breakdown: Record<string, number>;
  baseline: {
    provider: string;
    model: string;
  };
  methodology: {
    version: string;
    framing: string;
  };
  confidence: string;
  disclaimer: string;
  limitations: string[];
  local_only: true;
  export_notes: string[];
};

export const sustainabilityReportLimitations = [
  "counterfactual proxy estimates only",
  "methodology-dependent",
  "not measured energy use",
  "not actual carbon accounting",
  "not ESG certification",
  "not production compliance evidence",
  "not certified sustainability reporting",
] as const;

export const sustainabilityReportExportNotes = [
  "local-only report generated in the browser",
  "client-side generation only",
  "no telemetry",
  "no uploads",
  "no cloud calls",
  "no SaaS backend",
  "no external coefficient lookup",
  "no GitHub lookup",
  "no update checks",
  "no polling",
  "no localStorage or sessionStorage persistence",
  "no prompts, raw request text, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys",
] as const;

const requiredFraming =
  "These values are routing-aware counterfactual proxy estimates. They are methodology-dependent and are not measured energy use, not actual carbon accounting, not ESG certification, and not production compliance evidence.";

export function buildSustainabilityMarkdownReport(
  input: SustainabilityReportInput,
): string {
  const report = buildSustainabilityJsonReport(input);
  const tierRows = Object.entries(report.tier_breakdown)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([tier, count]) => `| ${tier} | ${count} |`)
    .join("\n");

  return [
    "# Aethra Sustainability Monitor - Local Report",
    "",
    requiredFraming,
    "",
    "## Report Metadata",
    "",
    `- report_schema_version: ${report.report_schema_version}`,
    `- generated_at: ${report.generated_at}`,
    `- source: ${report.source}`,
    `- period: ${report.period}`,
    `- local_only: ${String(report.local_only)}`,
    "",
    "## Summary",
    "",
    `- requests_total: ${report.summary.requests_total}`,
    `- local_request_rate: ${formatRate(report.summary.local_request_rate)}`,
    "",
    "## Key Estimates",
    "",
    `- estimated_cloud_cost_avoided_usd: ${formatFixed(report.estimates.estimated_cloud_cost_avoided_usd)}`,
    `- estimated CO₂e avoided: ${formatFixed(report.estimates.estimated_carbon_avoided_kgco2e)} kgCO2e`,
    `- estimated_data_kept_local_gb: ${formatFixed(report.estimates.estimated_data_kept_local_gb)}`,
    "",
    "## Tier Breakdown",
    "",
    "| Tier | Count |",
    "| --- | ---: |",
    tierRows || "| none | 0 |",
    "",
    "## Baseline Assumptions",
    "",
    `- baseline_provider: ${report.baseline.provider}`,
    `- baseline_model: ${report.baseline.model}`,
    "",
    "## Methodology and Confidence",
    "",
    `- methodology_version: ${report.methodology.version}`,
    `- confidence: ${report.confidence}`,
    `- framing: ${report.methodology.framing}`,
    "",
    "## Safety / Disclaimer",
    "",
    report.disclaimer,
    "",
    "## Limitations",
    "",
    ...report.limitations.map((limitation) => `- ${limitation}`),
    "",
    "## Local-Only Export Notes",
    "",
    ...report.export_notes.map((note) => `- ${note}`),
    "",
  ].join("\n");
}

export function buildSustainabilityJsonReport(
  input: SustainabilityReportInput,
): SustainabilityJsonReport {
  const { metrics } = input;

  return {
    report_schema_version: "aethra-sustainability-report-0.1",
    generated_at: input.generatedAt,
    source: input.dataSource,
    period: metrics.period,
    summary: {
      requests_total: metrics.requests_total,
      local_request_rate: metrics.local_request_rate,
    },
    estimates: {
      estimated_cloud_cost_avoided_usd:
        metrics.estimated_cloud_cost_avoided_usd,
      estimated_carbon_avoided_kgco2e:
        metrics.estimated_carbon_avoided_kgco2e,
      estimated_data_kept_local_gb: metrics.estimated_data_kept_local_gb,
    },
    tier_breakdown: sortTierBreakdown(metrics.tier_breakdown),
    baseline: {
      provider: metrics.baseline_provider,
      model: metrics.baseline_model,
    },
    methodology: {
      version: metrics.methodology_version,
      framing: requiredFraming,
    },
    confidence: metrics.confidence,
    disclaimer: metrics.disclaimer,
    limitations: [...sustainabilityReportLimitations],
    local_only: true,
    export_notes: [...sustainabilityReportExportNotes],
  };
}

export function buildSustainabilityJsonReportText(
  input: SustainabilityReportInput,
): string {
  return `${JSON.stringify(buildSustainabilityJsonReport(input), null, 2)}\n`;
}

export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType: string,
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function sortTierBreakdown(
  tierBreakdown: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(tierBreakdown).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatFixed(value: number): string {
  return value.toFixed(6);
}
