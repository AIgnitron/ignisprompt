export type AethraDataMode = "fixture" | "live-local";

export const DEFAULT_AETHRA_BASE_URL = "http://127.0.0.1:8765";

export type LocalBaseUrlValidation =
  | {
      ok: true;
      baseUrl: string;
    }
  | {
      ok: false;
      error: string;
    };

const loopbackHostnames = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export function normalizeLocalBaseUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl.trim());
  return `${parsed.protocol}//${parsed.host}`;
}

export function validateLocalBaseUrl(
  baseUrl: string,
): LocalBaseUrlValidation {
  if (baseUrl.trim().length === 0) {
    return {
      ok: false,
      error: "Enter a local daemon URL before using live local mode.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl.trim());
  } catch {
    return {
      ok: false,
      error: "Enter a valid URL such as http://127.0.0.1:8765.",
    };
  }

  if (parsed.protocol !== "http:") {
    return {
      ok: false,
      error: "Aethra only accepts http loopback URLs for the local daemon.",
    };
  }

  if (!loopbackHostnames.has(parsed.hostname)) {
    return {
      ok: false,
      error:
        "Aethra live local mode only accepts localhost, 127.0.0.1, or [::1].",
    };
  }

  if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
    return {
      ok: false,
      error: "Use only the local daemon origin, without a path, query, or hash.",
    };
  }

  return {
    ok: true,
    baseUrl: normalizeLocalBaseUrl(baseUrl),
  };
}
