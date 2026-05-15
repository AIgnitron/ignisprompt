import type { AuditEvent, HealthResponse, ModelManifest } from "./api/contracts";
import { AethraApiError } from "./api/errors";

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

export type LiveHealthState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      health: HealthResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
    };

export type LiveModelsState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      models: ModelManifest[];
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
    };

export type LiveAuditEventsState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      events: AuditEvent[];
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
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

export function describeHealthLoadError(error: unknown): {
  label: string;
  message: string;
} {
  return describeEndpointLoadError(error, "health");
}

export function describeModelsLoadError(error: unknown): {
  label: string;
  message: string;
} {
  return describeEndpointLoadError(error, "models");
}

export function describeAuditEventsLoadError(error: unknown): {
  label: string;
  message: string;
} {
  return describeEndpointLoadError(error, "audit-events");
}

function describeEndpointLoadError(
  error: unknown,
  endpoint: "health" | "models" | "audit-events",
): {
  label: string;
  message: string;
} {
  const noun =
    endpoint === "health"
      ? "health"
      : endpoint === "models"
        ? "model manifest"
        : "audit event";

  if (error instanceof AethraApiError) {
    switch (error.kind) {
      case "unreachable-daemon":
        return {
          label: "Daemon unreachable",
          message:
            "Aethra could not reach the configured local IgnisPrompt daemon.",
        };
      case "timeout":
        return {
          label: "Timeout",
          message: "The local daemon did not respond before the request timed out.",
        };
      case "invalid-json":
        return {
          label: "Invalid JSON",
          message: "The local daemon returned a response that was not valid JSON.",
        };
      case "unexpected-shape":
        return {
          label: "Unsupported schema",
          message:
            `The local daemon returned JSON that did not match the expected ${noun} schema.`,
        };
      case "http-error":
        return {
          label: "HTTP error",
          message: `The local daemon returned HTTP ${error.status ?? "error"}.`,
        };
    }
  }

  return {
    label:
      endpoint === "health"
        ? "Health load failed"
        : endpoint === "models"
          ? "Models load failed"
          : "Audit events load failed",
    message: `Aethra could not load live local ${noun} metadata.`,
  };
}
