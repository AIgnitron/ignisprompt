import { useState } from "react";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import {
  buildDemoStudioSummary,
  type DemoStoryStep,
} from "./demoStudioSummary";

type CopyStatus =
  | {
      message: string;
      tone: "ok" | "warning";
    }
  | undefined;

export function LocalDemoStudio() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>();
  const summary = buildDemoStudioSummary();

  async function copyReport() {
    if (!globalThis.navigator?.clipboard?.writeText) {
      setCopyStatus({
        message: "Clipboard unavailable; select the report text.",
        tone: "warning",
      });
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(summary.reportSnippet);
      setCopyStatus({ message: "Copied", tone: "ok" });
    } catch {
      setCopyStatus({
        message: "Copy failed; select the report text.",
        tone: "warning",
      });
    }
  }

  return (
    <section id="local-demo-studio" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local Demo Studio</p>
          <h2>Aethra local demo studio</h2>
          <p className="page-subtitle">
            Read-only product-story guidance across overview, routing, audit,
            status, package review, sustainability, and explicit non-claims.
          </p>
        </div>
        <div className="status-strip" aria-label="Local demo boundaries">
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="neutral">Fixture-backed</StatusBadge>
          <StatusBadge tone="neutral">Synthetic story</StatusBadge>
          <StatusBadge tone="warning">No controls</StatusBadge>
        </div>
      </header>

      <PageHelp
        collapsible
        items={[
          "The demo story uses synthetic fixture-backed steps only.",
          "Route, status, and package values are local-preview hints, not guarantees.",
          "Aethra does not execute commands, poll endpoints, upload packages, read local package paths, or persist demo data.",
        ]}
      />

      <section className="overview-section-group" aria-label="Demo story steps">
        <div className="section-heading">
          <p className="eyebrow">Story</p>
          <h3>Local preview demo story mode</h3>
          <p className="muted">
            Walk through the primary Aethra product flow without changing local
            daemon state.
          </p>
        </div>
        <div className="metric-grid" aria-label="Demo story cards">
          {summary.storySteps.map((step, index) => (
            <DemoStepCard key={step.id} step={step} index={index} />
          ))}
        </div>
      </section>

      <section className="overview-section-group" aria-label="Demo package preview">
        <div className="section-heading">
          <p className="eyebrow">Package</p>
          <h3>Demo package preview</h3>
          <p className="muted">
            Fixture-backed metadata for packages generated under ignored
            local-evidence/demo-studio/ paths. Validation is structural/local
            only.
          </p>
        </div>
        <div className="panel" aria-label="Demo package details">
          <div className="panel-heading">
            <div>
              <h3>Package manifest summary</h3>
              <p className="muted">
                The preview does not upload, extract, validate, or read local
                package files.
              </p>
            </div>
            <StatusBadge tone="neutral">
              {summary.packagePreview.packageMode}
            </StatusBadge>
          </div>
          <dl className="state-list">
            <div className="state-list-item">
              <dt>Package root</dt>
              <dd>
                <StatusBadge tone="neutral">ignored path</StatusBadge>
                <code>{summary.packagePreview.packageRoot}</code>
              </dd>
            </div>
            <div className="state-list-item">
              <dt>Demo report status</dt>
              <dd>
                <StatusBadge tone="neutral">
                  {summary.packagePreview.status}
                </StatusBadge>
                <span>Schema {summary.packagePreview.schemaVersion}</span>
              </dd>
            </div>
            <div className="state-list-item">
              <dt>Generated files</dt>
              <dd>
                <StatusBadge tone="neutral">copy-safe</StatusBadge>
                <span>{summary.packagePreview.generatedFiles.join(", ")}</span>
              </dd>
            </div>
            <div className="state-list-item">
              <dt>Boundary notes</dt>
              <dd>
                <StatusBadge tone="neutral">local preview</StatusBadge>
                <span>{summary.packagePreview.boundaryNotes.join("; ")}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Demo report snippet">
        <div className="section-heading">
          <p className="eyebrow">Report</p>
          <h3>Copy-safe demo report snippet</h3>
          <p className="muted">
            The snippet is generated from synthetic fixture summaries only.
          </p>
        </div>
        <div className="panel" aria-label="Demo report preview">
          <div className="panel-heading">
            <div>
              <h3>Local demo report preview</h3>
              <p className="muted">
                Copy text only. Aethra does not generate files or execute CLI
                commands.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={copyReport}
            >
              Copy report
            </button>
          </div>
          {copyStatus ? (
            <p className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
              {copyStatus.message}
            </p>
          ) : null}
          <pre className="report-preview">{summary.reportSnippet}</pre>
        </div>
      </section>

      <section className="overview-section-group" aria-label="Demo boundary reminders">
        <div className="section-heading">
          <p className="eyebrow">Boundaries</p>
          <h3>Local demo boundary reminders</h3>
        </div>
        <div className="panel" aria-label="Demo boundaries">
          <dl className="state-list">
            {summary.boundaries.map((boundary) => (
              <div key={boundary} className="state-list-item">
                <dt>{boundary}</dt>
                <dd>
                  <StatusBadge tone="neutral">boundary</StatusBadge>
                  <span>{boundary}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </section>
  );
}

function DemoStepCard({
  step,
  index,
}: {
  step: DemoStoryStep;
  index: number;
}) {
  return (
    <article className="metric-card">
      <p className="metric-label">Step {index + 1}</p>
      <strong>{step.name}</strong>
      <span>{step.summary}</span>
      <span>Surface: {step.sourceSurface}</span>
      <span>Talking point: {step.talkingPoint}</span>
      <span>Next step: {step.localNextStep}</span>
      <span>Boundary: {step.boundaryNote}</span>
    </article>
  );
}
