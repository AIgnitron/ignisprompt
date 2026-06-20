import { useEffect, useMemo, useState } from "react";
import {
  RouteExplainResponse,
  RoutingPolicySummaryResponse,
} from "../api/contracts";
import {
  routeExplainFixture,
  routingPolicySummaryFixture,
} from "../fixtures/aethraFixture";
import { EmptyState } from "../components/EmptyState";
import { PageHelp } from "../components/PageHelp";
import { StatusBadge } from "../components/StatusBadge";
import type {
  AethraDataMode,
  LiveRoutingPolicySummaryState,
} from "../dataSource";
import {
  formatLiveLocalDisplaySource,
  getLiveLocalDisplaySource,
} from "../dataSource";
import {
  buildRouteLadder,
  buildRouteDecisionCopyText,
  buildRouteFixtureScenarios,
  buildRouteStateLegend,
  formatRouteLadderState,
  isWarningRouteDecision,
  sampleRoutePrompt,
} from "./routeExplainSummary";
import { localPreviewEmptyStates } from "./emptyStates";

type RouteResultState =
  {
    source: "fixture";
    label: string;
    response?: RouteExplainResponse;
    errorMessage?: string;
  };

type RoutingExplorerProps = {
  dataMode: AethraDataMode;
  localBaseUrl: string;
  localBaseUrlError?: string;
  liveRoutingPolicyState: LiveRoutingPolicySummaryState;
};

export function RoutingExplorer({
  dataMode,
  localBaseUrl,
  localBaseUrlError,
  liveRoutingPolicyState,
}: RoutingExplorerProps) {
  const fixtureScenarios = useMemo(
    () => buildRouteFixtureScenarios(routeExplainFixture),
    [],
  );
  const [prompt, setPrompt] = useState(sampleRoutePrompt);
  const [model, setModel] = useState("ignisprompt/legal");
  const [domain, setDomain] = useState("legal");
  const [selectedFixtureId, setSelectedFixtureId] = useState(
    fixtureScenarios[0].id,
  );
  const [result, setResult] = useState<RouteResultState>({
    source: "fixture",
    label: fixtureScenarios[0].label,
    response: fixtureScenarios[0].response,
  });
  const liveRoutingPolicy =
    dataMode === "live-local" && liveRoutingPolicyState.status === "loaded"
      ? liveRoutingPolicyState.summary
      : undefined;
  const routingPolicy =
    liveRoutingPolicy ??
    (dataMode === "fixture" ? routingPolicySummaryFixture : undefined);
  const routingPolicySourceLabel = formatLiveLocalDisplaySource(
    getLiveLocalDisplaySource(dataMode, liveRoutingPolicyState),
  );

  function updatePrompt(nextPrompt: string) {
    setPrompt(nextPrompt);
  }

  function updateModel(nextModel: string) {
    setModel(nextModel);
  }

  function updateDomain(nextDomain: string) {
    setDomain(nextDomain);
  }

  function showFixtureResult() {
    const scenario =
      fixtureScenarios.find((fixture) => fixture.id === selectedFixtureId) ??
      fixtureScenarios[0];

    setResult({
      source: "fixture",
      label: scenario.label,
      response: scenario.response,
      errorMessage: scenario.errorMessage,
    });
  }

  return (
    <section id="routing-explorer" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Routing Explorer</p>
          <h2>Route inspection only</h2>
          <p className="page-subtitle">
            Inspect read-only routing policy metadata and clearly labeled
            offline preview route examples without submitting prompts from
            Aethra.
          </p>
        </div>
        <div className="status-strip" aria-label="Routing Explorer status">
          <StatusBadge tone="neutral">Read-only policy metadata</StatusBadge>
          <StatusBadge tone="warning">No route execution</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
        </div>
      </header>

      <PageHelp
        collapsible
        items={[
          "Compare clearly labeled offline preview routing examples with read-only live-local routing policy metadata.",
          "Route tiers, route codes, warnings, and explanations are policy metadata or fixture examples only in this dashboard.",
          "No cloud route is used by default; route explanations are local-preview policy signals, not production policy certification.",
          "Aethra does not submit prompts or execute route-explain requests in this dashboard.",
        ]}
      />

      <RoutingPolicySummaryPanel
        dataMode={dataMode}
        liveRoutingPolicyState={liveRoutingPolicyState}
        summary={routingPolicy}
        sourceLabel={routingPolicySourceLabel}
      />

      <div className="routing-layout">
        <RouteExplainForm
          prompt={prompt}
          model={model}
          domain={domain}
          fixtureScenarios={fixtureScenarios}
          selectedFixtureId={selectedFixtureId}
          localBaseUrl={localBaseUrl}
          localBaseUrlError={localBaseUrlError}
          onPromptChange={updatePrompt}
          onModelChange={updateModel}
          onDomainChange={updateDomain}
          onFixtureChange={setSelectedFixtureId}
          onFixtureSubmit={showFixtureResult}
        />
        <RouteExplainResult result={result} />
      </div>
    </section>
  );
}

