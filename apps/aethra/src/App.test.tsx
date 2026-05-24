import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Aethra app navigation and demo guidance", () => {
  it("keeps the safe demo order and guided path copy visible", () => {
    const markup = renderToStaticMarkup(<App />);
    const labels = [
      "Overview and mode",
      "Route inspection",
      "Audit records",
      "Model / runner hints",
      "Evidence workflow",
      "Sustainability preview",
    ];

    let previousIndex = -1;
    for (const label of labels) {
      const currentIndex = markup.indexOf(label);
      expect(currentIndex).toBeGreaterThan(previousIndex);
      previousIndex = currentIndex;
    }

    expect(markup).toContain("Guided Demo Path");
    expect(markup).toContain("Recommended safe walkthrough");
    expect(markup).toContain("Evidence workflow");
    expect(markup).toContain("Open the Evidence Bundle Viewer and report export helpers");
  });

  it("keeps demo copy away from unsafe claim phrases by default", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).not.toContain("signed attestation");
    expect(markup).not.toContain("tamper-evident storage");
    expect(markup).not.toContain("production attestation");
    expect(markup).not.toContain("production readiness");
    expect(markup).not.toContain("raw audit text");
    expect(markup).not.toContain("ghp_");
    expect(markup).not.toContain("sk-");
    expect(markup).not.toContain("/Users/");
  });
});
