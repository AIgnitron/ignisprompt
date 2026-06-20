import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Aethra app navigation and demo guidance", () => {
  it("keeps the safe sidebar order and guided path copy visible", () => {
    const markup = renderToStaticMarkup(<App />);
    const labels = [
      "Overview",
      "Local demo studio",
      "Route explorer",
      "Audit events",
      "Model and runner status",
      "Evidence bundle",
      "Sustainability preview",
      "Local readiness",
      "Local operator console",
      "Local policy workbench",
      "Local command center",
    ];

    let previousIndex = -1;
    for (const label of labels) {
      const currentIndex = markup.indexOf(label);
      expect(currentIndex).toBeGreaterThan(previousIndex);
      previousIndex = currentIndex;
    }

    expect(markup).toContain("Guided Demo Path");
    expect(markup).toContain("Recommended safe walkthrough");
    expect(markup).toContain("Local operations summary");
    expect(markup).toContain("Local routing policy summary");
    expect(markup).toContain("Local evidence packages");
    expect(markup).toContain("Operations endpoints");
    expect(markup).toContain("Evidence packages");
    expect(markup).toContain("Recent local activity");
    expect(markup).toContain("Ready model hints");
    expect(markup).toContain("model readiness");
    expect(markup).toContain("Local Demo Studio");
    expect(markup).toContain("Evidence bundle");
    expect(markup).toContain("Review what is generated locally, what stays ignored by git");
  });

  it("keeps explicit boundary language while avoiding unsafe positive claims", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Not legal advice.");
    expect(markup).toContain(
      "Not compliance claims, not security assurance, and not ESG reporting evidence.",
    );
    expect(markup).toContain(
      "Not signed attestation or tamper-evident audit evidence.",
    );
    expect(markup).not.toContain("production attestation");
    expect(markup).not.toContain("production readiness");
    expect(markup).not.toContain("raw audit text");
    expect(markup).not.toContain("ghp_");
    expect(markup).not.toContain("sk-");
    expect(markup).not.toContain("/Users/");
  });

  it("renders a compact collapsed local-preview panel with daemon-url guidance", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Offline preview");
    expect(markup).toContain("Read-only");
    expect(markup).toContain("No telemetry");
    expect(markup).toContain("No cloud calls by default");
    expect(markup).toContain("Local preview and live-local setup");
    expect(markup).toContain("http://127.0.0.1:8765");
    expect(markup).toContain("http://127.0.0.1:5173");
    expect(markup).toContain("This field is not the Aethra dev server URL");
    expect(markup).toContain("Refresh local daemon data");
    expect(markup).toContain("operations summary");
    expect(markup).toContain("model readiness");
    expect(markup).toContain("routing policy summary");
    expect(markup).toContain("evidence package index");
    expect(markup).toContain("Health-only check");
    expect(markup).toContain("No model or runner controls");
    expect(markup).toContain("No command execution");
    expect(markup).toContain("<details");
    expect(markup).not.toContain("<details class=\"data-source-details\" open");
  });

  it("does not fetch live-local metadata during initial render", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderToStaticMarkup(<App />);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does not render mutation or execution controls in the local daemon refresh path", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).not.toContain("Enable cloud");
    expect(markup).not.toContain("Run model");
    expect(markup).not.toContain("Execute model");
    expect(markup).not.toContain("Download model");
    expect(markup).not.toContain("Delete model");
    expect(markup).not.toContain("Edit connector");
    expect(markup).not.toContain("Disable connector");
    expect(markup).not.toContain("Edit policy");
    expect(markup).not.toContain("Mutate policy");
    expect(markup).not.toContain("Mutate routing");
    expect(markup).not.toContain("Upload package");
    expect(markup).not.toContain("Download package");
    expect(markup).not.toContain("Delete package");
    expect(markup).not.toContain("Generate package");
    expect(markup).not.toContain("Validate package");
  });

  it("does not add polling or live-local storage persistence APIs", () => {
    const appSource = App.toString();

    expect(appSource).not.toContain("setInterval");
    expect(appSource).not.toContain("localStorage");
    expect(appSource).not.toContain("sessionStorage");
  });
});
