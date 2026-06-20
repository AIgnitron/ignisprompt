# Aethra Review Checklist

Use this checklist for manual Aethra demo, screenshot, and reviewer passes. It is a manual review aid only. Do not commit generated screenshots, local evidence, audit logs, model files, Aethra `dist/`, or `target/` output.

## Start Local Preview

From the repo root:

```bash
cargo run -p ignispromptd
```

In a second terminal:

```bash
cd apps/aethra
npm run dev
```

Default URLs:

- IgnisPrompt daemon: `http://127.0.0.1:8765`
- Aethra dev server: `http://127.0.0.1:5173`

## Review Flow

1. Open Aethra and confirm the default state is live-local and not loaded.
2. Confirm Overview shows a clean data source strip and compact status badges rather than a large disclaimer banner.
3. Run **Refresh local daemon data** only after the daemon is running.
4. Review **Overview** for the current status, suggested review flow, grouped cards, endpoint matrix, and no unsafe controls.
5. Review **Model / Runner Status** for manifests, inventory, readiness, capabilities, and status hints.
6. Review **Routing Explorer** for read-only routing policy metadata and clearly labeled offline preview route examples.
7. Review **Evidence Bundle Viewer** for local evidence package metadata, fixture labels, and clipboard-only report copy.
8. Review **Audit Events** for local audit summary and absence of raw prompts/request bodies.
9. Review **Sustainability Preview** for proxy metric labels, methodology copy, and no file export or download controls.
10. Review **Help** for Local Preview, Data Sources, Safety / Product Limits, Troubleshooting, and Review Checklist guidance.

## Screenshot Checklist

Capture screenshots manually when needed. Do not commit screenshots.

- Overview before refresh: live-local, not-loaded state.
- Overview after refresh with daemon running: live local cards, endpoint matrix, and receipt.
- Overview with daemon unavailable: calm failed/unavailable state.
- Model / Runner Status: local model inventory/readiness sections and capability matrix.
- Routing Explorer: routing policy metadata and offline preview fixture route example.
- Evidence Bundle Viewer: local evidence package index and read-only package metadata.
- Audit Events: audit summary and empty or loaded state.
- Sustainability Preview: proxy metric cards and collapsed methodology details.
- Help: detailed local-preview, data source, troubleshooting, and safety/product-limit guidance.

## Visual Checks

- Density: top Overview should be scannable without walls of text.
- Help separation: long local-preview, status, troubleshooting, and safety explanations should be in Help, not repeated as large boxes on normal product pages.
- Spacing: cards, matrix, helper panels, and details should not crowd each other.
- Responsive width: narrow screens should not require horizontal scrolling except dense tables.
- Status badges: `live local`, `not loaded`, `unavailable`, `failed`, and `offline preview fixture` should be clear.
- Empty states: missing daemon data should explain what to do next without implying failure is dangerous.
- Fixture labels: offline preview fixtures must be visually separate from live-local product state.
- Unsafe controls: no route execution, prompt submission, model execution, upload, download, delete, export, package generation, validation claim, or mutation controls should appear.

## Copy Checks

- Use `live-local`, `manual refresh`, `offline preview fixture`, `read-only dashboard`, `review checklist`, and `demo smoke coverage` consistently.
- Product pages should use calm labels such as `Help`, `Details`, `About this data`, `Status details`, and `Data source`; avoid boundary/reminder headings on normal product pages.
- Do not claim production readiness, compliance certification, formal attestation, legal correctness, legal advice, model quality, or sustainability certification.
- Do not imply hidden route execution, prompt submission, model execution, file mutation, cloud calls, telemetry, or background polling.
- Do not expose raw prompts, request bodies, audit event bodies, secrets, full evidence contents, absolute local paths, usernames, hostnames, or private credentials.

## Terminal Validation

Run the local review commands before taking final screenshots or asking for review:

```bash
cd apps/aethra
npm test
npm run build
cd ../..
make demo-check
make preview-release-check
make security-check
make hidden-unicode-check
git diff --check
git status --short --ignored models local-evidence apps/aethra/dist target data/audit
```

Expected generated or local outputs should remain ignored under `apps/aethra/dist/`, `data/audit/`, `local-evidence/`, `models/`, and `target/`.
