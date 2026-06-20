import type {
  AuditEvent,
  CapabilitiesResponse,
  EvidencePackageIndexResponse,
  HealthResponse,
  ModelInventoryResponse,
  ModelManifest,
  ModelReadinessResponse,
  ModelStatusHint,
  OperationsSummaryResponse,
  RoutingPolicySummaryResponse,
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

export type LiveModelInventoryState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      inventory: ModelInventoryResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveModelReadinessState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      readiness: ModelReadinessResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveRoutingPolicySummaryState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      summary: RoutingPolicySummaryResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveEvidencePackageIndexState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      index: EvidencePackageIndexResponse;
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

export type LiveOperationsSummaryState =
  | {
      status: "not-loaded";
    }
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      summary: OperationsSummaryResponse;
      loadedAt: string;
    }
  | {
      status: "error";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
      checkedAt?: string;
    };

export type LiveEndpointState =
  | LiveHealthState
  | LiveModelsState
  | LiveModelInventoryState
  | LiveModelReadinessState
  | LiveRoutingPolicySummaryState
  | LiveEvidencePackageIndexState
  | LiveModelStatusState
  | LiveCapabilitiesState
  | LiveVersionStatusState
  | LiveAuditEventsState
  | LiveSustainabilityMetricsState
  | LiveOperationsSummaryState;

export type LiveLocalSurfaceId =
  | "health"
  | "version-status"
  | "models"
  | "model-inventory"
  | "model-readiness"
  | "routing-policy"
  | "evidence-packages"
  | "model-status"
  | "capabilities"
  | "audit-events"
  | "sustainability-metrics"
  | "operations-summary";

export type LiveLocalRefreshResult =
  | {
      surface: LiveLocalSurfaceId;
      status: "loaded";
      label: string;
    }
  | {
      surface: LiveLocalSurfaceId;
      status: "failed";
      label: string;
      message: string;
      diagnosticKind: LiveEndpointErrorKind;
    };

export type LiveLocalRefreshState =
  | {
      status: "idle";
    }
  | {
      status: "loading";
      requestedAt: string;
    }
  | {
      status: "complete";
      requestedAt: string;
      completedAt: string;
      results: LiveLocalRefreshResult[];
    };

export type LiveLocalDaemonClient = {
  health: () => Promise<HealthResponse>;
  versionStatus: () => Promise<VersionStatusResponse>;
  models: () => Promise<{ models: ModelManifest[] }>;
  modelInventory: () => Promise<ModelInventoryResponse>;
  modelReadiness: () => Promise<ModelReadinessResponse>;
  routingPolicySummary: () => Promise<RoutingPolicySummaryResponse>;
  evidencePackages: () => Promise<EvidencePackageIndexResponse>;
  modelStatus: () => Promise<{
    schemaVersion: string;
    generatedAt: string;
    source: "local-daemon";
    statusHints: ModelStatusHint[];
  }>;
  capabilities: () => Promise<CapabilitiesResponse>;
  auditEvents: () => Promise<AuditEvent[]>;
  sustainabilityMetrics: (period?: string) => Promise<SustainabilityMetricsResponse>;
  operationsSummary: () => Promise<OperationsSummaryResponse>;
};

export type LiveLocalDaemonSnapshot = {
  health: LiveHealthState;
  versionStatus: LiveVersionStatusState;
  models: LiveModelsState;
  modelInventory: LiveModelInventoryState;
  modelReadiness: LiveModelReadinessState;
  routingPolicy: LiveRoutingPolicySummaryState;
  evidencePackages: LiveEvidencePackageIndexState;
  modelStatus: LiveModelStatusState;
  capabilities: LiveCapabilitiesState;
  auditEvents: LiveAuditEventsState;
  sustainabilityMetrics: LiveSustainabilityMetricsState;
  operationsSummary: LiveOperationsSummaryState;
  results: LiveLocalRefreshResult[];
};

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

export function resolveAethraBaseUrlInput(
  baseUrlInput: string,
): LocalBaseUrlValidation {
  if (baseUrlInput.trim().length === 0) {
    return {
      ok: true,
      baseUrl: DEFAULT_AETHRA_BASE_URL,
    };
  }

  return validateLocalBaseUrl(baseUrlInput);
}

export function getLiveLocalDisplaySource(
  dataMode: AethraDataMode,
  state: LiveEndpointState,
): "local-daemon" | "fixture-fallback" | "offline-preview" {
  if (dataMode === "live-local" && state.status === "loaded") {
    return "local-daemon";
  }

  if (dataMode === "live-local") {
    return "fixture-fallback";
  }

  return "offline-preview";
}