type RoutingPolicySummaryPanelProps = {
  dataMode: AethraDataMode;
  liveRoutingPolicyState: LiveRoutingPolicySummaryState;
  summary?: RoutingPolicySummaryResponse;
  sourceLabel: string;
};

function RoutingPolicySummaryPanel({
  dataMode,
  liveRoutingPolicyState,
  summary,
  sourceLabel,
}: RoutingPolicySummaryPanelProps) {
  const isLiveMode = dataMode === "live-local";
  const isLoaded = isLiveMode && liveRoutingPolicyState.status === "loaded";

  return (
    <section className="panel" aria-label="Local routing policy summary">
      <div className="panel-heading">
        <div>
          <h3>Local routing policy summary</h3>
          <p className="muted">
            {isLiveMode
              ? "Manual read-only GET /v1/routing/policy-summary from the configured local daemon."
              : "Fixture mode uses offline preview routing policy metadata."}
          </p>
        </div>
        <StatusBadge
          tone={
            liveRoutingPolicyState.status === "error"
              ? "warning"
              : isLoaded
                ? "ok"
                : "neutral"
          }
        >
          {sourceLabel}
        </StatusBadge>
      </div>

      <p className="explanation">
        This summary explains current local-preview routing policy without
        submitting prompts, executing a route, running models, mutating policy,
        changing manifests, changing connectors, calling cloud services, or
        sending telemetry.
      </p>

      {isLiveMode && liveRoutingPolicyState.status === "not-loaded" ? (
        <EmptyState
          title="Routing policy summary has not been loaded"
          message="No live local routing policy metadata is displayed until GET /v1/routing/policy-summary loads successfully."
          nextAction="Start the daemon if needed, then use Refresh local daemon data."
        />
      ) : null}

      {isLiveMode && liveRoutingPolicyState.status === "loading" ? (
        <p className="explanation">
          Loading read-only routing policy metadata from the configured local
          daemon.
        </p>
      ) : null}

      {isLiveMode && liveRoutingPolicyState.status === "error" ? (
        <EmptyState
          title={liveRoutingPolicyState.label}
          message={liveRoutingPolicyState.message}
          nextAction="Routing policy metadata remains unavailable until a successful manual refresh."
        />
      ) : null}

      {summary ? (
      <>
      <dl className="definition-grid route-result-grid">
        <div>
          <dt>Source</dt>
          <dd>{sourceLabel}</dd>
        </div>
        <div>
          <dt>Endpoint</dt>
          <dd>
            {isLiveMode
              ? "GET /v1/routing/policy-summary"
              : "offline preview fixture routing policy"}
          </dd>
        </div>
        <div>
          <dt>Local only</dt>
          <dd>{String(summary.summary.local_only)}</dd>
        </div>
        <div>
          <dt>Cloud enabled</dt>
          <dd>{String(summary.summary.cloud_enabled)}</dd>
        </div>
        <div>
          <dt>Route execution</dt>
          <dd>{String(summary.summary.route_execution_required)}</dd>
        </div>
        <div>
          <dt>Prompt submission</dt>
          <dd>{String(summary.summary.prompt_submission_required)}</dd>
        </div>
      </dl>

      <div className="route-state-grid">
        {summary.route_categories.map((category) => (
          <article key={category.id} className="route-state-card">
            <div className="route-ladder-heading">
              <div>
                <p className="metric-label">{category.tier}</p>
                <strong>{category.label}</strong>
              </div>
              <StatusBadge tone="neutral">{category.status}</StatusBadge>
            </div>
            <p>{category.behavior}</p>
          </article>
        ))}
      </div>

      <div className="detail-section">
        <h4>Decision inputs</h4>
        <ul className="status-hint-list">
          {summary.decision_inputs.map((hint) => (
            <li key={hint.id}>
              <strong>{hint.label}:</strong> {hint.detail}
            </li>
          ))}
        </ul>
      </div>
      </>
      ) : null}

      <p className="muted">
        Policy metadata is not production policy certification, compliance
        evidence, legal advice, or legal accuracy validation.
      </p>
    </section>
  );
}

