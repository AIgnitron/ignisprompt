use std::collections::HashMap;

use serde::{Deserialize, Serialize};

pub const BASELINE_PROVIDER: &str = "openai";
pub const BASELINE_MODEL: &str = "gpt-4.1-mini";
pub const METHODOLOGY_VERSION: &str = "aethra-impact-0.1";
pub const CONFIDENCE: &str = "low";
pub const DISCLAIMER: &str = "Aethra sustainability values are local-only counterfactual proxy estimates. They are methodology-dependent, not measured energy use, not actual carbon accounting, not ESG certification, and not production compliance evidence.";

// Conservative placeholder coefficients for v0.1. These are configurable
// estimates, not measurements from a provider, hardware meter, or carbon API.
const CLOUD_COST_USD_PER_1K_TOKENS_EST: f64 = 0.0002;
const LOCAL_ENERGY_WH_PER_1K_TOKENS_EST: f64 = 0.01;
const CLOUD_BASELINE_WH_PER_1K_TOKENS_EST: f64 = 0.05;
const GRID_CARBON_GCO2E_PER_KWH_EST: f64 = 400.0;
const BYTES_PER_GB: f64 = 1_073_741_824.0;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SustainabilityEstimate {
    pub input_tokens_est: u64,
    pub output_tokens_est: u64,
    pub baseline_provider: String,
    pub baseline_model: String,
    pub estimated_cloud_cost_usd: f64,
    pub estimated_cloud_cost_avoided_usd: f64,
    pub estimated_local_energy_wh: f64,
    pub estimated_cloud_baseline_wh: f64,
    pub estimated_carbon_avoided_gco2e: f64,
    pub methodology_version: String,
    pub confidence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SustainabilityMetricsResponse {
    pub period: String,
    pub requests_total: u64,
    pub local_request_rate: f64,
    pub tier_breakdown: HashMap<String, u64>,
    pub estimated_cloud_cost_avoided_usd: f64,
    pub estimated_carbon_avoided_kgco2e: f64,
    pub estimated_data_kept_local_gb: f64,
    pub baseline_provider: String,
    pub baseline_model: String,
    pub methodology_version: String,
    pub confidence: String,
    pub disclaimer: String,
}

pub trait SustainabilityAuditEvent {
    fn tier(&self) -> &str;
    fn data_left_device(&self) -> bool;
    fn input_tokens_est(&self) -> Option<u64>;
    fn output_tokens_est(&self) -> Option<u64>;
    fn estimated_cloud_cost_avoided_usd(&self) -> Option<f64>;
    fn estimated_carbon_avoided_gco2e(&self) -> Option<f64>;
}

pub fn estimate_for_text(input_text: &str, output_text: &str) -> SustainabilityEstimate {
    estimate_for_counts(
        token_estimate_from_chars(input_text),
        token_estimate_from_chars(output_text),
    )
}

pub fn estimate_for_counts(
    input_tokens_est: u64,
    output_tokens_est: u64,
) -> SustainabilityEstimate {
    let total_tokens = input_tokens_est.saturating_add(output_tokens_est) as f64;
    let tokens_per_1k = total_tokens / 1_000.0;
    let estimated_cloud_cost_usd = round6(tokens_per_1k * CLOUD_COST_USD_PER_1K_TOKENS_EST);
    let estimated_local_energy_wh = round6(tokens_per_1k * LOCAL_ENERGY_WH_PER_1K_TOKENS_EST);
    let estimated_cloud_baseline_wh = round6(tokens_per_1k * CLOUD_BASELINE_WH_PER_1K_TOKENS_EST);
    let avoided_wh = (estimated_cloud_baseline_wh - estimated_local_energy_wh).max(0.0);
    let estimated_carbon_avoided_gco2e =
        round6((avoided_wh / 1_000.0) * GRID_CARBON_GCO2E_PER_KWH_EST);

    SustainabilityEstimate {
        input_tokens_est,
        output_tokens_est,
        baseline_provider: BASELINE_PROVIDER.to_string(),
        baseline_model: BASELINE_MODEL.to_string(),
        estimated_cloud_cost_usd,
        estimated_cloud_cost_avoided_usd: estimated_cloud_cost_usd,
        estimated_local_energy_wh,
        estimated_cloud_baseline_wh,
        estimated_carbon_avoided_gco2e,
        methodology_version: METHODOLOGY_VERSION.to_string(),
        confidence: CONFIDENCE.to_string(),
    }
}

pub fn token_estimate_from_chars(text: &str) -> u64 {
    let chars = text.chars().count() as u64;
    chars.div_ceil(4)
}

pub fn data_kept_local_gb_from_tokens(input_tokens_est: u64, output_tokens_est: u64) -> f64 {
    let estimated_chars = input_tokens_est
        .saturating_add(output_tokens_est)
        .saturating_mul(4);
    round6(estimated_chars as f64 / BYTES_PER_GB)
}

pub fn summarize_audit_events<T: SustainabilityAuditEvent>(
    period: impl Into<String>,
    events: &[T],
) -> SustainabilityMetricsResponse {
    let mut tier_breakdown = HashMap::new();
    let mut local_requests = 0_u64;
    let mut estimated_cloud_cost_avoided_usd = 0.0;
    let mut estimated_carbon_avoided_gco2e = 0.0;
    let mut estimated_data_kept_local_gb = 0.0;

    for event in events {
        *tier_breakdown.entry(event.tier().to_string()).or_insert(0) += 1;
        if !event.data_left_device() {
            local_requests += 1;
            estimated_cloud_cost_avoided_usd +=
                event.estimated_cloud_cost_avoided_usd().unwrap_or(0.0);
            estimated_carbon_avoided_gco2e += event.estimated_carbon_avoided_gco2e().unwrap_or(0.0);
            estimated_data_kept_local_gb += data_kept_local_gb_from_tokens(
                event.input_tokens_est().unwrap_or(0),
                event.output_tokens_est().unwrap_or(0),
            );
        }
    }

    let requests_total = events.len() as u64;
    let local_request_rate = if requests_total == 0 {
        0.0
    } else {
        round6(local_requests as f64 / requests_total as f64)
    };

    SustainabilityMetricsResponse {
        period: period.into(),
        requests_total,
        local_request_rate,
        tier_breakdown,
        estimated_cloud_cost_avoided_usd: round6(estimated_cloud_cost_avoided_usd),
        estimated_carbon_avoided_kgco2e: round6(estimated_carbon_avoided_gco2e / 1_000.0),
        estimated_data_kept_local_gb: round6(estimated_data_kept_local_gb),
        baseline_provider: BASELINE_PROVIDER.to_string(),
        baseline_model: BASELINE_MODEL.to_string(),
        methodology_version: METHODOLOGY_VERSION.to_string(),
        confidence: CONFIDENCE.to_string(),
        disclaimer: DISCLAIMER.to_string(),
    }
}

fn round6(value: f64) -> f64 {
    (value * 1_000_000.0).round() / 1_000_000.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn token_estimate_falls_back_to_chars_divided_by_four() {
        assert_eq!(token_estimate_from_chars("abcd"), 1);
        assert_eq!(token_estimate_from_chars("abcde"), 2);
    }

    #[test]
    fn methodology_defaults_are_conservative_and_explicit() {
        let estimate = estimate_for_text("Review this contract.", "Local route selected.");

        assert_eq!(estimate.baseline_provider, "openai");
        assert_eq!(estimate.baseline_model, "gpt-4.1-mini");
        assert_eq!(estimate.methodology_version, "aethra-impact-0.1");
        assert_eq!(estimate.confidence, "low");
        assert!(DISCLAIMER.contains("counterfactual proxy estimates"));
        assert!(DISCLAIMER.contains("not actual carbon accounting"));
    }
}
