import type { SustainabilityMetricsResponse } from "../api/contracts";

export type SustainabilityReportDataSource = "fixture" | "live-local";

export type SustainabilityReportInput = {
  generatedAt: string;
  dataSource: SustainabilityReportDataSource;
  metrics: SustainabilityMetricsResponse;
};

export type SustainabilityJsonReport = {
  generated_at: string;
  data_source: SustainabilityReportDataSource;
  period: string;
  requests_total: number;
  local_request_rate: number;
  tier_breakdown: Record<string, number>;
  estimated_cloud_cost_avoided_usd: number;
  estimated_carbon_avoided_kgco2e: number;
  estimated_data_kept_local_gb: number;
  baseline_provider: string;
  baseline_model: string;
  methodology_version: string;
  confidence: string;
  disclaimer: string;
  safety_boundaries: string[];
};

export const sustainabilityReportSafetyBoundaries = [
  "local-only report generated in the browser",
  "no telemetry",
  "no cloud calls",
  "no external coefficient lookup",
  "no SaaS backend",
  "no global opt-in aggregation",
  "no request content, prompts, raw audit text, PII, or machine identifiers",
  "counterfactual proxy estimates only",
  "methodology-dependent",
  "not measured energy use",
  "not actual carbon accounting",
  "not ESG certification",
  "not production compliance evidence",
];

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
    "# Aethra Sustainability Monitor — Local Report",
    "",
    requiredFraming,
    "",
    "## Summary",
    "",
    `- generated_at: ${report.generated_at}`,
    `- data_source: ${report.data_source}`,
    `- period: ${report.period}`,
    `- requests_total: ${report.requests_total}`,
    `- local_request_rate: ${formatRate(report.local_request_rate)}`,
    `- estimated_cloud_cost_avoided_usd: ${formatFixed(report.estimated_cloud_cost_avoided_usd)}`,
    `- estimated CO₂ avoided: ${formatFixed(report.estimated_carbon_avoided_kgco2e)} kgCO2e`,
    `- estimated_data_kept_local_gb: ${formatFixed(report.estimated_data_kept_local_gb)}`,
    `- baseline_provider: ${report.baseline_provider}`,
    `- baseline_model: ${report.baseline_model}`,
    `- methodology_version: ${report.methodology_version}`,
    `- confidence: ${report.confidence}`,
    "",
    "## Tier Breakdown",
    "",
    "| Tier | Count |",
    "| --- | ---: |",
    tierRows || "| none | 0 |",
    "",
    "## Disclaimer",
    "",
    report.disclaimer,
    "",
    "## Safety Boundaries / Limitations",
    "",
    ...report.safety_boundaries.map((boundary) => `- ${boundary}`),
    "",
  ].join("\n");
}

export function buildSustainabilityJsonReport(
  input: SustainabilityReportInput,
): SustainabilityJsonReport {
  const { metrics } = input;

  return {
    generated_at: input.generatedAt,
    data_source: input.dataSource,
    period: metrics.period,
    requests_total: metrics.requests_total,
    local_request_rate: metrics.local_request_rate,
    tier_breakdown: sortTierBreakdown(metrics.tier_breakdown),
    estimated_cloud_cost_avoided_usd:
      metrics.estimated_cloud_cost_avoided_usd,
    estimated_carbon_avoided_kgco2e:
      metrics.estimated_carbon_avoided_kgco2e,
    estimated_data_kept_local_gb: metrics.estimated_data_kept_local_gb,
    baseline_provider: metrics.baseline_provider,
    baseline_model: metrics.baseline_model,
    methodology_version: metrics.methodology_version,
    confidence: metrics.confidence,
    disclaimer: metrics.disclaimer,
    safety_boundaries: [...sustainabilityReportSafetyBoundaries],
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
  URL.revokeObjectURL(url);
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
