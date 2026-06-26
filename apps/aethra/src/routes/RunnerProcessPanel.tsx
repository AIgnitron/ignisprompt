import { useEffect, useMemo, useRef, useState } from "react";
import { createIgnisPromptClient } from "../api/client";
import {
  RunnerLifecycleAction,
  RunnerLifecycleActionResponse,
  RunnerProcessStatus,
  RunnerProcessStatusResponse,
  isSafeRunnerLifecycleAction,
  isSafeRunnerId,
} from "../api/contracts";
import type {
  AethraDataMode,
  LiveRunnerProcessStatusState,
} from "../dataSource";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { buildLiveErrorEmptyState } from "./emptyStates";

export type RunnerLifecycleRequest = (
  runnerId: string,
  action: RunnerLifecycleAction,
) => Promise<RunnerLifecycleActionResponse>;

type RunnerProcessPanelProps = {
  dataMode: AethraDataMode;
  localBaseUrl: string;
  liveRunnerProcessStatusState: LiveRunnerProcessStatusState;
  runnerLifecycleRefreshRequired: boolean;
  onLoadLiveRunnerProcessStatus: () => void;
  onRunnerLifecycleAttempt: () => void;
  lifecycleRequest?: RunnerLifecycleRequest;
};

type PendingRunnerAction = {
  runnerId: string;
  action: RunnerLifecycleAction;
};

type LifecycleRequestState =
  | { status: "idle" }
  | { status: "pending"; action: RunnerLifecycleAction; runnerId: string }
  | { status: "receipt"; response: RunnerLifecycleActionResponse }
  | {
      status: "validation-error";
      action?: RunnerLifecycleAction;
      runnerId?: string;
      message: string;
    }
  | {
      status: "request-uncertain";
      action: RunnerLifecycleAction;
      runnerId: string;
    };

