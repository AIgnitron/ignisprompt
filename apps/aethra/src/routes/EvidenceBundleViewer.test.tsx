import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EvidenceBundleViewer,
  sanitizeEvidenceBundleText,
} from "./EvidenceBundleViewer";

describe("EvidenceBundleViewer", () => {
  it("renders fixture-backed bundle metadata and validation summary", () => {
    const markup = renderToStaticMarkup(<EvidenceBundleViewer />);

    expect(markup).toContain("Local evidence bundle workflow");
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
});
