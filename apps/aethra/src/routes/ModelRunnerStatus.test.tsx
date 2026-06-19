import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { capabilitiesFixture, modelInventoryFixture } from "../api/fixtures";
import { ModelRunnerStatus } from "./ModelRunnerStatus";

describe("ModelRunnerStatus route", () => {
  it("renders the fixture-backed capability matrix with conservative boundaries", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="fixture"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Capability and status matrix");
    expect(markup).toContain("Local model inventory");
    expect(markup).toContain("offline preview inventory metadata");
    expect(markup).toContain("Inventory observes local file metadata only");
    expect(markup).toContain("Offline preview capabilities");
    expect(markup).toContain("Stub Legal Runner");
    expect(markup).toContain("cloud with consent");
    expect(markup).toContain("Cloud capability remains disabled by default");
    expect(markup).toContain("No model or runner controls");
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
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{
          status: "loaded",
          capabilities: liveCapabilities,
          loadedAt: "2026-06-19T00:00:00Z",
        }}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Local daemon capabilities");
    expect(markup).toContain("GET /v1/capabilities");
    expect(markup).toContain("Live Stub Legal Runner");
    expect(markup).toContain("live_local_capability_metadata");
    expect(markup).toContain("Refresh capabilities");
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
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{ status: "not-loaded" }}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Local daemon data");
    expect(markup).toContain("GET /v1/models/inventory");
    expect(markup).toContain("live-legal-model-q4_k_m.gguf");
    expect(markup).toContain("Inventory observes local file metadata only");
    expect(markup).toContain("Refresh model inventory");
  });

  it("shows a safe warning and preserves fixture capabilities after live load failure", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{
          status: "error",
          label: "Daemon unreachable",
          message:
            "Aethra could not reach the configured local IgnisPrompt daemon.",
          diagnosticKind: "daemon-unreachable",
          checkedAt: "2026-06-19T00:00:00Z",
        }}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelInventory={() => undefined}
        onLoadLiveModelStatus={() => undefined}
        onLoadLiveCapabilities={() => undefined}
      />,
    );

    expect(markup).toContain("Daemon unreachable");
    expect(markup).toContain("Fixture capability metadata remains clearly labeled below");
    expect(markup).toContain("Fixture fallback capabilities");
    expect(markup).toContain("Stub Legal Runner");
    expect(markup).toContain("Refresh capabilities");
  });

  it("shows a friendly empty state when live capabilities return no rows", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="live-local"
        liveModelsState={{ status: "not-loaded" }}
        liveModelInventoryState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        liveCapabilitiesState={{
          status: "loaded",
          capabilities: { ...capabilitiesFixture, capabilities: [] },
          loadedAt: "2026-06-19T00:00:00Z",
        }}
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
