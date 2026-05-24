import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalReadiness } from "./LocalReadiness";

const notLoadedProps = {
  dataMode: "fixture" as const,
  liveHealthState: { status: "not-loaded" as const },
  liveModelsState: { status: "not-loaded" as const },
  liveModelStatusState: { status: "not-loaded" as const },
  liveVersionStatusState: { status: "not-loaded" as const },
};

describe("local readiness route", () => {
  it("renders expected safe readiness labels and guidance", () => {
    const markup = renderToStaticMarkup(<LocalReadiness {...notLoadedProps} />);

    expect(markup).toContain("Aethra local readiness");
    expect(markup).toContain("local preview readiness");
    expect(markup).toContain("Daemon health");
    expect(markup).toContain("Version/status");
    expect(markup).toContain("Configured models");
    expect(markup).toContain("Model/runner status hints");
    expect(markup).toContain("Evidence workflow availability");
    expect(markup).toContain("Security/evidence checks");
    expect(markup).toContain("status hint");
    expect(markup).toContain("local helper checks");
    expect(markup).toContain("./scripts/start-dev.sh");
    expect(markup).toContain("cargo run -p ignispromptctl -- doctor");
    expect(markup).toContain("cargo run -p ignispromptctl -- readiness");
    expect(markup).toContain("make dev-check");
    expect(markup).toContain("make evidence-check");
    expect(markup).toContain("Copy-safe readiness report");
    expect(markup).toContain("Copy readiness report");
    expect(markup).toContain("# Aethra Local Readiness Report");
    expect(markup).toContain("Readiness diagnostic drilldown");
    expect(markup).toContain("Readiness package preview");
    expect(markup).toContain("Package manifest summary");
    expect(markup).toContain("local-evidence/readiness/demo-readiness");
    expect(markup).toContain("readiness-report.json");
    expect(markup).toContain("readiness-report.md");
    expect(markup).toContain("Category: daemon");
    expect(markup).toContain("Category: runner hints");
    expect(markup).toContain("Category: audit");
    expect(markup).toContain("Category: aethra");
    expect(markup).toContain("Next step:");
    expect(markup).toContain("Boundary:");
  });

  it("avoids unsafe claims and sensitive default rendering", () => {
    const markup = renderToStaticMarkup(<LocalReadiness {...notLoadedProps} />);
    const lowerMarkup = markup.toLowerCase();

    expect(lowerMarkup).not.toContain("production readiness");
    expect(lowerMarkup).not.toContain("compliance certification");
    expect(lowerMarkup).not.toContain("security certification");
    expect(lowerMarkup).not.toContain("signed attestation");
    expect(lowerMarkup).not.toContain("formal attestation");
    expect(lowerMarkup).not.toContain("tamper-evident");
    expect(lowerMarkup).not.toContain("cryptographic verification");
    expect(lowerMarkup).not.toContain("legal accuracy is solved");
    expect(lowerMarkup).not.toContain("legal accuracy");
    expect(lowerMarkup).not.toContain("certified");
    expect(lowerMarkup).not.toContain("model control");
    expect(lowerMarkup).not.toContain("runner control");
    expect(lowerMarkup).not.toContain("run shell commands");
    expect(lowerMarkup).not.toContain("continuous monitoring");
    expect(lowerMarkup).not.toContain("global aggregation enabled");
    expect(lowerMarkup).not.toContain("telemetry enabled");
    expect(lowerMarkup).not.toContain("cloud upload");
    expect(lowerMarkup).not.toContain("file picker");
    expect(lowerMarkup).not.toContain("prompt:");
    expect(lowerMarkup).not.toContain("secret");
    expect(lowerMarkup).not.toContain("api_key");
    expect(lowerMarkup).not.toContain("api key");
    expect(lowerMarkup).not.toContain("127.0.0.1");
    expect(lowerMarkup).not.toContain("localhost");
    expect(lowerMarkup).not.toContain("hostname");
    expect(lowerMarkup).not.toContain("username");
    expect(lowerMarkup).not.toContain("machine identifier");
    expect(lowerMarkup).not.toContain("/users/");
    expect(lowerMarkup).not.toContain("raw audit text");
    expect(lowerMarkup).not.toContain("production-grade inference");
    expect(lowerMarkup).not.toContain("production-grade security");
    expect(lowerMarkup).not.toContain(["esg", "certification"].join(" "));
    expect(lowerMarkup).not.toContain("compliance certification");
    expect(lowerMarkup).not.toContain("supply-chain certification");
    expect(lowerMarkup).not.toContain("signed attestation");
    expect(lowerMarkup).not.toContain("cryptographic verification");
  });

  it("renders manual live-local labels only when loaded data is supplied", () => {
    const markup = renderToStaticMarkup(
      <LocalReadiness
        {...notLoadedProps}
        dataMode="live-local"
        liveHealthState={{
          status: "loaded",
          loadedAt: "2026-05-24T00:00:00Z",
          health: {
            status: "ok",
            service: "ignispromptd",
            version: "0.1.5-dev",
            started_at: "2026-05-24T00:00:00Z",
            local_only: true,
            model_count: 0,
          },
        }}
      />,
    );

    expect(markup).toContain("Manual live-local");
    expect(markup).toContain("0.1.5-dev");
    expect(markup).toContain("Fixture-backed");
  });
});
