import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalCommandCenter } from "./LocalCommandCenter";

describe("local command center", () => {
  it("renders safe command recipes, checklist stages, and readiness notes", () => {
    const markup = renderToStaticMarkup(<LocalCommandCenter />);

    expect(markup).toContain("Local command center");
    expect(markup).toContain("Copy all commands");
    expect(markup).toContain("Check daemon health");
    expect(markup).toContain("Generate evidence bundle");
    expect(markup).toContain("Evidence workflow checklist");
    expect(markup).toContain("Aethra evidence report reviewed");
    expect(markup).toContain("Demo readiness panel");
    expect(markup).toContain("Fixture-backed by default");
    expect(markup).not.toContain("127.0.0.1");
    expect(markup).not.toContain("prompt:");
    expect(markup).not.toContain("api_key");
    expect(markup).not.toContain("certificate");
    expect(markup).not.toContain("signed attestation");
    expect(markup).not.toContain("tamper-evident");
    expect(markup).not.toContain("legal accuracy");
  });

  it("keeps copy actions browser-local and non-executing", () => {
    const markup = renderToStaticMarkup(<LocalCommandCenter />);

    expect(markup).toContain("clipboard");
    expect(markup).toContain("does not execute commands");
    expect(markup).not.toContain("execute shell commands");
  });
});
