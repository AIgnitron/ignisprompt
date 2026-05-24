export type LocalCommand = {
  id: string;
  label: string;
  command: string;
  detail: string;
};

export type EvidenceWorkflowStage = {
  id: string;
  label: string;
  detail: string;
  status: "fixture-backed" | "manual" | "reviewed";
};

export type DemoReadinessNote = {
  id: string;
  label: string;
  detail: string;
};

export const overviewLocalCommands: LocalCommand[] = [
  {
    id: "start-daemon",
    label: "Start local daemon",
    command: "./scripts/start-dev.sh",
    detail: "Run locally from the repo root to start ignispromptd.",
  },
  {
    id: "health",
    label: "Check daemon health",
    command: "cargo run -p ignispromptctl -- health",
    detail: "Run locally to confirm the daemon health endpoint.",
  },
  {
    id: "route-explain",
    label: "Inspect route explanation",
    command:
      'cargo run -p ignispromptctl -- route-explain --text "Review this synthetic contract clause."',
    detail: "Run locally with synthetic text to inspect route decisions.",
  },
  {
    id: "audit-events",
    label: "Inspect audit events",
    command: "cargo run -p ignispromptctl -- audit-events",
    detail: "Run locally to inspect read-only audit history.",
  },
  {
    id: "evidence-check",
    label: "Run evidence regression check",
    command: "make evidence-check",
    detail: "Run locally to verify the evidence workflow contract.",
  },
  {
    id: "start-aethra",
    label: "Start Aethra dashboard",
    command: "cd apps/aethra && npm run dev",
    detail: "Run locally from the repo root to start the dashboard.",
  },
];

export const commandCenterLocalCommands: LocalCommand[] = [
  ...overviewLocalCommands,
  {
    id: "status-version",
    label: "Check daemon version status",
    command: "cargo run -p ignispromptctl -- status-version",
    detail: "Run locally to inspect support and debugging metadata.",
  },
  {
    id: "models",
    label: "List model manifests",
    command: "cargo run -p ignispromptctl -- models",
    detail: "Run locally to inspect configured model manifests.",
  },
  {
    id: "sustainability-metrics",
    label: "Check sustainability metrics",
    command: "cargo run -p ignispromptctl -- sustainability --period 30d",
    detail: "Run locally to inspect proxy-only local preview metrics.",
  },
  {
    id: "evidence-generate",
    label: "Generate evidence bundle",
    command:
      "cargo run -p ignispromptctl -- evidence-bundle --output local-evidence/demo-bundle",
    detail: "Write a local-preview bundle under ignored local-evidence/ paths.",
  },
  {
    id: "evidence-list",
    label: "List evidence bundle",
    command:
      "cargo run -p ignispromptctl -- evidence-bundle --list local-evidence/demo-bundle",
    detail: "Inspect bundle files without calling the daemon.",
  },
  {
    id: "evidence-validate",
    label: "Validate evidence bundle",
    command:
      "cargo run -p ignispromptctl -- evidence-bundle --validate local-evidence/demo-bundle",
    detail: "Validate the on-disk bundle contract without daemon access.",
  },
  {
    id: "evidence-archive",
    label: "Archive evidence bundle",
    command:
      "cargo run -p ignispromptctl -- evidence-bundle --archive local-evidence/demo-bundle",
    detail: "Create a local archive under ignored local-evidence/ paths.",
  },
  {
    id: "evidence-verify-archive",
    label: "Verify evidence archive",
    command:
      "cargo run -p ignispromptctl -- evidence-bundle --verify-archive local-evidence/archives/demo-bundle.tar.gz",
    detail: "Inspect a local archive without cryptographic verification.",
  },
  {
    id: "evidence-print-manifest",
    label: "Print evidence manifest",
    command:
      "cargo run -p ignispromptctl -- evidence-bundle --print-manifest local-evidence/demo-bundle",
    detail: "Print the manifest without extraction or upload.",
  },
  {
    id: "demo-workflow-dry-run",
    label: "Demo workflow dry-run",
    command: "./scripts/demo-local-evidence-workflow.sh --dry-run",
    detail: "Preview the local evidence workflow without starting the daemon.",
  },
  {
    id: "demo-workflow-self-test",
    label: "Demo workflow self-test",
    command: "./scripts/demo-local-evidence-workflow.sh --self-test",
    detail: "Check ignored paths and command construction without a live daemon.",
  },
];

export const evidenceWorkflowChecklist: EvidenceWorkflowStage[] = [
  {
    id: "daemon-health",
    label: "Daemon health",
    detail: "Fixture-backed or manually refreshed health status is visible.",
    status: "fixture-backed",
  },
  {
    id: "route-explain",
    label: "Route explain",
    detail: "Synthetic text or a checked fixture is ready for inspection.",
    status: "manual",
  },
  {
    id: "audit-events",
    label: "Audit events",
    detail: "Read-only audit history is available for review.",
    status: "fixture-backed",
  },
  {
    id: "bundle-generated",
    label: "Evidence bundle generated",
    detail: "The local-preview bundle exists under ignored local-evidence/ paths.",
    status: "manual",
  },
  {
    id: "bundle-listed",
    label: "Bundle listed",
    detail: "The on-disk bundle files are visible without daemon access.",
    status: "manual",
  },
  {
    id: "bundle-validated",
    label: "Bundle validated",
    detail: "Manifest and summary metadata were checked locally.",
    status: "manual",
  },
  {
    id: "archive-created",
    label: "Archive created",
    detail: "A local archive was written under ignored local-evidence/ paths.",
    status: "manual",
  },
  {
    id: "archive-verified",
    label: "Archive verified",
    detail: "The archive was inspected structurally and locally.",
    status: "manual",
  },
  {
    id: "manifest-inspected",
    label: "Manifest inspected",
    detail: "The manifest text was printed without extraction or upload.",
    status: "manual",
  },
  {
    id: "report-reviewed",
    label: "Aethra evidence report reviewed",
    detail:
      "The browser-local report export was reviewed as local preview guidance.",
    status: "reviewed",
  },
];

export const demoReadinessNotes: DemoReadinessNote[] = [
  {
    id: "fixture-default",
    label: "Fixture-backed by default",
    detail: "Screens show bundled local-preview data until live-local loading is manual.",
  },
  {
    id: "live-manual",
    label: "Manual live-local loading",
    detail: "The dashboard does not poll, persist, or auto-run local metadata loads.",
  },
  {
    id: "read-only",
    label: "Read-only dashboard",
    detail: "Aethra observes local state and does not act as a control plane.",
  },
  {
    id: "local-only",
    label: "Local-only evidence",
    detail: "Evidence artifacts stay under ignored local-evidence/ paths.",
  },
  {
    id: "no-telemetry",
    label: "No telemetry or cloud calls",
    detail: "The demo guidance avoids telemetry and cloud calls by default.",
  },
  {
    id: "archive-boundary",
    label: "Archive boundary",
    detail: "Archive output is local-only and not signed.",
  },
  {
    id: "validation-boundary",
    label: "Validation boundary",
    detail: "Archive verification is structural local validation only.",
  },
  {
    id: "non-certified",
    label: "Non-certified preview",
    detail: "The workflow is not production attestation and not compliance certification.",
  },
];

export function getAllLocalCommandsText(
  commands = overviewLocalCommands,
): string {
  return commands.map((item) => item.command).join("\n");
}
