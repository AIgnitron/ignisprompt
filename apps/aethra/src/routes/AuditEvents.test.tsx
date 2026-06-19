import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuditEvents } from "./AuditEvents";

describe("AuditEvents", () => {
  it("renders aggregate operations summary without raw prompt body language", () => {
    const markup = renderToStaticMarkup(
      <AuditEvents
        dataMode="fixture"
        liveAuditEventsState={{ status: "not-loaded" }}
        liveOperationsSummaryState={{ status: "not-loaded" }}
        onLoadLiveAuditEvents={vi.fn()}
      />,
    );

    expect(markup).toContain("Audit summary");
    expect(markup).toContain("Total events");
    expect(markup).toContain("Latest event");
    expect(markup).toContain("Recent event types");
    expect(markup).toContain("Raw prompts and request bodies are not shown.");
    expect(markup).not.toContain("raw request body");
    expect(markup).not.toContain("prompt_body");
    expect(markup).not.toContain("Enable cloud");
    expect(markup).not.toContain("Run model");
    expect(markup).not.toContain("Delete model");
  });
});
