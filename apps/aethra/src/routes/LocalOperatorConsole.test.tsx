import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalOperatorConsole } from "./LocalOperatorConsole";

describe("local operator console route", () => {
  it("renders expected operator sections and copy-only recipes", () => {
    const markup = renderToStaticMarkup(<LocalOperatorConsole />);

    expect(markup).toContain("Aethra local operator console");
    expect(markup).toContain("local preview operator workflow");
    expect(markup).toContain("Daemon and endpoint readiness");
    expect(markup).toContain("CLI readiness package");
    expect(markup).toContain("Evidence bundle workflow");
    expect(markup).toContain("Aethra demo path");
    expect(markup).toContain("Local safety boundaries");
    expect(markup).toContain("Suggested next local commands");
    expect(markup).toContain("Copy-only operator command recipes");
    expect(markup).toContain("./scripts/start-dev.sh");
    expect(markup).toContain("cargo run -p ignispromptctl -- doctor");
    expect(markup).toContain("cargo run -p ignispromptctl -- readiness");
    expect(markup).toContain("cargo run -p ignispromptctl -- readiness --json");
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- operator-summary --package-output local-evidence/operator/demo",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- operator-summary --package-list local-evidence/operator/demo",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- operator-summary --package-validate local-evidence/operator/demo",
    );
    expect(markup).toContain("Local policy workbench");
    expect(markup).toContain("cargo run -p ignispromptctl -- policy-scenarios");
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- policy-scenarios --json",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- policy-scenarios --package-output local-evidence/policy/demo",
    );
    expect(markup).toContain(
      "cargo run -p ignispromptctl -- policy-scenarios --package-validate local-evidence/policy/demo",
    );
    expect(markup).toContain("make readiness-check");
    expect(markup).toContain("make policy-check");
    expect(markup).toContain("make evidence-check");
    expect(markup).toContain(
      "./scripts/demo-local-evidence-workflow.sh --self-test",
    );
    expect(markup).toContain("Read-only status hints");
    expect(markup).toContain("Operator package preview");
    expect(markup).toContain("Package manifest summary");
    expect(markup).toContain("local-evidence/operator/demo");
    expect(markup).toContain("operator-summary.json");
    expect(markup).toContain("operator-report.md");
    expect(markup).toContain("package validation is structural/local only");
    expect(markup).toContain("not signed");
    expect(markup).toContain("Local operator boundary reminders");
    expect(markup).toContain("status hints, not controls");
    expect(markup).toContain("local helper checks, not certification");
  });

  it("avoids unsafe claims and sensitive default rendering", () => {
    const markup = renderToStaticMarkup(<LocalOperatorConsole />);
    const lowerMarkup = markup.toLowerCase();

    expect(lowerMarkup).not.toContain("production readiness");
    expect(lowerMarkup).not.toContain("production deployment");
    expect(lowerMarkup).not.toContain("legal accuracy");
    expect(lowerMarkup).not.toContain("compliance certification");
    expect(lowerMarkup).not.toContain("security certification");
    expect(lowerMarkup).not.toContain(["esg", "certification"].join(" "));
    expect(lowerMarkup).not.toContain("signed attestation");
    expect(lowerMarkup).not.toContain("tamper-evident");
    expect(lowerMarkup).not.toContain("cryptographic verification");
    expect(lowerMarkup).not.toContain("model controls");
    expect(lowerMarkup).not.toContain("runner controls");
    expect(lowerMarkup).not.toContain("prompt:");
    expect(lowerMarkup).not.toContain("raw user text");
    expect(lowerMarkup).not.toContain("raw audit");
    expect(lowerMarkup).not.toContain("secret");
    expect(lowerMarkup).not.toContain("api_key");
    expect(lowerMarkup).not.toContain("api key");
    expect(lowerMarkup).not.toContain("127.0.0.1");
    expect(lowerMarkup).not.toContain("localhost");
    expect(lowerMarkup).not.toContain("hostname");
    expect(lowerMarkup).not.toContain("username");
    expect(lowerMarkup).not.toContain("machine identifier");
    expect(lowerMarkup).not.toContain("/users/");
    expect(lowerMarkup).not.toContain("/home/");
    expect(lowerMarkup).not.toContain("file picker");
    expect(lowerMarkup).not.toContain("cloud upload");
    expect(lowerMarkup).not.toContain("telemetry enabled");
  });
});