type RouteExplainFormProps = {
  prompt: string;
  model: string;
  domain: string;
  fixtureScenarios: ReturnType<typeof buildRouteFixtureScenarios>;
  selectedFixtureId: string;
  localBaseUrl: string;
  localBaseUrlError?: string;
  onPromptChange: (prompt: string) => void;
  onModelChange: (model: string) => void;
  onDomainChange: (domain: string) => void;
  onFixtureChange: (fixtureId: string) => void;
  onFixtureSubmit: () => void;
};

function RouteExplainForm({
  prompt,
  model,
  domain,
  fixtureScenarios,
  selectedFixtureId,
  localBaseUrl,
  localBaseUrlError,
  onPromptChange,
  onModelChange,
  onDomainChange,
  onFixtureChange,
  onFixtureSubmit,
}: RouteExplainFormProps) {
  return (
    <section
      className="panel route-form"
      aria-label="Offline preview route examples"
    >
      <div className="panel-heading">
        <div>
          <h3>Offline preview route example</h3>
          <p className="muted">
            These examples are bundled offline preview fixtures. Aethra does
            not submit prompts, execute route-explain, or append audit events.
          </p>
        </div>
      </div>

      <div className="route-base-url">
        <span>Configured local daemon URL</span>
        <strong>{localBaseUrlError ? "blocked" : localBaseUrl}</strong>
        {localBaseUrlError ? <p className="muted">{localBaseUrlError}</p> : null}
      </div>

      <label className="form-field">
        <span>Fixture excerpt</span>
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          rows={7}
        />
      </label>

      <div className="form-grid">
        <label className="form-field">
          <span>Optional model</span>
          <input
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
            placeholder="ignisprompt/legal"
          />
        </label>
        <label className="form-field">
          <span>Optional domain metadata</span>
          <input
            value={domain}
            onChange={(event) => onDomainChange(event.target.value)}
            placeholder="legal"
          />
        </label>
      </div>

      <label className="form-field">
        <span>Offline preview fixture route example</span>
        <select
          value={selectedFixtureId}
          onChange={(event) => onFixtureChange(event.target.value)}
        >
          {fixtureScenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label} - {scenario.description}
            </option>
          ))}
        </select>
      </label>

      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onFixtureSubmit}
        >
          Show fixture-backed route example
        </button>
      </div>

      <p className="muted">
        Route decisions explain why IgnisPrompt selected a tier and whether
        cloud was considered or allowed. This panel is fixture-only; live
        routing policy metadata is loaded through GET /v1/routing/policy-summary.
      </p>
    </section>
  );
}

type RouteExplainResultProps = {
  result: RouteResultState;
};

