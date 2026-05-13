import { useMemo, useState } from "react";
import { ModelManifest } from "../api/contracts";
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

export function ModelRunnerStatus() {
  const [selectedModelId, setSelectedModelId] = useState(
    initialSelectedModelId,
  );
  const rows = useMemo(() => toModelManifestRows(modelFixtures), []);
  const selectedModel =
    selectedModelId === undefined
      ? undefined
      : findModelManifestById(modelFixtures, selectedModelId);

  return (
    <section id="model-runner-status" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Model / Runner Status</p>
          <h2>Fixture-backed model manifest hints</h2>
        </div>
        <div className="status-strip" aria-label="Model fixture status">
          <StatusBadge tone="neutral">Fixture mode</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="warning">Readiness not verified</StatusBadge>
        </div>
      </header>

      <div className="metric-grid" aria-label="Model manifest metrics">
        <MetricCard
          label="Manifest entries"
          value={modelFixtures.length}
          detail="Synthetic model registry fixtures"
        />
        <MetricCard
          label="Installed hints"
          value={countInstalledManifestHints(modelFixtures)}
          detail="Manifest installed=true only"
        />
        <MetricCard
          label="Local paths"
          value={countDeclaredLocalPaths(modelFixtures)}
          detail="Declared paths, not filesystem checks"
        />
        <MetricCard
          label="Prompt packs"
          value={countDeclaredPromptPacks(modelFixtures)}
          detail="Declared prompt pack fields"
        />
        <MetricCard
          label="Runner readiness"
          value="Unknown"
          detail="Not inferred from manifest fixtures"
        />
      </div>

      <div className="model-layout">
        <ModelManifestTable
          rows={rows}
          selectedModelId={selectedModelId}
          onSelect={setSelectedModelId}
        />
        <ModelManifestDetail model={selectedModel} />
      </div>
    </section>
  );
}

type ModelManifestTableProps = {
  rows: ReturnType<typeof toModelManifestRows>;
  selectedModelId?: string;
  onSelect: (modelId: string) => void;
};

function ModelManifestTable({
  rows,
  selectedModelId,
  onSelect,
}: ModelManifestTableProps) {
  if (rows.length === 0) {
    return (
      <section className="panel" aria-label="Model manifest table">
        <h3>Model manifests</h3>
        <p className="muted">No synthetic model manifests are available.</p>
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
          <p className="muted">Manifest-derived fixture rows only</p>
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
};

function ModelManifestDetail({ model }: ModelManifestDetailProps) {
  if (!model) {
    return (
      <aside className="panel detail-panel" aria-label="Model manifest detail">
        <h3>Manifest detail</h3>
        <p className="muted">Select a synthetic model manifest to inspect it.</p>
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
        These are manifest-derived hints from synthetic fixtures. Aethra fixture
        mode does not verify model files, duplicate runner logic, or prove model
        quality, legal accuracy, production readiness, or compliance status.
      </p>

      <section className="detail-section">
        <h4>Status language</h4>
        <ul className="status-hint-list">
          {statusHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
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
