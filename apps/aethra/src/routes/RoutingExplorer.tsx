import { FormEvent, useMemo, useState } from "react";
import { createIgnisPromptClient } from "../api/client";
import { RouteExplainResponse } from "../api/contracts";
import { routeExplainFixture } from "../fixtures/aethraFixture";
import { StatusBadge } from "../components/StatusBadge";
import {
  buildRouteExplainRequest,
  buildRouteFixtureScenarios,
  describeRouteExplainError,
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

export function RoutingExplorer() {
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
  const [isLiveRequestRunning, setIsLiveRequestRunning] = useState(false);

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
      const client = createIgnisPromptClient();
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
          isLiveRequestRunning={isLiveRequestRunning}
          onPromptChange={setPrompt}
          onModelChange={setModel}
          onDomainChange={setDomain}
          onFixtureChange={setSelectedFixtureId}
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
  isLiveRequestRunning: boolean;
  onPromptChange: (prompt: string) => void;
  onModelChange: (model: string) => void;
  onDomainChange: (domain: string) => void;
  onFixtureChange: (fixtureId: string) => void;
  onFixtureSubmit: () => void;
  onLiveSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function RouteExplainForm({
  prompt,
  model,
  domain,
  fixtureScenarios,
  selectedFixtureId,
  isLiveRequestRunning,
  onPromptChange,
  onModelChange,
  onDomainChange,
  onFixtureChange,
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
          disabled={isLiveRequestRunning}
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
    : result.response && result.response.warnings.length > 0
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
                {response.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
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
