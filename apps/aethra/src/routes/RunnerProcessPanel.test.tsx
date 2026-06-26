// @vitest-environment jsdom

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RunnerLifecycleAction,
  RunnerLifecycleActionResponse,
  RunnerProcessStatus,
  RunnerProcessStatusResponse,
} from "../api/contracts";
import type { AethraDataMode, LiveRunnerProcessStatusState } from "../dataSource";
import { RunnerLifecycleRequest, RunnerProcessPanel } from "./RunnerProcessPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const baseUrl = "http://127.0.0.1:8765";
const alternateBaseUrl = "http://127.0.0.1:9876";
const loadedAt = "2026-06-20T00:00:00Z";

const baseRunner: RunnerProcessStatus = {
  runner_id: "stub-legal-runner",
  runner_kind: "stub-legal-runner",
  model_id: null,
  configured: true,
  executable_exists: true,
  process_state: "unknown",
  pid: null,
  local_endpoint: null,
  started_at: null,
  stopped_at: null,
  last_checked_at: "2026-06-20T00:00:00Z",
  last_error_summary: null,
  managed_by_ignisprompt: false,
  operator_mode_required: true,
  actions_allowed: ["none"],
  warnings: ["Status only."],
};

const rejectedReceipt: RunnerLifecycleActionResponse = {
  schema_version: "ignisprompt-runner-lifecycle-action-v0.1",
  request_id: "runner-lifecycle-rejected-1",
  action: "start",
  runner_id: "stub-legal-runner",
  accepted: false,
  outcome: "rejected",
  reason_code: "LIFECYCLE_CONTROLS_DISABLED",
  message: "Daemon rejected the guarded request.",
  audit_event_id: null,
  status: { ...baseRunner, process_state: "stopped", actions_allowed: ["start"] },
  boundaries: ["Daemon remains authoritative."],
};

const auditWriteFailedReceipt: RunnerLifecycleActionResponse = {
  ...rejectedReceipt,
  request_id: "runner-lifecycle-audit-failed-1",
  reason_code: "AUDIT_WRITE_FAILED",
  message: "Audit write failed; guarded request rejected.",
};

let currentRoot: Root | undefined;
let currentContainer: HTMLDivElement | undefined;

afterEach(() => {
  if (currentRoot) {
    act(() => {
      currentRoot?.unmount();
    });
  }
  currentContainer?.remove();
  currentRoot = undefined;
  currentContainer = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderPanel(input: {
  dataMode?: AethraDataMode;
  localBaseUrl?: string;
  state?: LiveRunnerProcessStatusState;
  refreshRequired?: boolean;
  lifecycleRequest?: RunnerLifecycleRequest;
  onRunnerLifecycleAttempt?: () => void;
  onLoad?: () => void;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  currentContainer = container;
  currentRoot = createRoot(container);
  let currentInput = input;
  let internalRefreshRequired = input.refreshRequired ?? false;

  const render = (override: Partial<Parameters<typeof renderPanel>[0]> = {}) => {
    currentInput = { ...currentInput, ...override };
    if (override.refreshRequired !== undefined) {
      internalRefreshRequired = override.refreshRequired;
    }
    const nextInput = currentInput;
    const props = {
      dataMode: nextInput.dataMode ?? "live-local",
      localBaseUrl: nextInput.localBaseUrl ?? baseUrl,
      liveRunnerProcessStatusState: nextInput.state ?? notLoadedState(),
      runnerLifecycleRefreshRequired: internalRefreshRequired,
      lifecycleRequest: nextInput.lifecycleRequest,
      onLoadLiveRunnerProcessStatus: nextInput.onLoad ?? (() => undefined),
      onRunnerLifecycleAttempt:
        nextInput.onRunnerLifecycleAttempt ??
        (() => {
          internalRefreshRequired = true;
          render({ refreshRequired: true });
        }),
    };
    act(() => {
      currentRoot?.render(<RunnerProcessPanel {...props} />);
    });
  };

  render();
  return { container, render };
}

function notLoadedState(): LiveRunnerProcessStatusState {
  return { status: "not-loaded" };
}

function loadedState(
  runners: RunnerProcessStatus[],
  sourceBaseUrl = baseUrl,
  timestamp = loadedAt,
): LiveRunnerProcessStatusState {
  return {
    status: "loaded",
    runnerProcessStatus: runnerProcessStatus(runners),
    loadedAt: timestamp,
    sourceBaseUrl,
  };
}

function runnerProcessStatus(
  runners: RunnerProcessStatus[],
): RunnerProcessStatusResponse {
  return {
    schema_version: "ignisprompt-runner-process-status-v0.1",
    generated_at: "2026-06-20T00:00:00Z",
    runners,
    summary: {
      total: runners.length,
      configured: runners.filter((runner) => runner.configured).length,
      running: runners.filter((runner) => runner.process_state === "running")
        .length,
      failed: runners.filter((runner) => runner.process_state === "failed")
        .length,
      actions_available: runners.filter((runner) =>
        runner.actions_allowed.some((action) => action !== "none"),
      ).length,
    },
    boundaries: ["Status only."],
    next_steps: ["Refresh manually."],
  };
}

function runnerWith(input: Partial<RunnerProcessStatus>): RunnerProcessStatus {
  return { ...baseRunner, ...input };
}

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );
  if (!match) {
    throw new Error(`Button not found: ${label}`);
  }
  return match;
}

function optionalButton(
  container: HTMLElement,
  label: string,
): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );
}

