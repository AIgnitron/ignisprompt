import type {
  EvidenceBundleArchivePreview,
  EvidenceBundlePreview,
} from "../api/contracts";
import {
  sanitizeEvidenceBundleText,
  sanitizeEvidenceBundleTextList,
} from "./evidenceBundleText";

export type EvidenceBundleReportInput = {
  generatedAt: string;
  preview?: Partial<EvidenceBundlePreview> | null;
};

export type EvidenceBundleJsonReport = {
  report_schema_version: "ignisprompt-evidence-bundle-report-0.1";
  generated_at: string;
  local_only: true;
  boundary_language: string[];
  bundle: EvidenceBundleReportBundleSection;
  validation: EvidenceBundleReportValidationSection;
  archive: EvidenceBundleReportArchiveSection;
  limitations: string[];
  export_notes: string[];
};

type EvidenceBundleReportSectionState = "ready" | "missing" | "invalid";

type EvidenceBundleReportBundleSection = {
  state: EvidenceBundleReportSectionState;
  schema_version: string | null;
  bundle_name: string | null;
  generated_at: string | null;
  generated_files: string[];
  included_endpoints: string[];
  audit_events_included: boolean | null;
  boundary_statements: string[];
};

type EvidenceBundleReportValidationSection = {
  state: EvidenceBundleReportSectionState;
  schema_version: string | null;
  validation_mode: string | null;
  status: string | null;
  required_files: string[];
  optional_files: string[];
  missing_files: string[];
  parsed_json_files: string[];
  placeholder_string_detected: boolean | null;
  safe_fields_redacted: boolean | null;
  note: string | null;
};

type EvidenceBundleReportArchiveSection = {
  state: EvidenceBundleReportSectionState;
  archive_name: string | null;
  archive_format: string | null;
  bundle_name: string | null;
  created_at: string | null;
  generated_files: string[];
  file_count: number | null;
  byte_size_estimate: number | null;
  includes_files_outside_bundle: boolean | null;
  symlinks_followed: boolean | null;
  signed: boolean | null;
  certified: boolean | null;
  tamper_evident: boolean | null;
  note: string | null;
};

type PartialEvidenceBundleManifest = NonNullable<EvidenceBundlePreview["manifest"]>;
type PartialEvidenceBundleValidation = NonNullable<EvidenceBundlePreview["validation"]>;

const reportBoundaryLanguage = [
  "local-preview",
  "local-only",
  "non-certified",
  "not signed",
  "not production attestation",
  "not cryptographic verification",
] as const;

const reportLimitations = [
  "local-preview diagnostics only",
  "not signed",
  "not certified",
  "not production attestation",
  "not tamper-evident storage",
  "not cryptographic verification",
] as const;

const reportExportNotes = [
  "browser-local copy only",
  "no telemetry",
  "no uploads",
  "no cloud calls",
  "no localStorage or sessionStorage persistence",
  "no raw audit events by default",
  "no prompts, raw user text, secrets, API keys, hostnames, usernames, machine identifiers, or absolute filesystem paths",
] as const;

