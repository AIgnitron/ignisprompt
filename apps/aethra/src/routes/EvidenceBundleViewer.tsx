import { evidenceBundleFixture } from "../fixtures/aethraFixture";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";

export function sanitizeEvidenceBundleText(value: string): string {
  return value
    .replace(/https?:\/\/[^\s]+/g, "[redacted url]")
    .replace(
      /\b(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/[^\s]*)?/g,
      "[redacted local host]",
    )
    .replace(/\/(?:Users|home|private)\/[^\s]+/g, "[redacted local path]")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[redacted local path]")
    .replace(/\b(?:sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_-]+)\b/g, "[redacted secret]");
}

function sanitizeTextList(values: string[]): string[] {
  return values.map((value) => sanitizeEvidenceBundleText(value));
}

export function EvidenceBundleViewer() {
  const { manifest, validation, archivePreview } = evidenceBundleFixture;
  const hasArchivePreview = archivePreview !== undefined && archivePreview !== null;

  return (
    <section id="evidence-bundle-viewer" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Evidence Bundle Viewer</p>
          <h2>Local evidence bundle workflow</h2>
          <p className="page-subtitle">
            Review fixture-backed bundle metadata, validation summary, and
            archive metadata preview without extraction, upload, telemetry, or
            external calls.
          </p>
        </div>
        <div className="status-strip" aria-label="Evidence bundle status">
          <StatusBadge tone="neutral">Fixture backed</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
          <StatusBadge tone="warning">Local preview only</StatusBadge>
        </div>
      </header>

      <PageHelp
        items={[
          "Inspect safe manifest and summary fields from the fixture bundle sample.",
          "Review the local validation helper result and required file coverage.",
          "Archive metadata preview is read-only and does not extract archives or load arbitrary local paths.",
        ]}
      />

      <div className="metric-grid" aria-label="Evidence bundle metrics">
        <MetricCard
          label="Bundle schema version"
          value={sanitizeEvidenceBundleText(manifest.bundle_schema_version)}
          detail="Manifest and summary compatibility marker"
        />
        <MetricCard
          label="Generated files"
          value={manifest.generated_files.length}
          detail="Manifest and endpoint files included in the bundle"
        />
        <MetricCard
          label="Included endpoints"
          value={manifest.included_endpoints.length}
          detail="Local daemon endpoints captured in the bundle"
        />
        <MetricCard
          label="Audit included"
          value={manifest.audit_events_included ? "Yes" : "No"}
          detail="Optional audit-events.json capture"
        />
        <MetricCard
          label="Validation status"
          value={validation.status}
          detail={sanitizeEvidenceBundleText(validation.validation_mode)}
        />
      </div>

      <div className="sustainability-layout">
        <section className="panel" aria-label="Bundle manifest preview">
          <div className="panel-heading">
            <div>
              <h3>Bundle manifest preview</h3>
              <p className="muted">
                Fixture-backed manifest metadata for the local evidence bundle
                workflow.
              </p>
            </div>
            <StatusBadge tone="neutral">Read-only</StatusBadge>
          </div>

          <dl className="definition-grid version-status-grid">
            <div>
              <dt>Bundle name</dt>
              <dd>{sanitizeEvidenceBundleText(manifest.bundle_name)}</dd>
            </div>
            <div>
              <dt>Generated at</dt>
              <dd>{sanitizeEvidenceBundleText(manifest.generated_at)}</dd>
            </div>
            <div>
              <dt>Local preview boundary</dt>
              <dd>{sanitizeEvidenceBundleText(manifest.local_preview_boundary)}</dd>
            </div>
          </dl>

          <div className="warning-list">
            <section>
              <h4>Generated files</h4>
              <ul>
                {sanitizeTextList(manifest.generated_files).map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Included endpoints</h4>
              <ul>
                {sanitizeTextList(manifest.included_endpoints).map((endpoint) => (
                  <li key={endpoint}>{endpoint}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Boundary statements</h4>
              <ul>
                <li>{sanitizeEvidenceBundleText(manifest.non_certified_boundary)}</li>
                <li>{sanitizeEvidenceBundleText(manifest.not_signed_boundary)}</li>
                <li>
                  {sanitizeEvidenceBundleText(
                    manifest.not_production_attestation_boundary,
                  )}
                </li>
              </ul>
            </section>
          </div>
        </section>

        <section className="panel" aria-label="Validation summary">
          <div className="panel-heading">
            <div>
              <h3>Validation summary</h3>
              <p className="muted">
                Local validation helper output for the fixture bundle sample.
              </p>
            </div>
            <StatusBadge tone={validation.status === "validated" ? "ok" : "warning"}>
              {validation.status}
            </StatusBadge>
          </div>

          <dl className="definition-grid version-status-grid">
            <div>
              <dt>Validation mode</dt>
              <dd>{sanitizeEvidenceBundleText(validation.validation_mode)}</dd>
            </div>
            <div>
              <dt>Required files</dt>
              <dd>{validation.required_files.length}</dd>
            </div>
            <div>
              <dt>Optional files</dt>
              <dd>{validation.optional_files.length}</dd>
            </div>
          </dl>

          <div className="warning-list">
            <section>
              <h4>Required file coverage</h4>
              <ul>
                {sanitizeTextList(validation.required_files).map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Parsed JSON files</h4>
              <ul>
                {sanitizeTextList(validation.parsed_json_files).map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Validation safety checks</h4>
              <ul>
                <li>
                  Placeholder string detected:{" "}
                  {validation.placeholder_string_detected ? "yes" : "no"}
                </li>
                <li>
                  Safe fields redacted:{" "}
                  {validation.safe_fields_redacted ? "yes" : "no"}
                </li>
                <li>
                  Missing files:{" "}
                  {validation.missing_files.length > 0
                    ? validation.missing_files.length
                    : "none"}
                </li>
              </ul>
            </section>
          </div>

          <p className="explanation">{sanitizeEvidenceBundleText(validation.note)}</p>
        </section>
      </div>

      <section className="panel" aria-label="Archive metadata preview">
        <div className="panel-heading">
          <div>
            <h3>Archive metadata preview</h3>
            <p className="muted">
              Read-only archive metadata shown only from fixture or sample data.
            </p>
          </div>
          <StatusBadge tone={hasArchivePreview ? "neutral" : "warning"}>
            {hasArchivePreview ? "Preview available" : "Preview unavailable"}
          </StatusBadge>
        </div>

        {archivePreview ? (
          <>
            <dl className="definition-grid version-status-grid">
              <div>
                <dt>Archive name</dt>
                <dd>{sanitizeEvidenceBundleText(archivePreview.archive_name)}</dd>
              </div>
              <div>
                <dt>Archive format</dt>
                <dd>{sanitizeEvidenceBundleText(archivePreview.archive_format)}</dd>
              </div>
              <div>
                <dt>Created at</dt>
                <dd>{sanitizeEvidenceBundleText(archivePreview.created_at)}</dd>
              </div>
            </dl>

            <div className="warning-list">
              <section>
                <h4>Archive contents preview</h4>
                <ul>
                  {sanitizeTextList(archivePreview.generated_files).map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h4>Archive safety checks</h4>
                <ul>
                  <li>Source bundle: {sanitizeEvidenceBundleText(archivePreview.bundle_name)}</li>
                  <li>File count: {archivePreview.file_count}</li>
                  <li>Byte size estimate: {archivePreview.byte_size_estimate}</li>
                  <li>
                    Files outside bundle included:{" "}
                    {archivePreview.includes_files_outside_bundle ? "yes" : "no"}
                  </li>
                  <li>
                    Symlinks followed: {archivePreview.symlinks_followed ? "yes" : "no"}
                  </li>
                  <li>Signed: {archivePreview.signed ? "yes" : "no"}</li>
                  <li>Certified: {archivePreview.certified ? "yes" : "no"}</li>
                  <li>
                    Tamper evident: {archivePreview.tamper_evident ? "yes" : "no"}
                  </li>
                </ul>
              </section>
            </div>

            <p className="explanation">
              {sanitizeEvidenceBundleText(archivePreview.note)}
            </p>
          </>
        ) : (
          <EmptyState
            title="No archive metadata preview"
            message="This fixture sample does not include archive metadata."
            nextAction="Archive inspection remains a separate local-only step outside the browser."
            detail="No archive extraction, upload, signed attestation, or tamper-evident claim is performed here."
          />
        )}
      </section>
    </section>
  );
}
