import { useEffect, useMemo, useState } from "react";
import {
  CapabilitiesResponse,
  ModelInventoryResponse,
  ModelManifest,
  ModelReadinessResponse,
  ModelStatusHint,
} from "../api/contracts";
import type {
  AethraDataMode,
  LiveCapabilitiesState,
  LiveModelInventoryState,
  LiveModelReadinessState,
  LiveModelsState,
  LiveModelStatusState,
  LiveRunnerProcessStatusState,
} from "../dataSource";
import {
  capabilitiesFixture,
  modelFixtures,
  modelInventoryFixture,
  modelReadinessFixture,
  modelStatusFixture,
} from "../fixtures/aethraFixture";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import {
  countDeclaredLocalPaths,
  countDeclaredPromptPacks,
  countInstalledManifestHints,
  findModelManifestById,
  getManifestStatusHints,
  toModelManifestRows,
} from "./modelManifestSummary";
import {
  buildCapabilityMatrixRowsFromCapabilities,
  describeExecutableInferenceStatus,
  describeLocalPathStatus,
  describeRunnerStatus,
  formatAvailability,
} from "./modelStatusSummary";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";
import { RunnerProcessPanel } from "./RunnerProcessPanel";

const initialSelectedModelId = toModelManifestRows(modelFixtures)[0]?.modelId;
const emptyModelInventory: ModelInventoryResponse = {
  ...modelInventoryFixture,
  files: [],
  summary: {
    ...modelInventoryFixture.summary,
    total_files: 0,
    total_size_bytes: 0,
    gguf_files: 0,
    safetensors_files: 0,
    present_count: 0,
    unsupported_count: 0,
    largest_file_mb: 0,
    scanned_directory_count: 0,
    notes: ["Live local model inventory has not been loaded."],
  },
  boundary_notes: [
    "Live local model inventory is not loaded. Offline preview fixtures are not used as product state.",
  ],
};
const emptyModelReadiness: ModelReadinessResponse = {
  ...modelReadinessFixture,
  models: [],
  summary: {
    ...modelReadinessFixture.summary,
    manifest_declared_count: 0,
    inventory_file_count: 0,
    ready_hint_count: 0,
    missing_file_count: 0,
    unsupported_format_count: 0,
    unknown_count: 0,
  },
  warnings: [],
  boundary_notes: [
    "Live local model readiness is not loaded. Offline preview fixtures are not used as product state.",
  ],
};
const emptyCapabilities: CapabilitiesResponse = {
  release_channel: "live-local",
  local_only: true,
  cloud_enabled: false,
  routing_order: [],
  capabilities: [],
};

type ModelRunnerStatusProps = {
  dataMode: AethraDataMode;
  liveModelsState: LiveModelsState;
  liveModelInventoryState: LiveModelInventoryState;
  liveModelReadinessState: LiveModelReadinessState;
  liveModelStatusState: LiveModelStatusState;
  liveCapabilitiesState: LiveCapabilitiesState;
  liveRunnerProcessStatusState: LiveRunnerProcessStatusState;
  localBaseUrl: string;
  runnerLifecycleRefreshRequired: boolean;
  onLoadLiveModels: () => void;
  onLoadLiveModelInventory: () => void;
  onLoadLiveModelStatus: () => void;
  onLoadLiveCapabilities: () => void;
  onLoadLiveRunnerProcessStatus: () => void;
  onRunnerLifecycleAttempt: () => void;
};

