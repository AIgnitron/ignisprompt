import type {
  AuditEvent,
  CapabilitiesResponse,
  HealthResponse,
  ModelManifest,
  ModelStatusHint,
  SustainabilityMetricsResponse,
  VersionStatusResponse,
} from "./api/contracts";
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

export type LiveEndpointErrorKind =
  | "daemon-unreachable"
  | "endpoint-unavailable"
  | "invalid-response-shape"
  | "invalid-local-url"
  | "timeout"
  | "unknown";

export type LiveEndpointErrorDescription = {
  label: string;
  message: string;
  diagnosticKind: LiveEndpointErrorKind;
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
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
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
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveModelStatusState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      statusHints: ModelStatusHint[];
      schemaVersion: string;
      source: "local-daemon";
      generatedAt: string;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveCapabilitiesState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      capabilities: CapabilitiesResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveVersionStatusState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      versionStatus: VersionStatusResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
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
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveSustainabilityMetricsState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
      period: string;
    }
  | {
      status: "loaded";
      metrics: SustainabilityMetricsResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      period: string;
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveEndpointState =
  | LiveHealthState
  | LiveModelsState
  | LiveModelStatusState
  | LiveCapabilitiesState
  | LiveVersionStatusState
  | LiveAuditEventsState
  | LiveSustainabilityMetricsState;

export type LiveLocalDiagnosticsState =
  | "fixture-mode-active"
  | "live-local-ready"
  | "live-local-connected"
  | "daemon-unreachable"
  | "endpoint-unavailable"
  | "invalid-response-shape"
  | "last-refresh-failed"
  | "last-refresh-succeeded";

export type LiveLocalDiagnostics = {
  state: LiveLocalDiagnosticsState;
  label: string;
  detail: string;
  nextAction: string;
  lastRefresh: string;
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

  if (
    !isSlashOnlyPath(parsed.pathname) ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
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

function isSlashOnlyPath(pathname: string): boolean {
  return /^\/+$/.test(pathname);
}

export function localUrlBlockedDescription(
  error: string,
): LiveEndpointErrorDescription {
  return {
    label: "Local URL blocked",
    message: error,
    diagnosticKind: "invalid-local-url",
  };
}

export function describeHealthLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "health");
}

export function describeModelsLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "models");
}

export function describeModelStatusLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "model-status");
}

export function describeCapabilitiesLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "capabilities");
}

export function describeVersionStatusLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "version-status");
}

export function describeAuditEventsLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "audit-events");
}

export function describeSustainabilityMetricsLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "sustainability-metrics");
}

function describeEndpointLoadError(
  error: unknown,
  endpoint:
    | "health"
    | "models"
    | "model-status"
    | "capabilities"
    | "version-status"
    | "audit-events"
    | "sustainability-metrics",
): LiveEndpointErrorDescription {
  const noun =
    endpoint === "health"
      ? "health"
      : endpoint === "models"
        ? "model manifest"
        : endpoint === "model-status"
          ? "model and runner status hint"
          : endpoint === "capabilities"
            ? "connector and capability status"
            : endpoint === "version-status"
              ? "daemon version status"
              : endpoint === "audit-events"
                ? "audit event"
                : "sustainability metrics";

  if (error instanceof AethraApiError) {
    switch (error.kind) {
      case "unreachable-daemon":
        return {
          label: "Daemon unreachable",
          message:
            "Aethra could not reach the configured local IgnisPrompt daemon.",
          diagnosticKind: "daemon-unreachable",
        };
      case "timeout":
        return {
          label: "Timeout",
          message: "The local daemon did not respond before the request timed out.",
          diagnosticKind: "timeout",
        };
      case "invalid-json":
        return {
          label: "Invalid JSON",
          message:
            "The local daemon returned a response that was not valid JSON. Fixture fallback remains available; confirm the current local-preview daemon is running before retrying manual refresh.",
          diagnosticKind: "invalid-response-shape",
        };
      case "unexpected-shape":
        return {
          label: "Unsupported schema",
          message:
            `The local daemon returned JSON that did not match the expected ${noun} schema. Fixture fallback remains available; confirm the daemon is from the current local-preview build before retrying manual refresh.`,
          diagnosticKind: "invalid-response-shape",
        };
      case "http-error":
        return {
          label:
            error.status === 404 ? "Endpoint unavailable" : "Endpoint HTTP error",
          message: `The local daemon returned HTTP ${error.status ?? "error"}.`,
          diagnosticKind: "endpoint-unavailable",
        };
    }
  }

  return {
    label:
      endpoint === "health"
        ? "Health load failed"
        : endpoint === "models"
          ? "Models load failed"
          : endpoint === "model-status"
            ? "Model status load failed"
            : endpoint === "capabilities"
              ? "Capabilities load failed"
              : endpoint === "version-status"
                ? "Version status load failed"
                : endpoint === "audit-events"
                  ? "Audit events load failed"
                  : "Sustainability metrics load failed",
    message: `Aethra could not load live local ${noun} metadata.`,
    diagnosticKind: "unknown",
  };
}

