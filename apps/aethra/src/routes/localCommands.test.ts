import { describe, expect, it } from "vitest";
import {
  commandCenterLocalCommands,
  getAllLocalCommandsText,
  overviewLocalCommands,
} from "./localCommands";

describe("local preview command helpers", () => {
  it("includes the expected overview commands without hostnames", () => {
    expect(overviewLocalCommands.map((item) => item.command)).toEqual([
      "./scripts/start-dev.sh",
      "cargo run -p ignispromptctl -- health",
      'cargo run -p ignispromptctl -- route-explain --text "Review this synthetic contract clause."',
      "cargo run -p ignispromptctl -- audit-events",
      "make evidence-check",
      "cd apps/aethra && npm run dev",
    ]);
    expect(overviewLocalCommands.map((item) => item.command).join(" ")).not.toContain("127.0.0.1");
  });

  it("formats copy-all content without remote execution metadata", () => {
    const copyText = getAllLocalCommandsText();

    expect(copyText).toContain("./scripts/start-dev.sh");
    expect(copyText).toContain("cd apps/aethra && npm run dev");
    expect(copyText).not.toContain("telemetry");
    expect(copyText).not.toContain("github");
  });

  it("includes the expected command center recipes and workflow checks", () => {
    expect(commandCenterLocalCommands.map((item) => item.id)).toEqual([
      "start-daemon",
      "health",
      "route-explain",
      "audit-events",
      "evidence-check",
      "start-aethra",
      "status-version",
      "models",
      "sustainability-metrics",
      "evidence-generate",
      "evidence-list",
      "evidence-validate",
      "evidence-archive",
      "evidence-verify-archive",
      "evidence-print-manifest",
      "demo-workflow-dry-run",
      "demo-workflow-self-test",
    ]);
    expect(
      commandCenterLocalCommands.map((item) => item.command),
    ).toContain(
      "cargo run -p ignispromptctl -- evidence-bundle --archive local-evidence/demo-bundle",
    );
    expect(
      commandCenterLocalCommands.map((item) => item.command).join(" "),
    ).not.toContain("127.0.0.1");
  });
});