export function formatLiveLocalDisplaySource(
  source: ReturnType<typeof getLiveLocalDisplaySource>,
): string {
  switch (source) {
    case "local-daemon":
      return "Local daemon data";
    case "fixture-fallback":
      return "Fixture fallback";
    case "offline-preview":
      return "Offline preview";
  }
}

export async function loadLiveLocalDaemonSnapshot(input: {
  client: LiveLocalDaemonClient;
  loadedAt: string;
  sustainabilityPeriod?: string;
}): Promise<LiveLocalDaemonSnapshot> {
  const period = input.sustainabilityPeriod ?? "30d";
  const [
    health,
    versionStatus,
    models,
    modelInventory,
    modelReadiness,
    routingPolicy,
    evidencePackages,
    modelStatus,
    capabilities,
    auditEvents,
    sustainabilityMetrics,
    operationsSummary,
  ] = await Promise.all([
    loadSurface("health", "Health", () => input.client.health(), describeHealthLoadError),
    loadSurface(
      "version-status",
      "Version status",
      () => input.client.versionStatus(),
      describeVersionStatusLoadError,
    ),
    loadSurface("models", "Models", () => input.client.models(), describeModelsLoadError),
    loadSurface(
      "model-inventory",
      "Model inventory",
      () => input.client.modelInventory(),
      describeModelInventoryLoadError,
    ),
    loadSurface(
      "model-readiness",
      "Model readiness",
      () => input.client.modelReadiness(),
      describeModelReadinessLoadError,
    ),
    loadSurface(
      "routing-policy",
      "Routing policy",
      () => input.client.routingPolicySummary(),
      describeRoutingPolicyLoadError,
    ),
    loadSurface(
      "evidence-packages",
      "Evidence packages",
      () => input.client.evidencePackages(),
      describeEvidencePackagesLoadError,
    ),
    loadSurface(
      "model-status",
      "Model status hints",
      () => input.client.modelStatus(),
      describeModelStatusLoadError,
    ),
    loadSurface(
      "capabilities",
      "Capabilities",
      () => input.client.capabilities(),
      describeCapabilitiesLoadError,
    ),
    loadSurface(
      "audit-events",
      "Audit events",
      () => input.client.auditEvents(),
      describeAuditEventsLoadError,
    ),
    loadSurface(
      "sustainability-metrics",
      "Sustainability metrics",
      () => input.client.sustainabilityMetrics(period),
      describeSustainabilityMetricsLoadError,
    ),
    loadSurface(
      "operations-summary",
      "Operations summary",
      () => input.client.operationsSummary(),
      describeOperationsSummaryLoadError,
    ),
  ]);

  return {
    health:
      health.status === "loaded"
        ? { status: "loaded", health: health.value, loadedAt: input.loadedAt }
        : endpointErrorState(health.error, input.loadedAt),
    versionStatus:
      versionStatus.status === "loaded"
        ? {
            status: "loaded",
            versionStatus: versionStatus.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(versionStatus.error, input.loadedAt),
    models:
      models.status === "loaded"
        ? {
            status: "loaded",
            models: models.value.models,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(models.error, input.loadedAt),
    modelInventory:
      modelInventory.status === "loaded"
        ? {
            status: "loaded",
            inventory: modelInventory.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(modelInventory.error, input.loadedAt),
    modelReadiness:
      modelReadiness.status === "loaded"
        ? {
            status: "loaded",
            readiness: modelReadiness.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(modelReadiness.error, input.loadedAt),
    routingPolicy:
      routingPolicy.status === "loaded"
        ? {
            status: "loaded",
            summary: routingPolicy.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(routingPolicy.error, input.loadedAt),
    evidencePackages:
      evidencePackages.status === "loaded"
        ? {
            status: "loaded",
            index: evidencePackages.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(evidencePackages.error, input.loadedAt),
    modelStatus:
      modelStatus.status === "loaded"
        ? {
            status: "loaded",
            statusHints: modelStatus.value.statusHints,
            schemaVersion: modelStatus.value.schemaVersion,
            source: modelStatus.value.source,
            generatedAt: modelStatus.value.generatedAt,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(modelStatus.error, input.loadedAt),
    capabilities:
      capabilities.status === "loaded"
        ? {
            status: "loaded",
            capabilities: capabilities.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(capabilities.error, input.loadedAt),
    auditEvents:
      auditEvents.status === "loaded"
        ? {
            status: "loaded",
            events: auditEvents.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(auditEvents.error, input.loadedAt),
    sustainabilityMetrics:
      sustainabilityMetrics.status === "loaded"
        ? {
            status: "loaded",
            metrics: sustainabilityMetrics.value,
            loadedAt: input.loadedAt,
          }
        : {
            status: "error",
            period,
            ...sustainabilityMetrics.error,
            checkedAt: input.loadedAt,
          },
    operationsSummary:
      operationsSummary.status === "loaded"
        ? {
            status: "loaded",
            summary: operationsSummary.value,
            loadedAt: input.loadedAt,
          }
        : endpointErrorState(operationsSummary.error, input.loadedAt),
    results: [
      health.result,
      versionStatus.result,
      models.result,
      modelInventory.result,
      modelReadiness.result,
      routingPolicy.result,
      evidencePackages.result,
      modelStatus.result,
      capabilities.result,
      auditEvents.result,
      sustainabilityMetrics.result,
      operationsSummary.result,
    ],
  };
}

type LoadedSurface<T> = {
  status: "loaded";
  value: T;
  result: LiveLocalRefreshResult;
};

type FailedSurface = {
  status: "failed";
  error: LiveEndpointErrorDescription;
  result: LiveLocalRefreshResult;
};

async function loadSurface<T>(
  surface: LiveLocalSurfaceId,
  label: string,
  load: () => Promise<T>,
  describeError: (error: unknown) => LiveEndpointErrorDescription,
): Promise<LoadedSurface<T> | FailedSurface> {
  try {
    const value = await load();
    return {
      status: "loaded",
      value,
      result: {
        surface,
        status: "loaded",
        label,
      },
    };
  } catch (error) {
    const description = describeError(error);
    return {
      status: "failed",
      error: description,
      result: {
        surface,
        status: "failed",
        label,
        message: description.message,
        diagnosticKind: description.diagnosticKind,
      },
    };
  }
}

function endpointErrorState(
  error: LiveEndpointErrorDescription,
  checkedAt: string,
): {
  status: "error";
  label: string;
  message: string;
  diagnosticKind: LiveEndpointErrorKind;
  checkedAt: string;
} {
  return {
    status: "error",
    ...error,
    checkedAt,
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

export function describeModelInventoryLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "model-inventory");
}

export function describeModelReadinessLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "model-readiness");
}

export function describeRoutingPolicyLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "routing-policy");
}

export function describeEvidencePackagesLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "evidence-packages");
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

export function describeOperationsSummaryLoadError(
  error: unknown,
): LiveEndpointErrorDescription {
  return describeEndpointLoadError(error, "operations-summary");
}

function describeEndpointLoadError(
  error: unknown,
  endpoint:
    | "health"
    | "models"
    | "model-inventory"
    | "model-readiness"
    | "routing-policy"
    | "evidence-packages"
    | "model-status"
    | "capabilities"
    | "version-status"
    | "audit-events"
    | "sustainability-metrics"
    | "operations-summary",
): LiveEndpointErrorDescription {
  const noun =
    endpoint === "health"
      ? "health"
      : endpoint === "models"
        ? "model manifest"
        : endpoint === "model-inventory"
          ? "local model inventory"
          : endpoint === "model-readiness"
            ? "local model readiness"
            : endpoint === "routing-policy"
              ? "local routing policy summary"
              : endpoint === "evidence-packages"
                ? "local evidence package index"
                : endpoint === "model-status"
                  ? "model and runner status hint"
                  : endpoint === "capabilities"
                    ? "connector and capability status"
                    : endpoint === "version-status"
                      ? "daemon version status"
                      : endpoint === "audit-events"
                        ? "audit event"
                        : endpoint === "sustainability-metrics"
                          ? "sustainability metrics"
                          : "local operations summary";

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
          : endpoint === "model-inventory"
            ? "Model inventory load failed"
            : endpoint === "model-readiness"
              ? "Model readiness load failed"
              : endpoint === "routing-policy"
                ? "Routing policy load failed"
                : endpoint === "evidence-packages"
                  ? "Evidence packages load failed"
                  : endpoint === "model-status"
                    ? "Model status load failed"
                    : endpoint === "capabilities"
                      ? "Capabilities load failed"
                      : endpoint === "version-status"
                        ? "Version status load failed"
                        : endpoint === "audit-events"
                          ? "Audit events load failed"
                          : endpoint === "sustainability-metrics"
                            ? "Sustainability metrics load failed"
                            : "Operations summary load failed",
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
