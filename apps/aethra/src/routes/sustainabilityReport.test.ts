import { describe, expect, it } from "vitest";
import { sustainabilityMetricsFixture } from "../api/fixtures";
import {
  buildSustainabilityJsonReport,
  buildSustainabilityJsonReportText,
  buildSustainabilityMarkdownReport,
} from "./sustainabilityReport";

const reportInput = {
  generatedAt: "2026-05-17T18:30:00.000Z",
  dataSource: "fixture" as const,
  metrics: sustainabilityMetricsFixture,
};

describe("sustainability report export formatting", () => {
  it("formats a human-readable Markdown report with required methodology fields", () => {
    const markdown = buildSustainabilityMarkdownReport(reportInput);

    expect(markdown).toContain(
      "# Aethra Sustainability Monitor — Local Report",
    );
    expect(markdown).toContain("- generated_at: 2026-05-17T18:30:00.000Z");
    expect(markdown).toContain("- data_source: fixture");
    expect(markdown).toContain(
      `- methodology_version: ${sustainabilityMetricsFixture.methodology_version}`,
    );
    expect(markdown).toContain(
      `- confidence: ${sustainabilityMetricsFixture.confidence}`,
    );
    expect(markdown).toContain(sustainabilityMetricsFixture.disclaimer);
  });

  it("emits conservative language and avoids unsafe claim phrases", () => {
    const markdown = buildSustainabilityMarkdownReport(reportInput);

    expect(markdown).toContain("estimated CO₂ avoided");
    expect(markdown).toContain("counterfactual proxy estimates");
    expect(markdown).toContain("methodology-dependent");
    expect(markdown).toContain("not actual carbon accounting");
    expect(markdown).toContain("not ESG certification");
    expect(markdown).toContain("not production compliance evidence");
    expect(markdown).not.toContain(["CO2", "saved"].join(" "));
    expect(markdown).not.toContain(["CO₂", "saved"].join(" "));
    expect(markdown).not.toContain(["carbon", "saved"].join(" "));
    expect(markdown).not.toContain(["actual", "emissions"].join(" "));
    expect(markdown).not.toContain(["zero", "emissions"].join(" "));
    expect(markdown).not.toContain(["ESG", "certified"].join(" "));
  });

  it("builds a deterministic JSON report shape without raw request data", () => {
    const report = buildSustainabilityJsonReport(reportInput);

    expect(report).toEqual({
      generated_at: "2026-05-17T18:30:00.000Z",
      data_source: "fixture",
      period: sustainabilityMetricsFixture.period,
      requests_total: sustainabilityMetricsFixture.requests_total,
      local_request_rate: sustainabilityMetricsFixture.local_request_rate,
      tier_breakdown: {
        TIER_3: 3,
      },
      estimated_cloud_cost_avoided_usd:
        sustainabilityMetricsFixture.estimated_cloud_cost_avoided_usd,
      estimated_carbon_avoided_kgco2e:
        sustainabilityMetricsFixture.estimated_carbon_avoided_kgco2e,
      estimated_data_kept_local_gb:
        sustainabilityMetricsFixture.estimated_data_kept_local_gb,
      baseline_provider: sustainabilityMetricsFixture.baseline_provider,
      baseline_model: sustainabilityMetricsFixture.baseline_model,
      methodology_version: sustainabilityMetricsFixture.methodology_version,
      confidence: sustainabilityMetricsFixture.confidence,
      disclaimer: sustainabilityMetricsFixture.disclaimer,
      safety_boundaries: expect.arrayContaining([
        "no request content, prompts, raw audit text, PII, or machine identifiers",
        "not actual carbon accounting",
        "not ESG certification",
        "not production compliance evidence",
      ]),
    });
    expect(report).not.toHaveProperty("request_content");
    expect(report).not.toHaveProperty("raw_audit_text");
    expect(report).not.toHaveProperty("machine_id");
    expect(report).not.toHaveProperty("pii");
  });

  it("serializes deterministic JSON text", () => {
    expect(buildSustainabilityJsonReportText(reportInput)).toMatchInlineSnapshot(`
      "{
        "generated_at": "2026-05-17T18:30:00.000Z",
        "data_source": "fixture",
        "period": "30d",
        "requests_total": 3,
        "local_request_rate": 1,
        "tier_breakdown": {
          "TIER_3": 3
        },
        "estimated_cloud_cost_avoided_usd": 0.000034,
        "estimated_carbon_avoided_kgco2e": 0.000003,
        "estimated_data_kept_local_gb": 0,
        "baseline_provider": "openai",
        "baseline_model": "gpt-4.1-mini",
        "methodology_version": "aethra-impact-0.1",
        "confidence": "low",
        "disclaimer": "Demo data: Aethra sustainability values are local-only counterfactual proxy estimates. They are methodology-dependent, not measured energy use, not actual carbon accounting, not sustainability certification, and not compliance evidence.",
        "safety_boundaries": [
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
          "not production compliance evidence"
        ]
      }
      "
    `);
  });
});
