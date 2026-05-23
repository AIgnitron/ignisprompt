import { afterEach, describe, expect, it, vi } from "vitest";
import { sustainabilityMetricsFixture } from "../api/fixtures";
import {
  buildSustainabilityJsonReport,
  buildSustainabilityJsonReportText,
  buildSustainabilityMarkdownReport,
  downloadTextFile,
} from "./sustainabilityReport";

const reportInput = {
  generatedAt: "2026-05-17T18:30:00.000Z",
  dataSource: "fixture" as const,
  metrics: sustainabilityMetricsFixture,
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "document");
});

describe("sustainability report export formatting", () => {
  it("formats a structured Markdown report with required sections", () => {
    const markdown = buildSustainabilityMarkdownReport(reportInput);

    expect(markdown).toContain("# Aethra Sustainability Monitor - Local Report");
    expect(markdown).toContain("## Report Metadata");
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("## Key Estimates");
    expect(markdown).toContain("## Tier Breakdown");
    expect(markdown).toContain("## Baseline Assumptions");
    expect(markdown).toContain("## Methodology and Confidence");
    expect(markdown).toContain("## Safety / Disclaimer");
    expect(markdown).toContain("## Limitations");
    expect(markdown).toContain("## Local-Only Export Notes");
    expect(markdown).toContain(
      "- report_schema_version: aethra-sustainability-report-0.1",
    );
    expect(markdown).toContain("- generated_at: 2026-05-17T18:30:00.000Z");
    expect(markdown).toContain("- source: fixture");
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

    expect(markdown).toContain("estimated CO₂e avoided");
    expect(markdown).toContain("counterfactual proxy estimates");
    expect(markdown).toContain("methodology-dependent");
    expect(markdown).toContain("not actual carbon accounting");
    expect(markdown).toContain("not ESG certification");
    expect(markdown).toContain("not production compliance evidence");
    expect(markdown).toContain("not certified sustainability reporting");
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
      report_schema_version: "aethra-sustainability-report-0.1",
      generated_at: "2026-05-17T18:30:00.000Z",
      source: "fixture",
      period: sustainabilityMetricsFixture.period,
      summary: {
        requests_total: sustainabilityMetricsFixture.requests_total,
        local_request_rate: sustainabilityMetricsFixture.local_request_rate,
      },
      estimates: {
        estimated_cloud_cost_avoided_usd:
          sustainabilityMetricsFixture.estimated_cloud_cost_avoided_usd,
        estimated_carbon_avoided_kgco2e:
          sustainabilityMetricsFixture.estimated_carbon_avoided_kgco2e,
        estimated_data_kept_local_gb:
          sustainabilityMetricsFixture.estimated_data_kept_local_gb,
      },
      tier_breakdown: {
        TIER_3: 3,
      },
      baseline: {
        provider: sustainabilityMetricsFixture.baseline_provider,
        model: sustainabilityMetricsFixture.baseline_model,
      },
      methodology: {
        version: sustainabilityMetricsFixture.methodology_version,
        framing:
          "These values are routing-aware counterfactual proxy estimates. They are methodology-dependent and are not measured energy use, not actual carbon accounting, not ESG certification, and not production compliance evidence.",
      },
      confidence: sustainabilityMetricsFixture.confidence,
      disclaimer: sustainabilityMetricsFixture.disclaimer,
      limitations: expect.arrayContaining([
        "not actual carbon accounting",
        "not ESG certification",
        "not production compliance evidence",
      ]),
      local_only: true,
      export_notes: expect.arrayContaining([
        "no prompts, raw request text, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys",
        "no telemetry",
        "no uploads",
        "no external coefficient lookup",
      ]),
    });
    expect(report.methodology.version).toBe(
      sustainabilityMetricsFixture.methodology_version,
    );
    expect(report.confidence).toBe(sustainabilityMetricsFixture.confidence);
    expect(report.disclaimer).toBe(sustainabilityMetricsFixture.disclaimer);
    expect(report).not.toHaveProperty("request_content");
    expect(report).not.toHaveProperty("raw_audit_text");
    expect(report).not.toHaveProperty("raw_audit_event_bodies");
    expect(report).not.toHaveProperty("machine_id");
    expect(report).not.toHaveProperty("hostname");
    expect(report).not.toHaveProperty("username");
    expect(report).not.toHaveProperty("filesystem_path");
    expect(report).not.toHaveProperty("pii");
  });

  it("redacts sensitive local identifiers from report text fields", () => {
    const sensitiveInput = {
      ...reportInput,
      metrics: {
        ...sustainabilityMetricsFixture,
        baseline_provider: "api_keyABCDEF1234567890",
        baseline_model: "/Users/alice/models/legal.gguf",
        methodology_version: "hostname=workstation.local",
        confidence: "username=alice",
        disclaimer:
          "Contact alice@example.com; prompt: synthetic private request text.",
      },
    };
    const markdown = buildSustainabilityMarkdownReport(sensitiveInput);
    const jsonText = buildSustainabilityJsonReportText(sensitiveInput);

    for (const reportText of [markdown, jsonText]) {
      expect(reportText).not.toContain("api_keyABCDEF1234567890");
      expect(reportText).not.toContain("/Users/alice");
      expect(reportText).not.toContain("workstation.local");
      expect(reportText).not.toContain("username=alice");
      expect(reportText).not.toContain("alice@example.com");
      expect(reportText).not.toContain("synthetic private request text");
      expect(reportText).toContain("[redacted local-only report field]");
    }
  });

  it("supports live-local displayed metrics without changing report shape", () => {
    const report = buildSustainabilityJsonReport({
      ...reportInput,
      dataSource: "live-local",
    });

    expect(report.source).toBe("live-local");
    expect(report.local_only).toBe(true);
    expect(report.report_schema_version).toBe(
      "aethra-sustainability-report-0.1",
    );
  });

  it("serializes deterministic JSON text", () => {
    expect(buildSustainabilityJsonReportText(reportInput)).toMatchInlineSnapshot(`
      "{
        "report_schema_version": "aethra-sustainability-report-0.1",
        "generated_at": "2026-05-17T18:30:00.000Z",
        "source": "fixture",
        "period": "30d",
        "summary": {
          "requests_total": 3,
          "local_request_rate": 1
        },
        "estimates": {
          "estimated_cloud_cost_avoided_usd": 0.000034,
          "estimated_carbon_avoided_kgco2e": 0.000003,
          "estimated_data_kept_local_gb": 0
        },
        "tier_breakdown": {
          "TIER_3": 3
        },
        "baseline": {
          "provider": "openai",
          "model": "gpt-4.1-mini"
        },
        "methodology": {
          "version": "aethra-impact-0.1",
          "framing": "These values are routing-aware counterfactual proxy estimates. They are methodology-dependent and are not measured energy use, not actual carbon accounting, not ESG certification, and not production compliance evidence."
        },
        "confidence": "low",
        "disclaimer": "Demo data: Aethra sustainability values are local-only counterfactual proxy estimates. They are methodology-dependent, not measured energy use, not actual carbon accounting, not sustainability certification, and not compliance evidence.",
        "limitations": [
          "counterfactual proxy estimates only",
          "methodology-dependent",
          "not measured energy use",
          "not actual carbon accounting",
          "not ESG certification",
          "not production compliance evidence",
          "not certified sustainability reporting"
        ],
        "local_only": true,
        "export_notes": [
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
          "no prompts, raw request text, raw audit event bodies, PII, machine identifiers, hostnames, usernames, filesystem paths, secrets, or API keys"
        ]
      }
      "
    `);
  });

  it("delays blob URL revocation until after the download click task", () => {
    vi.useFakeTimers();
    const anchor = {
      download: "",
      href: "",
      rel: "",
      style: { display: "" },
      click: vi.fn(),
      remove: vi.fn(),
    };
    const append = vi.fn();
    const createElement = vi.fn(() => anchor);
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:aethra-report");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        body: { append },
        createElement,
      },
    });

    downloadTextFile("report.md", "local report", "text/markdown");

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElement).toHaveBeenCalledWith("a");
    expect(anchor.href).toBe("blob:aethra-report");
    expect(anchor.download).toBe("report.md");
    expect(append).toHaveBeenCalledWith(anchor);
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:aethra-report");
  });
});
