import { useState } from "react";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import type {
  AethraDataMode,
  LiveHealthState,
  LiveModelStatusState,
  LiveModelsState,
  LiveVersionStatusState,
} from "../dataSource";
import {
  evidenceBundleFixture,
  healthFixture,
  modelFixtures,
  modelStatusFixture,
  versionStatusFixture,
} from "../api/fixtures";
import {
  buildLocalReadinessCards,
  getAllReadinessCommandsText,
  getReadinessSourceLabel,
  localPreviewReadinessChecklist,
  localReadinessCommands,
  type ReadinessCard,
  type ReadinessCommand,
} from "./localReadinessSummary";
import { buildReadinessMarkdownReport } from "./readinessReport";

type CopyStatus =
  | {
      id: string;
      message: string;
      tone: "ok" | "warning";
    }
  | undefined;

type LocalReadinessProps = {
  dataMode: AethraDataMode;
  liveHealthState: LiveHealthState;
  liveModelsState: LiveModelsState;
  liveModelStatusState: LiveModelStatusState;
  liveVersionStatusState: LiveVersionStatusState;
};

export function LocalReadiness({
  dataMode,
  liveHealthState,
  liveModelsState,
  liveModelStatusState,
  liveVersionStatusState,
}: LocalReadinessProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>();
  const useLiveHealth =
    dataMode === "live-local" && liveHealthState.status === "loaded";
  const useLiveModels =
    dataMode === "live-local" && liveModelsState.status === "loaded";
  const useLiveModelStatus =
    dataMode === "live-local" && liveModelStatusState.status === "loaded";
  const useLiveVersionStatus =
    dataMode === "live-local" && liveVersionStatusState.status === "loaded";
  const cards = buildLocalReadinessCards({
    health: useLiveHealth ? liveHealthState.health : healthFixture,
    healthSource: useLiveHealth ? "live-local" : "fixture",
    versionStatus: useLiveVersionStatus
      ? liveVersionStatusState.versionStatus
      : versionStatusFixture,
    versionSource: useLiveVersionStatus ? "live-local" : "fixture",
    models: useLiveModels ? liveModelsState.models : modelFixtures,
    modelsSource: useLiveModels ? "live-local" : "fixture",
    statusHints: useLiveModelStatus
      ? liveModelStatusState.statusHints
      : modelStatusFixture.statusHints,
    statusHintsSource: useLiveModelStatus ? "live-local" : "fixture",
    evidenceBundle: evidenceBundleFixture,
  });
  const readinessReport = buildReadinessMarkdownReport({ cards });

  async function copyCommand(id: string, command: string) {
    if (!globalThis.navigator?.clipboard?.writeText) {
      setCopyStatus({
        id,
        message: "Clipboard unavailable; select the command text.",
        tone: "warning",
      });
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(command);
      setCopyStatus({ id, message: "Copied", tone: "ok" });
    } catch {
      setCopyStatus({
        id,
        message: "Copy failed; select the command text.",
        tone: "warning",
      });
    }
  }

  return (
    <section id="local-readiness" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local Readiness</p>
          <h2>Aethra local readiness</h2>
          <p className="page-subtitle">
            Local preview readiness cards, safe daemon guidance, and a
            conservative checklist for manual review.
          </p>
        </div>
        <div className="status-strip" aria-label="Local readiness boundaries">
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="neutral">Fixture-backed default</StatusBadge>
          <StatusBadge tone="neutral">Manual live-local loading</StatusBadge>
          <StatusBadge tone="warning">Status hints only</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Use this page for local preview readiness, not production deployment approval.",
          "Cards use fixture-backed data until live-local health, version, model, and model-status metadata are manually loaded.",
          "Command snippets are copy-only guidance; Aethra does not execute them.",
        ]}
      />

      <div className="metric-grid" aria-label="Local preview readiness cards">
        {cards.map((card) => (
          <ReadinessCardView key={card.id} card={card} />
        ))}
      </div>

      <section className="overview-section-group" aria-label="Daemon connection guidance">
        <div className="section-heading">
          <p className="eyebrow">Daemon Guidance</p>
          <h3>Safe local command snippets</h3>
          <p className="muted">
            Copy these snippets into a terminal when needed. Aethra does not
            execute commands, poll endpoints, persist state, or act as a
            daemon operator.
          </p>
        </div>
        <div className="panel" aria-label="Copyable readiness commands">
          <div className="panel-heading">
            <div>
              <h3>Readiness command snippets</h3>
              <p className="muted">
                Manual local helper checks for daemon status, development
                checks, and evidence workflow checks.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                copyCommand("all", getAllReadinessCommandsText())
              }
            >
              Copy all commands
            </button>
          </div>

          {copyStatus?.id === "all" ? (
            <p className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
              {copyStatus.message}
            </p>
          ) : null}

          <div className="command-list">
            {localReadinessCommands.map((item) => (
              <ReadinessCommandRow
                key={item.id}
                item={item}
                copyStatus={copyStatus}
                onCopy={copyCommand}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Copy-safe readiness report">
        <div className="section-heading">
          <p className="eyebrow">Report</p>
          <h3>Copy-safe readiness report</h3>
          <p className="muted">
            Browser-local Markdown for local preview readiness notes. The
            report is generated from the cards, checklist, and command
            snippets shown on this page.
          </p>
        </div>
        <div className="panel" aria-label="Readiness report export">
          <div className="panel-heading">
            <div>
              <h3>Readiness report snippet</h3>
              <p className="muted">
                Copy-only export for issue or demo notes. Aethra does not
                upload, persist, or execute report content.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => copyCommand("readiness-report", readinessReport)}
            >
              Copy readiness report
            </button>
          </div>

          {copyStatus?.id === "readiness-report" ? (
            <p className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
              {copyStatus.message}
            </p>
          ) : null}

          <pre className="report-preview">{readinessReport}</pre>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Local preview readiness checklist">
        <div className="section-heading">
          <p className="eyebrow">Checklist</p>
          <h3>Local-preview readiness checklist</h3>
          <p className="muted">
            Checklist values are local preview status hints, not controls or
            external assurance.
          </p>
        </div>
        <div className="panel" aria-label="Readiness checklist">
          <dl className="state-list">
            {localPreviewReadinessChecklist.map((item) => (
              <div key={item.id} className="state-list-item">
                <dt>{item.label}</dt>
                <dd>
                  <StatusBadge tone="neutral">status hint</StatusBadge>
                  <span>{item.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            Security and evidence checks are local helper checks only. They do
            not provide certification, attestation reports, production
            deployment approval, legal advice, or legal quality validation.
            Use them for local preview readiness alignment only.
          </p>
        </div>
      </section>
    </section>
  );
}

function ReadinessCardView({ card }: { card: ReadinessCard }) {
  return (
    <article className="metric-card" aria-label={card.label}>
      <div className="metric-card-heading">
        <span>{card.label}</span>
        <StatusBadge tone={card.tone}>
          {getReadinessSourceLabel(card.source)}
        </StatusBadge>
      </div>
      <strong>{card.value}</strong>
      <p>{card.detail}</p>
    </article>
  );
}

type ReadinessCommandRowProps = {
  item: ReadinessCommand;
  copyStatus: CopyStatus;
  onCopy: (id: string, command: string) => void;
};

function ReadinessCommandRow({
  item,
  copyStatus,
  onCopy,
}: ReadinessCommandRowProps) {
  return (
    <div className="command-row">
      <div className="command-copy">
        <strong>{item.label}</strong>
        <code>{item.command}</code>
        <span>{item.detail}</span>
        {copyStatus?.id === item.id ? (
          <span className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
            {copyStatus.message}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="secondary-button"
        onClick={() => onCopy(item.id, item.command)}
      >
        Copy command
      </button>
    </div>
  );
}
