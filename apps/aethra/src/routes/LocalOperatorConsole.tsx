import { useState } from "react";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import {
  buildOperatorConsoleSummary,
  getAllOperatorCommandsText,
  type OperatorCommandRecipe,
  type OperatorSummaryCard,
} from "./operatorConsoleSummary";

type CopyStatus =
  | {
      id: string;
      message: string;
      tone: "ok" | "warning";
    }
  | undefined;

export function LocalOperatorConsole() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>();
  const summary = buildOperatorConsoleSummary();

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
    <section id="local-operator-console" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local Operator Console</p>
          <h2>Aethra local operator console</h2>
          <p className="page-subtitle">
            Read-only local preview operator guidance across readiness,
            evidence, package previews, and copy-only command recipes.
          </p>
        </div>
        <div className="status-strip" aria-label="Local operator boundaries">
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="neutral">Fixture-backed default</StatusBadge>
          <StatusBadge tone="neutral">Manual live-local loading</StatusBadge>
          <StatusBadge tone="warning">Copy-only commands</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Use this console for local preview operator workflow review only.",
          "Cards combine fixture-backed readiness, readiness package, and evidence workflow hints.",
          "Command recipes are copy-only; Aethra does not execute commands, poll endpoints, upload files, or persist operator data.",
        ]}
      />

      <div className="metric-grid" aria-label="Local operator summary cards">
        {summary.cards.map((card) => (
          <OperatorSummaryCardView key={card.id} card={card} />
        ))}
      </div>

      <section className="overview-section-group" aria-label="Operator command recipes">
        <div className="section-heading">
          <p className="eyebrow">Command Recipes</p>
          <h3>Suggested next local commands</h3>
          <p className="muted">
            Copy these snippets into a terminal when needed. The console keeps
            command recipes as text only and does not act as an operator
            control surface.
          </p>
        </div>
        <div className="panel" aria-label="Copy-only operator commands">
          <div className="panel-heading">
            <div>
              <h3>Copy-only operator command recipes</h3>
              <p className="muted">
                Local helper checks for readiness, evidence, package review,
                and demo workflow alignment.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                copyCommand("all", getAllOperatorCommandsText(summary.commands))
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
            {summary.commands.map((item) => (
              <OperatorCommandRow
                key={item.id}
                item={item}
                copyStatus={copyStatus}
                onCopy={copyCommand}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Operator readiness details">
        <div className="section-heading">
          <p className="eyebrow">Readiness Details</p>
          <h3>Read-only status hints</h3>
          <p className="muted">
            The detail view reuses fixture-backed readiness diagnostics and
            local next steps. Values remain status hints, not controls.
          </p>
        </div>
        <div className="panel" aria-label="Operator readiness diagnostics">
          <dl className="state-list">
            {summary.diagnostics.map((item) => (
              <div key={item.id} className="state-list-item">
                <dt>{item.label}</dt>
                <dd>
                  <StatusBadge tone={diagnosticTone(item.status)}>
                    {item.status}
                  </StatusBadge>
                  <span>
                    Category: {item.category}; severity: {item.severity}.
                  </span>
                  <span>Next step: {item.localNextStep}</span>
                  <span>Boundary: {item.boundaryNote}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Operator boundary reminders">
        <div className="section-heading">
          <p className="eyebrow">Boundaries</p>
          <h3>Local operator boundary reminders</h3>
          <p className="muted">
            These reminders keep the operator workflow aligned with local
            preview review, local helper checks, and fixture-backed defaults.
          </p>
        </div>
        <div className="panel" aria-label="Local operator boundaries">
          <dl className="state-list">
            {summary.boundaries.map((item) => (
              <div key={item.id} className="state-list-item">
                <dt>{item.label}</dt>
                <dd>
                  <StatusBadge tone="neutral">boundary</StatusBadge>
                  <span>{item.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </section>
  );
}

function diagnosticTone(status: string): "ok" | "neutral" | "warning" {
  if (status === "ok") {
    return "ok";
  }

  if (status === "needs attention") {
    return "warning";
  }

  return "neutral";
}

function OperatorSummaryCardView({ card }: { card: OperatorSummaryCard }) {
  return (
    <article className="metric-card" aria-label={card.label}>
      <div className="metric-card-heading">
        <span>{card.label}</span>
        <StatusBadge tone={card.tone}>local preview</StatusBadge>
      </div>
      <strong>{card.value}</strong>
      <p>{card.detail}</p>
    </article>
  );
}

type OperatorCommandRowProps = {
  item: OperatorCommandRecipe;
  copyStatus: CopyStatus;
  onCopy: (id: string, command: string) => void;
};

function OperatorCommandRow({
  item,
  copyStatus,
  onCopy,
}: OperatorCommandRowProps) {
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
