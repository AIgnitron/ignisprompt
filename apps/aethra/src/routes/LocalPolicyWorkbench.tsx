import { useState } from "react";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import {
  buildPolicyWorkbenchSummary,
  type PolicyScenarioSummary,
} from "./policyWorkbenchSummary";

type CopyStatus =
  | {
      message: string;
      tone: "ok" | "warning";
    }
  | undefined;

export function LocalPolicyWorkbench() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>();
  const summary = buildPolicyWorkbenchSummary();

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
    <section id="local-policy-workbench" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Local Policy Workbench</p>
          <h2>Aethra local policy workbench</h2>
          <p className="page-subtitle">
            Read-only local preview policy scenario review with synthetic
            fixtures, route hints, package preview metadata, and copy-safe
            report snippets.
          </p>
        </div>
        <div className="status-strip" aria-label="Local policy boundaries">
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="neutral">Synthetic scenarios</StatusBadge>
          <StatusBadge tone="neutral">Route hints</StatusBadge>
          <StatusBadge tone="warning">No controls</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Policy scenarios are synthetic and fixture-backed by default.",
          "Route summaries are local-preview hints, not guarantees.",
          "Aethra does not execute commands, poll endpoints, upload files, read local package paths, or persist policy data.",
        ]}
      />

      <section className="overview-section-group" aria-label="Policy scenarios">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h3>Synthetic policy scenario hints</h3>
          <p className="muted">
            These fixture-backed scenarios summarize expected local-preview
            routing behavior without sensitive input content.
          </p>
        </div>
        <div className="metric-grid" aria-label="Policy scenario cards">
          {summary.scenarios.map((scenario) => (
            <PolicyScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </section>

      <section className="overview-section-group" aria-label="Policy package preview">
        <div className="section-heading">
          <p className="eyebrow">Package</p>
          <h3>Policy package preview</h3>
          <p className="muted">
            Fixture-backed metadata for packages generated under ignored
            local-evidence/policy/ paths. Validation is structural/local only.
          </p>
        </div>
        <div className="panel" aria-label="Policy package details">
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
              <dt>Policy report status</dt>
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

      <section className="overview-section-group" aria-label="Policy report snippet">
        <div className="section-heading">
          <p className="eyebrow">Report</p>
          <h3>Copy-safe policy report snippet</h3>
          <p className="muted">
            The snippet is generated from synthetic fixture summaries only.
          </p>
        </div>
        <div className="panel" aria-label="Policy report preview">
          <div className="panel-heading">
            <div>
              <h3>Local policy report preview</h3>
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

      <section className="overview-section-group" aria-label="Policy boundary reminders">
        <div className="section-heading">
          <p className="eyebrow">Boundaries</p>
          <h3>Local policy boundary reminders</h3>
        </div>
        <div className="panel" aria-label="Policy boundaries">
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

function PolicyScenarioCard({
  scenario,
}: {
  scenario: PolicyScenarioSummary;
}) {
  return (
    <article className="metric-card">
      <p className="metric-label">{scenario.category}</p>
      <strong>{scenario.name}</strong>
      <span>{scenario.syntheticSummary}</span>
      <span>Expected route: {scenario.expectedRoute}</span>
      <span>Expected tier: {scenario.expectedTier}</span>
      <span>Local behavior: {scenario.expectedLocalBehavior}</span>
      <span>Warning: {scenario.warning}</span>
      <span>Next step: {scenario.localNextStep}</span>
      <span>Boundary: {scenario.boundaryNote}</span>
    </article>
  );
}
