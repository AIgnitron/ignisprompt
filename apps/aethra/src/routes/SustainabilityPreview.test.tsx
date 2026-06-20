import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SustainabilityPreview } from "./SustainabilityPreview";

describe("SustainabilityPreview route", () => {
  it("renders read-only metrics controls without file export or download actions", () => {
    const markup = renderToStaticMarkup(
      <SustainabilityPreview
        dataMode="live-local"
        liveSustainabilityMetricsState={{ status: "not-loaded" }}
        onLoadLiveSustainabilityMetrics={() => undefined}
      />,
    );

    expect(markup).toContain("Live local sustainability metrics");
    expect(markup).toContain("Data source");
    expect(markup).toContain("About this data");
    expect(markup).not.toContain("Read-only dashboard boundary");
    expect(markup).not.toContain("does not generate downloadable reports");
    expect(markup).not.toContain("Export Markdown");
    expect(markup).not.toContain("Export JSON");
    expect(markup).not.toContain("Download report");
    expect(markup).not.toContain("download=");
  });
});
