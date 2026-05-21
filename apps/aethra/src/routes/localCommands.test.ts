import { describe, expect, it } from "vitest";
import { getAllLocalCommandsText, localCommands } from "./localCommands";

describe("local preview command helpers", () => {
  it("includes the expected local daemon and dashboard commands", () => {
    expect(localCommands.map((item) => item.command)).toEqual([
      "./scripts/start-dev.sh",
      "./scripts/smoke.sh",
      "./scripts/release-check.sh",
      "curl -s http://127.0.0.1:8765/health | jq .",
      "curl -s http://127.0.0.1:8765/v1/status/version | jq .",
      "curl -s http://127.0.0.1:8765/v1/status/models | jq .",
      'curl -s "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d" | jq .',
      "cd apps/aethra && npm run dev",
    ]);
  });

  it("formats copy-all content without remote execution metadata", () => {
    const copyText = getAllLocalCommandsText();

    expect(copyText).toContain("./scripts/start-dev.sh");
    expect(copyText).toContain("cd apps/aethra && npm run dev");
    expect(copyText).not.toContain("telemetry");
    expect(copyText).not.toContain("github");
  });
});
