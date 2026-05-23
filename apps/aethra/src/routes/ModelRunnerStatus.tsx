import { useEffect, useMemo, useState } from "react";
import { ModelManifest, ModelStatusHint } from "../api/contracts";
import type {
  AethraDataMode,
  LiveModelsState,
  LiveModelStatusState,
} from "../dataSource";
import { modelFixtures } from "../fixtures/aethraFixture";
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
  describeExecutableInferenceStatus,
  describeLocalPathStatus,
  describeRunnerStatus,
  formatAvailability,
} from "./modelStatusSummary";
import {
  buildLiveErrorEmptyState,
  localPreviewEmptyStates,
} from "./emptyStates";

const initialSelectedModelId = toModelManifestRows(modelFixtures)[0]?.modelId;

type ModelRunnerStatusProps = {
  dataMode: AethraDataMode;
  liveModelsState: LiveModelsState;
  liveModelStatusState: LiveModelStatusState;
  onLoadLiveModels: () => void;
  onLoadLiveModelStatus: () => void;
};

export function ModelRunnerStatus({
  dataMode,
  liveModelsState,
  liveModelStatusState,
  onLoadLiveModels,
  onLoadLiveModelStatus,
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
  const selectedStatusHint =
    selectedModelId === undefined ||
    dataMode !== "live-local" ||
    liveModelStatusState.status !== "loaded"
      ? undefined
      : liveModelStatusState.statusHints.find(
          (hint) => hint.modelId === selectedModelId,
        );
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
          <p className="page-subtitle">
            Review manifest metadata and local daemon status hints without
            changing models or runners.
          </p>
        </div>
        <div className="status-strip" aria-label="Model metadata status">
          <StatusBadge tone={isLiveModelsLoaded ? "ok" : "neutral"}>
            {sourceLabel}
          </StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="warning">Status hints only</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Review model manifests and model and runner status hints from fixture data or manual live-local refresh.",
          "Status values are configuration, path, and runner hints only.",
          "Aethra observes local status; it does not install, delete, start, stop, or change models or runners.",
        ]}
      />

      <ModelMetadataPanel
        dataMode={dataMode}
        liveModelsState={liveModelsState}
        onLoadLiveModels={onLoadLiveModels}
      />

      <ModelStatusPanel
        dataMode={dataMode}
        liveModelStatusState={liveModelStatusState}
        onLoadLiveModelStatus={onLoadLiveModelStatus}
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
          label="Status hints"
          value={
            liveModelStatusState.status === "loaded"
              ? liveModelStatusState.statusHints.length
              : "Not loaded"
          }
          detail="Local daemon status hints only"
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
            "Fixture model manifest hints remain clearly labeled below.",
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

type ModelStatusPanelProps = {
  dataMode: AethraDataMode;
  liveModelStatusState: LiveModelStatusState;
  onLoadLiveModelStatus: () => void;
};

function ModelStatusPanel({
  dataMode,
  liveModelStatusState,
  onLoadLiveModelStatus,
}: ModelStatusPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const isLoaded = isLiveMode && liveModelStatusState.status === "loaded";

  return (
    <section className="panel" aria-label="Model and runner status hints">
      <div className="panel-heading">
        <div>
          <h3>Model and runner status hints</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/status/models from the configured local daemon."
              : "Fixture mode does not contact the local daemon for status hints."}
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

      <p className="explanation">
        Local daemon status hints are configuration, path, and runner hints only.
        They are not production readiness, model quality certification, legal
        accuracy, or compliance certification.
      </p>

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
            "Fixture manifest hints remain clearly labeled below.",
          )}
        />
      ) : null}

      {isLiveMode &&
      liveModelStatusState.status === "loaded" &&
      liveModelStatusState.statusHints.length === 0 ? (
        <EmptyState {...localPreviewEmptyStates.modelStatusEmpty} />
      ) : null}

      <dl className="definition-grid model-metadata-grid">
        <div>
          <dt>Source</dt>
          <dd>
            {isLoaded
              ? "Local daemon status hints"
              : isLiveMode
                ? "Not loaded"
                : "Fixture mode"}
          </dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>{isLiveMode ? "GET /v1/status/models" : "manual live only"}</dd>
        </div>
        <div>
          <dt>Status hints</dt>
          <dd>
            {isLoaded ? liveModelStatusState.statusHints.length : "not loaded"}
          </dd>
        </div>
        <div>
          <dt>Loaded at</dt>
          <dd>
            {isLoaded
              ? formatTimestamp(liveModelStatusState.loadedAt)
              : "not loaded"}
          </dd>
        </div>
      </dl>

      {isLoaded ? (
        <ModelStatusHintTable statusHints={liveModelStatusState.statusHints} />
      ) : null}

      {isLiveMode ? (
        <div className="manual-refresh-card model-action-row">
          <span>Manual live-local refresh action</span>
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

type ModelStatusHintTableProps = {
  statusHints: ModelStatusHint[];
};

function ModelStatusHintTable({ statusHints }: ModelStatusHintTableProps) {
  if (statusHints.length === 0) {
    return null;
  }

  return (
    <div className="table-scroll model-status-table-scroll">
      <table className="audit-table model-status-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Availability</th>
            <th>Local path</th>
            <th>Runner</th>
            <th>Inference</th>
            <th>Last checked</th>
            <th>Warnings</th>
          </tr>
        </thead>
        <tbody>
          {statusHints.map((hint) => (
            <tr key={hint.modelId}>
              <td>
                <strong>{hint.modelId}</strong>
                <span className="table-subtext">{hint.displayName}</span>
              </td>
              <td>{formatAvailability(hint.availability)}</td>
              <td>
                {describeLocalPathStatus(hint)}
              </td>
              <td>{describeRunnerStatus(hint)}</td>
              <td>{describeExecutableInferenceStatus(hint)}</td>
              <td>{formatTimestamp(hint.lastCheckedAt)}</td>
              <td>
                {hint.warnings.length > 0 ? hint.warnings.join(" ") : "none"}
              </td>
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
        {isLiveModel ? "live local metadata" : "synthetic fixtures"}. Aethra
        does not verify model files, duplicate runner logic, or prove model
        quality, legal accuracy, production readiness, or compliance status.
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
    return "Fixture mode";
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
