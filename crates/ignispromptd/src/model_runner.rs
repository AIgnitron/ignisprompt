use std::sync::Arc;

#[cfg(feature = "gguf-runner-spike")]
use anyhow::{anyhow, bail};
use anyhow::{Context, Result};
#[cfg(feature = "gguf-runner-spike")]
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};
#[cfg(feature = "gguf-runner-spike")]
use uuid::Uuid;

#[cfg(feature = "gguf-runner-spike")]
use crate::legal_json::normalize_legal_json_output;
use crate::legal_json::LegalJsonMetadata;
#[cfg(feature = "gguf-runner-spike")]
use crate::Args;
use crate::{ChatCompletionRequest, ModelManifest, RouteDecision};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub(crate) struct CompletionOutputMetadata {
    pub(crate) runner: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) legal_json: Option<LegalJsonMetadata>,
}

pub(crate) struct ModelRunnerOutput {
    pub(crate) content: String,
    pub(crate) metadata: Option<CompletionOutputMetadata>,
}

pub(crate) struct ModelRunnerContext<'a> {
    #[cfg(feature = "gguf-runner-spike")]
    pub(crate) config: &'a Args,
    pub(crate) request: &'a ChatCompletionRequest,
    pub(crate) decision: &'a RouteDecision,
    #[cfg_attr(not(feature = "gguf-runner-spike"), allow(dead_code))]
    pub(crate) model: Option<&'a ModelManifest>,
}

pub(crate) trait ModelRunner: Send + Sync {
    fn name(&self) -> &'static str;
    fn supports(&self, context: &ModelRunnerContext<'_>) -> bool;
    fn run(&self, context: &ModelRunnerContext<'_>) -> Result<ModelRunnerOutput>;
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
        context: &ModelRunnerContext<'_>,
    ) -> Result<Option<ModelRunnerOutput>> {
        let mut last_error = None;

        for runner in &self.runners {
            if !runner.supports(context) {
                continue;
            }

            match runner
                .run(context)
                .with_context(|| format!("runner '{}' failed", runner.name()))
            {
                Ok(output) => return Ok(Some(output)),
                Err(err) => last_error = Some(err),
            }
        }

        match last_error {
            Some(err) => Err(err),
            None => Ok(None),
        }
    }
}

#[cfg(feature = "gguf-runner-spike")]
#[derive(Debug, Default)]
pub(crate) struct GgufRunner;

#[cfg(feature = "gguf-runner-spike")]
impl GgufRunner {
    const LEGAL_PROMPT_PACK_FILE: &'static str = "legal-contract-review-v0.1.md";

    fn local_model_path(model: &ModelManifest) -> Option<&str> {
        model
            .local_path
            .as_deref()
            .filter(|path| !path.trim().is_empty())
    }

    fn prompt_pack_path(config: &Args) -> PathBuf {
        config.prompt_dir.join(Self::LEGAL_PROMPT_PACK_FILE)
    }

    fn legal_prompt_pack(config: &Args) -> Result<String> {
        let path = Self::prompt_pack_path(config);
        fs::read_to_string(&path)
            .with_context(|| format!("failed to read legal prompt pack {}", path.display()))
    }

    fn render_prompt(context: &ModelRunnerContext<'_>) -> Result<String> {
        let mut sections = Vec::new();

        if context.decision.domain.eq_ignore_ascii_case("legal") {
            let prompt_pack = Self::legal_prompt_pack(context.config)?;
            sections.push(prompt_pack.trim().to_string());
            sections.push(
                "Apply the rules above to the most recent user-provided contract excerpt and respond with one JSON object only."
                    .to_string(),
            );
        }

        sections.push("Conversation:".to_string());
        sections.extend(context.request.messages.iter().map(|message| {
            format!(
                "{}:\n{}",
                message.role.to_ascii_uppercase(),
                message.content.trim()
            )
        }));
        sections.push("ASSISTANT:".to_string());

        Ok(sections.join("\n\n"))
    }

    fn prompt_file_path() -> PathBuf {
        std::env::temp_dir().join(format!("ignisprompt-gguf-prompt-{}.txt", Uuid::new_v4()))
    }

    fn write_prompt_file(prompt: &str) -> Result<PathBuf> {
        let path = Self::prompt_file_path();
        fs::write(&path, prompt)
            .with_context(|| format!("failed to write GGUF prompt file {}", path.display()))?;
        Ok(path)
    }
}

#[cfg(feature = "gguf-runner-spike")]
impl ModelRunner for GgufRunner {
    fn name(&self) -> &'static str {
        "gguf-runner-spike"
    }

    fn supports(&self, context: &ModelRunnerContext<'_>) -> bool {
        let Some(model) = context.model else {
            return false;
        };

        if context.decision.tier != "TIER_3" || context.decision.domain != "legal" {
            return false;
        }

        if !model.format.eq_ignore_ascii_case("gguf") {
            return false;
        }

        let Some(runner_bin) = context.config.gguf_runner_bin.as_ref() else {
            return false;
        };

        let Some(model_path) = Self::local_model_path(model) else {
            return false;
        };

        Path::new(runner_bin).exists() && Path::new(model_path).exists()
    }

    fn run(&self, context: &ModelRunnerContext<'_>) -> Result<ModelRunnerOutput> {
        let runner_bin = context
            .config
            .gguf_runner_bin
            .as_ref()
            .ok_or_else(|| anyhow!("GGUF runner binary is not configured"))?;
        let model = context
            .model
            .ok_or_else(|| anyhow!("no model manifest was selected for the GGUF runner"))?;
        let model_path = Self::local_model_path(model)
            .ok_or_else(|| anyhow!("selected GGUF model manifest does not declare localPath"))?;

        let prompt = Self::render_prompt(context)?;
        let prompt_file = Self::write_prompt_file(&prompt)?;
        let output = Command::new(runner_bin)
            .arg("--model")
            .arg(model_path)
            .arg("--prompt-file")
            .arg(&prompt_file)
            .arg("--max-tokens")
            .arg(context.config.gguf_max_tokens.to_string())
            .output()
            .with_context(|| format!("failed to execute GGUF runner {}", runner_bin.display()));

        let _ = fs::remove_file(&prompt_file);
        let output = output?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            bail!(
                "GGUF runner exited with status {}{}",
                output
                    .status
                    .code()
                    .map(|code| code.to_string())
                    .unwrap_or_else(|| "unknown".to_string()),
                if stderr.is_empty() {
                    "".to_string()
                } else {
                    format!(": {stderr}")
                }
            );
        }

        let raw_model_output = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if raw_model_output.is_empty() {
            bail!("GGUF runner returned empty stdout");
        }

        let normalized = normalize_legal_json_output(&raw_model_output);

        Ok(ModelRunnerOutput {
            content: normalized.content,
            metadata: Some(CompletionOutputMetadata {
                runner: self.name().to_string(),
                legal_json: Some(normalized.metadata),
            }),
        })
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

    fn supports(&self, context: &ModelRunnerContext<'_>) -> bool {
        context.decision.tier == "TIER_3" && context.decision.domain == "legal"
    }

    fn run(&self, context: &ModelRunnerContext<'_>) -> Result<ModelRunnerOutput> {
        let model_id = context
            .decision
            .model_id
            .as_deref()
            .unwrap_or("unknown-legal-model");
        let summary = Self::summarize_request(context.request);

        Ok(ModelRunnerOutput {
            content: format!(
                "StubLegalRunner handled this Tier 3 legal request locally with placeholder model '{}'. The optional GGUF runner path was unavailable for this request. Request summary: {}.",
                model_id, summary
            ),
            metadata: None,
        })
    }
}
