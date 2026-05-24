import {
  getReadinessSourceLabel,
  localPreviewReadinessChecklist,
  localReadinessCommands,
  type ReadinessCard,
  type ReadinessChecklistItem,
  type ReadinessCommand,
} from "./localReadinessSummary";

export type ReadinessReportInput = {
  cards: ReadinessCard[];
  checklist?: ReadinessChecklistItem[];
  commands?: ReadinessCommand[];
};

export function buildReadinessMarkdownReport({
  cards,
  checklist = localPreviewReadinessChecklist,
  commands = localReadinessCommands,
}: ReadinessReportInput): string {
  return [
    "# Aethra Local Readiness Report",
    "",
    "This report is local preview readiness only. It is copy-safe by default and omits daemon URLs, network names, user account names, device-specific identifiers, absolute paths, sensitive input content, audit event bodies, private credentials, and generated evidence contents.",
    "",
    "## Summary",
    "",
    "- report_mode: browser-local copy only",
    "- Aethra loading: manual live-local loading",
    "- dashboard mode: read-only",
    "- telemetry: no telemetry",
    "- cloud behavior: no cloud calls by default",
    "",
    "## Readiness Cards",
    "",
    ...formatCards(cards),
    "",
    "## Local Preview Checklist",
    "",
    ...formatChecklist(checklist),
    "",
    "## Boundary Notes",
    "",
    "- status hints, not controls",
    "- local helper checks, not certification",
    "- no production deployment approval",
    "- no uploads",
    "- no localStorage or sessionStorage persistence",
    "- no command execution",
    "",
    "## Local Helper Commands",
    "",
    ...formatCommands(commands),
    "",
  ].join("\n");
}

export function sanitizeReadinessReportText(value: string): string {
  if (containsSensitiveReadinessReportText(value)) {
    return "[redacted local readiness field]";
  }

  return value
    .replace(/production readiness/gi, "production deployment approval")
    .replace(/compliance certification/gi, "external assurance")
    .replace(/security certification/gi, "external assurance")
    .replace(/signed attestation/gi, "local evidence note")
    .replace(/tamper-evident storage/gi, "storage claim")
    .replace(/tamper-evident/gi, "tamper claim")
    .replace(/cryptographic verification/gi, "verification claim")
    .replace(/model controls/gi, "model status hints")
    .replace(/runner controls/gi, "runner status hints")
    .replace(/model control/gi, "model status hint")
    .replace(/runner control/gi, "runner status hint");
}

function formatCards(cards: ReadinessCard[]): string[] {
  if (cards.length === 0) {
    return ["- No readiness card summaries available."];
  }

  return cards.map(
    (card) =>
      `- ${sanitizeReadinessReportText(card.label)}: ${sanitizeReadinessReportText(
        card.value,
      )} (${getReadinessSourceLabel(card.source)}; ${sanitizeReadinessReportText(
        card.detail,
      )})`,
  );
}

function formatChecklist(checklist: ReadinessChecklistItem[]): string[] {
  if (checklist.length === 0) {
    return ["- No local preview checklist items available."];
  }

  return checklist.map(
    (item) =>
      `- ${sanitizeReadinessReportText(item.label)}: ${sanitizeReadinessReportText(
        item.detail,
      )}`,
  );
}

function formatCommands(commands: ReadinessCommand[]): string[] {
  if (commands.length === 0) {
    return ["- No local helper commands listed."];
  }

  return commands.map(
    (item) =>
      `- ${sanitizeReadinessReportText(item.label)}: \`${sanitizeReadinessReportText(
        item.command,
      )}\``,
  );
}

function containsSensitiveReadinessReportText(value: string): boolean {
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:sk|api|token|secret|key)[-_]?[A-Za-z0-9]{8,}\b/i,
    /\b(?:api[_ -]?key|secret|token)\b/i,
    /(?:^|\s)(?:\/Users|\/home|\/private|\/var|\/tmp|[A-Za-z]:\\)[^\s]*/i,
    /\b(?:localhost|127\.0\.0\.1|\[::1\]|[A-Za-z0-9-]+\.(?:local|lan|internal|corp))\b/i,
    /\b(?:host(?:name)?|machine(?: identifier| id)?|username|user)\s*[:=]\s*[A-Za-z0-9._-]+/i,
    /\b(?:host(?:name)?|machine(?: identifier| id)?|username)\b/i,
    /\b(?:prompt|request text|raw text|raw user text|raw audit text|raw audit event)\b/i,
  ].some((pattern) => pattern.test(value));
}
