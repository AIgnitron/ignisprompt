export type LocalCommand = {
  id: string;
  label: string;
  command: string;
  detail: string;
};

export const localCommands: LocalCommand[] = [
  {
    id: "start-daemon",
    label: "Start local daemon",
    command: "./scripts/start-dev.sh",
    detail: "Run locally from the repo root to start ignispromptd.",
  },
  {
    id: "smoke",
    label: "Run daemon smoke",
    command: "./scripts/smoke.sh",
    detail: "Run locally after the daemon is listening on loopback.",
  },
  {
    id: "release-check",
    label: "Run release check",
    command: "./scripts/release-check.sh",
    detail: "Run locally for the combined local preview verification path.",
  },
  {
    id: "health",
    label: "Check health",
    command: "curl -s http://127.0.0.1:8765/health | jq .",
    detail: "Run locally to verify the daemon health endpoint.",
  },
  {
    id: "version-status",
    label: "Check daemon version status",
    command: "curl -s http://127.0.0.1:8765/v1/status/version | jq .",
    detail: "Run locally to inspect support/debugging metadata.",
  },
  {
    id: "model-status",
    label: "Check model and runner status hints",
    command: "curl -s http://127.0.0.1:8765/v1/status/models | jq .",
    detail: "Run locally to inspect conservative model and runner hints.",
  },
  {
    id: "sustainability-metrics",
    label: "Check sustainability metrics",
    command:
      'curl -s "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d" | jq .',
    detail: "Run locally to inspect proxy-only local preview metrics.",
  },
  {
    id: "start-aethra",
    label: "Start Aethra dashboard",
    command: "cd apps/aethra && npm run dev",
    detail: "Run locally from the repo root to start the dashboard.",
  },
];

export function getAllLocalCommandsText(commands = localCommands): string {
  return commands.map((item) => item.command).join("\n");
}
