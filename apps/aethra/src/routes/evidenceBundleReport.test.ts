import { describe, expect, it } from "vitest";
import type { EvidenceBundlePreview } from "../api/contracts";
import { evidenceBundleFixture } from "../fixtures/aethraFixture";
import {
  buildEvidenceBundleJsonReport,
  buildEvidenceBundleJsonReportText,
  buildEvidenceBundleMarkdownReport,
} from "./evidenceBundleReport";

describe("evidence bundle report export", () => {
  it("formats a local-preview report with bundle, validation, and archive summaries", () => {
    const report = buildEvidenceBundleJsonReport({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: evidenceBundleFixture,
    });
    const markdown = buildEvidenceBundleMarkdownReport({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: evidenceBundleFixture,
    });

    expect(report).toEqual(
      expect.objectContaining({
        report_schema_version: "ignisprompt-evidence-bundle-report-0.1",
        generated_at: "2026-05-18T10:15:00.000Z",
        local_only: true,
        boundary_language: expect.arrayContaining([
          "local-preview",
          "local-only",
          "non-certified",
          "not signed",
          "not production attestation",
          "not cryptographic verification",
        ]),
        bundle: expect.objectContaining({
          state: "ready",
          schema_version: "ignisprompt-evidence-bundle-0.1",
          bundle_name: "demo-bundle",
          audit_events_included: false,
          boundary_statements: expect.arrayContaining([
            "Local preview only.",
            "Not certified.",
            "Not signed.",
            "Not production attestation.",
          ]),
        }),
        validation: expect.objectContaining({
          state: "ready",
          validation_mode: "local validation helper",
          status: "validated",
          placeholder_string_detected: false,
          safe_fields_redacted: true,
        }),
        archive: expect.objectContaining({
          state: "ready",
          archive_name: "demo-bundle.tar.gz",
          archive_format: "tar.gz",
          bundle_name: "demo-bundle",
          signed: false,
          certified: false,
          tamper_evident: false,
        }),
      }),
    );

    expect(markdown).toContain("# Aethra Evidence Bundle Report - Local Preview");
    expect(markdown).toContain("local-preview only, local-only, non-certified");
    expect(markdown).toContain("## Bundle Metadata");
    expect(markdown).toContain("## Validation Summary");
    expect(markdown).toContain("## Archive Metadata Summary");
    expect(markdown).toContain("## Local-Only Export Notes");
    expect(markdown).toContain("local validation helper");
    expect(markdown).toContain("demo-bundle.tar.gz");
    expect(markdown).not.toContain("fixture-route-001");
    expect(markdown).not.toContain("fixture-warning-001");
  });

  it("redacts prompt-like and local sensitive text from report output", () => {
    const sensitivePreview = {
      manifest: {
        bundle_schema_version: "string",
        bundle_name: "prompt: synthetic private request text /Users/alice/demo",
        generated_at: "string",
        generated_files: ["README.md", "string", "/Users/alice/demo"],
        included_endpoints: ["https://example.com/api", "string"],
        audit_events_included: true,
        local_preview_boundary: "localhost:8765",
        non_certified_boundary: "not certified",
        not_signed_boundary: "not signed",
        not_production_attestation_boundary: "not production attestation",
      },
      validation: {
        bundle_schema_version: "string",
        validation_mode: "prompt: raw user text",
        status: "string",
        required_files: ["manifest.json", "string"],
        optional_files: ["audit-events.json"],
        missing_files: ["string"],
        parsed_json_files: ["manifest.json", "string"],
        placeholder_string_detected: true,
        safe_fields_redacted: true,
        note: "Contact alice@example.com with api_keyABCDEF1234567890 and /Users/alice/demo.",
      },
      archivePreview: {
        archive_name: "string",
        archive_format: "string",
        bundle_name: "string",
        created_at: "string",
        generated_files: ["string", "/Users/alice/demo"],
        file_count: 1,
        byte_size_estimate: 42,
        includes_files_outside_bundle: false,
        symlinks_followed: false,
        signed: false,
        certified: false,
        tamper_evident: false,
        note: "hostname=workstation.local prompt: raw user text.",
      },
    } as Partial<EvidenceBundlePreview>;

    const markdown = buildEvidenceBundleMarkdownReport({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: sensitivePreview,
    });
    const jsonText = buildEvidenceBundleJsonReportText({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: sensitivePreview,
    });
    const report = buildEvidenceBundleJsonReport({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: sensitivePreview,
    });

    for (const reportText of [markdown, jsonText]) {
      expect(reportText).not.toContain("prompt: synthetic private request text");
      expect(reportText).not.toContain("/Users/alice/demo");
      expect(reportText).not.toContain("https://example.com/api");
      expect(reportText).not.toContain("alice@example.com");
      expect(reportText).not.toContain("api_keyABCDEF1234567890");
      expect(reportText).not.toContain("workstation.local");
      expect(reportText).not.toContain("fixture-route-001");
      expect(reportText).not.toContain("fixture-warning-001");
      expect(reportText).not.toContain("\"string\"");
      expect(reportText).toContain("[redacted local-only report field]");
    }

    expect(report.bundle.state).toBe("invalid");
    expect(report.bundle.schema_version).toBeNull();
    expect(report.bundle.bundle_name).toBe("[redacted local-only report field]");
    expect(report.validation.state).toBe("invalid");
    expect(report.validation.note).toBe("[redacted local-only report field]");
    expect(report.archive.state).toBe("invalid");
    expect(report.archive.note).toBe("[redacted local-only report field]");
  });

  it("handles missing metadata with conservative empty states", () => {
    const report = buildEvidenceBundleJsonReport({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: null,
    });
    const markdown = buildEvidenceBundleMarkdownReport({
      generatedAt: "2026-05-18T10:15:00.000Z",
      preview: null,
    });

    expect(report.bundle.state).toBe("missing");
    expect(report.validation.state).toBe("missing");
    expect(report.archive.state).toBe("missing");
    expect(markdown).toContain("Not available");
    expect(markdown).toContain("not cryptographic verification");
  });
});
