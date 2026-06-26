import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuditEvents } from "./AuditEvents";
import { EvidenceBundleViewer } from "./EvidenceBundleViewer";
import { Help } from "./Help";
import { ModelRunnerStatus } from "./ModelRunnerStatus";
import { Overview } from "./Overview";
import { RoutingExplorer } from "./RoutingExplorer";
import { SustainabilityPreview } from "./SustainabilityPreview";

const noop = () => undefined;

const forbiddenActionLabels = [
  "Enable cloud",
  "Run model",
  "Execute model",
  "Download model",
  "Delete model",
  "Edit connector",
  "Disable connector",
  "Edit policy",
  "Mutate policy",
  "Mutate routing",
  "Upload package",
  "Download package",
  "Delete package",
  "Generate package",
  "Validate package",
  "Export Markdown",
  "Export JSON",
  "Download report",
  "Run live route",
  "Live local route-explain",
  "Submit prompt",
] as const;

const forbiddenClaimPhrases = [
  "production-ready",
  "Validated legal",
  "Legal correctness proven",
  "Compliance certified",
  "Certified compliance",
  "Formal attestation",
] as const;

const defaultRunnerProcessProps = {
  liveRunnerProcessStatusState: { status: "not-loaded" } as const,
  localBaseUrl: "http://127.0.0.1:8765",
  runnerLifecycleRefreshRequired: false,
  onLoadLiveRunnerProcessStatus: noop,
  onRunnerLifecycleAttempt: noop,
};

function expectNoUnsafeActions(markup: string) {
  for (const label of forbiddenActionLabels) {
    expect(markup).not.toContain(label);
  }
}

function expectNoPositiveClaims(markup: string) {
  for (const phrase of forbiddenClaimPhrases) {
    expect(markup).not.toContain(phrase);
  }
}

function renderLiveLocalOverview() {
  return renderToStaticMarkup(
    <Overview
      dataMode="live-local"
      baseUrl="http://127.0.0.1:8765"
      liveHealthState={{ status: "not-loaded" }}
      liveModelsState={{ status: "not-loaded" }}
      liveModelInventoryState={{ status: "not-loaded" }}
      liveModelReadinessState={{ status: "not-loaded" }}
      liveRoutingPolicyState={{ status: "not-loaded" }}
      liveEvidencePackagesState={{ status: "not-loaded" }}
      liveModelStatusState={{ status: "not-loaded" }}
      liveCapabilitiesState={{ status: "not-loaded" }}
      liveVersionStatusState={{ status: "not-loaded" }}
      liveAuditEventsState={{ status: "not-loaded" }}
      liveSustainabilityMetricsState={{ status: "not-loaded" }}
      liveOperationsSummaryState={{ status: "not-loaded" }}
      onLoadLiveHealth={noop}
      onLoadLiveVersionStatus={noop}
      onNavigateToRoute={noop}
    />,
  );
}

function renderMainRouteSet() {
  return [
    renderLiveLocalOverview(),
    renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={noop}
        onLoadLiveModelInventory={noop}
        onLoadLiveModelStatus={noop}
        onLoadLiveCapabilities={noop}
      />,
    ),
    renderToStaticMarkup(
      <RoutingExplorer
        dataMode="live-local"
        localBaseUrl="http://127.0.0.1:8765"
        liveRoutingPolicyState={{ status: "not-loaded" }}
      />,
    ),
    renderToStaticMarkup(
      <AuditEvents
        dataMode="live-local"
        liveAuditEventsState={{ status: "not-loaded" }}
        liveOperationsSummaryState={{ status: "not-loaded" }}
        onLoadLiveAuditEvents={noop}
      />,
    ),
    renderToStaticMarkup(
      <EvidenceBundleViewer
        dataMode="live-local"
        liveEvidencePackagesState={{ status: "not-loaded" }}
      />,
    ),
    renderToStaticMarkup(
      <SustainabilityPreview
        dataMode="live-local"
        liveSustainabilityMetricsState={{ status: "not-loaded" }}
        onLoadLiveSustainabilityMetrics={noop}
      />,
    ),
  ];
}

