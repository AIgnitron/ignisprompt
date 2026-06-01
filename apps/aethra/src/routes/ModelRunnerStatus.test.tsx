import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModelRunnerStatus } from "./ModelRunnerStatus";

describe("ModelRunnerStatus route", () => {
  it("renders the fixture-backed capability matrix with conservative boundaries", () => {
    const markup = renderToStaticMarkup(
      <ModelRunnerStatus
        dataMode="fixture"
        liveModelsState={{ status: "not-loaded" }}
        liveModelStatusState={{ status: "not-loaded" }}
        onLoadLiveModels={() => undefined}
        onLoadLiveModelStatus={() => undefined}
      />,
    );

    expect(markup).toContain("Capability and status matrix");
    expect(markup).toContain("local only");
    expect(markup).toContain("model file missing");
    expect(markup).toContain("No model or runner controls");
  });
});
