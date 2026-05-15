import { describe, expect, it } from "vitest";
import {
  DEFAULT_AETHRA_BASE_URL,
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
});
