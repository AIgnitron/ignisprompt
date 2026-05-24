import { useState } from "react";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import {
  commandCenterLocalCommands,
  demoReadinessNotes,
  evidenceWorkflowChecklist,
  getAllLocalCommandsText,
  type LocalCommand,
} from "./localCommands";

type CopyStatus =
  | {
      id: string;
      message: string;
      tone: "ok" | "warning";
    }
  | undefined;

export function LocalCommandCenter() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>();

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
    <section id="local-command-center" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Command Center</p>
          <h2>Local command center</h2>
          <p className="page-subtitle">
            Copyable CLI recipes, a local evidence workflow checklist, and demo
            readiness notes for local-preview review.
          </p>
        </div>
        <div className="status-strip" aria-label="Command center status">
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="neutral">Fixture-backed</StatusBadge>
          <StatusBadge tone="neutral">Clipboard only</StatusBadge>
          <StatusBadge tone="warning">Local preview only</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Use these examples only as local-preview command recipes.",
          "Keep generated evidence under ignored local-evidence/ paths.",
          "Archive verification is structural local validation only, not cryptographic verification.",
        ]}
      />

      <section className="overview-section-group" aria-label="Command recipes">
        <div className="section-heading">
          <p className="eyebrow">Recipes</p>
          <h3>Safe local command recipes</h3>
          <p className="muted">
            These snippets are examples only. Aethra copies text to the
            clipboard and does not execute commands.
          </p>
        </div>

        <div className="panel" aria-label="Copyable command recipes">
          <div className="panel-heading">
            <div>
              <h3>CLI recipes</h3>
              <p className="muted">
                Keep these local-preview commands under ignored local-evidence/
                paths and use synthetic or checked fixture inputs.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => copyCommand("all", getAllLocalCommandsText(commandCenterLocalCommands))}
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
            {commandCenterLocalCommands.map((item) => (
              <LocalCommandRow
                key={item.id}
                item={item}
                copyStatus={copyStatus}
                onCopy={copyCommand}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Evidence workflow checklist">
        <div className="section-heading">
          <p className="eyebrow">Checklist</p>
          <h3>Evidence workflow checklist</h3>
          <p className="muted">
            Demo readiness only. Status values are hints, not controls.
          </p>
        </div>

        <div className="panel" aria-label="Evidence workflow stages">
          <dl className="state-list">
            {evidenceWorkflowChecklist.map((item) => (
              <div key={item.id} className="state-list-item">
                <dt>{item.label}</dt>
                <dd>
                  <StatusBadge tone={checklistTone(item.status)}>
                    {item.status}
                  </StatusBadge>
                  <span>{item.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Demo readiness panel">
        <div className="section-heading">
          <p className="eyebrow">Readiness</p>
          <h3>Demo readiness panel</h3>
          <p className="muted">
            Conservative copy for fixture-backed local preview review.
          </p>
        </div>

        <div className="panel" aria-label="Demo readiness notes">
          <div className="fact-columns">
            {demoReadinessNotes.map((item) => (
              <article key={item.id} className="empty-state">
                <StatusBadge tone={readinessTone(item.id)}>
                  {item.label}
                </StatusBadge>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className="muted">
            Local evidence artifacts stay local-only, archives are not signed,
            and verification is structural local validation only.
          </p>
        </div>
      </section>
    </section>
  );
}

function checklistTone(status: EvidenceWorkflowChecklistStatus): "ok" | "neutral" | "warning" {
  return status === "reviewed" ? "ok" : status === "manual" ? "warning" : "neutral";
}

function readinessTone(id: string): "ok" | "neutral" | "warning" {
  return id === "read-only" || id === "local-only"
    ? "ok"
    : id === "non-certified"
      ? "warning"
      : "neutral";
}

type EvidenceWorkflowChecklistStatus = "fixture-backed" | "manual" | "reviewed";

type LocalCommandRowProps = {
  item: LocalCommand;
  copyStatus: CopyStatus;
  onCopy: (id: string, command: string) => void;
};

function LocalCommandRow({
  item,
  copyStatus,
  onCopy,
}: LocalCommandRowProps) {
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