export function buildLiveLocalDiagnostics(input: {
  dataMode: AethraDataMode;
  baseUrl: string;
  baseUrlError?: string;
  endpointStates: LiveEndpointState[];
}): LiveLocalDiagnostics {
  if (input.dataMode === "fixture") {
    return {
      state: "fixture-mode-active",
      label: "Fixture mode active",
      detail:
        "Aethra is using bundled fixture data and is not contacting the local daemon.",
      nextAction:
        "Switch to live local mode when you want to manually load loopback daemon metadata.",
      lastRefresh: "No live local refresh has run in fixture mode.",
    };
  }

  if (input.baseUrlError) {
    return {
      state: "last-refresh-failed",
      label: "Live-local URL blocked",
      detail: input.baseUrlError,
      nextAction:
        "Use a loopback daemon origin such as http://127.0.0.1:8765.",
      lastRefresh: "No valid live local refresh is available.",
    };
  }

  const latestCompletedState = latestEndpointState(input.endpointStates);
  const failedState =
    latestCompletedState?.status === "error"
      ? latestCompletedState
      : latestCompletedState
        ? undefined
        : input.endpointStates.find(
            (
              state,
            ): state is Extract<LiveEndpointState, { status: "error" }> =>
              state.status === "error",
          );

  if (failedState) {
    const state = diagnosticsStateForError(failedState.diagnosticKind);
    return {
      state,
      label: diagnosticsLabelForError(failedState),
      detail: failedState.message,
      nextAction: nextActionForError(failedState.diagnosticKind, input.baseUrl),
      lastRefresh: "Last refresh failed.",
    };
  }

  const loadedStates = input.endpointStates.filter(
    (state): state is Extract<LiveEndpointState, { status: "loaded" }> =>
      state.status === "loaded",
  );

  if (loadedStates.length > 0) {
    const latestLoadedAt = latestTimestamp(
      loadedStates.map((state) => state.loadedAt),
    );
    const fullyLoaded = loadedStates.length === input.endpointStates.length;
    return {
      state: fullyLoaded ? "last-refresh-succeeded" : "live-local-connected",
      label: fullyLoaded ? "Last refresh succeeded" : "Live-local connected",
      detail: `${loadedStates.length} of ${input.endpointStates.length} live local metadata surfaces have loaded from the configured daemon.`,
      nextAction:
        "Use the remaining manual refresh actions if you need more local metadata.",
      lastRefresh: latestLoadedAt
        ? `Last successful refresh: ${latestLoadedAt}.`
        : "Last successful refresh recorded.",
    };
  }

  return {
    state: "live-local-ready",
    label: "Live-local ready",
    detail:
      "Aethra is pointed at the local loopback daemon but has not loaded live metadata yet.",
    nextAction: `Start the daemon with ./scripts/start-dev.sh, then confirm ${input.baseUrl}/health is reachable before using manual refresh actions.`,
    lastRefresh: "No live local refresh has run yet.",
  };
}

function diagnosticsStateForError(
  kind: LiveEndpointErrorKind,
): LiveLocalDiagnosticsState {
  switch (kind) {
    case "daemon-unreachable":
    case "timeout":
      return "daemon-unreachable";
    case "endpoint-unavailable":
      return "endpoint-unavailable";
    case "invalid-response-shape":
      return "invalid-response-shape";
    case "invalid-local-url":
    case "unknown":
      return "last-refresh-failed";
  }
}

function diagnosticsLabelForError(
  state: Extract<LiveEndpointState, { status: "error" }>,
): string {
  if (
    state.diagnosticKind === "daemon-unreachable" ||
    state.diagnosticKind === "timeout"
  ) {
    return "Daemon unreachable";
  }
  if (state.diagnosticKind === "endpoint-unavailable") {
    return "Endpoint unavailable";
  }
  if (state.diagnosticKind === "invalid-response-shape") {
    return "Invalid response shape";
  }
  return state.label;
}

function nextActionForError(
  kind: LiveEndpointErrorKind,
  baseUrl: string,
): string {
  switch (kind) {
    case "daemon-unreachable":
    case "timeout":
      return `Start the daemon with ./scripts/start-dev.sh and confirm ${baseUrl}/health is reachable.`;
    case "endpoint-unavailable":
      return "Confirm the daemon build includes the requested local preview endpoint.";
    case "invalid-response-shape":
      return "Confirm the daemon is from the current local preview build and retry the manual refresh.";
    case "invalid-local-url":
      return "Enter a local daemon URL before using live local mode.";
    case "unknown":
      return "Fixture mode remains available without a daemon while you inspect the local setup.";
  }
}

function latestTimestamp(timestamps: string[]): string | undefined {
  return timestamps
    .map((timestamp) => ({ timestamp, time: Date.parse(timestamp) }))
    .filter(({ time }) => Number.isFinite(time))
    .sort((a, b) => b.time - a.time)[0]?.timestamp;
}

function latestEndpointState(
  endpointStates: LiveEndpointState[],
): Extract<LiveEndpointState, { status: "loaded" | "error" }> | undefined {
  return endpointStates
    .map((state) => ({
      state,
      timestamp: endpointStateCompletedAt(state),
    }))
    .filter(
      (
        item,
      ): item is {
        state: Extract<LiveEndpointState, { status: "loaded" | "error" }>;
        timestamp: number;
      } => item.timestamp !== undefined,
    )
    .sort((a, b) => b.timestamp - a.timestamp)[0]?.state;
}

function endpointStateCompletedAt(
  state: LiveEndpointState,
): number | undefined {
  if (state.status === "loaded") {
    const loadedAt = Date.parse(state.loadedAt);
    return Number.isFinite(loadedAt) ? loadedAt : undefined;
  }

  if (state.status === "error" && state.checkedAt) {
    const checkedAt = Date.parse(state.checkedAt);
    return Number.isFinite(checkedAt) ? checkedAt : undefined;
  }

  return undefined;
}
