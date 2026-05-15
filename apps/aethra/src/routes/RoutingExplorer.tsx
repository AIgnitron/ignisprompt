import { FormEvent, useMemo, useState } from "react";
import { createIgnisPromptClient } from "../api/client";
import { RouteExplainResponse } from "../api/contracts";
import { routeExplainFixture } from "../fixtures/aethraFixture";
import { StatusBadge } from "../components/StatusBadge";
import {
  buildRouteExplainRequest,
  buildRouteFixtureScenarios,
  describeRouteExplainError,
  isWarningRouteDecision,
  sampleRoutePrompt,
  validateRoutePrompt,
} from "./routeExplainSummary";

type RouteResultState =
  {
    source: "fixture" | "live";
    label: string;
    response?: RouteExplainResponse;
    errorMessage?: string;
  };

type RoutingExplorerProps = {
  localBaseUrl: string;
  localBaseUrlError?: string;
};

export function RoutingExplorer({
  localBaseUrl,
  localBaseUrlError,
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
  const [isLiveRequestConfirmed, setIsLiveRequestConfirmed] = useState(false);
  const [isLiveRequestRunning, setIsLiveRequestRunning] = useState(false);

  function updatePrompt(nextPrompt: string) {
    setPrompt(nextPrompt);
    setIsLiveRequestConfirmed(false);
  }

  function updateModel(nextModel: string) {
    setModel(nextModel);
    setIsLiveRequestConfirmed(false);
  }

  function updateDomain(nextDomain: string) {
    setDomain(nextDomain);
    setIsLiveRequestConfirmed(false);
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

  async function runLiveRouteExplain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (localBaseUrlError) {
      setResult({
        source: "live",
        label: "Local URL blocked",
        errorMessage: localBaseUrlError,
      });
      return;
    }

    if (!isLiveRequestConfirmed) {
      setResult({
        source: "live",
        label: "Confirmation required",
        errorMessage:
          "Confirm that this local route-explain request may append a local audit event before running it.",
      });
      return;
    }

    const validationError = validateRoutePrompt(prompt);
    if (validationError) {
      setResult({
        source: "live",
        label: "Preflight rejection",
        errorMessage: validationError,
      });
      return;
    }

    setIsLiveRequestRunning(true);
    try {
      const client = createIgnisPromptClient({ baseUrl: localBaseUrl });
      const response = await client.routeExplain(
        buildRouteExplainRequest(prompt, model, domain),
      );
      setResult({
        source: "live",
        label: "Live local route explanation",
        response,
      });
    } catch (error) {
      setResult({
        source: "live",
        label: "Live local route explanation failed",
        errorMessage: describeRouteExplainError(error),
      });
    } finally {
      setIsLiveRequestRunning(false);
      setIsLiveRequestConfirmed(false);
    }
  }

  return (
    <section id="routing-explorer" className="page-section">
      <header className="page-header">
        <div>
          <p className="eyebrow">Routing Explorer</p>
          <h2>Route inspection only</h2>
        </div>
        <div className="status-strip" aria-label="Routing Explorer status">
          <StatusBadge tone="neutral">Fixture default</StatusBadge>
          <StatusBadge tone="warning">Explicit live action</StatusBadge>
          <StatusBadge tone="neutral">Read-only</StatusBadge>
        </div>
      </header>

      <div className="routing-layout">
        <RouteExplainForm
          prompt={prompt}
          model={model}
          domain={domain}
          fixtureScenarios={fixtureScenarios}
          selectedFixtureId={selectedFixtureId}
          localBaseUrl={localBaseUrl}
          localBaseUrlError={localBaseUrlError}
          isLiveRequestConfirmed={isLiveRequestConfirmed}
          isLiveRequestRunning={isLiveRequestRunning}
          onPromptChange={updatePrompt}
          onModelChange={updateModel}
          onDomainChange={updateDomain}
          onFixtureChange={setSelectedFixtureId}
          onLiveRequestConfirmationChange={setIsLiveRequestConfirmed}
          onFixtureSubmit={showFixtureResult}
          onLiveSubmit={runLiveRouteExplain}
        />
        <RouteExplainResult result={result} />
      </div>
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
  isLiveRequestConfirmed: boolean;
  isLiveRequestRunning: boolean;
  onPromptChange: (prompt: string) => void;
  onModelChange: (model: string) => void;
  onDomainChange: (domain: string) => void;
  onFixtureChange: (fixtureId: string) => void;
  onLiveRequestConfirmationChange: (isConfirmed: boolean) => void;
  onFixtureSubmit: () => void;
  onLiveSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function RouteExplainForm({
  prompt,
  model,
  domain,
  fixtureScenarios,
  selectedFixtureId,
  localBaseUrl,
  localBaseUrlError,
  isLiveRequestConfirmed,
  isLiveRequestRunning,
  onPromptChange,
  onModelChange,
  onDomainChange,
  onFixtureChange,
  onLiveRequestConfirmationChange,
  onFixtureSubmit,
  onLiveSubmit,
}: RouteExplainFormProps) {
  return (
    <form className="panel route-form" onSubmit={onLiveSubmit}>
      <div className="panel-heading">
        <div>
          <h3>Route request</h3>
          <p className="muted">
            Use synthetic or non-sensitive text. This is not legal advice.
          </p>
        </div>
      </div>

      <div className="route-base-url">
        <span>Local route-explain URL</span>
        <strong>{localBaseUrlError ? "blocked" : localBaseUrl}</strong>
        {localBaseUrlError ? <p className="muted">{localBaseUrlError}</p> : null}
      </div>

      <label className="form-field">
        <span>Prompt or excerpt</span>
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
        <span>Fixture result mode</span>
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

      <label className="route-confirmation">
        <input
          type="checkbox"
          checked={isLiveRequestConfirmed}
          onChange={(event) =>
            onLiveRequestConfirmationChange(event.target.checked)
          }
          disabled={Boolean(localBaseUrlError) || isLiveRequestRunning}
        />
        <span>
          I understand this request stays local to the configured daemon, appends
          a local audit event, and should use only synthetic or non-sensitive
          text. Aethra will display the result, but IgnisPrompt owns the routing
          decision.
        </span>
      </label>

      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onFixtureSubmit}
        >
          Show fixture route explanation
        </button>
        <button
          type="submit"
          className="primary-button"
          disabled={
            isLiveRequestRunning ||
            Boolean(localBaseUrlError) ||
            !isLiveRequestConfirmed
          }
        >
          {isLiveRequestRunning
            ? "Running local route explanation"
            : "Run local route explanation"}
        </button>
      </div>

      <p className="muted">
        A live route-explain request is local, but it creates a local audit
        event. Aethra does not own routing logic; IgnisPrompt returns the
        decision.
      </p>
    </form>
  );
}

type RouteExplainResultProps = {
  result: RouteResultState;
};

function RouteExplainResult({ result }: RouteExplainResultProps) {
  const tone = result.errorMessage
    ? "warning"
    : result.response &&
        (result.response.warnings.length > 0 ||
          isWarningRouteDecision(result.response))
      ? "warning"
      : "ok";
  const response = result.response;

  return (
    <aside className="panel detail-panel" aria-label="Route explanation result">
      <div className="panel-heading">
        <div>
          <h3>Route result</h3>
          <p className="muted">
            {result.source === "live"
              ? "Live local response"
              : "Synthetic fixture"}
          </p>
        </div>
        <StatusBadge tone={tone}>{result.label}</StatusBadge>
      </div>

      {result.errorMessage || !response ? (
        <section className="detail-section">
          <h4>Route inspection did not run</h4>
          <p className="explanation">
            {result.errorMessage ?? "No route explanation is selected."}
          </p>
        </section>
      ) : (
        <>
          <dl className="definition-grid route-result-grid">
            <div>
              <dt>Request ID</dt>
              <dd>{response.request_id}</dd>
            </div>
            <div>
              <dt>Tier</dt>
              <dd>{response.decision.tier}</dd>
            </div>
            <div>
              <dt>Route code</dt>
              <dd>{response.decision.route_code}</dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{response.decision.domain}</dd>
            </div>
            <div>
              <dt>Model</dt>
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
          </dl>

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
        </>
      )}

      <p className="muted">
        Route decisions are returned by IgnisPrompt. This screen does not
        classify prompts, execute model inference, or validate legal accuracy.
      </p>
    </aside>
  );
}