export function RunnerProcessPanel({
  dataMode,
  localBaseUrl,
  liveRunnerProcessStatusState,
  runnerLifecycleRefreshRequired,
  onLoadLiveRunnerProcessStatus,
  onRunnerLifecycleAttempt,
  lifecycleRequest,
}: RunnerProcessPanelProps) {
  const [operatorModeEnabled, setOperatorModeEnabled] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingRunnerAction | null>(
    null,
  );
  const [lifecycleState, setLifecycleState] = useState<LifecycleRequestState>({
    status: "idle",
  });
  const inFlightRef = useRef(false);
  const isLiveMode = dataMode === "live-local";
  const isLoaded =
    isLiveMode &&
    liveRunnerProcessStatusState.status === "loaded" &&
    liveRunnerProcessStatusState.sourceBaseUrl === localBaseUrl;
  const runnerProcessStatus = isLoaded
    ? liveRunnerProcessStatusState.runnerProcessStatus
    : undefined;
  const isSubmitting = lifecycleState.status === "pending";
  const statusSignature = useMemo(
    () =>
      buildRunnerProcessStatusSignature(
        liveRunnerProcessStatusState,
        localBaseUrl,
      ),
    [liveRunnerProcessStatusState, localBaseUrl],
  );
  const authoritySignature = `${dataMode}|${statusSignature}`;
  const mountedRef = useRef(true);
  const requestAuthorityRef = useRef({
    generation: 0,
    signature: authoritySignature,
  });
  if (requestAuthorityRef.current.signature !== authoritySignature) {
    requestAuthorityRef.current = {
      generation: requestAuthorityRef.current.generation + 1,
      signature: authoritySignature,
    };
  }
  const currentAuthorityGeneration = requestAuthorityRef.current.generation;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setOperatorModeEnabled(false);
    setPendingAction(null);
    setLifecycleState({ status: "idle" });
  }, [dataMode, localBaseUrl]);

  useEffect(() => {
    if (runnerLifecycleRefreshRequired || isSubmitting) {
      setOperatorModeEnabled(false);
    }
  }, [isSubmitting, runnerLifecycleRefreshRequired]);

  useEffect(() => {
    if (!pendingAction) {
      return;
    }
    const validation = validatePendingAction(
      pendingAction,
      dataMode,
      localBaseUrl,
      liveRunnerProcessStatusState,
      operatorModeEnabled,
      runnerLifecycleRefreshRequired,
    );
    if (!validation.ok) {
      setPendingAction(null);
      setLifecycleState({
        status: "validation-error",
        action: pendingAction.action,
        runnerId: pendingAction.runnerId,
        message: validation.message,
      });
    }
  }, [
    dataMode,
    localBaseUrl,
    liveRunnerProcessStatusState,
    operatorModeEnabled,
    pendingAction,
    runnerLifecycleRefreshRequired,
    statusSignature,
  ]);

  const operatorModeAvailable =
    isLiveMode && isLoaded && !runnerLifecycleRefreshRequired && !isSubmitting;

  function handleOperatorModeToggle(enabled: boolean) {
    if (isSubmitting || runnerLifecycleRefreshRequired) {
      setOperatorModeEnabled(false);
      return;
    }

    setOperatorModeEnabled(enabled);
    if (!enabled) {
      if (pendingAction) {
        setPendingAction(null);
        setLifecycleState({
          status: "validation-error",
          action: pendingAction.action,
          runnerId: pendingAction.runnerId,
          message:
            "Operator Mode is off. Re-enable Operator Mode and refresh runner process status before sending a lifecycle request.",
        });
      }
    }
  }

  function requestAction(runner: RunnerProcessStatus, action: RunnerLifecycleAction) {
    if (!operatorModeEnabled || !operatorModeAvailable || isSubmitting) {
      setLifecycleState({
        status: "validation-error",
        action,
        runnerId: runner.runner_id,
        message:
          runnerLifecycleRefreshRequired
            ? "Refresh runner process status before attempting another lifecycle action."
            : "Runner lifecycle requests require live-local status, Operator Mode, and daemon-authorized actions.",
      });
      return;
    }

    if (!canRequestRunnerLifecycleAction(runner, action)) {
      setLifecycleState({
        status: "validation-error",
        action,
        runnerId: runner.runner_id,
        message:
          "Current daemon status no longer allows that runner lifecycle action. Refresh runner process status before trying again.",
      });
      return;
    }

    setPendingAction({ runnerId: runner.runner_id, action });
  }

  async function confirmLifecycleAction() {
    if (inFlightRef.current) {
      return;
    }

    const validation = validatePendingAction(
      pendingAction,
      dataMode,
      localBaseUrl,
      liveRunnerProcessStatusState,
      operatorModeEnabled,
      runnerLifecycleRefreshRequired,
    );
    if (!validation.ok) {
      setPendingAction(null);
      setLifecycleState({
        status: "validation-error",
        action: pendingAction?.action,
        runnerId: pendingAction?.runnerId,
        message: validation.message,
      });
      return;
    }

    inFlightRef.current = true;
    const requestAuthorityGeneration = currentAuthorityGeneration;
    const requestRunnerId = validation.runner.runner_id;
    const requestActionName = validation.action;
    setPendingAction(null);
    setOperatorModeEnabled(false);
    onRunnerLifecycleAttempt();
    setLifecycleState({
      status: "pending",
      action: requestActionName,
      runnerId: requestRunnerId,
    });

    try {
      const request =
        lifecycleRequest ??
        ((runnerId: string, action: RunnerLifecycleAction) =>
          createIgnisPromptClient({ baseUrl: localBaseUrl }).runnerLifecycleAction(
            runnerId,
            action,
          ));
      const response = await request(requestRunnerId, requestActionName);
      if (
        !mountedRef.current ||
        requestAuthorityRef.current.generation !== requestAuthorityGeneration
      ) {
        return;
      }
      setOperatorModeEnabled(false);
      setLifecycleState({ status: "receipt", response });
    } catch {
      if (
        !mountedRef.current ||
        requestAuthorityRef.current.generation !== requestAuthorityGeneration
      ) {
        return;
      }
      setOperatorModeEnabled(false);
      setLifecycleState({
        status: "request-uncertain",
        action: requestActionName,
        runnerId: requestRunnerId,
      });
    } finally {
      if (
        mountedRef.current &&
        requestAuthorityRef.current.generation !== requestAuthorityGeneration
      ) {
        setOperatorModeEnabled(false);
        setLifecycleState({ status: "idle" });
      }
      inFlightRef.current = false;
    }
  }

  return (
    <section className="panel runner-process-panel" aria-label="Local runner processes">
      <div className="panel-heading">
        <div>
          <h3>Local runner processes</h3>
          <p className="muted">
            {isLiveMode
              ? "Runner process status from the configured local daemon after manual refresh."
              : "Runner controls require live-local daemon data."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveRunnerProcessStatusState.status === "error"
              ? "warning"
              : isLoaded
                ? "ok"
                : "neutral"
          }
        >
          {getRunnerProcessStatusStateLabel(dataMode, liveRunnerProcessStatusState)}
        </StatusBadge>
      </div>

      {!isLiveMode ? (
        <EmptyState
          title="Runner controls require live-local daemon data"
          message="Offline preview fixtures never send lifecycle requests."
          nextAction="Switch to live local mode and manually refresh runner process status."
        />
      ) : null}

      {isLiveMode && liveRunnerProcessStatusState.status === "not-loaded" ? (
        <EmptyState
          title="Runner process status has not been loaded"
          message="No runner process metadata is displayed until GET /v1/runners/status loads successfully."
          nextAction="Start the daemon if needed, then use Refresh runner process status."
        />
      ) : null}

      {isLiveMode && liveRunnerProcessStatusState.status === "loading" ? (
        <p className="explanation">
          Loading runner process status from the configured local daemon.
        </p>
      ) : null}

      {isLiveMode && liveRunnerProcessStatusState.status === "error" ? (
        <EmptyState
          {...buildLiveErrorEmptyState(
            liveRunnerProcessStatusState.label,
            liveRunnerProcessStatusState.message,
            "Runner process status remains unavailable until a successful manual refresh.",
          )}
        />
      ) : null}

      {isLiveMode &&
      liveRunnerProcessStatusState.status === "loaded" &&
      liveRunnerProcessStatusState.sourceBaseUrl !== localBaseUrl ? (
        <EmptyState
          title="Runner status source changed"
          message="Runner process status was loaded from a different local daemon URL."
          nextAction="Refresh runner process status before enabling Operator Mode."
        />
      ) : null}

      <RunnerProcessSummary
        dataMode={dataMode}
        runnerProcessStatus={runnerProcessStatus}
        loadedAt={isLoaded ? liveRunnerProcessStatusState.loadedAt : undefined}
      />

      <OperatorModePanel
        dataMode={dataMode}
        isLoaded={isLoaded}
        refreshRequired={runnerLifecycleRefreshRequired}
        requestPending={isSubmitting}
        sourceMatches={
          liveRunnerProcessStatusState.status !== "loaded" ||
          liveRunnerProcessStatusState.sourceBaseUrl === localBaseUrl
        }
        enabled={operatorModeEnabled && operatorModeAvailable}
        onToggle={handleOperatorModeToggle}
      />

      {runnerProcessStatus?.runners.length === 0 ? (
        <EmptyState
          title="No runner process rows returned"
          message="The local daemon returned an empty runner process status list."
          nextAction="Refresh local daemon data to check the current status."
        />
      ) : null}

      {runnerProcessStatus ? (
        <div className="runner-card-grid" aria-label="Runner process rows">
          {runnerProcessStatus.runners.map((runner) => (
            <RunnerProcessCard
              key={runner.runner_id}
              runner={runner}
              operatorModeEnabled={operatorModeEnabled}
              controlsAvailable={operatorModeAvailable}
              requestPending={isSubmitting}
              onRequestAction={(action) => requestAction(runner, action)}
            />
          ))}
        </div>
      ) : null}

      {pendingAction ? (
        <RunnerActionConfirmation
          pendingAction={pendingAction}
          runner={findRunnerById(runnerProcessStatus, pendingAction.runnerId)}
          isSubmitting={isSubmitting}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmLifecycleAction}
        />
      ) : null}

      <LifecycleReceipt lifecycleState={lifecycleState} />

      {isLiveMode ? (
        <div className="manual-refresh-card model-action-row">
          <span>Manual live-local refresh</span>
          <button
            type="button"
            className="secondary-button"
            disabled={liveRunnerProcessStatusState.status === "loading"}
            onClick={onLoadLiveRunnerProcessStatus}
          >
            {liveRunnerProcessStatusState.status === "loading"
              ? "Loading runner process status"
              : "Refresh runner process status"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function RunnerProcessSummary({
  dataMode,
  runnerProcessStatus,
  loadedAt,
}: {
  dataMode: AethraDataMode;
  runnerProcessStatus?: RunnerProcessStatusResponse;
  loadedAt?: string;
}) {
  const summary = runnerProcessStatus?.summary;
  return (
    <div className="metric-grid" aria-label="Runner process summary">
      <MetricCard
        label="Total runners"
        value={summary?.total ?? 0}
        detail={`Data source: ${
          runnerProcessStatus
            ? "Local daemon"
            : dataMode === "live-local"
              ? "Not loaded"
              : "Live-local required"
        }`}
      />
      <MetricCard
        label="Configured runners"
        value={summary?.configured ?? 0}
        detail="Reported by runner process status"
      />
      <MetricCard
        label="Running"
        value={summary?.running ?? 0}
        detail="Daemon reported state"
      />
      <MetricCard
        label="Failed"
        value={summary?.failed ?? 0}
        detail="Daemon reported state"
      />
      <MetricCard
        label="Actions available"
        value={summary?.actions_available ?? 0}
        detail="Daemon-authoritative lifecycle availability"
      />
      <MetricCard
        label="Generated"
        value={
          runnerProcessStatus
            ? formatTimestamp(runnerProcessStatus.generated_at)
            : "Not loaded"
        }
        detail={
          loadedAt
            ? `Loaded at ${formatTimestamp(loadedAt)}`
            : "Manual refresh required"
        }
      />
    </div>
  );
}

function OperatorModePanel({
  dataMode,
  isLoaded,
  sourceMatches,
  refreshRequired,
  requestPending,
  enabled,
  onToggle,
}: {
  dataMode: AethraDataMode;
  isLoaded: boolean;
  sourceMatches: boolean;
  refreshRequired: boolean;
  requestPending: boolean;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const unavailableMessage =
    dataMode !== "live-local"
      ? "Runner controls require live-local daemon data. Offline preview fixtures never send lifecycle requests."
      : !sourceMatches
        ? "Runner process status was loaded from a different daemon URL. Refresh before enabling Operator Mode."
        : refreshRequired
          ? "Refresh runner process status before enabling Operator Mode again."
          : requestPending
            ? "A lifecycle request is pending."
            : !isLoaded
              ? "Runner process status must be loaded before Operator Mode can be enabled."
              : undefined;

  return (
    <div className="operator-mode-card">
      <div>
        <h4>Operator Mode: {enabled ? "On" : "Off"}</h4>
        <p className="muted">
          Operator Mode enables guarded requests to the configured local daemon
          for this page session only. The daemon remains authoritative and may
          reject every request.
        </p>
        {unavailableMessage ? <p className="muted">{unavailableMessage}</p> : null}
      </div>
      <label className="operator-mode-toggle">
        <input
          type="checkbox"
          checked={enabled}
          disabled={Boolean(unavailableMessage)}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <span>{enabled ? "Operator Mode on" : "Operator Mode off"}</span>
      </label>
    </div>
  );
}

function RunnerProcessCard({
  runner,
  operatorModeEnabled,
  controlsAvailable,
  requestPending,
  onRequestAction,
}: {
  runner: RunnerProcessStatus;
  operatorModeEnabled: boolean;
  controlsAvailable: boolean;
  requestPending: boolean;
  onRequestAction: (action: RunnerLifecycleAction) => void;
}) {
  const allowedDescription = describeAllowedActions(runner);
  const safeRunnerId = isSafeRunnerId(runner.runner_id);
  const canStart =
    safeRunnerId &&
    controlsAvailable &&
    operatorModeEnabled &&
    canRequestRunnerLifecycleAction(runner, "start");
  const canStop =
    safeRunnerId &&
    controlsAvailable &&
    operatorModeEnabled &&
    canRequestRunnerLifecycleAction(runner, "stop");

  return (
    <article className="runner-process-card">
      <div className="runner-process-card-heading">
        <div>
          <h4>{runner.runner_id}</h4>
          <p className="muted">{runner.runner_kind}</p>
        </div>
        <StatusBadge tone={runner.process_state === "failed" ? "warning" : "neutral"}>
          {formatProcessState(runner.process_state)}
        </StatusBadge>
      </div>
      <dl className="state-list compact-state-list">
        <div><dt>Model</dt><dd>{runner.model_id ?? "none"}</dd></div>
        <div><dt>Configured</dt><dd>{formatBoolean(runner.configured)}</dd></div>
        <div><dt>Executable found</dt><dd>{formatBoolean(runner.executable_exists)}</dd></div>
        <div><dt>Managed by IgnisPrompt</dt><dd>{formatBoolean(runner.managed_by_ignisprompt)}</dd></div>
        <div><dt>Operator mode required</dt><dd>{formatBoolean(runner.operator_mode_required)}</dd></div>
        <div><dt>Allowed actions</dt><dd>{allowedDescription}</dd></div>
        <div><dt>Last checked</dt><dd>{formatTimestamp(runner.last_checked_at)}</dd></div>
        {runner.started_at ? <div><dt>Started</dt><dd>{formatTimestamp(runner.started_at)}</dd></div> : null}
        {runner.stopped_at ? <div><dt>Stopped</dt><dd>{formatTimestamp(runner.stopped_at)}</dd></div> : null}
        {runner.last_error_summary ? <div><dt>Status details</dt><dd>{runner.last_error_summary}</dd></div> : null}
      </dl>
      {runner.warnings.length > 0 ? (
        <ul className="status-hint-list">
          {runner.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      <div className="runner-action-row">
        <button
          type="button"
          className="secondary-button compact-button"
          disabled={!canStart || requestPending}
          onClick={() => onRequestAction("start")}
        >
          Start
        </button>
        <button
          type="button"
          className="secondary-button compact-button"
          disabled={!canStop || requestPending}
          onClick={() => onRequestAction("stop")}
        >
          Stop
        </button>
        {!canRequestRunnerLifecycleAction(runner, "start") &&
        !canRequestRunnerLifecycleAction(runner, "stop") ? (
          <span className="muted">No lifecycle actions available</span>
        ) : null}
        {!safeRunnerId ? (
          <span className="muted">Unsafe runner ID; actions hidden</span>
        ) : null}
      </div>
    </article>
  );
}

function RunnerActionConfirmation({
  pendingAction,
  runner,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  pendingAction: PendingRunnerAction;
  runner?: RunnerProcessStatus;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="runner-confirmation-panel" aria-label="Confirm runner lifecycle request">
      <div>
        <h4>Confirm {pendingAction.action} request</h4>
        <p className="muted">
          Runner {pendingAction.runnerId} currently reports{" "}
          {runner ? formatProcessState(runner.process_state) : "Unavailable"} and
          managed by IgnisPrompt:{" "}
          {runner ? formatBoolean(runner.managed_by_ignisprompt) : "Unknown"}.
          The daemon remains authoritative and may reject this request.
        </p>
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary-button" disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? "Request pending" : `Confirm ${pendingAction.action} request`}
        </button>
      </div>
    </section>
  );
}

function LifecycleReceipt({
  lifecycleState,
}: {
  lifecycleState: LifecycleRequestState;
}) {
  if (lifecycleState.status === "idle") {
    return null;
  }

  if (lifecycleState.status === "pending") {
    return (
      <section className="runner-receipt-panel" aria-label="Runner lifecycle request pending">
        <StatusBadge tone="neutral">Request pending</StatusBadge>
        <p className="muted">
          Sending guarded {lifecycleState.action} request for {lifecycleState.runnerId}.
        </p>
      </section>
    );
  }

  if (lifecycleState.status === "validation-error") {
    return (
      <section className="runner-receipt-panel" aria-label="Runner lifecycle request error">
        <StatusBadge tone="warning">Request not sent</StatusBadge>
        <p className="muted">{lifecycleState.message}</p>
        <p className="muted">Refresh runner process status before attempting another action.</p>
      </section>
    );
  }

  if (lifecycleState.status === "request-uncertain") {
    return (
      <section className="runner-receipt-panel" aria-label="Runner lifecycle request outcome unknown">
        <StatusBadge tone="warning">Lifecycle request outcome unknown</StatusBadge>
        <p className="muted">
          The lifecycle request outcome is unknown. The daemon may have received
          the request. Refresh runner process status and audit events before
          attempting another action.
        </p>
      </section>
    );
  }

  const response = lifecycleState.response;
  const isAuditWriteFailed = response.reason_code === "AUDIT_WRITE_FAILED";
  return (
    <section className="runner-receipt-panel" aria-label="Runner lifecycle receipt">
      <div className="runner-process-card-heading">
        <div>
          <h4>Lifecycle action receipt</h4>
          <p className="muted">
            {response.action} request for {response.runner_id}
          </p>
        </div>
        <StatusBadge tone="warning">
          {isAuditWriteFailed ? "Audit write failed" : "Rejected"}
        </StatusBadge>
      </div>
      <dl className="definition-grid model-metadata-grid">
        <div><dt>Reason code</dt><dd>{response.reason_code}</dd></div>
        <div><dt>Request ID</dt><dd>{response.request_id}</dd></div>
        <div><dt>Audit event ID</dt><dd>{response.audit_event_id ?? "No durable audit event ID was returned."}</dd></div>
        <div><dt>Outcome</dt><dd>{response.outcome}</dd></div>
      </dl>
      <p className="explanation">{response.message}</p>
      {response.status ? (
        <p className="muted">
          Status snapshot: {response.status.runner_id} reported{" "}
          {formatProcessState(response.status.process_state)} with{" "}
          {describeAllowedActions(response.status)}.
        </p>
      ) : null}
      {response.boundaries.length > 0 ? (
        <ul className="status-hint-list">
          {response.boundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      ) : null}
      <p className="muted">
        Refresh runner process status and audit events before attempting another action.
      </p>
    </section>
  );
}

type PendingValidation =
  | { ok: true; action: RunnerLifecycleAction; runner: RunnerProcessStatus }
  | { ok: false; message: string };

function validatePendingAction(
  pendingAction: PendingRunnerAction | null,
  dataMode: AethraDataMode,
  localBaseUrl: string,
  liveRunnerProcessStatusState: LiveRunnerProcessStatusState,
  operatorModeEnabled: boolean,
  runnerLifecycleRefreshRequired: boolean,
): PendingValidation {
  if (!pendingAction) {
    return {
      ok: false,
      message:
        "No runner lifecycle request is pending. Refresh status and choose an action again.",
    };
  }

  if (dataMode !== "live-local") {
    return {
      ok: false,
      message:
        "Runner lifecycle requests require live-local mode. Fixture mode never sends lifecycle requests.",
    };
  }

  if (!operatorModeEnabled) {
    return {
      ok: false,
      message:
        "Operator Mode is off. Re-enable Operator Mode and refresh runner process status before sending a lifecycle request.",
    };
  }

  if (runnerLifecycleRefreshRequired) {
    return {
      ok: false,
      message:
        "Refresh runner process status before attempting another lifecycle action.",
    };
  }

  if (liveRunnerProcessStatusState.status !== "loaded") {
    return {
      ok: false,
      message:
        "Runner process status is not currently loaded. Refresh runner process status before sending a lifecycle request.",
    };
  }

  if (liveRunnerProcessStatusState.sourceBaseUrl !== localBaseUrl) {
    return {
      ok: false,
      message:
        "Runner process status was loaded from a different daemon URL. Refresh runner process status before sending a lifecycle request.",
    };
  }

  const runner = findRunnerById(
    liveRunnerProcessStatusState.runnerProcessStatus,
    pendingAction.runnerId,
  );
  if (!runner) {
    return {
      ok: false,
      message:
        "Current daemon status no longer includes that runner. Refresh runner process status before trying again.",
    };
  }

  if (
    !isSafeRunnerId(runner.runner_id) ||
    !isSafeRunnerLifecycleAction(pendingAction.action)
  ) {
    return {
      ok: false,
      message:
        "Runner lifecycle request was blocked locally because the current runner ID or action is not safe.",
    };
  }

  if (!canRequestRunnerLifecycleAction(runner, pendingAction.action)) {
    return {
      ok: false,
      message:
        "Current daemon status no longer allows that runner lifecycle action. Refresh runner process status before trying again.",
    };
  }

  return { ok: true, action: pendingAction.action, runner };
}

function findRunnerById(
  runnerProcessStatus: RunnerProcessStatusResponse | undefined,
  runnerId: string,
): RunnerProcessStatus | undefined {
  return runnerProcessStatus?.runners.find((runner) => runner.runner_id === runnerId);
}

function buildRunnerProcessStatusSignature(
  liveRunnerProcessStatusState: LiveRunnerProcessStatusState,
  localBaseUrl: string,
): string {
  if (liveRunnerProcessStatusState.status !== "loaded") {
    return `${localBaseUrl}:${liveRunnerProcessStatusState.status}`;
  }

  return [
    localBaseUrl,
    liveRunnerProcessStatusState.sourceBaseUrl,
    liveRunnerProcessStatusState.loadedAt,
    ...liveRunnerProcessStatusState.runnerProcessStatus.runners.map((runner) =>
      [runner.runner_id, ...runner.actions_allowed].join(":"),
    ),
  ].join("|");
}

export function canRequestRunnerLifecycleAction(
  runner: Pick<RunnerProcessStatus, "actions_allowed">,
  action: RunnerLifecycleAction,
): boolean {
  return runner.actions_allowed.includes(action);
}

export function describeAllowedActions(
  runner: Pick<RunnerProcessStatus, "actions_allowed">,
): string {
  const actions = runner.actions_allowed.filter((action) => action !== "none");
  return actions.length > 0
    ? actions.join(", ")
    : "No lifecycle actions available";
}

function getRunnerProcessStatusStateLabel(
  dataMode: AethraDataMode,
  liveRunnerProcessStatusState: LiveRunnerProcessStatusState,
): string {
  if (dataMode === "fixture") {
    return "Live-local required";
  }

  switch (liveRunnerProcessStatusState.status) {
    case "not-loaded":
      return "Runner process status not loaded";
    case "loading":
      return "Loading runner process status";
    case "loaded":
      return liveRunnerProcessStatusState.runnerProcessStatus.runners.length === 0
        ? "No runner processes"
        : "Runner process status loaded";
    case "error":
      return liveRunnerProcessStatusState.label;
  }
}

function formatProcessState(processState: RunnerProcessStatus["process_state"]): string {
  switch (processState) {
    case "unknown":
      return "Unknown";
    case "stopped":
      return "Stopped";
    case "running":
      return "Running";
    case "failed":
      return "Failed";
  }
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatTimestamp(timestamp: string): string {
  return timestamp.replace("T", " ").replace("Z", " UTC");
}