describe("Aethra demo smoke and review readiness", () => {
  it("renders the main live-local demo route set with stable page purposes", () => {
    const markups = renderMainRouteSet();
    const combined = markups.join("\n");

    expect(combined).toContain("Live Local Dashboard");
    expect(combined).toContain("Model and runner status hints");
    expect(combined).toContain("Route inspection only");
    expect(combined).toContain("Local audit records");
    expect(combined).toContain("Local evidence bundle workflow");
    expect(combined).toContain("Live local sustainability metrics");
    expect(combined).toContain("Capability and status matrix");
    expect(combined).toContain("Data source");

    for (const markup of markups) {
      expect(markup).toContain("Read-only");
      expectNoUnsafeActions(markup);
      expectNoPositiveClaims(markup);
      expect(markup).not.toContain("Boundaries");
      expect(markup).not.toContain("Local demo boundary reminders");
      expect(markup).not.toContain("Local preview boundary reminders");
    }
  });

  it("keeps the polished review flow and grouped dashboard sections visible", () => {
    const markup = renderLiveLocalOverview();

    expect(markup).toContain("What is happening now?");
    expect(markup).toContain("Suggested Review Flow");
    expect(markup).toContain("What this dashboard proves");
    expect(markup).toContain("Data source details");
    expect(markup).toContain("Product limits");
    expect(markup).toContain("Core daemon status");
    expect(markup).toContain("Models and readiness");
    expect(markup).toContain("Routing and operations");
    expect(markup).toContain("Evidence and audit");
    expect(markup).toContain("Sustainability");
    expect(markup).toContain("Endpoint Matrix");
    expect(markup).toContain("not loaded");
    expect(markup).toContain("live local");
    expect(markup).not.toContain("Not legal advice");
    expect(markup).not.toContain("Not compliance claims");
    expect(markup).not.toContain("Not ESG reporting evidence");
  });

  it("keeps live-local default not-loaded without startup fetches or fixture substitution", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const appMarkup = renderToStaticMarkup(<App />);
    const overviewMarkup = renderLiveLocalOverview();

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();

    expect(appMarkup).toContain("Live local daemon dashboard");
    expect(appMarkup).toContain("Not loaded yet");
    expect(overviewMarkup).toContain("not loaded");
    expect(overviewMarkup).not.toContain("Fixture-only demo data");
    expect(overviewMarkup).not.toContain("Offline Preview Fixture");
  });

  it("keeps explicit offline preview fixture labeling separate from live-local state", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="fixture"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={noop}
        onLoadLiveModelInventory={noop}
        onLoadLiveModelStatus={noop}
        onLoadLiveCapabilities={noop}
      />,
    );

    expect(markup).toContain("Offline preview fixture");
    expect(markup).toContain("Offline preview fixture capabilities");
    expect(markup).toContain("Stub Legal Runner");
    expectNoUnsafeActions(markup);
  });

  it("shows failed and unavailable endpoint states without replacing them with fixtures", () => {
    const markup = renderToStaticMarkup(
      <Overview
        dataMode="live-local"
        baseUrl="http://127.0.0.1:8765"
        liveHealthState={{
          status: "error",
          label: "Daemon unreachable",
          message:
            "Aethra could not reach the configured local IgnisPrompt daemon.",
          diagnosticKind: "daemon-unreachable",
          checkedAt: "2026-06-20T00:00:00Z",
        }}
        liveModelsState={{
          status: "error",
          label: "Endpoint unavailable",
          message: "The local daemon returned HTTP 404.",
          diagnosticKind: "endpoint-unavailable",
          checkedAt: "2026-06-20T00:00:00Z",
        }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveRoutingPolicyState={{ status: "not-loaded" }}
        liveEvidencePackagesState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        liveVersionStatusState={{ status: "not-loaded" }}
        liveAuditEventsState={{ status: "not-loaded" }}
        liveSustainabilityMetricsState={{ status: "not-loaded" }}
        liveOperationsSummaryState={{ status: "not-loaded" }}
        onLoadLiveHealth={noop}
        onLoadLiveVersionStatus={noop}
        onNavigateToRoute={noop}
      />,
    );

    expect(markup).toContain("daemon unavailable");
    expect(markup).toContain("failed");
    expect(markup).toContain("unavailable");
    expect(markup).toContain("Aethra could not reach the configured local IgnisPrompt daemon.");
    expect(markup).not.toContain("Fixture-only demo data");
    expect(markup).not.toContain("Stub Legal Runner");
  });

  it("does not add polling, browser storage, or route execution APIs to the app shell", () => {
    const appSource = App.toString();

    expect(appSource).not.toContain("setInterval");
    expect(appSource).not.toContain("localStorage");
    expect(appSource).not.toContain("sessionStorage");
    expect(appSource).not.toContain("routeExplain(");
  });

  it("keeps long explanatory guidance on Help", () => {
    const markup = renderToStaticMarkup(<Help />);

    expect(markup).toContain("Safety / Product Limits");
    expect(markup).toContain("Aethra is not legal advice");
    expect(markup).toContain("No telemetry or cloud calls are made by default");
    expect(markup).toContain("Manual refresh means Aethra does not poll");
  });
});
