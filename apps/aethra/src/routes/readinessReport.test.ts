import { describe, expect, it } from "vitest";
import {
  buildReadinessMarkdownReport,
  sanitizeReadinessReportText,
} from "./readinessReport";
import type { ReadinessCard } from "./localReadinessSummary";

const safeCards: ReadinessCard[] = [
  {
    id: "daemon-health",
    label: "Daemon health",
    value: "ok",
    detail: "Fixture-backed health status hint.",
    source: "fixture",
    tone: "ok",
  },
  {
    id: "model-runner-hints",
    label: "Model/runner status hints",
    value: "2 hint(s)",
    detail: "Status hints only.",
    source: "fixture",
    tone: "neutral",
  },
];

describe("readiness report export", () => {
  it("builds a copy-safe local preview readiness report", () => {
    const report = buildReadinessMarkdownReport({ cards: safeCards });

    expect(report).toContain("# Aethra Local Readiness Report");
    expect(report).toContain("local preview readiness only");
    expect(report).toContain("manual live-local loading");
    expect(report).toContain("status hints, not controls");
    expect(report).toContain("local helper checks, not certification");
    expect(report).toContain("no production deployment approval");
    expect(report).toContain("cargo run -p ignispromptctl -- readiness");
    expect(report).toContain("make readiness-check");
  });

  it("redacts unsafe report fields before rendering", () => {
    const report = buildReadinessMarkdownReport({
      cards: [
        {
          id: "unsafe",
          label: "hostname devbox username alice",
          value: "api_key sk-test-token",
          detail:
            "prompt: raw user text raw audit text /Users/alice/work localhost production readiness compliance certification signed attestation tamper-evident storage cryptographic verification model controls runner controls",
          source: "fixture",
          tone: "warning",
        },
      ],
      checklist: [
        {
          id: "unsafe-checklist",
          label: "Machine identifier abc123",
          detail: "secret token ghp_example /home/alice",
        },
      ],
      commands: [
        {
          id: "unsafe-command",
          label: "Run unsafe",
          command: "curl http://127.0.0.1:8765 -H 'token: abc'",
          detail: "not rendered",
        },
      ],
    });
    const lowerReport = report.toLowerCase();

    expect(lowerReport).not.toContain("prompt:");
    expect(lowerReport).not.toContain("raw user text");
    expect(lowerReport).not.toContain("raw audit text");
    expect(lowerReport).not.toContain("secret");
    expect(lowerReport).not.toContain("api_key");
    expect(lowerReport).not.toContain("api key");
    expect(lowerReport).not.toContain("sk-test");
    expect(lowerReport).not.toContain("ghp_");
    expect(lowerReport).not.toContain("hostname");
    expect(lowerReport).not.toContain("username");
    expect(lowerReport).not.toContain("machine identifier");
    expect(lowerReport).not.toContain("/users/");
    expect(lowerReport).not.toContain("/home/");
    expect(lowerReport).not.toContain("localhost");
    expect(lowerReport).not.toContain("127.0.0.1");
    expect(lowerReport).not.toContain("production readiness");
    expect(lowerReport).not.toContain("compliance certification");
    expect(lowerReport).not.toContain("security certification");
    expect(lowerReport).not.toContain("signed attestation");
    expect(lowerReport).not.toContain("tamper-evident");
    expect(lowerReport).not.toContain("cryptographic verification");
    expect(lowerReport).not.toContain("model controls");
    expect(lowerReport).not.toContain("runner controls");
  });

  it("keeps empty report inputs conservative", () => {
    const report = buildReadinessMarkdownReport({
      cards: [],
      checklist: [],
      commands: [],
    });

    expect(report).toContain("No readiness card summaries available.");
    expect(report).toContain("No local preview checklist items available.");
    expect(report).toContain("No local helper commands listed.");
  });

  it("sanitizes unsafe phrases without weakening status hint language", () => {
    expect(sanitizeReadinessReportText("model controls")).toBe(
      "model status hints",
    );
    expect(sanitizeReadinessReportText("runner controls")).toBe(
      "runner status hints",
    );
    expect(sanitizeReadinessReportText("production readiness")).toBe(
      "production deployment approval",
    );
  });
});
