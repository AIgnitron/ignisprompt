import { describe, expect, it } from "vitest";
import {
  buildReadinessMarkdownReport,
  sanitizeReadinessReportText,
} from "./readinessReport";
import type {
  ReadinessCard,
  ReadinessDiagnostic,
  ReadinessPackagePreview,
} from "./localReadinessSummary";

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

const safeDiagnostics: ReadinessDiagnostic[] = [
  {
    id: "daemon-health",
    label: "Daemon health",
    category: "daemon",
    status: "ok",
    severity: "info",
    localNextStep: "No local action needed for this status hint.",
    boundaryNote: "local preview readiness only",
    source: "fixture",
  },
  {
    id: "model-runner-hints",
    label: "Model/runner status hints",
    category: "runner hints",
    status: "status hint",
    severity: "advisory",
    localNextStep: "Review model and runner status hints as prerequisites only.",
    boundaryNote: "status hints, not controls",
    source: "fixture",
  },
];

const safePackagePreview: ReadinessPackagePreview = {
  schemaVersion: "ignisprompt-readiness-package-0.1",
  packageMode: "local-preview",
  packageRoot: "local-evidence/readiness/demo-readiness",
  status: "local_preview_ready",
  generatedFiles: [
    "README.md",
    "manifest.json",
    "readiness-summary.json",
    "readiness-report.json",
    "readiness-report.md",
  ],
  categories: [
    { category: "daemon", severity: "info", status: "ok" },
    { category: "runner hints", severity: "advisory", status: "status hint" },
  ],
  localNextSteps: ["No local action needed for this status hint."],
  boundaryNotes: [
    "local preview readiness only",
    "status hints, not controls",
    "local helper checks, not certification",
    "no telemetry",
    "no cloud calls by default",
  ],
};

describe("readiness report export", () => {
  it("builds a copy-safe local preview readiness report", () => {
    const report = buildReadinessMarkdownReport({
      cards: safeCards,
      diagnostics: safeDiagnostics,
      packagePreview: safePackagePreview,
    });

    expect(report).toContain("# Aethra Local Readiness Report");
    expect(report).toContain("local preview readiness only");
    expect(report).toContain("manual live-local loading");
    expect(report).toContain("status hints, not controls");
    expect(report).toContain("local helper checks, not certification");
    expect(report).toContain("no production deployment approval");
    expect(report).toContain("## Diagnostic Details");
    expect(report).toContain("category=runner hints");
    expect(report).toContain("next_step=Review model and runner status hints");
    expect(report).toContain("## Readiness Package Preview");
    expect(report).toContain("ignisprompt-readiness-package-0.1");
    expect(report).toContain("local-evidence/readiness/demo-readiness");
    expect(report).toContain("readiness-report.json");
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
      diagnostics: [
        {
          id: "unsafe-diagnostic",
          label: "hostname devbox",
          category: "runner hints",
          status: "needs attention",
          severity: "required",
          localNextStep:
            "prompt: raw audit text /Users/alice token sk-test production readiness",
          boundaryNote:
            "compliance certification signed attestation tamper-evident storage cryptographic verification model controls runner controls",
          source: "fixture",
        },
      ],
      packagePreview: {
        ...safePackagePreview,
        packageRoot: "/Users/alice/local-evidence/readiness",
        boundaryNotes: [
          "hostname username prompt: raw audit text production readiness compliance certification signed attestation tamper-evident storage cryptographic verification",
        ],
      },
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
    expect(lowerReport).not.toContain("production-grade inference");
    expect(lowerReport).not.toContain("production-grade security");
    expect(lowerReport).not.toContain("supply-chain certification");
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
