import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { EvidenceBundlePreview } from "../api/contracts";
import { evidencePackageIndexFixture } from "../api/fixtures";
import {
  EvidenceBundleViewer,
  sanitizeEvidenceBundleText,
} from "./EvidenceBundleViewer";

describe("EvidenceBundleViewer", () => {
  it("renders fixture-backed bundle metadata and CLI snippets", () => {
    const markup = renderToStaticMarkup(<EvidenceBundleViewer />);

    expect(markup).toContain("Local evidence bundle workflow");
    expect(markup).toContain("CLI command snippets");
    expect(markup).toContain("Clipboard report copy");
    expect(markup).toContain("Local evidence packages");
    expect(markup).toContain("Offline preview");
    expect(markup).toContain("readiness_package");
    expect(markup).toContain("golden_legal");
    expect(markup).toContain("Copy Markdown report");
    expect(markup).toContain("Copy JSON report");
    expect(markup).toContain("Clipboard only");
    expect(markup).not.toContain("Report export");
    expect(markup).not.toContain("Clipboard export");
    expect(markup).toContain(
      "ignispromptctl evidence-bundle --output local-evidence/demo-bundle",
    );
    expect(markup).toContain(
      "Archive verification is structural local validation only",
    );
    expect(markup).toContain("Bundle schema version");
    expect(markup).toContain("local validation helper");
    expect(markup).toContain("Archive metadata preview");
    expect(markup).toContain("Preview available");
  });

  it("redacts local paths, URLs, and secrets in helper text", () => {
    const redacted = sanitizeEvidenceBundleText(
      "https://example.com/path /Users/alice/demo sk-abc123 ghp_test",
    );

    expect(redacted).not.toContain("example.com");
    expect(redacted).not.toContain("/Users/alice");
    expect(redacted).not.toContain("sk-abc123");
    expect(redacted).not.toContain("ghp_test");
  });

  it("does not render prompts or raw audit event content by default", () => {
    const markup = renderToStaticMarkup(<EvidenceBundleViewer />);

    expect(markup).not.toContain("Review this synthetic contract clause.");
    expect(markup).not.toContain("fixture-route-001");
    expect(markup).not.toContain("fixture-warning-001");
    expect(markup).not.toContain("gpt-4.1-mini");
    expect(markup).not.toContain("127.0.0.1");
    expect(markup).not.toContain("/Users/");
    expect(markup).not.toContain("Upload package");
    expect(markup).not.toContain("Download package");
    expect(markup).not.toContain("Delete package");
    expect(markup).not.toContain("Generate package");
    expect(markup).not.toContain("Validate package");
  });

  it("renders manually loaded live-local evidence package metadata", () => {
    const markup = renderToStaticMarkup(
      <EvidenceBundleViewer
        dataMode="live-local"
        liveEvidencePackagesState={{
          status: "loaded",
          loadedAt: "2026-05-20T00:01:00Z",
          index: {
            ...evidencePackageIndexFixture,
            packages: [
              {
                ...evidencePackageIndexFixture.packages[0],
                package_id: "readiness__live",
                display_name: "live-readiness",
                relative_path: "local-evidence/readiness/live-readiness",
              },
            ],
            aggregate_summary: {
              ...evidencePackageIndexFixture.aggregate_summary,
              total_packages: 1,
              packages_by_type: { readiness_package: 1 },
            },
          },
        }}
      />,
    );

    expect(markup).toContain("Local daemon data");
    expect(markup).toContain("live-readiness");
    expect(markup).toContain("local-evidence/readiness/live-readiness");
    expect(markup).toContain("Read-only metadata only");
  });

  it("renders evidence package empty state when no packages are returned", () => {
    const markup = renderToStaticMarkup(
      <EvidenceBundleViewer
        dataMode="live-local"
        liveEvidencePackagesState={{
          status: "loaded",
          loadedAt: "2026-05-20T00:01:00Z",
          index: {
            ...evidencePackageIndexFixture,
            root_summary: {
              ...evidencePackageIndexFixture.root_summary,
              package_count: 0,
            },
            packages: [],
            aggregate_summary: {
              total_packages: 0,
              packages_by_type: {},
              packages_with_manifests: 0,
              packages_with_reports: 0,
              packages_with_validation_like_files: 0,
              packages_with_attestation_like_names: 0,
              packages_with_warnings: 0,
              scan_was_partial: false,
            },
          },
        }}
      />,
    );

    expect(markup).toContain("No evidence packages indexed");
    expect(markup).toContain("does not create packages");
  });

  it("shows conservative empty states when metadata is missing", () => {
    const markup = renderToStaticMarkup(<EvidenceBundleViewer preview={null} />);

    expect(markup).toContain("No manifest metadata available");
    expect(markup).toContain("No validation summary available");
    expect(markup).toContain("No archive metadata preview");
    expect(markup).toContain("CLI command snippets");
  });

  it("shows invalid metadata states without rendering raw values", () => {
    const markup = renderToStaticMarkup(
      <EvidenceBundleViewer
        preview={
          {
            manifest: {
              bundle_schema_version: "string",
              bundle_name: "string",
            },
            validation: {
              bundle_schema_version: "string",
              status: "string",
            },
            archivePreview: {
              archive_name: "string",
              archive_format: "string",
            },
          } as Partial<EvidenceBundlePreview>
        }
      />,
    );

    expect(markup).toContain("Bundle manifest metadata is incomplete");
    expect(markup).toContain("Validation summary is incomplete");
    expect(markup).toContain("Archive metadata is incomplete");
    expect(markup).not.toContain("review this synthetic contract clause");
    expect(markup).not.toContain("/Users/");
    expect(markup).not.toContain("ghp_");
    expect(markup).not.toContain("sk-");
  });
});
