import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  capabilitiesFixture,
  modelInventoryFixture,
  modelReadinessFixture,
} from "../api/fixtures";
import { ModelRunnerStatus } from "./ModelRunnerStatus";

const noop = () => undefined;
const defaultRunnerProcessProps = {
  liveRunnerProcessStatusState: { status: "not-loaded" } as const,
  localBaseUrl: "http://127.0.0.1:8765",
  runnerLifecycleRefreshRequired: false,
  onLoadLiveRunnerProcessStatus: noop,
  onRunnerLifecycleAttempt: noop,
};

describe("ModelRunnerStatus route", () => {
  it("renders the fixture-backed capability matrix with concise product copy", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="fixture"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Capability matrix");
    expect(markup).toContain("Local model inventory");
    expect(markup).toContain("Local model readiness");
    expect(markup).toContain("offline preview readiness metadata");
    expect(markup).toContain("offline preview inventory metadata");
    expect(markup).toContain("Data source: Offline preview fixture");
    expect(markup).toContain("Total capabilities");
    expect(markup).toContain("Available/configured");
    expect(markup).toContain("Unavailable/disabled");
    expect(markup).toContain("Route ladder");
    expect(markup).toContain("Stub Legal Runner");
    expect(markup).toContain("cloud with consent");
    expect(markup).toContain("Operator Mode off");
    expect(markup).toContain("Runner controls require live-local daemon data");
    expect(markup).not.toContain("Readiness compares manifest declarations");
    expect(markup).not.toContain("Inventory observes local file metadata only");
    expect(markup).not.toContain("Cloud capability remains disabled by default");
    expect(markup).not.toContain("Enable cloud");
    expect(markup).not.toContain("Run model");
    expect(markup).not.toContain("Edit connector");
  });

  it("renders manually loaded live-local capabilities in the matrix", () => {
    const liveCapabilities = {
      ...capabilitiesFixture,
      capabilities: [
        {
          ...capabilitiesFixture.capabilities[3],
          provider_id: "live-stub-legal-runner",
          display_name: "Live Stub Legal Runner",
          reason: "live_local_capability_metadata",
        },
        capabilitiesFixture.capabilities[5],
      ],
    };
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{
          status: "loaded",
          capabilities: liveCapabilities,
          loadedAt: "2026-06-19T00:00:00Z",
        }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Data source: Local daemon");
    expect(markup).toContain("<p>Total capabilities</p><strong>2</strong>");
    expect(markup).toContain("<p>Available/configured</p><strong>1</strong>");
    expect(markup).toContain("<p>Unavailable/disabled</p><strong>1</strong>");
    expect(markup).toContain("<p>Cloud enabled</p><strong>No</strong>");
    expect(markup).toContain("<p>Route ladder</p><strong>Loaded</strong>");
    expect(markup).toContain("GET /v1/capabilities");
    expect(markup).toContain("Live Stub Legal Runner");
    expect(markup).toContain("live_local_capability_metadata");
    expect(markup).toContain("Refresh capabilities");
  });

  it("shows live-local capabilities as not loaded without fixture rows", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Live capabilities have not been loaded");
    expect(markup).toContain("Capabilities from local daemon");
    expect(markup).toContain("Data source: Not loaded");
    expect(markup).toContain("<p>Total capabilities</p><strong>0</strong>");
    expect(markup).toContain("<p>Cloud enabled</p><strong>Not loaded</strong>");
    expect(markup).toContain("not loaded");
    expect(markup).not.toContain("Stub Legal Runner");
    expect(markup).not.toContain("cloud with consent");
    expect(markup).not.toContain("Data source: Offline preview fixture");
  });

  it("renders manually loaded live-local model inventory", () => {
    const liveInventory = {
      ...modelInventoryFixture,
      inventory_source: "local_model_directories",
      files: [
        {
          ...modelInventoryFixture.files[0],
          filename: "live-legal-model-q4_k_m.gguf",
          relative_path: "configured-model-dir/live-legal-model-q4_k_m.gguf",
        },
      ],
      summary: {
        ...modelInventoryFixture.summary,
        total_files: 1,
        gguf_files: 1,
        unsupported_count: 0,
      },
    };
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{
          status: "loaded",
          inventory: liveInventory,
          loadedAt: "2026-06-19T00:00:00Z",
        }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Local daemon data");
    expect(markup).toContain("GET /v1/models/inventory");
    expect(markup).toContain("live-legal-model-q4_k_m.gguf");
    expect(markup).toContain("Refresh model inventory");
    expect(markup).not.toContain("Inventory observes local file metadata only");
  });

  it("renders manually loaded live-local model readiness", () => {
    const liveReadiness = {
      ...modelReadinessFixture,
      summary: {
        ...modelReadinessFixture.summary,
        manifest_declared_count: 2,
        ready_hint_count: 1,
        missing_file_count: 1,
      },
      models: [
        {
          ...modelReadinessFixture.models[0],
          model_id: "live-ready-model",
          display_name: "Live Ready Model",
          matched_inventory_file: "configured-model-dir/live-ready-model.gguf",
        },
      ],
    };
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{
          status: "loaded",
          readiness: liveReadiness,
          loadedAt: "2026-06-19T00:00:00Z",
        }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Local daemon data");
    expect(markup).toContain("GET /v1/models/readiness");
    expect(markup).toContain("Live Ready Model");
    expect(markup).toContain("configured-model-dir/live-ready-model.gguf");
    expect(markup).toContain("Ready model hints");
    expect(markup).toContain("Missing model files");
  });

  it("shows a safe warning without substituting fixture capabilities after live load failure", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{
          status: "error",
          label: "Daemon unreachable",
          message:
            "Aethra could not reach the configured local IgnisPrompt daemon.",
          diagnosticKind: "daemon-unreachable",
          checkedAt: "2026-06-19T00:00:00Z",
        }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Daemon unreachable");
    expect(markup).toContain("Capability metadata remains unavailable until a successful manual refresh");
    expect(markup).toContain("Data source: Not loaded");
    expect(markup).toContain("<p>Total capabilities</p><strong>0</strong>");
    expect(markup).not.toContain("Stub Legal Runner");
    expect(markup).not.toContain("cloud with consent");
    expect(markup).not.toContain("Data source: Offline preview fixture");
    expect(markup).toContain("Refresh capabilities");
  });

  it("shows a friendly empty state when live capabilities return no rows", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelReadinessState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{
          status: "loaded",
          capabilities: { ...capabilitiesFixture, capabilities: [] },
          loadedAt: "2026-06-19T00:00:00Z",
        }}
        {...defaultRunnerProcessProps}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("No capabilities returned");
    expect(markup).toContain("Confirm the daemon is the current local-preview build");
  });
});
