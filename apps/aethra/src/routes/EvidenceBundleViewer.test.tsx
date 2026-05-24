import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { EvidenceBundlePreview } from "../api/contracts";
import {
  EvidenceBundleViewer,
  sanitizeEvidenceBundleText,
} from "./EvidenceBundleViewer";

describe("EvidenceBundleViewer", () => {
  it("renders fixture-backed bundle metadata and CLI snippets", () => {
    const markup = renderToStaticMarkup(<EvidenceBundleViewer />);

    expect(markup).toContain("Local evidence bundle workflow");
    expect(markup).toContain("CLI command snippets");
    expect(markup).toContain("Report export");
    expect(markup).toContain("Copy Markdown report");
    expect(markup).toContain("Copy JSON report");
    expect(markup).toContain("Clipboard only");
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
