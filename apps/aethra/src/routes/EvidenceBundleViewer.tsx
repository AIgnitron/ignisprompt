import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import type {
  EvidenceBundleArchivePreview,
  EvidenceBundleManifest,
  EvidenceBundlePreview,
  EvidenceBundleValidationSummary,
} from "../api/contracts";
import { evidenceBundleFixture } from "../fixtures/aethraFixture";
import {
  buildEvidenceBundleJsonReportText,
  buildEvidenceBundleMarkdownReport,
} from "./evidenceBundleReport";
import {
  sanitizeEvidenceBundleText,
  sanitizeEvidenceBundleTextList,
} from "./evidenceBundleText";

type EvidenceBundleViewerProps = {
  preview?: Partial<EvidenceBundlePreview> | null;
};

type BundleSectionState<T> =
  | { kind: "ready"; value: T }
  | {
      kind: "missing";
      title: string;
      message: string;
      detail: string;
    }
  | {
      kind: "invalid";
      title: string;
      message: string;
      detail: string;
    };

type BundleIssueState = {
  kind: "missing" | "invalid";
  title: string;
  message: string;
  detail: string;
};

type EvidenceBundleCommandSnippet = {
  command: string;
  note: string;
};

type ReportCopyKind = "markdown" | "json";

type ReportCopyStatus = {
  kind: ReportCopyKind;
  tone: "ok" | "warning";
  message: string;
};

const evidenceBundleCommandSnippets: EvidenceBundleCommandSnippet[] = [
  {
    command: "ignispromptctl evidence-bundle --output local-evidence/demo-bundle",
    note:
      "Generate a local-preview bundle under ignored local-evidence/ paths.",
  },
  {
    command: "ignispromptctl evidence-bundle --list local-evidence/demo-bundle",
    note: "Inspect the bundle contents without calling the daemon.",
  },
  {
    command: "ignispromptctl evidence-bundle --validate local-evidence/demo-bundle",
    note:
      "Check required files and summary metadata with local validation only.",
  },
  {
    command: "ignispromptctl evidence-bundle --archive local-evidence/demo-bundle",
    note:
      "Create a local archive after validation; the archive is not signed.",
  },
  {
    command:
      "ignispromptctl evidence-bundle --verify-archive local-evidence/archives/demo-bundle.tar.gz",
    note:
      "Structural local validation only; this is not cryptographic verification.",
  },
  {
    command: "ignispromptctl evidence-bundle --print-manifest local-evidence/demo-bundle",
    note: "Print the manifest without upload, extraction, or persistence.",
  },
];

export { sanitizeEvidenceBundleText } from "./evidenceBundleText";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;
}

function missingState(
  title: string,
  message: string,
  detail: string,
): BundleSectionState<never> {
  return {
    kind: "missing",
    title,
    message,
    detail,
  };
}

function invalidState(
  title: string,
  message: string,
  detail: string,
): BundleSectionState<never> {
  return {
    kind: "invalid",
    title,
    message,
    detail,
  };
}