export function ModelRunnerStatus({
  dataMode,
  liveModelsState,
  liveModelInventoryState,
  liveModelReadinessState,
  liveModelStatusState,
  liveCapabilitiesState,
  liveRunnerProcessStatusState,
  localBaseUrl,
  runnerLifecycleRefreshRequired,
  onLoadLiveModels,
  onLoadLiveModelInventory,
  onLoadLiveModelStatus,
  onLoadLiveCapabilities,
  onLoadLiveRunnerProcessStatus,
  onRunnerLifecycleAttempt,
}: ModelRunnerStatusProps) {
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    initialSelectedModelId,
  );
  const isLiveModelsLoaded =
    dataMode === "live-local" && liveModelsState.status === "loaded";
  const isLiveStatusLoaded =
    dataMode === "live-local" && liveModelStatusState.status === "loaded";
  const isLiveInventoryLoaded =
    dataMode === "live-local" && liveModelInventoryState.status === "loaded";
  const isLiveReadinessLoaded =
    dataMode === "live-local" && liveModelReadinessState.status === "loaded";
  const isLiveCapabilitiesLoaded =
    dataMode === "live-local" && liveCapabilitiesState.status === "loaded";
  const models = isLiveModelsLoaded
    ? liveModelsState.models
    : dataMode === "fixture"
      ? modelFixtures
      : [];
  const inventory = isLiveInventoryLoaded
    ? liveModelInventoryState.inventory
    : dataMode === "fixture"
      ? modelInventoryFixture
      : emptyModelInventory;
  const readiness = isLiveReadinessLoaded
    ? liveModelReadinessState.readiness
    : dataMode === "fixture"
      ? modelReadinessFixture
      : emptyModelReadiness;
  const rows = useMemo(() => toModelManifestRows(models), [models]);
  const effectiveStatusHints = isLiveStatusLoaded
    ? liveModelStatusState.statusHints
    : dataMode === "fixture"
      ? modelStatusFixture.statusHints
      : [];
  const effectiveCapabilities = isLiveCapabilitiesLoaded
    ? liveCapabilitiesState.capabilities
    : dataMode === "fixture"
      ? capabilitiesFixture
      : emptyCapabilities;
  const capabilityRows = useMemo(
    () =>
      buildCapabilityMatrixRowsFromCapabilities(effectiveCapabilities.capabilities),
    [effectiveCapabilities],
  );
  const selectedModel =
    selectedModelId === undefined
      ? undefined
      : findModelManifestById(models, selectedModelId);
  const selectedStatusHint =
    selectedModelId === undefined
      ? undefined
      : effectiveStatusHints.find(
          (hint: ModelStatusHint) => hint.modelId === selectedModelId,
        );
  const sourceLabel = isLiveModelsLoaded
    ? "Local daemon data"
    : dataMode === "live-local"
      ? "Live local not loaded"
      : "Offline preview fixture";

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedModelId(undefined);
      return;
    }

    if (
      selectedModelId === undefined ||
      !rows.some((row) => row.modelId === selectedModelId)
    ) {
      setSelectedModelId(rows[0].modelId);
    }
  }, [rows, selectedModelId]);

  return (
    <section id="model-runner-status" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Model / Runner Status</p>
          <h2>Model and runner status hints</h2>
          <p className="page-subtitle">
            Review live-local manifest metadata, inventory, readiness, and
            runner hints without changing models or runners.
          </p>
        </div>
        <div className="status-strip" aria-label="Model metadata status">
          <StatusBadge tone={isLiveModelsLoaded ? "ok" : "neutral"}>
            {sourceLabel}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only by default</StatusBadge>
          <StatusBadge tone="warning">Guarded operator controls</StatusBadge>
          <StatusBadge tone="warning">Status hints only</StatusBadge>
        </div>
      </header>

      <PageHelp
        collapsible
        items={["See Help for model data source details and product limits."]}
      />

      <ModelMetadataPanel
        dataMode={dataMode}
        liveModelsState={liveModelsState}
        onLoadLiveModels={onLoadLiveModels}
      />

      <ModelInventoryPanel
        dataMode={dataMode}
        liveModelInventoryState={liveModelInventoryState}
        inventory={inventory}
        onLoadLiveModelInventory={onLoadLiveModelInventory}
      />

      <ModelReadinessPanel
        dataMode={dataMode}
        liveModelReadinessState={liveModelReadinessState}
        readiness={readiness}
      />

      <ModelStatusPanel
        dataMode={dataMode}
        liveModelStatusState={liveModelStatusState}
        liveCapabilitiesState={liveCapabilitiesState}
        capabilities={effectiveCapabilities}
        capabilityRows={capabilityRows}
        onLoadLiveModelStatus={onLoadLiveModelStatus}
        onLoadLiveCapabilities={onLoadLiveCapabilities}
      />

      <RunnerProcessPanel
        dataMode={dataMode}
        localBaseUrl={localBaseUrl}
        liveRunnerProcessStatusState={liveRunnerProcessStatusState}
        runnerLifecycleRefreshRequired={runnerLifecycleRefreshRequired}
        onLoadLiveRunnerProcessStatus={onLoadLiveRunnerProcessStatus}
        onRunnerLifecycleAttempt={onRunnerLifecycleAttempt}
      />

      <div className="metric-grid" aria-label="Model manifest metrics">
        <MetricCard
          label="Manifest entries"
          value={models.length}
          detail={
            isLiveModelsLoaded
              ? "Local daemon model registry entries"
              : dataMode === "fixture"
                ? "Offline preview fixture model registry entries"
                : "No live local model registry loaded"
          }
        />
        <MetricCard
          label="Installed hints"
          value={countInstalledManifestHints(models)}
          detail="Manifest installed=true only"
        />
        <MetricCard
          label="Local paths"
          value={countDeclaredLocalPaths(models)}
          detail="Declared paths, not filesystem checks"
        />
        <MetricCard
          label="Inventory files"
          value={inventory.summary.total_files}
          detail={
            isLiveInventoryLoaded
              ? "Observed local daemon file metadata"
              : dataMode === "fixture"
                ? "Offline preview fixture inventory metadata"
                : "No live local inventory loaded"
          }
        />
        <MetricCard
          label="Ready model hints"
          value={readiness.summary.ready_hint_count}
          detail={
            isLiveReadinessLoaded
              ? "Local daemon readiness hints"
              : dataMode === "fixture"
                ? "Offline preview fixture readiness hints"
                : "No live local readiness loaded"
          }
        />
        <MetricCard
          label="Missing model files"
          value={readiness.summary.missing_file_count}
          detail="Readiness hints only; missing files do not break preview"
        />
        <MetricCard
          label="Prompt packs"
          value={countDeclaredPromptPacks(models)}
          detail="Declared prompt pack fields"
        />
        <MetricCard
          label="Status hints"
          value={effectiveStatusHints.length}
          detail={
            isLiveStatusLoaded
              ? "Local daemon status hints"
              : dataMode === "fixture"
                ? "Offline preview fixture status hints"
                : "No live local status hints loaded"
          }
        />
      </div>

      <div className="model-layout">
        <ModelManifestTable
          rows={rows}
          sourceLabel={sourceLabel}
          selectedModelId={selectedModelId}
          onSelect={setSelectedModelId}
        />
        <ModelManifestDetail
          model={selectedModel}
          isLiveModel={isLiveModelsLoaded}
          statusHint={selectedStatusHint}
        />
      </div>
    </section>
  );
}

