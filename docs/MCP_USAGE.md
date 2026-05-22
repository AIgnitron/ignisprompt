# Contributor MCP Usage

IgnisPrompt includes an experimental stdio MCP stub for local contributor testing. It is a local-preview tool surface, not a production deployment or a production-grade MCP compatibility claim.

## Current Scope

- Transport: newline-delimited JSON-RPC 2.0 over stdio.
- Startup: `ignispromptd --experimental-mcp-stdio`.
- Lifecycle methods: `initialize`, `notifications/initialized`, and `ping`.
- Tool methods: `tools/list` and `tools/call`.
- Tools exposed: `route_explain`, `audit_events`, `status_version`, and `sustainability_summary`.
- Default daemon behavior is unchanged when MCP stdio mode is not enabled.

The MCP path is local-only. It does not add cloud calls, telemetry, uploads, global aggregation, model controls, runner controls, config mutation, command execution, remote transports, or prompt/resource/sampling support.

## Manual Stdio Example

Run from the repository root:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual","version":"0.1.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"route_explain","arguments":{"model":"ignisprompt/legal","messages":[{"role":"user","content":"Review this indemnification clause in a vendor services agreement and return the key risks."}],"metadata":{"domain":"legal"}}}}' \
  '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"audit_events","arguments":{"limit":5}}}' \
  | cargo run -p ignispromptd -- --experimental-mcp-stdio
```

The command prints one JSON-RPC response per response-producing request. Notifications do not produce responses.

## Tool Behavior

### `route_explain`

`route_explain` reuses the same local route classification, route explanation, local-only policy signals, and adversarial document-instruction handling as the HTTP route-explain path. Successful calls append a local audit event, just like `POST /v1/route/explain`.

Use synthetic or non-sensitive text for manual tests. This tool does not provide legal advice, does not prove legal accuracy, and does not make a production readiness claim.

### `audit_events`

`audit_events` returns recent local audit metadata from the current daemon process. It is read-only and does not append a new audit event.

Arguments:

- `limit`: optional integer from `0` to `100`; default is `20`.

MCP tool-call `structuredContent` is object-shaped:

```json
{
  "events": []
}
```

The `events` array contains the same audit event fields exposed by the local HTTP audit endpoint. The HTTP `GET /v1/audit/events` response shape remains a JSON array; it was not changed by the MCP compatibility wrapper.

### `status_version`

`status_version` returns the existing local daemon version/status metadata. It is local preview support/debugging metadata only. It does not perform telemetry, update checks, GitHub lookups, cloud calls, or external release lookups.

### `sustainability_summary`

`sustainability_summary` returns aggregate local sustainability proxy estimates from the existing sustainability metrics logic. It defaults to `30d` and supports the same local-preview framing as the HTTP and CLI sustainability surfaces.

Sustainability values remain estimated, proxy, counterfactual, methodology-dependent, and non-certified. They are not certified sustainability reporting, not ESG certification, and not production compliance evidence.

## Limitations

- Experimental and manual-only.
- No MCP HTTP transport.
- No production-grade MCP compatibility claim.
- No production deployment claim.
- No cloud calls.
- No telemetry.
- No global aggregation.
- No model or runner controls.
- No command execution.
- No prompt/resource/sampling support.
- No persisted MCP session state beyond the running process behavior.

## Contributor Checklist

When touching MCP docs or behavior in a future PR:

- Preserve local-only behavior.
- Preserve route explanations and audit events.
- Preserve the HTTP `GET /v1/audit/events` JSON array shape.
- Keep MCP `audit_events` `structuredContent` object-shaped as `{ "events": [...] }`.
- Keep observability tools read-only.
- Avoid production, legal-accuracy, compliance, ESG, certified-reporting, complete-MCP, or broad-client-compatibility claims.
- Update schema-lock tests before changing response shapes.