function buildManifestState(
  preview: Partial<EvidenceBundlePreview> | null,
): BundleSectionState<EvidenceBundleManifest> {
  const manifest = preview?.manifest;

  if (!isRecord(manifest)) {
    return missingState(
      "No manifest metadata available",
      "This sample does not include bundle manifest data.",
      "Aethra stays read-only and does not infer signing, certification, or production readiness from missing metadata.",
    );
  }

  const bundleSchemaVersion = asString(manifest.bundle_schema_version);
  const bundleName = asString(manifest.bundle_name);
  const generatedAt = asString(manifest.generated_at);
  const generatedFiles = asStringArray(manifest.generated_files);
  const includedEndpoints = asStringArray(manifest.included_endpoints);
  const auditEventsIncluded = asBoolean(manifest.audit_events_included);
  const localPreviewBoundary = asString(manifest.local_preview_boundary);
  const nonCertifiedBoundary = asString(manifest.non_certified_boundary);
  const notSignedBoundary = asString(manifest.not_signed_boundary);
  const notProductionAttestationBoundary = asString(
    manifest.not_production_attestation_boundary,
  );

  if (
    bundleSchemaVersion &&
    bundleName &&
    generatedAt &&
    generatedFiles &&
    includedEndpoints &&
    typeof auditEventsIncluded === "boolean" &&
    localPreviewBoundary &&
    nonCertifiedBoundary &&
    notSignedBoundary &&
    notProductionAttestationBoundary
  ) {
    return {
      kind: "ready",
      value: {
        bundle_schema_version: bundleSchemaVersion,
        bundle_name: bundleName,
        generated_at: generatedAt,
        generated_files: generatedFiles,
        included_endpoints: includedEndpoints,
        audit_events_included: auditEventsIncluded,
        local_preview_boundary: localPreviewBoundary,
        non_certified_boundary: nonCertifiedBoundary,
        not_signed_boundary: notSignedBoundary,
        not_production_attestation_boundary: notProductionAttestationBoundary,
      },
    };
  }

  const missingFields = [
    bundleSchemaVersion ? null : "bundle_schema_version",
    bundleName ? null : "bundle_name",
    generatedAt ? null : "generated_at",
    generatedFiles ? null : "generated_files",
    includedEndpoints ? null : "included_endpoints",
    typeof auditEventsIncluded === "boolean" ? null : "audit_events_included",
    localPreviewBoundary ? null : "local_preview_boundary",
    nonCertifiedBoundary ? null : "non_certified_boundary",
    notSignedBoundary ? null : "not_signed_boundary",
    notProductionAttestationBoundary ? null : "not_production_attestation_boundary",
  ].filter((value): value is string => value !== null);

  return invalidState(
    "Bundle manifest metadata is incomplete",
    "This sample includes a manifest object, but one or more required fields are missing or invalid.",
    `Missing or invalid fields: ${missingFields.join(", ")}. Aethra keeps this view read-only and does not infer signing, certification, or production readiness from incomplete metadata.`,
  );
}

function buildValidationState(
  preview: Partial<EvidenceBundlePreview> | null,
): BundleSectionState<EvidenceBundleValidationSummary> {
  const validation = preview?.validation;

  if (!isRecord(validation)) {
    return missingState(
      "No validation summary available",
      "This sample does not include validation summary data.",
      "Aethra stays read-only and does not infer signed attestation, tamper-evident storage, or certification from missing validation fields.",
    );
  }

  const bundleSchemaVersion = asString(validation.bundle_schema_version);
  const validationMode = asString(validation.validation_mode);
  const status = asString(validation.status);
  const requiredFiles = asStringArray(validation.required_files);
  const optionalFiles = asStringArray(validation.optional_files);
  const missingFiles = asStringArray(validation.missing_files);
  const parsedJsonFiles = asStringArray(validation.parsed_json_files);
  const placeholderStringDetected = asBoolean(
    validation.placeholder_string_detected,
  );
  const safeFieldsRedacted = asBoolean(validation.safe_fields_redacted);
  const note = asString(validation.note);

  if (
    bundleSchemaVersion &&
    validationMode &&
    status &&
    requiredFiles &&
    optionalFiles &&
    missingFiles &&
    parsedJsonFiles &&
    typeof placeholderStringDetected === "boolean" &&
    typeof safeFieldsRedacted === "boolean" &&
    note
  ) {
    return {
      kind: "ready",
      value: {
        bundle_schema_version: bundleSchemaVersion,
        validation_mode: validationMode,
        status,
        required_files: requiredFiles,
        optional_files: optionalFiles,
        missing_files: missingFiles,
        parsed_json_files: parsedJsonFiles,
        placeholder_string_detected: placeholderStringDetected,
        safe_fields_redacted: safeFieldsRedacted,
        note,
      },
    };
  }

  const missingFields = [
    bundleSchemaVersion ? null : "bundle_schema_version",
    validationMode ? null : "validation_mode",
    status ? null : "status",
    requiredFiles ? null : "required_files",
    optionalFiles ? null : "optional_files",
    missingFiles ? null : "missing_files",
    parsedJsonFiles ? null : "parsed_json_files",
    typeof placeholderStringDetected === "boolean"
      ? null
      : "placeholder_string_detected",
    typeof safeFieldsRedacted === "boolean" ? null : "safe_fields_redacted",
    note ? null : "note",
  ].filter((value): value is string => value !== null);

  return invalidState(
    "Validation summary is incomplete",
    "This sample includes validation data, but one or more required fields are missing or invalid.",
    `Missing or invalid fields: ${missingFields.join(", ")}. Aethra keeps the view read-only and does not infer signing, certification, or production readiness from incomplete validation data.`,
  );
}

