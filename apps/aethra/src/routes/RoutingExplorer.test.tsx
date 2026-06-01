import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutingExplorer } from "./RoutingExplorer";

describe("RoutingExplorer route", () => {
  it("renders the route ladder and cloud-disabled-by-default language", () => {
    const markup = renderToStaticMarkup(
      <RoutingExplorer localBaseUrl="http://127.0.0.1:8765" />,
    );

    expect(markup).toContain("Collapsed by default");
    expect(markup).toContain("Route ladder");
    expect(markup).toContain("Cloud disabled by default");
    expect(markup).toContain("Local legal candidate");
    expect(markup).toContain("Route state legend");
    expect(markup).toContain("not implemented");
  });
});