function RouteExplainResult({ result }: RouteExplainResultProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const tone = result.errorMessage
    ? "warning"
    : result.response &&
        (result.response.warnings.length > 0 ||
          isWarningRouteDecision(result.response))
      ? "warning"
      : "ok";
  const response = result.response;
  const routeLadder = response ? buildRouteLadder(response) : [];
  const routeStateLegend = buildRouteStateLegend();

  useEffect(() => {
    setCopyStatus("idle");
  }, [response?.request_id]);

  async function copyRouteDecision(responseToCopy: RouteExplainResponse) {
    if (!globalThis.navigator?.clipboard?.writeText) {
      setCopyStatus("error");
      return;
    }

    try {
      await globalThis.navigator.clipboard.writeText(
        buildRouteDecisionCopyText(responseToCopy),
      );
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <aside
      className="panel detail-panel"
      aria-label="Offline preview routing example result"
    >
      <div className="panel-heading">
        <div>
          <h3>Offline preview routing example</h3>
          <p className="muted">
            Fixture-backed route example only. Aethra does not submit prompts
            or execute route-explain.
          </p>
        </div>
        <StatusBadge tone={tone}>{result.label}</StatusBadge>
      </div>

      {result.errorMessage || !response ? (
        <section className="detail-section">
          <EmptyState
            {...(result.errorMessage
              ? {
                  ...localPreviewEmptyStates.routingLiveError,
                  message: result.errorMessage,
                }
              : localPreviewEmptyStates.routingNoResult)}
          />
        </section>
      ) : (
        <>
          <dl className="definition-grid route-result-grid">
            <div>
              <dt>Request ID</dt>
              <dd>{response.request_id}</dd>
            </div>
            <div>
              <dt>Result source</dt>
              <dd>Fixture-backed route example</dd>
            </div>
          </dl>

          <section className="detail-section route-policy-breakdown">
            <div className="panel-heading compact-panel-heading">
              <div>
                <h4>Decision breakdown</h4>
                <p className="muted">
                  Offline preview fixture route signals. Live local policy
                  metadata is read-only and loaded separately.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() => copyRouteDecision(response)}
              >
                Copy decision JSON
              </button>
            </div>
            {copyStatus !== "idle" ? (
              <p
                className={`copy-feedback copy-feedback-${
                  copyStatus === "copied" ? "ok" : "warning"
                }`}
              >
                {copyStatus === "copied"
                  ? "Copied route decision JSON"
                  : "Clipboard unavailable; select the route fields."}
              </p>
            ) : null}
            <dl className="state-list compact-state-list">
              <div>
                <dt>Tier selected</dt>
                <dd>{response.decision.tier}</dd>
              </div>
              <div>
                <dt>Route code</dt>
                <dd>{response.decision.route_code}</dd>
              </div>
              <div>
                <dt>Domain signal</dt>
                <dd>{response.decision.domain}</dd>
              </div>
              <div>
                <dt>Selected model</dt>
                <dd>{response.decision.model_id ?? "none"}</dd>
              </div>
              <div>
                <dt>Cloud considered</dt>
                <dd>{String(response.decision.cloud_considered)}</dd>
              </div>
              <div>
                <dt>Cloud allowed</dt>
                <dd>{String(response.decision.cloud_allowed)}</dd>
              </div>
              <div>
                <dt>Data left device</dt>
                <dd>{String(response.decision.data_left_device)}</dd>
              </div>
              <div>
                <dt>Warnings</dt>
                <dd>{response.warnings.length}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-section">
            <div className="panel-heading compact-panel-heading">
              <div>
                <h4>Route ladder</h4>
                <p className="muted">
                  Candidate routes by tier with conservative local-preview
                  status reasons.
                </p>
              </div>
              <StatusBadge
                tone={response.decision.cloud_allowed ? "warning" : "neutral"}
              >
                {response.decision.cloud_allowed
                  ? "Cloud must not be assumed"
                  : "Cloud disabled by default"}
              </StatusBadge>
            </div>
            <div className="route-ladder">
              {routeLadder.map((item) => (
                <article key={item.id} className="route-ladder-item">
                  <div className="route-ladder-heading">
                    <div>
                      <p className="metric-label">{item.tierLabel}</p>
                      <strong>{item.title}</strong>
                    </div>
                    <StatusBadge
                      tone={
                        item.state === "selected"
                          ? "ok"
                          : item.state === "disabled" ||
                              item.state === "not-implemented"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {formatRouteLadderState(item.state)}
                    </StatusBadge>
                  </div>
                  <p>{item.reason}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h4>Explanation</h4>
            <p className="explanation">{response.explanation}</p>
          </section>

          <section className="detail-section">
            <h4>Warnings</h4>
            {response.warnings.length > 0 ? (
              <ul className="warning-list">
                {response.warnings.map((warning, index) => (
                  <li key={`${response.request_id}-${index}`}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No warnings returned.</p>
            )}
          </section>

          <section className="detail-section">
            <h4>Route state legend</h4>
            <div className="route-state-grid">
              {routeStateLegend.map((item) => (
                <article key={item.id} className="route-state-card">
                  <div className="route-ladder-heading">
                    <strong>{item.title}</strong>
                    <StatusBadge
                      tone={
                        item.state === "selected"
                          ? "ok"
                          : item.state === "disabled" ||
                              item.state === "not-implemented"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      {formatRouteLadderState(item.state)}
                    </StatusBadge>
                  </div>
                  <p>{item.reason}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <p className="muted">
        Route decisions are returned by IgnisPrompt. This screen does not
        classify prompts, execute model inference, validate legal accuracy, or
        certify production policy.
      </p>
    </aside>
  );
}