function buildArchiveState(
  preview: Partial<EvidenceBundlePreview> | null,
): BundleSectionState<EvidenceBundleArchivePreview> {
  const archivePreview = preview?.archivePreview;

  if (archivePreview === undefined || archivePreview === null) {
    return missingState(
      "No archive metadata preview",
      "This sample does not include archive metadata.",
      "Archive inspection remains a separate local-only step outside the browser and does not imply upload, signing, or cryptographic verification.",
    );
  }

  if (!isRecord(archivePreview)) {
    return invalidState(
      "Archive metadata is invalid",
      "This sample includes archive metadata, but the shape is not valid.",
      "Aethra keeps the archive preview read-only and does not infer signing, certification, or cryptographic verification from malformed metadata.",
    );
  }

  const archiveName = asString(archivePreview.archive_name);
  const archiveFormat = asString(archivePreview.archive_format);
  const bundleName = asString(archivePreview.bundle_name);
  const createdAt = asString(archivePreview.created_at);
  const generatedFiles = asStringArray(archivePreview.generated_files);
  const fileCount = asNumber(archivePreview.file_count);
  const byteSizeEstimate = asNumber(archivePreview.byte_size_estimate);
  const includesFilesOutsideBundle = asBoolean(
    archivePreview.includes_files_outside_bundle,
  );
  const symlinksFollowed = asBoolean(archivePreview.symlinks_followed);
  const signed = asBoolean(archivePreview.signed);
  const certified = asBoolean(archivePreview.certified);
  const tamperEvident = asBoolean(archivePreview.tamper_evident);
  const note = asString(archivePreview.note);

  if (
    archiveName &&
    archiveFormat &&
    bundleName &&
    createdAt &&
    generatedFiles &&
    typeof fileCount === "number" &&
    typeof byteSizeEstimate === "number" &&
    typeof includesFilesOutsideBundle === "boolean" &&
    typeof symlinksFollowed === "boolean" &&
    typeof signed === "boolean" &&
    typeof certified === "boolean" &&
    typeof tamperEvident === "boolean" &&
    note
  ) {
    return {
      kind: "ready",
      value: {
        archive_name: archiveName,
        archive_format: archiveFormat,
        bundle_name: bundleName,
        created_at: createdAt,
        generated_files: generatedFiles,
        file_count: fileCount,
        byte_size_estimate: byteSizeEstimate,
        includes_files_outside_bundle: includesFilesOutsideBundle,
        symlinks_followed: symlinksFollowed,
        signed,
        certified,
        tamper_evident: tamperEvident,
        note,
      },
    };
  }

  const missingFields = [
    archiveName ? null : "archive_name",
    archiveFormat ? null : "archive_format",
    bundleName ? null : "bundle_name",
    createdAt ? null : "created_at",
    generatedFiles ? null : "generated_files",
    typeof fileCount === "number" ? null : "file_count",
    typeof byteSizeEstimate === "number" ? null : "byte_size_estimate",
    typeof includesFilesOutsideBundle === "boolean"
      ? null
      : "includes_files_outside_bundle",
    typeof symlinksFollowed === "boolean" ? null : "symlinks_followed",
    typeof signed === "boolean" ? null : "signed",
    typeof certified === "boolean" ? null : "certified",
    typeof tamperEvident === "boolean" ? null : "tamper_evident",
    note ? null : "note",
  ].filter((value): value is string => value !== null);

  return invalidState(
    "Archive metadata is incomplete",
    "This sample includes archive metadata, but one or more required fields are missing or invalid.",
    `Missing or invalid fields: ${missingFields.join(", ")}. Aethra keeps the archive preview read-only and does not infer signing, certification, or cryptographic verification from incomplete metadata.`,
  );
}

