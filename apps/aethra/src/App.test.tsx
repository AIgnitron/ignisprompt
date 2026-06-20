import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { Help } from "./routes/Help";

describe("Aethra app navigation and demo guidance", () => {
  it("keeps the safe sidebar order and guided path copy visible", () => {
    const markup = renderToStaticMarkup(<App />);
    const labels = [
      "Overview",
      "Routing",
      "Audit",
      "Models",
      "Evidence",
      "Sustainability",
      "Help",
      "Local demo studio",
      "Local readiness",
      "Local operator console",
      "Local policy workbench",
      "Local command center",
    ];

    let previousIndex = -1;
    for (const label of labels) {
      const currentIndex = markup.indexOf(`>${label}</button>`);
      expect(currentIndex).toBeGreaterThan(previousIndex);
      previousIndex = currentIndex;
    }

    expect(markup).toContain("Live Local Dashboard");
    expect(markup).toContain("What is happening now?");
    expect(markup).toContain("Suggested Review Flow");
    expect(markup).toContain("Start daemon");
    expect(markup).toContain("Refresh local daemon data");
    expect(markup).toContain("Review daemon health/version");
    expect(markup).toContain("Review models/readiness");
    expect(markup).toContain("Review routing policy");
    expect(markup).toContain("Review evidence packages");
    expect(markup).toContain("Review audit/operations");
    expect(markup).toContain("Review sustainability metrics");
    expect(markup).toContain("What this dashboard proves");
    expect(markup).toContain("local daemon connectivity");
    expect(markup).toContain("local metadata visibility");
    expect(markup).toContain("Help");
    expect(markup).toContain("Data source details");
    expect(markup).toContain("Product limits");
    expect(markup).toContain("Endpoint Matrix");
    expect(markup).toContain("Core daemon status");
    expect(markup).toContain("Models and readiness");
    expect(markup).toContain("Routing and operations");
    expect(markup).toContain("Evidence and audit");
    expect(markup).toContain("Sustainability");
    expect(markup).toContain("Operations summary");
    expect(markup).toContain("Routing policy summary");
    expect(markup).toContain("Evidence package index");
    expect(markup).toContain("Not loaded yet");
    expect(markup).toContain("model readiness");
    expect(markup).toContain("cargo run -p ignispromptd");
    expect(markup).toContain("cd apps/aethra &amp;&amp; npm run dev");
    expect(markup).toContain("cargo run -p ignispromptctl -- doctor --json");
  });

  it("moves long safety explanations out of the default product surface", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).not.toContain("Not legal advice.");
    expect(markup).not.toContain("Not compliance claims");
    expect(markup).not.toContain("Not ESG reporting evidence");
    expect(markup).not.toContain("Local demo boundary reminders");
    expect(markup).not.toContain("Local preview boundary reminders");
    expect(markup).not.toContain("production attestation");
    expect(markup).not.toContain("production readiness");
    expect(markup).not.toContain("raw audit text");
    expect(markup).not.toContain("ghp_");
    expect(markup).not.toContain("sk-");
    expect(markup).not.toContain("/Users/");
  });

  it("renders a compact collapsed local-preview panel with daemon-url guidance", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Offline preview fixture");
    expect(markup).toContain("Read-only");
    expect(markup).toContain("Local preview and live-local setup");
    expect(markup).toContain("http://127.0.0.1:8765");
    expect(markup).toContain("http://127.0.0.1:5173");
    expect(markup).toContain("This field is not the Aethra dev server URL");
    expect(markup).toContain("Refresh local daemon data");
    expect(markup).toContain("Operations summary");
    expect(markup).toContain("model readiness");
    expect(markup).toContain("Routing policy summary");
    expect(markup).toContain("Evidence package index");
    expect(markup).toContain("Health-only check");
    expect(markup).toContain("<details");
    expect(markup).not.toContain("<details class=\"data-source-details\" open");
  });

  it("does not fetch live-local metadata during initial render", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderToStaticMarkup(<App />);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("renders Help with local-preview and safety guidance", () => {
    const markup = renderToStaticMarkup(<Help />);

    expect(markup).toContain("Aethra help");
    expect(markup).toContain("Local Preview");
    expect(markup).toContain("Data Sources");
    expect(markup).toContain("Safety / Product Limits");
    expect(markup).toContain("Troubleshooting");
    expect(markup).toContain("Review Checklist");
    expect(markup).toContain("Aethra is not legal advice");
    expect(markup).toContain("No telemetry or cloud calls are made by default");
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
    expect(markup).not.toContain("Export Markdown");
    expect(markup).not.toContain("Export JSON");
    expect(markup).not.toContain("Run live route");
    expect(markup).not.toContain("Live local route-explain");
  });

  it("does not add polling or live-local storage persistence APIs", () => {
    const appSource = App.toString();

    expect(appSource).not.toContain("setInterval");
    expect(appSource).not.toContain("localStorage");
    expect(appSource).not.toContain("sessionStorage");
  });
});
