use std::sync::Arc;

use anyhow::{Context, Result};

use crate::{ChatCompletionRequest, RouteDecision};

pub(crate) struct ModelRunnerOutput {
    pub(crate) content: String,
}

pub(crate) trait ModelRunner: Send + Sync {
    fn name(&self) -> &'static str;
    fn supports(&self, request: &ChatCompletionRequest, decision: &RouteDecision) -> bool;
    fn run(
        &self,
        request: &ChatCompletionRequest,
        decision: &RouteDecision,
    ) -> Result<ModelRunnerOutput>;
}

#[derive(Clone, Default)]
pub(crate) struct ModelRunnerAdapter {
    runners: Vec<Arc<dyn ModelRunner>>,
}

impl ModelRunnerAdapter {
    pub(crate) fn new(runners: Vec<Arc<dyn ModelRunner>>) -> Self {
        Self { runners }
    }

    pub(crate) fn generate(
        &self,
        request: &ChatCompletionRequest,
        decision: &RouteDecision,
    ) -> Result<Option<ModelRunnerOutput>> {
        if let Some(runner) = self
            .runners
            .iter()
            .find(|runner| runner.supports(request, decision))
        {
            return runner
                .run(request, decision)
                .with_context(|| format!("runner '{}' failed", runner.name()))
                .map(Some);
        }

        Ok(None)
    }
}

#[derive(Debug, Default)]
pub(crate) struct StubLegalRunner;

impl StubLegalRunner {
    fn summarize_request(request: &ChatCompletionRequest) -> String {
        let text = request
            .messages
            .iter()
            .rev()
            .find_map(|message| {
                let trimmed = message.content.trim();
                (!trimmed.is_empty()).then_some(trimmed)
            })
            .unwrap_or("No non-empty prompt text was provided.");

        let summary: String = text.chars().take(160).collect();
        if text.chars().count() > 160 {
            format!("{summary}...")
        } else {
            summary
        }
    }
}

impl ModelRunner for StubLegalRunner {
    fn name(&self) -> &'static str {
        "stub-legal-runner"
    }

    fn supports(&self, _request: &ChatCompletionRequest, decision: &RouteDecision) -> bool {
        decision.tier == "TIER_3" && decision.domain == "legal"
    }

    fn run(
        &self,
        request: &ChatCompletionRequest,
        decision: &RouteDecision,
    ) -> Result<ModelRunnerOutput> {
        let model_id = decision
            .model_id
            .as_deref()
            .unwrap_or("unknown-legal-model");
        let summary = Self::summarize_request(request);

        Ok(ModelRunnerOutput {
            content: format!(
                "StubLegalRunner handled this Tier 3 legal request locally with placeholder model '{}'. Request summary: {}. Real GGUF/ONNX inference is not wired yet.",
                model_id, summary
            ),
        })
    }
}