function renderSectionState(state: BundleIssueState) {
  return (
    <EmptyState
      title={state.title}
      message={state.message}
      detail={state.detail}
    />
  );
}

function renderManifestState(
  state: BundleSectionState<EvidenceBundleManifest>,
) {
  if (state.kind !== "ready") {
    return renderSectionState(state);
  }

  const { value: manifest } = state;

  return (
    <>
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
            {sanitizeEvidenceBundleTextList(manifest.generated_files).map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Included endpoints</h4>
          <ul>
            {sanitizeEvidenceBundleTextList(manifest.included_endpoints).map((endpoint) => (
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
    </>
  );
}

function renderValidationState(
  state: BundleSectionState<EvidenceBundleValidationSummary>,
) {
  if (state.kind !== "ready") {
    return renderSectionState(state);
  }

  const { value: validation } = state;

  return (
    <>
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
            {sanitizeEvidenceBundleTextList(validation.required_files).map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Parsed JSON files</h4>
          <ul>
            {sanitizeEvidenceBundleTextList(validation.parsed_json_files).map((file) => (
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
              Safe fields redacted: {validation.safe_fields_redacted ? "yes" : "no"}
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
    </>
  );
}

function renderArchiveState(
  state: BundleSectionState<EvidenceBundleArchivePreview>,
) {
  if (state.kind !== "ready") {
    return renderSectionState(state);
  }

  const { value: archivePreview } = state;

  return (
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
            {sanitizeEvidenceBundleTextList(archivePreview.generated_files).map((file) => (
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

      <p className="explanation">{sanitizeEvidenceBundleText(archivePreview.note)}</p>
    </>
  );
}

function renderCommandSnippets() {
  return (
    <section className="panel" aria-label="Evidence bundle CLI snippets">
      <div className="panel-heading">
        <div>
          <h3>CLI command snippets</h3>
          <p className="muted">
            Local-preview examples for generating, listing, validating,
            archiving, verifying, and printing the bundle manifest.
          </p>
        </div>
        <StatusBadge tone="neutral">Local preview examples</StatusBadge>
      </div>

      <PageHelp
        items={[
          "Use these commands with local-preview data only.",
          "Keep generated output under ignored local-evidence/ paths.",
          "Archive verification is structural local validation only; it is not cryptographic verification.",
        ]}
      />

      <div className="warning-list">
        {evidenceBundleCommandSnippets.map((snippet) => (
          <section key={snippet.command}>
            <p>
              <code>{snippet.command}</code>
            </p>
            <p className="muted">{snippet.note}</p>
          </section>
        ))}
      </div>
    </section>
  );
}

export function EvidenceBundleViewer({ preview }: EvidenceBundleViewerProps) {
  const source = preview === undefined ? evidenceBundleFixture : preview;
  const [copyStatus, setCopyStatus] = useState<ReportCopyStatus>();
  const manifestState = buildManifestState(source);
  const validationState = buildValidationState(source);
  const archiveState = buildArchiveState(source);
  const hasArchivePreview = archiveState.kind === "ready";
  const manifestValue = manifestState.kind === "ready" ? manifestState.value : null;
  const validationValue =
    validationState.kind === "ready" ? validationState.value : null;
  const archiveValue = archiveState.kind === "ready" ? archiveState.value : null;

  async function copyReport(kind: ReportCopyKind) {
    const generatedAt = new Date().toISOString();
    const text =
      kind === "markdown"
        ? buildEvidenceBundleMarkdownReport({ generatedAt, preview: source })
        : buildEvidenceBundleJsonReportText({ generatedAt, preview: source });

    if (!globalThis.navigator?.clipboard?.writeText) {
      setCopyStatus({
        kind,
        tone: "warning",
        message: "Clipboard unavailable; use browser clipboard permissions.",
      });
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(text);
      setCopyStatus({
        kind,
        tone: "ok",
        message: "Copied",
      });
    } catch {
      setCopyStatus({
        kind,
        tone: "warning",
        message: "Copy failed; use browser clipboard permissions.",
      });
    }
  }

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

      {renderCommandSnippets()}

      <section className="panel" aria-label="Evidence bundle report export">
        <div className="panel-heading">
          <div>
            <h3>Report export</h3>
            <p className="muted">
              Copy local-preview Markdown or JSON reports from the currently
              displayed bundle metadata.
            </p>
          </div>
          <StatusBadge tone="neutral">Clipboard only</StatusBadge>
        </div>

        <PageHelp
          items={[
            "Reports are generated locally from the displayed evidence metadata.",
            "Raw audit events stay omitted by default.",
            "The report text is local-preview only and is not signed, certified, or cryptographically verified.",
          ]}
        />

        <div className="command-list">
          <div className="command-row">
            <div className="command-copy">
              <strong>Markdown report</strong>
              <code>Clipboard export</code>
              <span>Copies a local-only Markdown report snapshot.</span>
              {copyStatus?.kind === "markdown" ? (
                <span className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
                  {copyStatus.message}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => copyReport("markdown")}
            >
              Copy Markdown report
            </button>
          </div>
          <div className="command-row">
            <div className="command-copy">
              <strong>JSON report</strong>
              <code>Clipboard export</code>
              <span>Copies a local-only JSON report snapshot.</span>
              {copyStatus?.kind === "json" ? (
                <span className={`copy-feedback copy-feedback-${copyStatus.tone}`}>
                  {copyStatus.message}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => copyReport("json")}
            >
              Copy JSON report
            </button>
          </div>
        </div>
      </section>

      <div className="metric-grid" aria-label="Evidence bundle metrics">
        <MetricCard
          label="Bundle schema version"
          value={
            manifestValue
              ? sanitizeEvidenceBundleText(manifestValue.bundle_schema_version)
              : "Not available"
          }
          detail="Manifest and summary compatibility marker"
        />
        <MetricCard
          label="Generated files"
          value={manifestValue ? manifestValue.generated_files.length : "Not available"}
          detail="Manifest and endpoint files included in the bundle"
        />
        <MetricCard
          label="Included endpoints"
          value={
            manifestValue ? manifestValue.included_endpoints.length : "Not available"
          }
          detail="Local daemon endpoints captured in the bundle"
        />
        <MetricCard
          label="Audit included"
          value={
            manifestValue
              ? manifestValue.audit_events_included
                ? "Yes"
                : "No"
              : "Not available"
          }
          detail="Optional audit-events.json capture"
        />
        <MetricCard
          label="Validation status"
          value={validationValue ? validationValue.status : "Not available"}
          detail={
            validationValue
              ? sanitizeEvidenceBundleText(validationValue.validation_mode)
              : "Validation helper output"
          }
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
            <StatusBadge tone="neutral">
              {manifestState.kind === "ready" ? "Read-only" : "Empty state"}
            </StatusBadge>
          </div>

          {renderManifestState(manifestState)}
        </section>

        <section className="panel" aria-label="Validation summary">
          <div className="panel-heading">
            <div>
              <h3>Validation summary</h3>
              <p className="muted">
                Local validation helper output for the fixture bundle sample.
              </p>
            </div>
            <StatusBadge
              tone={validationState.kind === "ready" ? "ok" : "warning"}
            >
              {validationState.kind === "ready"
                ? validationState.value.status
                : "Empty state"}
            </StatusBadge>
          </div>

          {renderValidationState(validationState)}
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

        {archiveValue ? (
          renderArchiveState(archiveState)
        ) : (
          <EmptyState
            title={
              archiveState.kind === "invalid"
                ? archiveState.title
                : "No archive metadata preview"
            }
            message={
              archiveState.kind === "invalid"
                ? archiveState.message
                : "This sample does not include archive metadata."
            }
            nextAction="Archive inspection remains a separate local-only step outside the browser."
            detail={
              archiveState.kind === "invalid"
                ? archiveState.detail
                : "No archive extraction, upload, signed attestation, tamper-evident storage, or cryptographic verification is performed here."
            }
          />
        )}
      </section>
    </section>
  );
}