function checkbox(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector("input[type='checkbox']");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("Operator Mode checkbox not found");
  }
  return input;
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function enableOperatorMode(container: HTMLElement) {
  const input = checkbox(container);
  if (!input.checked) {
    await click(input);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}

describe("RunnerProcessPanel interactions", () => {
  it("keeps Operator Mode off by default and fixture mode inert", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>();
    const { container } = renderPanel({
      dataMode: "fixture",
      state: notLoadedState(),
      lifecycleRequest,
    });

    expect(container.textContent).toContain("Operator Mode: Off");
    expect(checkbox(container).disabled).toBe(true);
    expect(container.textContent).not.toContain("Confirm start request");
    expect(container.textContent).not.toContain("Confirm stop request");
    expect(lifecycleRequest).not.toHaveBeenCalled();
  });

  it("renders without sending requests and enabling Operator Mode alone sends none", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>();
    const { container } = renderPanel({
      state: loadedState([
        runnerWith({ actions_allowed: ["start"], managed_by_ignisprompt: false }),
      ]),
      lifecycleRequest,
    });

    expect(lifecycleRequest).not.toHaveBeenCalled();
    await enableOperatorMode(container);
    expect(container.textContent).toContain("Operator Mode: On");
    expect(lifecycleRequest).not.toHaveBeenCalled();
  });

  it("turns Operator Mode off without showing a request-not-sent error when no confirmation is open", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>();
    const { container } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(checkbox(container));

    expect(container.textContent).toContain("Operator Mode: Off");
    expect(container.textContent).not.toContain("Request not sent");
    expect(lifecycleRequest).not.toHaveBeenCalled();
  });

  it("gates actions by daemon-authoritative actions_allowed only", async () => {
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["none"] })]),
    });

    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(true);
    expect(button(container, "Stop").disabled).toBe(true);

    render({
      state: loadedState([
        runnerWith({ actions_allowed: ["start"], process_state: "running" }),
      ]),
    });
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(false);
    expect(button(container, "Stop").disabled).toBe(true);

    render({
      state: loadedState([
        runnerWith({
          actions_allowed: ["stop"],
          managed_by_ignisprompt: false,
          process_state: "stopped",
        }),
      ]),
    });
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(true);
    expect(button(container, "Stop").disabled).toBe(false);
  });

  it("opens and cancels confirmation without sending a request", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>();
    const { container } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    expect(container.textContent).toContain("Confirm start request");
    await click(button(container, "Cancel"));
    expect(container.textContent).not.toContain("Confirm start request");
    expect(lifecycleRequest).not.toHaveBeenCalled();
  });

  it("sends exactly one final confirmation request and releases pending state", async () => {
    const pending = deferred<RunnerLifecycleActionResponse>();
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>(() => pending.promise);
    const { container } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    const confirmButton = button(container, "Confirm start request");
    await act(async () => {
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      confirmButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(lifecycleRequest).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("Confirm start request");
    expect(container.textContent).toContain("Request pending");
    expect(container.textContent).not.toContain("Request not sent");
    expect(container.textContent).toContain("Operator Mode: Off");
    expect(checkbox(container).disabled).toBe(true);
    expect(button(container, "Start").disabled).toBe(true);

    await act(async () => {
      pending.resolve(rejectedReceipt);
      await pending.promise;
    });
    expect(container.textContent).toContain("Rejected");
    expect(container.textContent).toContain("runner-lifecycle-rejected-1");
    expect(container.textContent).toContain("Operator Mode: Off");
    expect(button(container, "Start").disabled).toBe(true);
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(true);
    expect(container.textContent).toContain(
      "Refresh runner process status and audit events before attempting another action.",
    );
  });

  it("invalidates confirmation when Operator Mode turns off, action disappears, or runner disappears", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>();
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(checkbox(container));
    expect(container.textContent).not.toContain("Confirm start request");
    expect(container.textContent).toContain("Operator Mode is off");

    render({
      state: loadedState([
        runnerWith({ actions_allowed: ["start"] }),
      ]),
    });
    await enableOperatorMode(container);
    await click(button(container, "Start"));
    render({
      state: loadedState([
        runnerWith({ actions_allowed: ["none"] }),
      ], baseUrl, "2026-06-20T00:00:01Z"),
    });
    expect(container.textContent).toContain("no longer allows");
    expect(lifecycleRequest).not.toHaveBeenCalled();

    render({
      state: loadedState([
        runnerWith({ actions_allowed: ["start"] }),
      ]),
    });
    await enableOperatorMode(container);
    await click(button(container, "Start"));
    render({
      state: loadedState([], baseUrl, "2026-06-20T00:00:02Z"),
    });
    expect(container.textContent).toContain("no longer includes that runner");
    expect(lifecycleRequest).not.toHaveBeenCalled();
  });

  it("renders guarded rejection, null audit ID, audit-write failure, and safe connectivity failures", async () => {
    const responses: Array<RunnerLifecycleActionResponse | "reject"> = [
      rejectedReceipt,
      auditWriteFailedReceipt,
      "reject",
    ];
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>(() => {
      const response = responses.shift();
      if (response === "reject") {
        return Promise.reject(new Error("stack secret /Users/alice"));
      }
      if (!response) {
        return Promise.reject(new Error("missing test response"));
      }
      return Promise.resolve(response);
    });
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain("Rejected");
    expect(container.textContent).toContain("start request for stub-legal-runner");
    expect(container.textContent).toContain("LIFECYCLE_CONTROLS_DISABLED");
    expect(container.textContent).toContain("runner-lifecycle-rejected-1");
    expect(container.textContent).toContain(
      "No durable audit event ID was returned.",
    );
    expect(container.textContent).toContain("Daemon rejected the guarded request.");
    expect(container.textContent).toContain("Daemon remains authoritative.");
    expect(container.textContent).toContain(
      "Refresh runner process status and audit events before attempting another action.",
    );

    render({
      state: loadedState([
        runnerWith({ actions_allowed: ["start"] }),
      ], baseUrl, "2026-06-20T00:00:03Z"),
      refreshRequired: false,
    });
    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain("AUDIT_WRITE_FAILED");
    expect(container.textContent).toContain("Audit write failed");

    render({
      state: loadedState([
        runnerWith({ actions_allowed: ["start"] }),
      ], baseUrl, "2026-06-20T00:00:04Z"),
      refreshRequired: false,
    });
    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain(
      "Lifecycle request outcome unknown",
    );
    expect(container.textContent).toContain("daemon may have received");
    expect(container.textContent).not.toContain("stack secret");
    expect(container.textContent).not.toContain("/Users/alice");
  });

  it("does not optimistically change displayed process status after guarded receipt", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>(async () => ({
      ...rejectedReceipt,
      status: {
        ...baseRunner,
        process_state: "running",
        actions_allowed: ["stop"],
      },
    }));
    const { container } = renderPanel({
      state: loadedState([
        runnerWith({ process_state: "stopped", actions_allowed: ["start"] }),
      ]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain("Rejected");
    expect(container.textContent).toContain("Status snapshot: stub-legal-runner reported Running");
    expect(container.textContent).toContain("Stopped");
  });

  it("does not apply lifecycle receipts after daemon authority changes", async () => {
    const pending = deferred<RunnerLifecycleActionResponse>();
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>(() => pending.promise);
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    render({
      localBaseUrl: alternateBaseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        alternateBaseUrl,
        "2026-06-20T00:00:03Z",
      ),
    });

    await act(async () => {
      pending.resolve(rejectedReceipt);
      await pending.promise;
    });

    expect(container.textContent).not.toContain("Lifecycle action receipt");
    expect(container.textContent).not.toContain("runner-lifecycle-rejected-1");
    expect(container.textContent).not.toContain("Lifecycle request outcome unknown");
  });

  it("ignores in-flight lifecycle results after status refreshes, fixture switches, and ABA URL changes", async () => {
    const statusRefreshPending = deferred<RunnerLifecycleActionResponse>();
    const fixturePending = deferred<RunnerLifecycleActionResponse>();
    const abaPending = deferred<RunnerLifecycleActionResponse>();
    const lifecycleRequest = vi
      .fn<RunnerLifecycleRequest>()
      .mockReturnValueOnce(statusRefreshPending.promise)
      .mockReturnValueOnce(fixturePending.promise)
      .mockReturnValueOnce(abaPending.promise);
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    render({
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        baseUrl,
        "2026-06-20T00:00:05Z",
      ),
      refreshRequired: false,
    });
    await act(async () => {
      statusRefreshPending.resolve(rejectedReceipt);
      await statusRefreshPending.promise;
    });
    expect(container.textContent).not.toContain("runner-lifecycle-rejected-1");

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    render({ dataMode: "fixture", state: notLoadedState() });
    await act(async () => {
      fixturePending.resolve(rejectedReceipt);
      await fixturePending.promise;
    });
    expect(container.textContent).not.toContain("runner-lifecycle-rejected-1");
    expect(container.textContent).toContain("Runner controls require live-local daemon data");

    render({
      dataMode: "live-local",
      localBaseUrl: baseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        baseUrl,
        "2026-06-20T00:00:06Z",
      ),
      refreshRequired: false,
    });
    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    render({
      localBaseUrl: alternateBaseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        alternateBaseUrl,
        "2026-06-20T00:00:07Z",
      ),
    });
    render({
      localBaseUrl: baseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        baseUrl,
        "2026-06-20T00:00:08Z",
      ),
      refreshRequired: false,
    });
    await act(async () => {
      abaPending.resolve(rejectedReceipt);
      await abaPending.promise;
    });
    expect(container.textContent).not.toContain("runner-lifecycle-rejected-1");
  });

  it("clears completed lifecycle receipts when mode or daemon URL changes", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>(async () => rejectedReceipt);
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain("runner-lifecycle-rejected-1");

    render({ dataMode: "fixture", state: notLoadedState() });
    expect(container.textContent).not.toContain("runner-lifecycle-rejected-1");

    render({
      dataMode: "live-local",
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        baseUrl,
        "2026-06-20T00:00:09Z",
      ),
      refreshRequired: false,
    });
    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain("runner-lifecycle-rejected-1");

    render({
      localBaseUrl: alternateBaseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        alternateBaseUrl,
      ),
    });
    expect(container.textContent).not.toContain("runner-lifecycle-rejected-1");
  });

  it("requires a successful runner-status refresh after every post attempt", async () => {
    const lifecycleRequest = vi
      .fn<RunnerLifecycleRequest>()
      .mockResolvedValueOnce(rejectedReceipt)
      .mockRejectedValueOnce(new Error("network stack /Users/alice"));
    const { container, render } = renderPanel({
      state: loadedState([
        runnerWith({ process_state: "stopped", actions_allowed: ["start"] }),
      ]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(button(container, "Start").disabled).toBe(true);
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(true);
    expect(container.textContent).toContain("Stopped");

    render({
      state: loadedState(
        [runnerWith({ process_state: "stopped", actions_allowed: ["start"] })],
        baseUrl,
        "2026-06-20T00:00:09Z",
      ),
      refreshRequired: false,
    });
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(false);

    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(container.textContent).toContain("Lifecycle request outcome unknown");
    expect(button(container, "Start").disabled).toBe(true);
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(true);

    render({
      state: loadedState(
        [runnerWith({ process_state: "stopped", actions_allowed: ["start"] })],
        baseUrl,
        "2026-06-20T00:00:10Z",
      ),
      refreshRequired: false,
    });
    await enableOperatorMode(container);
    expect(button(container, "Start").disabled).toBe(false);
    expect(container.textContent).not.toContain("/Users/alice");
  });

  it("resets Operator Mode for mode changes, URL changes, stale source URLs, and remounts", async () => {
    const lifecycleRequest = vi.fn<RunnerLifecycleRequest>();
    const { container, render } = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });

    await enableOperatorMode(container);
    expect(container.textContent).toContain("Operator Mode: On");

    render({ dataMode: "fixture" });
    expect(container.textContent).toContain("Operator Mode: Off");

    render({
      dataMode: "live-local",
      localBaseUrl: alternateBaseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        baseUrl,
      ),
    });
    expect(checkbox(container).disabled).toBe(true);
    expect(optionalButton(container, "Start")).toBeUndefined();

    render({
      dataMode: "live-local",
      localBaseUrl: alternateBaseUrl,
      state: loadedState(
        [runnerWith({ actions_allowed: ["start"] })],
        alternateBaseUrl,
      ),
    });
    await enableOperatorMode(container);
    expect(container.textContent).toContain("Operator Mode: On");

    act(() => {
      currentRoot?.unmount();
    });
    currentContainer?.remove();
    currentRoot = undefined;
    currentContainer = undefined;
    const remounted = renderPanel({
      state: loadedState([runnerWith({ actions_allowed: ["start"] })]),
      lifecycleRequest,
    });
    expect(remounted.container.textContent).toContain("Operator Mode: Off");
  });
});