export function buildEvidenceBundleMarkdownReport(
  input: EvidenceBundleReportInput,
): string {
  const report = buildEvidenceBundleJsonReport(input);
  const bundle = report.bundle;
  const validation = report.validation;
  const archive = report.archive;

  return [
    "# Aethra Evidence Bundle Report - Local Preview",
    "",
    "This report is local-preview only, local-only, non-certified, not signed, not production attestation, and not cryptographic verification.",
    "",
    "## Report Metadata",
    "",
    `- report_schema_version: ${report.report_schema_version}`,
    `- generated_at: ${report.generated_at}`,
    `- local_only: ${String(report.local_only)}`,
    "",
    "## Boundary Language",
    "",
    ...report.boundary_language.map((item) => `- ${item}`),
    "",
    "## Bundle Metadata",
    "",
    `- state: ${bundle.state}`,
    `- bundle_schema_version: ${formatValue(bundle.schema_version)}`,
    `- bundle_name: ${formatValue(bundle.bundle_name)}`,
    `- generated_at: ${formatValue(bundle.generated_at)}`,
    `- audit_events_included: ${formatBoolean(bundle.audit_events_included)}`,
    "",
    "### Generated Files",
    "",
    ...formatListOrPlaceholder(bundle.generated_files),
    "",
    "### Included Endpoints",
    "",
    ...formatListOrPlaceholder(bundle.included_endpoints),
    "",
    "### Boundary Statements",
    "",
    ...formatListOrPlaceholder(bundle.boundary_statements),
    "",
    "## Validation Summary",
    "",
    `- state: ${validation.state}`,
    `- bundle_schema_version: ${formatValue(validation.schema_version)}`,
    `- validation_mode: ${formatValue(validation.validation_mode)}`,
    `- status: ${formatValue(validation.status)}`,
    `- placeholder_string_detected: ${formatBoolean(validation.placeholder_string_detected)}`,
    `- safe_fields_redacted: ${formatBoolean(validation.safe_fields_redacted)}`,
    "",
    "### Required Files",
    "",
    ...formatListOrPlaceholder(validation.required_files),
    "",
    "### Optional Files",
    "",
    ...formatListOrPlaceholder(validation.optional_files),
    "",
    "### Missing Files",
    "",
    ...formatListOrPlaceholder(validation.missing_files),
    "",
    "### Parsed JSON Files",
    "",
    ...formatListOrPlaceholder(validation.parsed_json_files),
    "",
    "### Validation Note",
    "",
    validation.note ? `- ${validation.note}` : "- Not available",
    "",
    "## Archive Metadata Summary",
    "",
    `- state: ${archive.state}`,
    `- archive_name: ${formatValue(archive.archive_name)}`,
    `- archive_format: ${formatValue(archive.archive_format)}`,
    `- bundle_name: ${formatValue(archive.bundle_name)}`,
    `- created_at: ${formatValue(archive.created_at)}`,
    `- file_count: ${formatNumeric(archive.file_count)}`,
    `- byte_size_estimate: ${formatNumeric(archive.byte_size_estimate)}`,
    `- includes_files_outside_bundle: ${formatBoolean(archive.includes_files_outside_bundle)}`,
    `- symlinks_followed: ${formatBoolean(archive.symlinks_followed)}`,
    `- signed: ${formatBoolean(archive.signed)}`,
    `- certified: ${formatBoolean(archive.certified)}`,
    `- tamper_evident: ${formatBoolean(archive.tamper_evident)}`,
    "",
    "### Archive Files",
    "",
    ...formatListOrPlaceholder(archive.generated_files),
    "",
    "### Archive Note",
    "",
    archive.note ? `- ${archive.note}` : "- Not available",
    "",
    "## Limitations",
    "",
    ...report.limitations.map((item) => `- ${item}`),
    "",
    "## Local-Only Export Notes",
    "",
    ...report.export_notes.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

export function buildEvidenceBundleJsonReport(
  input: EvidenceBundleReportInput,
): EvidenceBundleJsonReport {
  const preview = input.preview ?? null;
  const manifest = preview?.manifest;
  const validation = preview?.validation;
  const archivePreview = preview?.archivePreview;

  return {
    report_schema_version: "ignisprompt-evidence-bundle-report-0.1",
    generated_at: input.generatedAt,
    local_only: true,
    boundary_language: [...reportBoundaryLanguage],
    bundle: buildBundleSection(manifest),
    validation: buildValidationSection(validation),
    archive: buildArchiveSection(archivePreview),
    limitations: [...reportLimitations],
    export_notes: [...reportExportNotes],
  };
}

export function buildEvidenceBundleJsonReportText(
  input: EvidenceBundleReportInput,
): string {
  return `${JSON.stringify(buildEvidenceBundleJsonReport(input), null, 2)}\n`;
}

function buildBundleSection(
  manifest: PartialEvidenceBundleManifest | null | undefined,
): EvidenceBundleReportBundleSection {
  if (manifest === null || manifest === undefined) {
    return {
      state: "missing",
      schema_version: null,
      bundle_name: null,
      generated_at: null,
      generated_files: [],
      included_endpoints: [],
      audit_events_included: null,
      boundary_statements: [],
    };
  }

  const schemaVersion = normalizeString(manifest.bundle_schema_version);
  const bundleName = normalizeString(manifest.bundle_name);
  const generatedAt = normalizeString(manifest.generated_at);
  const generatedFiles = normalizeStringArray(manifest.generated_files);
  const includedEndpoints = normalizeStringArray(manifest.included_endpoints);
  const auditEventsIncluded = normalizeBoolean(manifest.audit_events_included);
  const boundaryStatements = [
    normalizeString(manifest.local_preview_boundary),
    normalizeString(manifest.non_certified_boundary),
    normalizeString(manifest.not_signed_boundary),
    normalizeString(manifest.not_production_attestation_boundary),
  ].filter((value): value is string => value !== null);

  const ready =
    schemaVersion !== null &&
    bundleName !== null &&
    generatedAt !== null &&
    generatedFiles.length > 0 &&
    includedEndpoints.length > 0 &&
    auditEventsIncluded !== null &&
    boundaryStatements.length > 0;

  return {
    state: ready ? "ready" : "invalid",
    schema_version: schemaVersion,
    bundle_name: bundleName,
    generated_at: generatedAt,
    generated_files: generatedFiles,
    included_endpoints: includedEndpoints,
    audit_events_included: auditEventsIncluded,
    boundary_statements: boundaryStatements,
  };
}

function buildValidationSection(
  validation: PartialEvidenceBundleValidation | null | undefined,
): EvidenceBundleReportValidationSection {
  if (validation === null || validation === undefined) {
    return {
      state: "missing",
      schema_version: null,
      validation_mode: null,
      status: null,
      required_files: [],
      optional_files: [],
      missing_files: [],
      parsed_json_files: [],
      placeholder_string_detected: null,
      safe_fields_redacted: null,
      note: null,
    };
  }

  const schemaVersion = normalizeString(validation.bundle_schema_version);
  const validationMode = normalizeString(validation.validation_mode);
  const status = normalizeString(validation.status);
  const requiredFiles = normalizeStringArray(validation.required_files);
  const optionalFiles = normalizeStringArray(validation.optional_files);
  const missingFiles = normalizeStringArray(validation.missing_files);
  const parsedJsonFiles = normalizeStringArray(validation.parsed_json_files);
  const placeholderStringDetected = normalizeBoolean(
    validation.placeholder_string_detected,
  );
  const safeFieldsRedacted = normalizeBoolean(validation.safe_fields_redacted);
  const note = normalizeString(validation.note);

  const ready =
    schemaVersion !== null &&
    validationMode !== null &&
    status !== null &&
    requiredFiles.length > 0 &&
    optionalFiles.length > 0 &&
    parsedJsonFiles.length > 0 &&
    placeholderStringDetected !== null &&
    safeFieldsRedacted !== null &&
    note !== null;

  return {
    state: ready ? "ready" : "invalid",
    schema_version: schemaVersion,
    validation_mode: validationMode,
    status,
    required_files: requiredFiles,
    optional_files: optionalFiles,
    missing_files: missingFiles,
    parsed_json_files: parsedJsonFiles,
    placeholder_string_detected: placeholderStringDetected,
    safe_fields_redacted: safeFieldsRedacted,
    note,
  };
}

function buildArchiveSection(
  archivePreview: EvidenceBundleArchivePreview | null | undefined,
): EvidenceBundleReportArchiveSection {
  if (archivePreview === null || archivePreview === undefined) {
    return {
      state: "missing",
      archive_name: null,
      archive_format: null,
      bundle_name: null,
      created_at: null,
      generated_files: [],
      file_count: null,
      byte_size_estimate: null,
      includes_files_outside_bundle: null,
      symlinks_followed: null,
      signed: null,
      certified: null,
      tamper_evident: null,
      note: null,
    };
  }

  const archiveName = normalizeString(archivePreview.archive_name);
  const archiveFormat = normalizeString(archivePreview.archive_format);
  const bundleName = normalizeString(archivePreview.bundle_name);
  const createdAt = normalizeString(archivePreview.created_at);
  const generatedFiles = normalizeStringArray(archivePreview.generated_files);
  const fileCount = normalizeNumber(archivePreview.file_count);
  const byteSizeEstimate = normalizeNumber(archivePreview.byte_size_estimate);
  const includesFilesOutsideBundle = normalizeBoolean(
    archivePreview.includes_files_outside_bundle,
  );
  const symlinksFollowed = normalizeBoolean(archivePreview.symlinks_followed);
  const signed = normalizeBoolean(archivePreview.signed);
  const certified = normalizeBoolean(archivePreview.certified);
  const tamperEvident = normalizeBoolean(archivePreview.tamper_evident);
  const note = normalizeString(archivePreview.note);

  const ready =
    archiveName !== null &&
    archiveFormat !== null &&
    bundleName !== null &&
    createdAt !== null &&
    generatedFiles.length > 0 &&
    fileCount !== null &&
    byteSizeEstimate !== null &&
    includesFilesOutsideBundle !== null &&
    symlinksFollowed !== null &&
    signed !== null &&
    certified !== null &&
    tamperEvident !== null &&
    note !== null;

  return {
    state: ready ? "ready" : "invalid",
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
  };
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || isPlaceholderString(trimmed)) {
    return null;
  }

  return sanitizeEvidenceBundleText(trimmed);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sanitizeEvidenceBundleTextList(
    value.filter((item): item is string => typeof item === "string" && !isPlaceholderString(item)),
  );
}

function normalizeBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatValue(value: string | null): string {
  return value ?? "Not available";
}

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return "Not available";
  }

  return value ? "yes" : "no";
}

function formatNumeric(value: number | null): string {
  return value === null ? "Not available" : String(value);
}

function formatListOrPlaceholder(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- Not available"];
}

function isPlaceholderString(value: string): boolean {
  return value.trim().toLowerCase() === "string";
}
