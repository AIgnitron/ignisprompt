import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { routingPolicySummaryFixture } from "../api/fixtures";
import { RoutingExplorer } from "./RoutingExplorer";

describe("RoutingExplorer route", () => {
  it("renders the route ladder and cloud-disabled-by-default language", () => {
    const markup = renderToStaticMarkup(
      <RoutingExplorer
        dataMode="fixture"
        localBaseUrl="http://127.0.0.1:8765"
        liveRoutingPolicyState={{ status: "not-loaded" }}
      />,
    );

    expect(markup).toContain("Local routing policy summary");
    expect(markup).toContain("fixture routing policy");
    expect(markup).toContain("Legal specialized routing");
    expect(markup).toContain("Collapsed by default");
    expect(markup).toContain("Route ladder");
    expect(markup).toContain("Cloud disabled by default");
    expect(markup).toContain("Local legal candidate");
    expect(markup).toContain("Route state legend");
    expect(markup).toContain("not implemented");
    expect(markup).toContain("Offline preview route example");
    expect(markup).toContain("Fixture-backed route example");
    expect(markup).not.toContain("Live local route-explain");
    expect(markup).not.toContain("Run live route");
    expect(markup).not.toContain("Submit prompt");
    expect(markup).not.toContain("Edit policy");
    expect(markup).not.toContain("Enable cloud");
    expect(markup).not.toContain("Run model");
  });

  it("renders manually loaded live-local routing policy metadata", () => {
    const markup = renderToStaticMarkup(
      <RoutingExplorer
        dataMode="live-local"
        localBaseUrl="http://127.0.0.1:8765"
        liveRoutingPolicyState={{
          status: "loaded",
          summary: {
            ...routingPolicySummaryFixture,
            route_categories: [
              {
                ...routingPolicySummaryFixture.route_categories[0],
                label: "Live legal specialized routing",
                status: "live_policy_metadata",
              },
            ],
          },
          loadedAt: "2026-06-19T00:00:00Z",
        }}
      />,
    );

    expect(markup).toContain("GET /v1/routing/policy-summary");
    expect(markup).toContain("Local daemon data");
    expect(markup).toContain("Live legal specialized routing");
    expect(markup).toContain("live_policy_metadata");
    expect(markup).toContain("Read-only policy metadata");
    expect(markup).not.toContain("sending telemetry");
    expect(markup).not.toContain("Live local route-explain");
    expect(markup).not.toContain("Run live route");
    expect(markup).not.toContain("Submit prompt");
  });
});
