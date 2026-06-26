// @vitest-environment jsdom

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  auditEventFixtures,
  capabilitiesFixture,
  evidencePackageIndexFixture,
  healthFixture,
  modelFixtures,
  modelInventoryFixture,
  modelReadinessFixture,
  modelStatusFixture,
  operationsSummaryFixture,
  routingPolicySummaryFixture,
  sustainabilityMetricsFixture,
  versionStatusFixture,
} from "./api/fixtures";
import { RunnerProcessStatusResponse } from "./api/contracts";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

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

function renderApp() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  currentContainer = container;
  currentRoot = createRoot(container);
  act(() => {
    currentRoot?.render(<App />);
  });
  return container;
}

function jsonResponse(value: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function runnerProcessStatus(
  runnerId = "stub-legal-runner",
  actionsAllowed: RunnerProcessStatusResponse["runners"][number]["actions_allowed"] = [
    "start",
  ],
): RunnerProcessStatusResponse {
  return {
    schema_version: "ignisprompt-runner-process-status-v0.1",
    generated_at: "2026-06-20T00:00:00Z",
    runners: [
      {
        runner_id: runnerId,
        runner_kind: "stub-legal-runner",
        model_id: null,
        configured: true,
        executable_exists: true,
        process_state: "stopped",
        pid: null,
        local_endpoint: null,
        started_at: null,
        stopped_at: null,
        last_checked_at: "2026-06-20T00:00:00Z",
        last_error_summary: null,
        managed_by_ignisprompt: true,
        operator_mode_required: true,
        actions_allowed: actionsAllowed,
        warnings: ["Guarded local preview action only."],
      },
    ],
    summary: {
      total: 1,
      configured: 1,
      running: 0,
      failed: 0,
      actions_available: 1,
    },
    boundaries: ["Daemon remains authoritative."],
    next_steps: ["Refresh manually after a receipt."],
  };
}

function responseForUrl(url: string, runnerId?: string) {
  const parsed = new URL(url);
  if (parsed.pathname === "/health") return healthFixture;
  if (parsed.pathname === "/v1/status/version") return versionStatusFixture;
  if (parsed.pathname === "/v1/models") return { models: modelFixtures };
  if (parsed.pathname === "/v1/models/inventory") return modelInventoryFixture;
  if (parsed.pathname === "/v1/models/readiness") return modelReadinessFixture;
  if (parsed.pathname === "/v1/routing/policy-summary") {
    return routingPolicySummaryFixture;
  }
  if (parsed.pathname === "/v1/evidence/packages") {
    return evidencePackageIndexFixture;
  }
  if (parsed.pathname === "/v1/status/models") return modelStatusFixture;
  if (parsed.pathname === "/v1/capabilities") return capabilitiesFixture;
  if (parsed.pathname === "/v1/runners/status") {
    return runnerProcessStatus(runnerId);
  }
  if (parsed.pathname === "/v1/audit/events") return auditEventFixtures;
  if (parsed.pathname === "/v1/metrics/sustainability") {
    return sustainabilityMetricsFixture;
  }
  if (parsed.pathname === "/v1/operations/summary") {
    return operationsSummaryFixture;
  }
  throw new Error(`Unexpected URL ${url}`);
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

function buttonContaining(
  container: HTMLElement,
  label: string,
): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.includes(label),
  );
  if (!match) {
    throw new Error(`Button not found containing: ${label}`);
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

function baseUrlInput(container: HTMLElement): HTMLInputElement {
  const match = container.querySelector(".base-url-field input");
  if (!(match instanceof HTMLInputElement)) {
    throw new Error("Base URL input not found");
  }
  return match;
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

async function changeInput(element: HTMLInputElement, value: string) {
  await act(async () => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

describe("App runner process status source handling", () => {
  it("includes runner process status in primary refresh without lifecycle POSTs", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      expect(init?.method ?? "GET").toBe("GET");
      return jsonResponse(responseForUrl(String(url)));
    });
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Refresh local daemon data"));

    expect(container.textContent).toContain("Attempted 13 endpoints");
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8765/v1/runners/status",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchImpl).not.toHaveBeenCalledWith(
      expect.stringContaining("/start"),
      expect.anything(),
    );
  });

  it("invalidates old runner status when the daemon URL changes", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) =>
      jsonResponse(responseForUrl(String(url))),
    );
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Models"));
    await click(button(container, "Refresh runner process status"));
    expect(container.textContent).toContain("Runner process status loaded");
    await click(
      container.querySelector("input[type='checkbox']") as HTMLInputElement,
    );
    expect(container.textContent).toContain("Operator Mode: On");

    await click(button(container, "Overview"));
    await changeInput(baseUrlInput(container), "http://127.0.0.1:9876");
    await click(button(container, "Models"));

    expect(container.textContent).toContain("Runner process status has not been loaded");
    expect(container.textContent).toContain("Operator Mode: Off");
    expect(container.textContent).not.toContain("Confirm start request");
  });

  it("ignores stale in-flight runner status after the daemon URL changes", async () => {
    const pendingRunnerStatus = deferred<Response>();
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      if (String(url).endsWith("/v1/runners/status")) {
        return pendingRunnerStatus.promise;
      }
      return jsonResponse(responseForUrl(String(url)));
    });
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Models"));
    await click(button(container, "Refresh runner process status"));
    await click(button(container, "Overview"));
    await changeInput(baseUrlInput(container), "http://127.0.0.1:9876");
    await act(async () => {
      pendingRunnerStatus.resolve(jsonResponse(runnerProcessStatus()));
      await pendingRunnerStatus.promise;
    });
    await click(button(container, "Models"));

    expect(container.textContent).toContain("Runner process status has not been loaded");
    expect(container.textContent).toContain("Operator Mode: Off");
    expect(optionalButton(container, "Start")).toBeUndefined();
  });

  it("does not leave full refresh loading or allow stale and ABA snapshot overwrites", async () => {
    const pendingRunnerStatusByOrigin = new Map<string, Array<ReturnType<typeof deferred<Response>>>>();
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const parsed = new URL(String(url));
      if (parsed.pathname === "/v1/runners/status") {
        const pending = deferred<Response>();
        const queue = pendingRunnerStatusByOrigin.get(parsed.origin) ?? [];
        queue.push(pending);
        pendingRunnerStatusByOrigin.set(parsed.origin, queue);
        return pending.promise;
      }
      return jsonResponse(responseForUrl(String(url)));
    });
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Refresh local daemon data"));
    expect(buttonContaining(container, "Refreshing local daemon data").disabled).toBe(true);

    await changeInput(baseUrlInput(container), "http://127.0.0.1:9876");
    expect(button(container, "Refresh local daemon data").disabled).toBe(false);

    await click(button(container, "Refresh local daemon data"));
    const firstB = pendingRunnerStatusByOrigin.get("http://127.0.0.1:9876")?.[0];
    if (!firstB) throw new Error("B runner status request not captured");
    await act(async () => {
      firstB.resolve(jsonResponse(runnerProcessStatus("runner-from-b")));
      await firstB.promise;
    });
    await click(button(container, "Models"));
    expect(container.textContent).toContain("runner-from-b");

    await click(button(container, "Overview"));
    await changeInput(baseUrlInput(container), "http://127.0.0.1:8765");
    await click(button(container, "Refresh local daemon data"));
    const firstA = pendingRunnerStatusByOrigin.get("http://127.0.0.1:8765")?.[0];
    const secondA = pendingRunnerStatusByOrigin.get("http://127.0.0.1:8765")?.[1];
    if (!firstA || !secondA) throw new Error("A runner status requests not captured");
    await act(async () => {
      secondA.resolve(jsonResponse(runnerProcessStatus("runner-from-later-a")));
      await secondA.promise;
    });
    await click(button(container, "Models"));
    expect(container.textContent).toContain("runner-from-later-a");

    await act(async () => {
      firstA.resolve(jsonResponse(runnerProcessStatus("runner-from-stale-a")));
      await firstA.promise;
    });
    expect(container.textContent).toContain("runner-from-later-a");
    expect(container.textContent).not.toContain("runner-from-stale-a");
  });

  it("does not allow stale or ABA individual runner-status refreshes to overwrite newer status", async () => {
    const pendingRunnerStatusByOrigin = new Map<string, Array<ReturnType<typeof deferred<Response>>>>();
    const fetchImpl = vi.fn<typeof fetch>(async (url) => {
      const parsed = new URL(String(url));
      if (parsed.pathname === "/v1/runners/status") {
        const pending = deferred<Response>();
        const queue = pendingRunnerStatusByOrigin.get(parsed.origin) ?? [];
        queue.push(pending);
        pendingRunnerStatusByOrigin.set(parsed.origin, queue);
        return pending.promise;
      }
      return jsonResponse(responseForUrl(String(url)));
    });
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Models"));
    await click(button(container, "Refresh runner process status"));
    await click(button(container, "Overview"));
    await changeInput(baseUrlInput(container), "http://127.0.0.1:9876");
    expect(button(container, "Refresh local daemon data").disabled).toBe(false);

    await click(button(container, "Models"));
    await click(button(container, "Overview"));
    await changeInput(baseUrlInput(container), "http://127.0.0.1:8765");
    await click(button(container, "Models"));
    await click(button(container, "Refresh runner process status"));

    const firstA = pendingRunnerStatusByOrigin.get("http://127.0.0.1:8765")?.[0];
    const secondA = pendingRunnerStatusByOrigin.get("http://127.0.0.1:8765")?.[1];
    if (!firstA || !secondA) throw new Error("A runner status requests not captured");

    await act(async () => {
      secondA.resolve(jsonResponse(runnerProcessStatus("individual-later-a")));
      await secondA.promise;
    });
    expect(container.textContent).toContain("individual-later-a");

    await act(async () => {
      firstA.resolve(jsonResponse(runnerProcessStatus("individual-stale-a")));
      await firstA.promise;
    });
    expect(container.textContent).toContain("individual-later-a");
    expect(container.textContent).not.toContain("individual-stale-a");
  });

  it("persists lifecycle refresh-required state across route and mode changes until runner status reloads", async () => {
    let lifecyclePostCount = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      const parsed = new URL(String(url));
      if (init?.method === "POST" && parsed.pathname.endsWith("/start")) {
        lifecyclePostCount += 1;
        return jsonResponse(
          {
            schema_version: "ignisprompt-runner-lifecycle-action-v0.1",
            request_id: "runner-lifecycle-rejected-app-1",
            action: "start",
            runner_id: "stub-legal-runner",
            accepted: false,
            outcome: "rejected",
            reason_code: "LIFECYCLE_CONTROLS_DISABLED",
            message: "Daemon rejected the guarded request.",
            audit_event_id: null,
            status: runnerProcessStatus().runners[0],
            boundaries: ["Daemon remains authoritative."],
          },
          { status: 409 },
        );
      }
      return jsonResponse(responseForUrl(String(url)));
    });
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Models"));
    await click(button(container, "Refresh runner process status"));
    await click(checkbox(container));
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(lifecyclePostCount).toBe(1);
    expect(container.textContent).toContain("runner-lifecycle-rejected-app-1");
    expect(checkbox(container).checked).toBe(false);
    expect(checkbox(container).disabled).toBe(true);
    expect(button(container, "Start").disabled).toBe(true);

    await click(button(container, "Overview"));
    await click(button(container, "Models"));
    expect(checkbox(container).disabled).toBe(true);
    expect(button(container, "Start").disabled).toBe(true);

    await click(button(container, "Overview"));
    await click(button(container, "Offline preview fixture"));
    await click(button(container, "Live local"));
    await click(button(container, "Models"));
    expect(checkbox(container).disabled).toBe(true);
    expect(container.textContent).toContain(
      "Refresh runner process status before enabling Operator Mode again.",
    );
    await click(button(container, "Start"));
    expect(lifecyclePostCount).toBe(1);
  });

  it("clears lifecycle refresh-required state only after successful authoritative runner status", async () => {
    let runnerStatusAttempt = 0;
    let lifecyclePostCount = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      const parsed = new URL(String(url));
      if (init?.method === "POST" && parsed.pathname.endsWith("/start")) {
        lifecyclePostCount += 1;
        return jsonResponse(
          {
            schema_version: "ignisprompt-runner-lifecycle-action-v0.1",
            request_id: `runner-lifecycle-rejected-app-${lifecyclePostCount}`,
            action: "start",
            runner_id: "stub-legal-runner",
            accepted: false,
            outcome: "rejected",
            reason_code: "LIFECYCLE_CONTROLS_DISABLED",
            message: "Daemon rejected the guarded request.",
            audit_event_id: null,
            status: runnerProcessStatus().runners[0],
            boundaries: ["Daemon remains authoritative."],
          },
          { status: 409 },
        );
      }
      if (parsed.pathname === "/v1/runners/status") {
        runnerStatusAttempt += 1;
        if (runnerStatusAttempt === 2) {
          return jsonResponse({ nope: true }, { status: 500 });
        }
        return jsonResponse(
          runnerProcessStatus(
            "stub-legal-runner",
            runnerStatusAttempt >= 3 ? ["start"] : ["start"],
          ),
        );
      }
      return jsonResponse(responseForUrl(String(url)));
    });
    vi.stubGlobal("fetch", fetchImpl);
    const container = renderApp();

    await click(button(container, "Models"));
    await click(button(container, "Refresh runner process status"));
    await click(checkbox(container));
    await click(button(container, "Start"));
    await click(button(container, "Confirm start request"));
    expect(checkbox(container).disabled).toBe(true);

    await click(button(container, "Refresh runner process status"));
    expect(checkbox(container).disabled).toBe(true);

    await click(button(container, "Refresh runner process status"));
    await click(checkbox(container));
    expect(checkbox(container).checked).toBe(true);
    expect(button(container, "Start").disabled).toBe(false);
  });
});
