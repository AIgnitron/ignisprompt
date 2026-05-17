import { describe, expect, it } from "vitest";
import { AethraApiError } from "./api/errors";
import {
  DEFAULT_AETHRA_BASE_URL,
  describeAuditEventsLoadError,
  describeHealthLoadError,
  describeModelStatusLoadError,
  describeModelsLoadError,
  describeSustainabilityMetricsLoadError,
  normalizeLocalBaseUrl,
  validateLocalBaseUrl,
} from "./dataSource";

describe("Aethra data source helpers", () => {
  it("defaults to the local IgnisPrompt daemon URL", () => {
    expect(DEFAULT_AETHRA_BASE_URL).toBe("http://127.0.0.1:8765");
  });

  it("normalizes trailing slashes from local base URLs", () => {
    expect(normalizeLocalBaseUrl("http://127.0.0.1:8765///")).toBe(
      "http://127.0.0.1:8765",
    );
  });

  it("accepts trailing slash-only loopback origins", () => {
    expect(validateLocalBaseUrl("http://127.0.0.1:8765///")).toEqual({
      ok: true,
      baseUrl: "http://127.0.0.1:8765",
    });
  });

  it("accepts localhost and 127.0.0.1 URLs", () => {
    expect(validateLocalBaseUrl("http://localhost:8765")).toEqual({
      ok: true,
      baseUrl: "http://localhost:8765",
    });
    expect(validateLocalBaseUrl("http://127.0.0.1:8765")).toEqual({
      ok: true,
      baseUrl: "http://127.0.0.1:8765",
    });
  });

  it("accepts the IPv6 loopback URL", () => {
    expect(validateLocalBaseUrl("http://[::1]:8765")).toEqual({
      ok: true,
      baseUrl: "http://[::1]:8765",
    });
  });

  it("rejects non-loopback URLs", () => {
    expect(validateLocalBaseUrl("http://192.168.1.10:8765")).toMatchObject({
      ok: false,
    });
    expect(validateLocalBaseUrl("https://example.com")).toMatchObject({
      ok: false,
    });
  });

  it("rejects malformed and empty URLs", () => {
    expect(validateLocalBaseUrl("")).toMatchObject({ ok: false });
    expect(validateLocalBaseUrl("not a url")).toMatchObject({ ok: false });
  });

  it("rejects loopback URLs with paths, queries, or hashes", () => {
    expect(validateLocalBaseUrl("http://127.0.0.1:8765/health")).toMatchObject({
      ok: false,
    });
    expect(validateLocalBaseUrl("http://127.0.0.1:8765/?x=1")).toMatchObject({
      ok: false,
    });
    expect(validateLocalBaseUrl("http://127.0.0.1:8765/#health")).toMatchObject({
      ok: false,
    });
  });

  it("describes daemon unreachable health load failures", () => {
    expect(
      describeHealthLoadError(
        new AethraApiError("unreachable-daemon", "unreachable"),
      ),
    ).toEqual({
      label: "Daemon unreachable",
      message:
        "Aethra could not reach the configured local IgnisPrompt daemon.",
    });
  });

  it("describes invalid JSON and unsupported health schema failures", () => {
    expect(
      describeHealthLoadError(new AethraApiError("invalid-json", "bad json")),
    ).toMatchObject({
      label: "Invalid JSON",
    });
    expect(
      describeHealthLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toMatchObject({
      label: "Unsupported schema",
    });
  });

  it("describes daemon unreachable model metadata load failures", () => {
    expect(
      describeModelsLoadError(
        new AethraApiError("unreachable-daemon", "unreachable"),
      ),
    ).toEqual({
      label: "Daemon unreachable",
      message:
        "Aethra could not reach the configured local IgnisPrompt daemon.",
    });
  });

  it("describes invalid JSON and unsupported model schema failures", () => {
    expect(
      describeModelsLoadError(new AethraApiError("invalid-json", "bad json")),
    ).toMatchObject({
      label: "Invalid JSON",
    });
    expect(
      describeModelsLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected model manifest schema.",
    });
  });

  it("describes invalid JSON and unsupported model status schema failures", () => {
    expect(
      describeModelStatusLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
    });
    expect(
      describeModelStatusLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected model and runner status hint schema.",
    });
  });

  it("describes daemon unreachable audit event metadata load failures", () => {
    expect(
      describeAuditEventsLoadError(
        new AethraApiError("unreachable-daemon", "unreachable"),
      ),
    ).toEqual({
      label: "Daemon unreachable",
      message:
        "Aethra could not reach the configured local IgnisPrompt daemon.",
    });
  });

  it("describes invalid JSON and unsupported audit event schema failures", () => {
    expect(
      describeAuditEventsLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
    });
    expect(
      describeAuditEventsLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected audit event schema.",
    });
  });

  it("describes invalid JSON and unsupported sustainability metrics schema failures", () => {
    expect(
      describeSustainabilityMetricsLoadError(
        new AethraApiError("invalid-json", "bad json"),
      ),
    ).toMatchObject({
      label: "Invalid JSON",
    });
    expect(
      describeSustainabilityMetricsLoadError(
        new AethraApiError("unexpected-shape", "bad schema"),
      ),
    ).toEqual({
      label: "Unsupported schema",
      message:
        "The local daemon returned JSON that did not match the expected sustainability metrics schema.",
    });
  });
});
