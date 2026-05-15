import { useEffect, useMemo, useState } from "react";
import { ModelManifest } from "../api/contracts";
import type { AethraDataMode, LiveModelsState } from "../dataSource";
import { modelFixtures } from "../fixtures/aethraFixture";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  countDeclaredLocalPaths,
  countDeclaredPromptPacks,
  countInstalledManifestHints,
  findModelManifestById,
  getManifestStatusHints,
  toModelManifestRows,
} from "./modelManifestSummary";

const initialSelectedModelId = toModelManifestRows(modelFixtures)[0]?.modelId;

type ModelRunnerStatusProps = {
  dataMode: AethraDataMode;
  liveModelsState: LiveModelsState;
  onLoadLiveModels: () => void;
};

export function ModelRunnerStatus({
  dataMode,
  liveModelsState,
  onLoadLiveModels,
}: ModelRunnerStatusProps) {
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    initialSelectedModelId,
  );
  const isLiveModelsLoaded =
    dataMode === "live-local" && liveModelsState.status === "loaded";
  const models = isLiveModelsLoaded ? liveModelsState.models : modelFixtures;
  const rows = useMemo(() => toModelManifestRows(models), [models]);
  const selectedModel =
    selectedModelId === undefined
      ? undefined
      : findModelManifestById(models, selectedModelId);
  const sourceLabel = isLiveModelsLoaded
    ? "Live local metadata"
    : dataMode === "live-local"
      ? "Fixture fallback"
      : "Fixture mode";

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
        </div>
        <div className="status-strip" aria-label="Model metadata status">
          <StatusBadge tone={isLiveModelsLoaded ? "ok" : "neutral"}>
            {sourceLabel}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="warning">Readiness not verified</StatusBadge>
        </div>
      </header>

      <ModelMetadataPanel
        dataMode={dataMode}
        liveModelsState={liveModelsState}
        onLoadLiveModels={onLoadLiveModels}
      />

      <div className="metric-grid" aria-label="Model manifest metrics">
        <MetricCard
          label="Manifest entries"
          value={models.length}
          detail={
            isLiveModelsLoaded
              ? "Live local model registry entries"
              : "Synthetic model registry fixtures"
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
          label="Prompt packs"
          value={countDeclaredPromptPacks(models)}
          detail="Declared prompt pack fields"
        />
        <MetricCard
          label="Runner readiness"
          value="Unknown"
          detail="Not inferred from manifest metadata"
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
        <p className="explanation">
          Live local model metadata is not loaded yet. Aethra is showing fixture
          manifest hints until you manually refresh.
        </p>
      ) : null}

      {isLiveMode && liveModelsState.status === "loading" ? (
        <p className="explanation">
          Loading read-only model manifest metadata from the configured local
          daemon.
        </p>
      ) : null}

      {isLiveMode && liveModelsState.status === "error" ? (
        <p className="explanation">
          {liveModelsState.label}: {liveModelsState.message} Fixture model
          manifest hints remain clearly labeled below.
        </p>
      ) : null}

      <dl className="definition-grid model-metadata-grid">
        <div>
          <dt>Source</dt>
          <dd>
            {isLiveMode && liveModelsState.status === "loaded"
              ? "Live local metadata"
              : isLiveMode
                ? "Fixture fallback"
                : "Fixture metadata"}
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
              : modelFixtures.length}
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
        <div className="button-row model-action-row">
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
        <p className="muted">No model manifests are available from {sourceLabel}.</p>
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
};

function ModelManifestDetail({ model, isLiveModel }: ModelManifestDetailProps) {
  if (!model) {
    return (
      <aside className="panel detail-panel" aria-label="Model manifest detail">
        <h3>Manifest detail</h3>
        <p className="muted">Select a model manifest to inspect it.</p>
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
        {isLiveModel ? "live local metadata" : "synthetic fixtures"}. Aethra
        does not verify model files, duplicate runner logic, or prove model
        quality, legal accuracy, production readiness, or compliance status.
      </p>

      <section className="detail-section">
        <h4>Status language</h4>
        <ul className="status-hint-list">
          {statusHints.map((hint) => {
            const displayHint =
              isLiveModel &&
              hint === "File existence not verified by Aethra in fixture mode"
                ? "File existence not verified by Aethra"
                : hint;
            return <li key={hint}>{displayHint}</li>;
          })}
        </ul>
      </section>

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

function getModelsStateLabel(
  dataMode: AethraDataMode,
  liveModelsState: LiveModelsState,
): string {
  if (dataMode === "fixture") {
    return "Fixture models";
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

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}