type ModelMetadataPanelProps = {
  dataMode: AethraDataMode;
  liveModelsState: LiveModelsState;
  onLoadLiveModels: () => void;
};

function ModelMetadataPanel({
  dataMode,
  liveModelsState,
  onLoadLiveModels,
}: ModelMetadataPanelProps) {
  const isLiveMode = dataMode === "live-local";

  return (
    <section className="panel" aria-label="Model metadata source">
      <div className="panel-heading">
        <div>
          <h3>Model metadata</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/models from the configured local daemon."
              : "Fixture mode uses bundled synthetic model manifest metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveModelsState.status === "error"
              ? "warning"
              : liveModelsState.status === "loaded" && isLiveMode
                ? "ok"
                : "neutral"
          }
        >
          {getModelsStateLabel(dataMode, liveModelsState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveModelsState.status === "not-loaded" ? (
        <EmptyState {...localPreviewEmptyStates.modelMetadataNotLoaded} />
      ) : null}

      {isLiveMode && liveModelsState.status === "loading" ? (
        <p className="explanation">
          Loading read-only model manifest metadata from the configured local
          daemon.
        </p>
      ) : null}

      {isLiveMode && liveModelsState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveModelsState.label,
            liveModelsState.message,
            "Model manifest metadata remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      <dl className="definition-grid model-metadata-grid">
        <div>
          <dt>Source</dt>
          <dd>
            {isLiveMode && liveModelsState.status === "loaded"
              ? "Live local metadata"
              : isLiveMode
                ? "Live local not loaded"
                : "Offline preview fixture metadata"}
          </dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>{isLiveMode ? "GET /v1/models" : "fixture registry"}</dd>
        </div>
        <div>
          <dt>Model entries</dt>
          <dd>
            {liveModelsState.status === "loaded" && isLiveMode
              ? liveModelsState.models.length
              : dataMode === "fixture"
                ? modelFixtures.length
                : 0}
          </dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {liveModelsState.status === "loaded" && isLiveMode
              ? formatTimestamp(liveModelsState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      {isLiveMode ? (
        <div className="manual-refresh-card model-action-row">
          <span>Manual live-local refresh action</span>
          <button
            type="button"
            className="secondary-button"
            disabled={liveModelsState.status === "loading"}
            onClick={onLoadLiveModels}
          >
            {liveModelsState.status === "loading"
              ? "Loading models"
              : "Refresh live models"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

type ModelInventoryPanelProps = {
  dataMode: AethraDataMode;
  liveModelInventoryState: LiveModelInventoryState;
  inventory: ModelInventoryResponse;
  onLoadLiveModelInventory: () => void;
};

function ModelInventoryPanel({
  dataMode,
  liveModelInventoryState,
  inventory,
  onLoadLiveModelInventory,
}: ModelInventoryPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const isLoaded = isLiveMode && liveModelInventoryState.status === "loaded";

  return (
    <section className="panel" aria-label="Local model inventory">
      <div className="panel-heading">
        <div>
          <h3>Local model inventory</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/models/inventory from the configured local daemon."
              : "Fixture mode uses offline preview inventory metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveModelInventoryState.status === "error"
              ? "warning"
              : isLoaded
                ? "ok"
                : "neutral"
          }
        >
          {getModelInventoryStateLabel(dataMode, liveModelInventoryState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveModelInventoryState.status === "not-loaded" ? (
        <EmptyState
          title="Local model inventory has not been loaded"
          message="No live local inventory metadata is displayed until GET /v1/models/inventory loads successfully."
          nextAction="Start the daemon if needed, then use Refresh model inventory."
        />
      ) : null}

      {isLiveMode && liveModelInventoryState.status === "loading" ? (
        <p className="explanation">
          Loading read-only local model inventory metadata from the configured
          local daemon.
        </p>
      ) : null}

      {isLiveMode && liveModelInventoryState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveModelInventoryState.label,
            liveModelInventoryState.message,
            "Local model inventory remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {isLoaded && inventory.files.length === 0 ? (
        <EmptyState
          title="No local model files returned"
          message="The local daemon did not report GGUF, safetensors, or other supported inventory metadata from the configured local scan roots."
          nextAction="Missing model files do not break local preview. Add files outside git-ignored model directories only when you intentionally stage local assets."
        />
      ) : null}

      <dl className="definition-grid model-metadata-grid">
        <div>
          <dt>Source</dt>
          <dd>
            {isLoaded
              ? "Local daemon data"
              : isLiveMode
                ? "Live local not loaded"
                : "Offline preview fixture"}
          </dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>
            {isLiveMode ? "GET /v1/models/inventory" : "fixture inventory"}
          </dd>
        </div>
        <div>
          <dt>Total files</dt>
          <dd>{inventory.summary.total_files}</dd>
        </div>
        <div>
          <dt>Total size</dt>
          <dd>{formatBytes(inventory.summary.total_size_bytes)}</dd>
        </div>
        <div>
          <dt>GGUF files</dt>
          <dd>{inventory.summary.gguf_files}</dd>
        </div>
        <div>
          <dt>Safetensors files</dt>
          <dd>{inventory.summary.safetensors_files}</dd>
        </div>
        <div>
          <dt>Largest file</dt>
          <dd>{inventory.summary.largest_file_mb.toFixed(2)} MB</dd>
        </div>
        <div>
          <dt>Scan limited</dt>
          <dd>{String(inventory.summary.scan_limited)}</dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {isLoaded
              ? formatTimestamp(liveModelInventoryState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      <ModelInventoryTable inventory={inventory} />

      {inventory.summary.notes.length > 0 ? (
        <ul className="status-hint-list">
          {inventory.summary.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {isLiveMode ? (
        <div className="manual-refresh-card model-action-row">
          <span>Manual live-local refresh action</span>
          <button
            type="button"
            className="secondary-button"
            disabled={liveModelInventoryState.status === "loading"}
            onClick={onLoadLiveModelInventory}
          >
            {liveModelInventoryState.status === "loading"
              ? "Loading model inventory"
              : "Refresh model inventory"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

type ModelInventoryTableProps = {
  inventory: ModelInventoryResponse;
};

function ModelInventoryTable({ inventory }: ModelInventoryTableProps) {
  if (inventory.files.length === 0) {
    return null;
  }

  return (
    <div className="table-scroll model-status-table-scroll">
      <table className="audit-table model-status-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Safe path</th>
            <th>Format</th>
            <th>Status</th>
            <th>Size</th>
            <th>Family</th>
            <th>Quantization</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {inventory.files.map((file) => (
            <tr key={`${file.relative_path}-${file.size_bytes}`}>
              <td>{file.filename}</td>
              <td>{file.relative_path}</td>
              <td>{file.extension || "unknown"}</td>
              <td>{file.status}</td>
              <td>{formatBytes(file.size_bytes)}</td>
              <td>{file.model_family ?? "unknown"}</td>
              <td>{file.quantization ?? "unknown"}</td>
              <td>{file.boundary_note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ModelReadinessPanelProps = {
  dataMode: AethraDataMode;
  liveModelReadinessState: LiveModelReadinessState;
  readiness: ModelReadinessResponse;
};

function ModelReadinessPanel({
  dataMode,
  liveModelReadinessState,
  readiness,
}: ModelReadinessPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const isLoaded = isLiveMode && liveModelReadinessState.status === "loaded";

  return (
    <section className="panel" aria-label="Local model readiness">
      <div className="panel-heading">
        <div>
          <h3>Local model readiness</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/models/readiness from the configured local daemon."
              : "Fixture mode uses offline preview readiness metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveModelReadinessState.status === "error"
              ? "warning"
              : isLoaded
                ? "ok"
                : "neutral"
          }
        >
          {getModelReadinessStateLabel(dataMode, liveModelReadinessState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveModelReadinessState.status === "not-loaded" ? (
        <EmptyState
          title="Local model readiness has not been loaded"
          message="No live local readiness metadata is displayed until GET /v1/models/readiness loads successfully."
          nextAction="Start the daemon if needed, then use Refresh local daemon data."
        />
      ) : null}

      {isLiveMode && liveModelReadinessState.status === "loading" ? (
        <p className="explanation">
          Loading read-only local model readiness metadata from the configured
          local daemon.
        </p>
      ) : null}

      {isLiveMode && liveModelReadinessState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveModelReadinessState.label,
            liveModelReadinessState.message,
            "Local model readiness remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {isLoaded && readiness.models.length === 0 ? (
        <EmptyState
          title="No model readiness rows returned"
          message="The local daemon did not report manifest readiness rows for the current local-preview model registry."
          nextAction="Missing readiness rows do not break local preview. Confirm local manifests separately before relying on readiness hints."
        />
      ) : null}

      <dl className="definition-grid model-metadata-grid">
        <div>
          <dt>Source</dt>
          <dd>
            {isLoaded
              ? "Local daemon data"
              : isLiveMode
                ? "Live local not loaded"
                : "Offline preview fixture"}
          </dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>{isLiveMode ? "GET /v1/models/readiness" : "fixture readiness"}</dd>
        </div>
        <div>
          <dt>Manifest models</dt>
          <dd>{readiness.summary.manifest_declared_count}</dd>
        </div>
        <div>
          <dt>Inventory files</dt>
          <dd>{readiness.summary.inventory_file_count}</dd>
        </div>
        <div>
          <dt>Ready hints</dt>
          <dd>{readiness.summary.ready_hint_count}</dd>
        </div>
        <div>
          <dt>Missing files</dt>
          <dd>{readiness.summary.missing_file_count}</dd>
        </div>
        <div>
          <dt>Unsupported formats</dt>
          <dd>{readiness.summary.unsupported_format_count}</dd>
        </div>
        <div>
          <dt>Unknown</dt>
          <dd>{readiness.summary.unknown_count}</dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {isLoaded
              ? formatTimestamp(liveModelReadinessState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      <ModelReadinessTable readiness={readiness} />

      {readiness.warnings.length > 0 ? (
        <ul className="status-hint-list">
          {readiness.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <p className="muted diagnostics-note">Readiness metadata is advisory.</p>
    </section>
  );
}

type ModelReadinessTableProps = {
  readiness: ModelReadinessResponse;
};

function ModelReadinessTable({ readiness }: ModelReadinessTableProps) {
  if (readiness.models.length === 0) {
    return null;
  }

  return (
    <div className="table-scroll model-status-table-scroll">
      <table className="audit-table model-status-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Readiness</th>
            <th>File state</th>
            <th>Format</th>
            <th>Matched file</th>
            <th>Size</th>
            <th>Runner hint</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {readiness.models.map((model) => (
            <tr key={model.model_id}>
              <td>{model.display_name}</td>
              <td>{model.readiness_level}</td>
              <td>{model.file_state}</td>
              <td>{model.format}</td>
              <td>{model.matched_inventory_file ?? model.declared_path ?? "none"}</td>
              <td>
                {model.size_bytes === undefined
                  ? "unknown"
                  : formatBytes(model.size_bytes)}
              </td>
              <td>
                {model.runner_hint.kind} / configured=
                {String(model.runner_hint.configured)} / executable=
                {String(model.runner_hint.executable_exists)}
              </td>
              <td>{model.notes.join(" ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ModelStatusPanelProps = {
  dataMode: AethraDataMode;
  liveModelStatusState: LiveModelStatusState;
  liveCapabilitiesState: LiveCapabilitiesState;
  capabilities: CapabilitiesResponse;
  capabilityRows: ReturnType<typeof buildCapabilityMatrixRowsFromCapabilities>;
  onLoadLiveModelStatus: () => void;
  onLoadLiveCapabilities: () => void;
};

function summarizeCapabilities(capabilities: CapabilitiesResponse) {
  const unavailableOrDisabled = capabilities.capabilities.filter(
    (capability) =>
      !capability.available ||
      capability.status === "disabled" ||
      capability.status === "not_implemented" ||
      capability.status === "unavailable",
  ).length;

  return {
    total: capabilities.capabilities.length,
    availableConfigured: capabilities.capabilities.filter(
      (capability) => capability.available && capability.configured,
    ).length,
    unavailableOrDisabled,
    routeLadder: capabilities.routing_order.length > 0 ? "Loaded" : "Not loaded",
  };
}

function ModelStatusPanel({
  dataMode,
  liveModelStatusState,
  liveCapabilitiesState,
  capabilities,
  capabilityRows,
  onLoadLiveModelStatus,
  onLoadLiveCapabilities,
}: ModelStatusPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const isLoaded = isLiveMode && liveModelStatusState.status === "loaded";
  const isCapabilitiesLoaded =
    isLiveMode && liveCapabilitiesState.status === "loaded";
  const hasCapabilityData = isCapabilitiesLoaded || !isLiveMode;
  const capabilitySummary = summarizeCapabilities(capabilities);
  const capabilityDataSource = isCapabilitiesLoaded
    ? "Local daemon"
    : isLiveMode
      ? "Not loaded"
      : "Offline preview fixture";

  return (
    <section className="panel" aria-label="Capability and status matrix">
      <div className="panel-heading">
        <div>
          <h3>Capability matrix</h3>
          <p className="muted">
            {isLiveMode
              ? "Capabilities from local daemon for IgnisPrompt local routing availability."
              : "Offline preview fixture capabilities for demo review."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveModelStatusState.status === "error"
              ? "warning"
              : isLoaded
                ? "ok"
                : "neutral"
          }
        >
          {getModelStatusStateLabel(dataMode, liveModelStatusState)}
        </StatusBadge>
      </div>

      {isLiveMode && liveModelStatusState.status === "not-loaded" ? (
        <EmptyState {...localPreviewEmptyStates.modelStatusNotLoaded} />
      ) : null}

      {isLiveMode && liveModelStatusState.status === "loading" ? (
        <p className="explanation">
          Loading read-only model and runner status hints from the configured
          local daemon.
        </p>
      ) : null}

      {isLiveMode && liveModelStatusState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveModelStatusState.label,
            liveModelStatusState.message,
            "Model and runner status hints remain unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {isLiveMode && liveCapabilitiesState.status === "not-loaded" ? (
        <EmptyState
          title="Live capabilities have not been loaded"
          message="Capabilities from local daemon appear after manual live-local refresh."
          nextAction="Start the daemon if needed, then use Refresh capabilities."
        />
      ) : null}

      {isLiveMode && liveCapabilitiesState.status === "loading" ? (
        <p className="explanation">
          Loading read-only connector and capability status metadata from the
          configured local daemon.
        </p>
      ) : null}

      {isLiveMode && liveCapabilitiesState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveCapabilitiesState.label,
            liveCapabilitiesState.message,
            "Capability metadata remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {isLiveMode &&
      liveCapabilitiesState.status === "loaded" &&
      liveCapabilitiesState.capabilities.capabilities.length === 0 ? (
        <EmptyState
          title="No capabilities returned"
          message="The local daemon returned an empty capabilities list."
          nextAction="Confirm the daemon is the current local-preview build and retry manual refresh."
        />
      ) : null}

      {isLiveMode &&
      liveModelStatusState.status === "loaded" &&
      liveModelStatusState.statusHints.length === 0 ? (
        <EmptyState {...localPreviewEmptyStates.modelStatusEmpty} />
      ) : null}

      <div className="metric-grid" aria-label="Capability summary">
        <MetricCard
          label="Total capabilities"
          value={capabilitySummary.total}
          detail={`Data source: ${capabilityDataSource}`}
        />
        <MetricCard
          label="Available/configured"
          value={capabilitySummary.availableConfigured}
          detail="Reported as available and configured"
        />
        <MetricCard
          label="Unavailable/disabled"
          value={capabilitySummary.unavailableOrDisabled}
          detail="Unavailable, disabled, or not implemented"
        />
        <MetricCard
          label="Cloud enabled"
          value={
            hasCapabilityData
              ? capabilities.cloud_enabled
                ? "Yes"
                : "No"
              : "Not loaded"
          }
          detail="Reported by capability metadata"
        />
        <MetricCard
          label="Route ladder"
          value={capabilitySummary.routeLadder}
          detail={
            capabilities.routing_order.length > 0
              ? "Local routing order loaded"
              : "Local routing order not loaded"
          }
        />
      </div>

      <dl className="definition-grid model-metadata-grid">
        <div>
          <dt>Data source</dt>
          <dd>{`Data source: ${capabilityDataSource}`}</dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>{isLiveMode ? "GET /v1/capabilities" : "fixture capabilities"}</dd>
        </div>
        <div>
          <dt>Capabilities</dt>
          <dd>{capabilities.capabilities.length}</dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {isCapabilitiesLoaded
              ? formatTimestamp(liveCapabilitiesState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
        <div>
          <dt>Cloud enabled</dt>
          <dd>{String(capabilities.cloud_enabled)}</dd>
        </div>
        <div>
          <dt>Route ladder</dt>
          <dd>
            {capabilities.routing_order.length > 0
              ? capabilities.routing_order.join(", ")
              : "not loaded"}
          </dd>
        </div>
      </dl>

      <CapabilityMatrixTable rows={capabilityRows} />

      {isLiveMode ? (
        <div className="manual-refresh-card model-action-row">
          <span>Manual live-local refresh</span>
          <button
            type="button"
            className="secondary-button"
            disabled={liveCapabilitiesState.status === "loading"}
            onClick={onLoadLiveCapabilities}
          >
            {liveCapabilitiesState.status === "loading"
              ? "Loading capabilities"
              : "Refresh capabilities"}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={liveModelStatusState.status === "loading"}
            onClick={onLoadLiveModelStatus}
          >
            {liveModelStatusState.status === "loading"
              ? "Loading status hints"
              : "Refresh status hints"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

type CapabilityMatrixTableProps = {
  rows: ReturnType<typeof buildCapabilityMatrixRowsFromCapabilities>;
};

function CapabilityMatrixTable({ rows }: CapabilityMatrixTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="table-scroll model-status-table-scroll">
      <table className="audit-table model-status-table">
        <thead>
          <tr>
            <th>Tier</th>
            <th>Capability</th>
            <th>Status</th>
            <th>Available</th>
            <th>Configured</th>
            <th>Data boundary</th>
            <th>Reason</th>
            <th>Warnings</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.tier}</td>
              <td>{row.providerName}</td>
              <td>{row.status}</td>
              <td>{row.available}</td>
              <td>{row.configured}</td>
              <td>{row.dataBoundary}</td>
              <td>{row.reason}</td>
              <td>{row.warnings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ModelManifestTableProps = {
  rows: ReturnType<typeof toModelManifestRows>;
  sourceLabel: string;
  selectedModelId?: string;
  onSelect: (modelId: string) => void;
};

function ModelManifestTable({
  rows,
  sourceLabel,
  selectedModelId,
  onSelect,
}: ModelManifestTableProps) {
  if (rows.length === 0) {
    return (
      <section className="panel" aria-label="Model manifest table">
        <h3>Model manifests</h3>
        <EmptyState
          title="No model manifests are available"
          message={`No model manifests are available from ${sourceLabel}.`}
          nextAction="Fixture hints remain available; live-local model metadata requires the daemon and a manual refresh."
        />
      </section>
    );
  }

  return (
    <section
      className="panel model-table-panel"
      aria-label="Model manifest table"
    >
      <div className="panel-heading">
        <div>
          <h3>Model manifests</h3>
          <p className="muted">Manifest-derived hints from {sourceLabel}</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Display name</th>
              <th>Tier</th>
              <th>Domains</th>
              <th>Format</th>
              <th>Quantization</th>
              <th>Context</th>
              <th>Installed</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.modelId}
                className={
                  row.modelId === selectedModelId ? "selected-row" : ""
                }
              >
                <td>
                  <button
                    type="button"
                    className="table-link"
                    onClick={() => onSelect(row.modelId)}
                  >
                    {row.modelId}
                  </button>
                </td>
                <td>{row.displayName}</td>
                <td>{row.tier}</td>
                <td>{row.domains || "none"}</td>
                <td>{row.format}</td>
                <td>{row.quantization}</td>
                <td>{row.contextWindow}</td>
                <td>{String(row.installed)}</td>
                <td>{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type ModelManifestDetailProps = {
  model?: ModelManifest;
  isLiveModel: boolean;
  statusHint?: ModelStatusHint;
};

function ModelManifestDetail({
  model,
  isLiveModel,
  statusHint,
}: ModelManifestDetailProps) {
  if (!model) {
    return (
      <aside className="panel detail-panel" aria-label="Model manifest detail">
        <h3>Manifest detail</h3>
        <EmptyState
          title="No model manifest selected"
          message="There is no model manifest detail to inspect yet."
          nextAction="Select a manifest row, or refresh live models after starting the local daemon."
        />
      </aside>
    );
  }

  const row = toModelManifestRows([model])[0];
  const statusHints = getManifestStatusHints(model);

  return (
    <aside className="panel detail-panel" aria-label="Model manifest detail">
      <div className="panel-heading">
        <div>
          <h3>Manifest detail</h3>
          <p className="muted">{model.modelId}</p>
        </div>
        <StatusBadge tone={model.installed ? "neutral" : "warning"}>
          installed={String(model.installed)}
        </StatusBadge>
      </div>

      <p className="model-name">{model.displayName}</p>
      <p className="explanation">
        These are manifest-derived hints from{" "}
        {isLiveModel ? "live local metadata" : "synthetic fixtures"}.
      </p>

      <section className="detail-section">
        <h4>Status language</h4>
        <ul className="status-hint-list">
          {statusHints.map((hint) => {
            const displayHint = manifestStatusHintLabel(hint, isLiveModel);
            return <li key={hint}>{displayHint}</li>;
          })}
        </ul>
      </section>

      {statusHint ? (
        <section className="detail-section">
          <h4>Local daemon status hints</h4>
          <dl className="state-list compact-state-list">
            <div>
              <dt>Availability</dt>
              <dd>{formatAvailability(statusHint.availability)}</dd>
            </div>
            <div>
              <dt>Local path</dt>
              <dd>
                {describeLocalPathStatus(statusHint)}
              </dd>
            </div>
            <div>
              <dt>Runner</dt>
              <dd>{describeRunnerStatus(statusHint)}</dd>
            </div>
            <div>
              <dt>Executable inference</dt>
              <dd>{describeExecutableInferenceStatus(statusHint)}</dd>
            </div>
            <div>
              <dt>Last checked</dt>
              <dd>{formatTimestamp(statusHint.lastCheckedAt)}</dd>
            </div>
          </dl>
          {statusHint.warnings.length > 0 ? (
            <ul className="status-hint-list">
              {statusHint.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="detail-section">
        <h4>Manifest fields</h4>
        <dl className="state-list compact-state-list">
          <div>
            <dt>Tier</dt>
            <dd>{row.tier}</dd>
          </div>
          <div>
            <dt>Domains</dt>
            <dd>{row.domains || "none"}</dd>
          </div>
          <div>
            <dt>Format</dt>
            <dd>{row.format}</dd>
          </div>
          <div>
            <dt>Quantization</dt>
            <dd>{row.quantization}</dd>
          </div>
          <div>
            <dt>Context window</dt>
            <dd>{row.contextWindow}</dd>
          </div>
          <div>
            <dt>Local path</dt>
            <dd>{row.localPath}</dd>
          </div>
          <div>
            <dt>Prompt pack</dt>
            <dd>{row.promptPack}</dd>
          </div>
          <div>
            <dt>Response format</dt>
            <dd>{row.responseFormat}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{row.source}</dd>
          </div>
          <div>
            <dt>SHA-256</dt>
            <dd>{row.sha256}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{row.version}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

function getModelStatusStateLabel(
  dataMode: AethraDataMode,
  liveModelStatusState: LiveModelStatusState,
): string {
  if (dataMode === "fixture") {
    return "Offline preview fixture";
  }

  switch (liveModelStatusState.status) {
    case "not-loaded":
      return "Status hints not loaded";
    case "loading":
      return "Loading status hints";
    case "loaded":
      return liveModelStatusState.statusHints.length === 0
        ? "Empty status hints"
        : "Status hints loaded";
    case "error":
      return liveModelStatusState.label;
  }
}

function getModelsStateLabel(
  dataMode: AethraDataMode,
  liveModelsState: LiveModelsState,
): string {
  if (dataMode === "fixture") {
    return "Offline preview fixture models";
  }

  switch (liveModelsState.status) {
    case "not-loaded":
      return "Live models not loaded";
    case "loading":
      return "Loading live models";
    case "loaded":
      return "Live models loaded";
    case "error":
      return liveModelsState.label;
  }
}

function getModelInventoryStateLabel(
  dataMode: AethraDataMode,
  liveModelInventoryState: LiveModelInventoryState,
): string {
  if (dataMode === "fixture") {
    return "Offline preview fixture inventory";
  }

  switch (liveModelInventoryState.status) {
    case "not-loaded":
      return "Inventory not loaded";
    case "loading":
      return "Loading inventory";
    case "loaded":
      return liveModelInventoryState.inventory.files.length === 0
        ? "Empty inventory"
        : "Inventory loaded";
    case "error":
      return liveModelInventoryState.label;
  }
}

function getModelReadinessStateLabel(
  dataMode: AethraDataMode,
  liveModelReadinessState: LiveModelReadinessState,
): string {
  if (dataMode === "fixture") {
    return "Offline preview fixture readiness";
  }

  switch (liveModelReadinessState.status) {
    case "not-loaded":
      return "Readiness not loaded";
    case "loading":
      return "Loading readiness";
    case "loaded":
      return liveModelReadinessState.readiness.models.length === 0
        ? "Empty readiness"
        : "Readiness loaded";
    case "error":
      return liveModelReadinessState.label;
  }
}

function manifestStatusHintLabel(hint: string, isLiveModel: boolean): string {
  if (hint === "Runner status unknown") {
    return "Runner status not inferred from manifest metadata";
  }

  if (hint === "File existence not verified by Aethra in fixture mode") {
    return isLiveModel
      ? "File existence comes from local daemon status hints when loaded"
      : "File existence not checked by Aethra in fixture mode";
  }

  return hint;
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}

function formatBytes(sizeBytes: number): string {
  if (sizeBytes >= 1_073_741_824) {
    return `${(sizeBytes / 1_073_741_824).toFixed(2)} GB`;
  }

  if (sizeBytes >= 1_048_576) {
    return `${(sizeBytes / 1_048_576).toFixed(2)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${(sizeBytes / 1024).toFixed(2)} KB`;
  }

  return `${sizeBytes} B`;
}
