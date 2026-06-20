import { StatusBadge } from "../components/StatusBadge";

const helpSections = [
  {
    title: "Local Preview",
    items: [
      "Aethra loads local daemon metadata only after manual refresh.",
      "Offline preview fixtures are bundled data for tests and demos when the daemon is unavailable.",
      "Failed, unavailable, and not-loaded states stay visible so product pages do not silently replace live-local state with fixtures.",
      "Manual refresh means Aethra does not poll, autoload on startup, or persist live-local daemon responses.",
    ],
  },
  {
    title: "Data Sources",
    items: [
      "Overview is the main live-local daemon dashboard for health, version, models, inventory, readiness, routing policy, evidence packages, capabilities, model status, audit events, operations, and sustainability metadata.",
      "Detail pages focus on their own read-only data tables, cards, filters, and concise status labels.",
      "Aethra does not expose raw prompts, request bodies, audit event bodies, secrets, full evidence contents, absolute local paths, telemetry, cloud activity, or external update checks.",
      "Sustainability values are counterfactual proxy estimates derived from local metadata, not measured energy use or formal sustainability reporting.",
    ],
  },
  {
    title: "Safety / Product Limits",
    items: [
      "Aethra is not legal advice and does not claim legal accuracy is solved.",
      "Aethra does not claim compliance certification, security assurance, ESG reporting evidence, production readiness, signed attestation, or tamper-evident audit storage.",
      "Aethra does not execute routes, submit prompts, execute models, start or stop runners, mutate connectors, mutate policy, mutate manifests, generate packages, upload files, download files, delete files, or export dashboard files.",
      "No telemetry or cloud calls are made by default.",
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      "If a local endpoint is unavailable, start the local daemon and use Refresh local daemon data from Overview.",
      "If a detail page says not loaded, refresh the relevant page action or use the Overview refresh action.",
      "If a daemon URL is blocked, use a loopback URL such as http://127.0.0.1:8765.",
      "Clipboard actions copy displayed text only; Aethra does not execute commands.",
    ],
  },
  {
    title: "Review Checklist",
    items: [
      "Use docs/AETHRA_REVIEW_CHECKLIST.md for the manual reviewer pass.",
      "Confirm product pages show clean status, data, actions, and empty states.",
      "Confirm detailed local-preview and safety explanations are available here instead of repeated as large boxes on product pages.",
      "Confirm no polling, startup autoload, browser storage persistence, unsafe controls, telemetry, or cloud calls were added.",
    ],
  },
];

export function Help() {
  return (
    <section id="help" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Help</p>
          <h2>Aethra help</h2>
          <p className="page-subtitle">
            Local-preview behavior, data source details, product limits, and
            review guidance in one place.
          </p>
        </div>
        <div className="status-strip" aria-label="Help status">
          <StatusBadge tone="neutral">Reference</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
        </div>
      </header>

      <div className="help-section-grid">
        {helpSections.map((section) => (
          <section className="panel" key={section.title}>
            <div className="panel-heading">
              <h3>{section.title}</h3>
              <StatusBadge tone="neutral">Help</StatusBadge>
            </div>
            <ul className="status-hint-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
