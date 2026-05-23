use clap::{Parser, Subcommand};
use serde_json::{json, Value};
use std::fs;
use std::process;

#[derive(Parser)]
#[command(
    name = "ignispromptctl",
    about = "CLI for inspecting a running ignispromptd daemon",
    version
)]
struct Cli {
    /// Daemon base URL
    #[arg(long, default_value = "http://127.0.0.1:8765", global = true)]
    daemon_url: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Check local daemon readiness for local preview
    Doctor {
        /// Print structured JSON diagnostics
        #[arg(long)]
        json: bool,
    },
    /// Check daemon health
    Health,
    /// Print daemon version and local preview status
    StatusVersion,
    /// Print local sustainability metrics summary
    Sustainability {
        /// Metrics period: 7d, 30d, or 90d
        #[arg(long, default_value = "30d")]
        period: String,
        /// Print raw JSON response instead of a terminal summary
        #[arg(long)]
        json: bool,
    },
    /// List available model manifests
    Models,
    /// Explain routing for a request file
    RouteExplain {
        /// Path to JSON request file
        #[arg(long)]
        file: String,
    },
    /// Inspect audit events
    Audit {
        #[command(subcommand)]
        sub: AuditCommands,
    },
}

#[derive(Subcommand)]
enum AuditCommands {
    /// Print the last 10 audit events
    Tail,
}

fn parse_response(resp: ureq::Response) -> Value {
    let text = resp.into_string().unwrap_or_default();
    serde_json::from_str(&text).unwrap_or(Value::Null)
}

fn main() {
    let cli = Cli::parse();
    match &cli.command {
        Commands::Doctor { json } => cmd_doctor(&cli.daemon_url, *json),
        Commands::Health => cmd_health(&cli.daemon_url),
        Commands::StatusVersion => cmd_status_version(&cli.daemon_url),
        Commands::Sustainability { period, json } => {
            cmd_sustainability(&cli.daemon_url, period, *json)
        }
        Commands::Models => cmd_models(&cli.daemon_url),
        Commands::RouteExplain { file } => cmd_route_explain(&cli.daemon_url, file),
        Commands::Audit { sub } => match sub {
            AuditCommands::Tail => cmd_audit_tail(&cli.daemon_url),
        },
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DoctorCheckLevel {
    Required,
    Informational,
}

impl DoctorCheckLevel {
    fn as_str(self) -> &'static str {
        match self {
            DoctorCheckLevel::Required => "required",
            DoctorCheckLevel::Informational => "informational",
        }
    }
}

#[derive(Clone, Copy, Debug)]
struct DoctorCheckSpec {
    id: &'static str,
    label: &'static str,
    path: &'static str,
    level: DoctorCheckLevel,
    validate: fn(&Value) -> Result<String, String>,
}

#[derive(Clone, Debug)]
struct DoctorCheckResult {
    id: &'static str,
    label: &'static str,
    level: DoctorCheckLevel,
    endpoint: String,
    ok: bool,
    summary: String,
    error: Option<String>,
}

#[derive(Clone, Debug)]
struct DoctorReport {
    base_url: String,
    checks: Vec<DoctorCheckResult>,
}

const DOCTOR_CHECKS: &[DoctorCheckSpec] = &[
    DoctorCheckSpec {
        id: "health",
        label: "health",
        path: "/health",
        level: DoctorCheckLevel::Required,
        validate: validate_doctor_health,
    },
    DoctorCheckSpec {
        id: "version_status",
        label: "version status",
        path: "/v1/status/version",
        level: DoctorCheckLevel::Required,
        validate: validate_doctor_version_status,
    },
    DoctorCheckSpec {
        id: "models",
        label: "models",
        path: "/v1/models",
        level: DoctorCheckLevel::Required,
        validate: validate_doctor_models,
    },
    DoctorCheckSpec {
        id: "model_status_hints",
        label: "model and runner status hints",
        path: "/v1/status/models",
        level: DoctorCheckLevel::Required,
        validate: validate_doctor_model_status_hints,
    },
    DoctorCheckSpec {
        id: "sustainability_metrics",
        label: "sustainability metrics",
        path: "/v1/metrics/sustainability?period=30d",
        level: DoctorCheckLevel::Informational,
        validate: validate_doctor_sustainability_metrics,
    },
];

fn cmd_doctor(base_url: &str, json_output: bool) {
    let report = build_doctor_report(base_url);
    let is_ready = report.required_checks_passed();

    if json_output {
        println!("{}", format_doctor_json(&report));
    } else {
        println!("{}", format_doctor_summary(&report));
    }

    if !is_ready {
        process::exit(1);
    }
}

fn build_doctor_report(base_url: &str) -> DoctorReport {
    DoctorReport {
        base_url: base_url.trim_end_matches('/').to_string(),
        checks: DOCTOR_CHECKS
            .iter()
            .map(|spec| run_doctor_check(base_url, spec))
            .collect(),
    }
}

fn run_doctor_check(base_url: &str, spec: &DoctorCheckSpec) -> DoctorCheckResult {
    let endpoint = doctor_endpoint_url(base_url, spec.path);

    match ureq::get(&endpoint).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            match (spec.validate)(&body) {
                Ok(summary) => DoctorCheckResult {
                    id: spec.id,
                    label: spec.label,
                    level: spec.level,
                    endpoint,
                    ok: true,
                    summary,
                    error: None,
                },
                Err(message) => DoctorCheckResult {
                    id: spec.id,
                    label: spec.label,
                    level: spec.level,
                    endpoint,
                    ok: false,
                    summary: "invalid response shape".to_string(),
                    error: Some(message),
                },
            }
        }
        Err(ureq::Error::Status(status, resp)) => {
            let body = parse_response(resp);
            let daemon_message = body.get("error").and_then(|v| v.as_str());
            DoctorCheckResult {
                id: spec.id,
                label: spec.label,
                level: spec.level,
                endpoint,
                ok: false,
                summary: format!("HTTP {}", status),
                error: Some(
                    daemon_message
                        .map(|message| format!("endpoint returned HTTP {}: {}", status, message))
                        .unwrap_or_else(|| format!("endpoint returned HTTP {}", status)),
                ),
            }
        }
        Err(error) => DoctorCheckResult {
            id: spec.id,
            label: spec.label,
            level: spec.level,
            endpoint,
            ok: false,
            summary: "daemon unreachable".to_string(),
            error: Some(format!("daemon unreachable: {}", error)),
        },
    }
}

fn doctor_endpoint_url(base_url: &str, path: &str) -> String {
    format!("{}{}", base_url.trim_end_matches('/'), path)
}

impl DoctorReport {
    fn required_checks_passed(&self) -> bool {
        self.checks
            .iter()
            .filter(|check| check.level == DoctorCheckLevel::Required)
            .all(|check| check.ok)
    }

    fn next_steps(&self) -> Vec<String> {
        if self.required_checks_passed() {
            return Vec::new();
        }

        vec![
            "start the daemon with ./scripts/start-dev.sh".to_string(),
            format!("{}/health", self.base_url),
            "run ./scripts/smoke.sh after the daemon starts".to_string(),
        ]
    }
}

fn format_doctor_summary(report: &DoctorReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Doctor".to_string(),
        format!("Base URL: {}", report.base_url),
        "".to_string(),
    ];

    let required_checks = report
        .checks
        .iter()
        .filter(|check| check.level == DoctorCheckLevel::Required)
        .collect::<Vec<_>>();
    if !required_checks.is_empty() {
        lines.push("Required checks:".to_string());
        for check in required_checks {
            lines.push(format_doctor_check_line(check));
        }
        lines.push("".to_string());
    }

    let informational_checks = report
        .checks
        .iter()
        .filter(|check| check.level == DoctorCheckLevel::Informational)
        .collect::<Vec<_>>();
    if !informational_checks.is_empty() {
        lines.push("Informational checks:".to_string());
        for check in informational_checks {
            lines.push(format_doctor_check_line(check));
        }
        lines.push("".to_string());
    }

    lines.push("Result:".to_string());
    if report.required_checks_passed() {
        lines.push("✓ Local preview daemon appears ready.".to_string());
    } else {
        lines.push("✗ Required local preview checks failed.".to_string());
        lines.push("".to_string());
        lines.push("Next steps:".to_string());
        for step in report.next_steps() {
            if step.starts_with("http") {
                lines.push(format!("- check {}", step));
            } else {
                lines.push(format!("- {}", step));
            }
        }
    }

    lines.join("\n")
}

fn format_doctor_check_line(check: &DoctorCheckResult) -> String {
    if check.ok {
        format!("✓ {}: {}", check.label, check.summary)
    } else {
        format!(
            "✗ {}: {}",
            check.label,
            check.error.as_deref().unwrap_or(&check.summary)
        )
    }
}

fn format_doctor_json(report: &DoctorReport) -> String {
    let checks = report
        .checks
        .iter()
        .map(|check| {
            json!({
                "id": check.id,
                "label": check.label,
                "level": check.level.as_str(),
                "endpoint": check.endpoint,
                "status": if check.ok { "ok" } else { "failed" },
                "summary": check.summary,
                "error": check.error,
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "base_url": report.base_url,
        "overall_status": if report.required_checks_passed() { "ready" } else { "failed" },
        "checks": checks,
        "next_steps": report.next_steps(),
    }))
    .unwrap_or_default()
}

fn validate_doctor_health(body: &Value) -> Result<String, String> {
    let status = required_string(body, "status")?;
    required_string(body, "service")?;
    required_string(body, "version")?;
    required_bool(body, "local_only")?;

    if status == "ok" {
        Ok("ok".to_string())
    } else {
        Err(format!("health status is '{}'", status))
    }
}

fn validate_doctor_version_status(body: &Value) -> Result<String, String> {
    required_string(body, "service")?;
    let version = required_string(body, "version")?;
    let release_channel = required_string(body, "release_channel")?;
    let local_only = required_bool(body, "local_only")?;

    if release_channel != "local-preview" {
        return Err(format!(
            "release_channel is '{}', expected local-preview",
            release_channel
        ));
    }

    if !local_only {
        return Err("local_only is false".to_string());
    }

    Ok(format!("{} / {}", release_channel, version))
}

fn validate_doctor_models(body: &Value) -> Result<String, String> {
    let models = required_array(body, "models")?;
    Ok(format!(
        "{} {} listed",
        models.len(),
        if models.len() == 1 { "model" } else { "models" }
    ))
}

fn validate_doctor_model_status_hints(body: &Value) -> Result<String, String> {
    required_string(body, "schemaVersion")?;
    required_string(body, "generatedAt")?;
    required_string(body, "source")?;
    let hints = required_array(body, "statusHints")?;

    for hint in hints {
        required_string(hint, "modelId")?;
        required_bool(hint, "configured")?;
        required_bool(hint, "localPathDeclared")?;
        required_bool(hint, "localPathExists")?;
        required_bool(hint, "runnerConfigured")?;
        required_string(hint, "runnerKind")?;
        required_bool(hint, "runnerExecutableExists")?;
        required_string(hint, "availability")?;
        required_array(hint, "warnings")?;
    }

    Ok(format!(
        "available ({} {}; status hints only)",
        hints.len(),
        if hints.len() == 1 { "hint" } else { "hints" }
    ))
}

fn validate_doctor_sustainability_metrics(body: &Value) -> Result<String, String> {
    if !is_sustainability_metrics_response(body) {
        return Err("missing required sustainability metrics fields".to_string());
    }

    Ok(format!(
        "methodology {}, confidence {}",
        body.get("methodology_version")
            .and_then(|v| v.as_str())
            .unwrap_or("-"),
        body.get("confidence")
            .and_then(|v| v.as_str())
            .unwrap_or("-")
    ))
}

fn required_string<'a>(body: &'a Value, field: &str) -> Result<&'a str, String> {
    body.get(field)
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("missing required string field '{}'", field))
}

fn required_bool(body: &Value, field: &str) -> Result<bool, String> {
    body.get(field)
        .and_then(|v| v.as_bool())
        .ok_or_else(|| format!("missing required boolean field '{}'", field))
}

fn required_array<'a>(body: &'a Value, field: &str) -> Result<&'a Vec<Value>, String> {
    body.get(field)
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("missing required array field '{}'", field))
}

fn sustainability_url(base_url: &str, period: &str) -> String {
    format!("{}/v1/metrics/sustainability?period={}", base_url, period)
}

fn validate_sustainability_period(period: &str) -> Result<(), String> {
    match period {
        "7d" | "30d" | "90d" => Ok(()),
        _ => Err(format!(
            "unsupported sustainability period '{}'; supported values are 7d, 30d, and 90d",
            period
        )),
    }
}

fn cmd_sustainability(base_url: &str, period: &str, json_output: bool) {
    if let Err(message) = validate_sustainability_period(period) {
        eprintln!("error: {}", message);
        process::exit(1);
    }

    let url = sustainability_url(base_url, period);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            if !is_sustainability_metrics_response(&body) {
                eprintln!(
                    "error: invalid sustainability metrics response from {}",
                    url
                );
                process::exit(1);
            }

            if json_output {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&body).unwrap_or_default()
                );
            } else {
                println!("{}", format_sustainability_summary(&body));
            }
        }
        Err(ureq::Error::Status(status, resp)) => {
            let body = parse_response(resp);
            eprintln!("error: sustainability endpoint returned HTTP {}", status);
            if let Some(message) = body.get("error").and_then(|v| v.as_str()) {
                eprintln!("daemon error: {}", message);
            }
            eprintln!("endpoint: {}", url);
            process::exit(1);
        }
        Err(e) => {
            eprintln!("error: daemon not reachable — {}", e);
            eprintln!("confirm the daemon is running with ./scripts/start-dev.sh");
            eprintln!("endpoint: {}", url);
            process::exit(1);
        }
    }
}

fn is_sustainability_metrics_response(value: &Value) -> bool {
    value.get("period").and_then(|v| v.as_str()).is_some()
        && value
            .get("requests_total")
            .and_then(|v| v.as_u64())
            .is_some()
        && value
            .get("local_request_rate")
            .and_then(|v| v.as_f64())
            .is_some()
        && value
            .get("tier_breakdown")
            .and_then(|v| v.as_object())
            .is_some()
        && value
            .get("estimated_cloud_cost_avoided_usd")
            .and_then(|v| v.as_f64())
            .is_some()
        && value
            .get("estimated_carbon_avoided_kgco2e")
            .and_then(|v| v.as_f64())
            .is_some()
        && value
            .get("estimated_data_kept_local_gb")
            .and_then(|v| v.as_f64())
            .is_some()
        && value
            .get("methodology_version")
            .and_then(|v| v.as_str())
            .is_some()
        && value.get("confidence").and_then(|v| v.as_str()).is_some()
        && value.get("disclaimer").and_then(|v| v.as_str()).is_some()
}

fn format_sustainability_summary(body: &Value) -> String {
    let mut lines = vec![
        "Aethra Sustainability Summary".to_string(),
        format!(
            "Period: {}",
            body.get("period").and_then(|v| v.as_str()).unwrap_or("-")
        ),
        format!(
            "Requests total: {}",
            body.get("requests_total")
                .and_then(|v| v.as_u64())
                .map(|v| v.to_string())
                .unwrap_or_else(|| "-".to_string())
        ),
        format!(
            "Local request rate: {}",
            body.get("local_request_rate")
                .and_then(|v| v.as_f64())
                .map(format_rate)
                .unwrap_or_else(|| "-".to_string())
        ),
        format!(
            "Estimated cloud cost avoided: {}",
            body.get("estimated_cloud_cost_avoided_usd")
                .and_then(|v| v.as_f64())
                .map(format_usd)
                .unwrap_or_else(|| "-".to_string())
        ),
        format!(
            "Estimated CO₂e avoided: {}",
            body.get("estimated_carbon_avoided_kgco2e")
                .and_then(|v| v.as_f64())
                .map(format_kgco2e)
                .unwrap_or_else(|| "-".to_string())
        ),
        format!(
            "Estimated data kept local: {}",
            body.get("estimated_data_kept_local_gb")
                .and_then(|v| v.as_f64())
                .map(format_gb)
                .unwrap_or_else(|| "-".to_string())
        ),
        format!(
            "Methodology: {}",
            body.get("methodology_version")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ),
        format!(
            "Confidence: {}",
            body.get("confidence")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ),
        "".to_string(),
        "Disclaimer:".to_string(),
        body.get("disclaimer")
            .and_then(|v| v.as_str())
            .unwrap_or("-")
            .to_string(),
        "".to_string(),
        "Tier breakdown:".to_string(),
    ];

    if let Some(tiers) = body.get("tier_breakdown").and_then(|v| v.as_object()) {
        if tiers.is_empty() {
            lines.push("- none: 0".to_string());
        } else {
            let mut entries = tiers.iter().collect::<Vec<_>>();
            entries.sort_by(|(left, _), (right, _)| left.cmp(right));
            for (tier, count) in entries {
                lines.push(format!(
                    "- {}: {}",
                    tier,
                    count
                        .as_u64()
                        .map(|v| v.to_string())
                        .unwrap_or_else(|| "-".to_string())
                ));
            }
        }
    }

    lines.join("\n")
}

fn format_rate(value: f64) -> String {
    format!("{:.0}%", value * 100.0)
}

fn format_usd(value: f64) -> String {
    format!("${:.6}", value)
}

fn format_kgco2e(value: f64) -> String {
    format!("{:.6} kgCO2e", value)
}

fn format_gb(value: f64) -> String {
    format!("{:.6} GB", value)
}

fn cmd_health(base_url: &str) {
    let url = format!("{}/health", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            println!(
                "status:  {}",
                body.get("status").and_then(|v| v.as_str()).unwrap_or("ok")
            );
            println!(
                "version: {}",
                body.get("version").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "service: {}",
                body.get("service").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "local_only: {}",
                body.get("local_only")
                    .and_then(|v| v.as_bool())
                    .map(|b| if b { "true" } else { "false" })
                    .unwrap_or("-")
            );
        }
        Err(e) => {
            eprintln!("error: daemon not reachable — {}", e);
            process::exit(1);
        }
    }
}

fn cmd_status_version(base_url: &str) {
    let url = format!("{}/v1/status/version", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            println!(
                "service:         {}",
                body.get("service").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "version:         {}",
                body.get("version").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "release_channel: {}",
                body.get("release_channel")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            println!(
                "local_only:      {}",
                body.get("local_only")
                    .and_then(|v| v.as_bool())
                    .map(|b| if b { "true" } else { "false" })
                    .unwrap_or("-")
            );
            println!(
                "build_profile:   {}",
                body.get("build_profile")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            println!(
                "git_commit:      {}",
                body.get("git_commit")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            if let Some(warnings) = body.get("warnings").and_then(|v| v.as_array()) {
                for warning in warnings {
                    if let Some(message) = warning.as_str() {
                        println!("warning:         {}", message);
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

fn cmd_models(base_url: &str) {
    // Daemon returns ModelRegistry: { models: [{ modelId, displayName, tier, domains, ... }] }
    let url = format!("{}/v1/models", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            if let Some(models) = body.get("models").and_then(|d| d.as_array()) {
                if models.is_empty() {
                    println!("no models found");
                    return;
                }
                for m in models {
                    println!("{}", format_model_manifest_line(m));
                }
            } else {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&body).unwrap_or_default()
                );
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

fn format_model_manifest_line(model: &Value) -> String {
    let id = string_field(model, &["modelId", "model_id"]).unwrap_or("unknown");
    let tier = model
        .get("tier")
        .and_then(|v| v.as_u64())
        .map(|t| format!("TIER_{}", t))
        .unwrap_or_else(|| "-".to_string());
    let domains = model
        .get("domains")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|d| d.as_str())
                .collect::<Vec<_>>()
                .join(",")
        })
        .unwrap_or_else(|| "-".to_string());
    let installed = model
        .get("installed")
        .and_then(|v| v.as_bool())
        .map(|b| if b { "installed" } else { "missing" })
        .unwrap_or("-");

    format!("{:<45} {}  domains={}  {}", id, tier, domains, installed)
}

fn string_field<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a str> {
    keys.iter()
        .find_map(|key| value.get(*key).and_then(|v| v.as_str()))
}

fn cmd_route_explain(base_url: &str, file: &str) {
    let body = match fs::read_to_string(file) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("error reading file {}: {}", file, e);
            process::exit(1);
        }
    };
    // Daemon returns RouteExplainResponse:
    // { request_id, decision: { tier, route_code, domain, model_id,
    //   cloud_considered, cloud_allowed, data_left_device }, explanation, warnings }
    let url = format!("{}/v1/route/explain", base_url);
    match ureq::post(&url)
        .set("content-type", "application/json")
        .send_string(&body)
    {
        Ok(resp) => {
            let data = parse_response(resp);
            let decision = data.get("decision").cloned().unwrap_or(Value::Null);
            println!(
                "tier:               {}",
                decision.get("tier").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "route_code:         {}",
                decision
                    .get("route_code")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            println!(
                "domain:             {}",
                decision
                    .get("domain")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            println!(
                "model_id:           {}",
                decision
                    .get("model_id")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            println!(
                "data_left_device:   {}",
                decision
                    .get("data_left_device")
                    .and_then(|v| v.as_bool())
                    .map(|b| if b { "true" } else { "false" })
                    .unwrap_or("-")
            );
            println!(
                "cloud_considered:   {}",
                decision
                    .get("cloud_considered")
                    .and_then(|v| v.as_bool())
                    .map(|b| if b { "true" } else { "false" })
                    .unwrap_or("-")
            );
            println!(
                "explanation:        {}",
                data.get("explanation")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
            if let Some(warnings) = data.get("warnings").and_then(|v| v.as_array()) {
                for w in warnings {
                    if let Some(s) = w.as_str() {
                        println!("warning:            {}", s);
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

fn cmd_audit_tail(base_url: &str) {
    let url = format!("{}/v1/audit/events", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let data = parse_response(resp);
            if let Some(events) = data.as_array() {
                let start = if events.len() > 10 {
                    events.len() - 10
                } else {
                    0
                };
                for event in &events[start..] {
                    let ts = event
                        .get("timestamp")
                        .and_then(|v| v.as_str())
                        .unwrap_or("-");
                    let et = event
                        .get("event_type")
                        .and_then(|v| v.as_str())
                        .unwrap_or("-");
                    let rc = event
                        .get("route_code")
                        .and_then(|v| v.as_str())
                        .unwrap_or("-");
                    let tier = event.get("tier").and_then(|v| v.as_str()).unwrap_or("-");
                    println!("[{}] {} {} {}", ts, et, rc, tier);
                }
            } else {
                println!("no audit events found");
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        doctor_endpoint_url, format_doctor_json, format_doctor_summary, format_model_manifest_line,
        format_sustainability_summary, is_sustainability_metrics_response, string_field,
        sustainability_url, validate_doctor_health, validate_doctor_model_status_hints,
        validate_doctor_models, validate_doctor_sustainability_metrics,
        validate_doctor_version_status, validate_sustainability_period, DoctorCheckLevel,
        DoctorCheckResult, DoctorReport, DOCTOR_CHECKS,
    };
    use serde_json::json;

    #[test]
    fn health_url_format() {
        let url = format!("{}/health", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/health");
    }

    #[test]
    fn doctor_url_format_trims_trailing_slashes() {
        let url = doctor_endpoint_url("http://127.0.0.1:8765/", "/health");
        assert_eq!(url, "http://127.0.0.1:8765/health");
    }

    #[test]
    fn doctor_check_list_covers_required_local_preview_endpoints() {
        let endpoints = DOCTOR_CHECKS
            .iter()
            .map(|check| (check.path, check.level))
            .collect::<Vec<_>>();

        assert!(endpoints.contains(&("/health", DoctorCheckLevel::Required)));
        assert!(endpoints.contains(&("/v1/status/version", DoctorCheckLevel::Required)));
        assert!(endpoints.contains(&("/v1/models", DoctorCheckLevel::Required)));
        assert!(endpoints.contains(&("/v1/status/models", DoctorCheckLevel::Required)));
        assert!(endpoints.contains(&(
            "/v1/metrics/sustainability?period=30d",
            DoctorCheckLevel::Informational
        )));
    }

    #[test]
    fn models_url_format() {
        let url = format!("{}/v1/models", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/models");
    }

    #[test]
    fn status_version_url_format() {
        let url = format!("{}/v1/status/version", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/status/version");
    }

    #[test]
    fn route_explain_url_format() {
        let url = format!("{}/v1/route/explain", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/route/explain");
    }

    #[test]
    fn audit_tail_url_format() {
        let url = format!("{}/v1/audit/events", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/audit/events");
    }

    #[test]
    fn sustainability_default_url_uses_30d() {
        let url = sustainability_url("http://127.0.0.1:8765", "30d");
        assert_eq!(
            url,
            "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d"
        );
    }

    #[test]
    fn sustainability_custom_period_url_uses_selected_period() {
        let url = sustainability_url("http://127.0.0.1:8765", "7d");
        assert_eq!(
            url,
            "http://127.0.0.1:8765/v1/metrics/sustainability?period=7d"
        );
    }

    #[test]
    fn sustainability_period_validation_rejects_unsupported_values() {
        assert!(validate_sustainability_period("7d").is_ok());
        assert!(validate_sustainability_period("30d").is_ok());
        assert!(validate_sustainability_period("90d").is_ok());

        let error = validate_sustainability_period("365d").unwrap_err();
        assert!(error.contains("unsupported sustainability period"));
        assert!(error.contains("7d, 30d, and 90d"));
    }

    #[test]
    fn doctor_validates_representative_endpoint_shapes() {
        assert_eq!(
            validate_doctor_health(&json!({
                "status": "ok",
                "service": "ignispromptd",
                "version": "0.1.0",
                "local_only": true
            }))
            .unwrap(),
            "ok"
        );
        assert_eq!(
            validate_doctor_version_status(&json!({
                "service": "ignispromptd",
                "version": "0.1.0",
                "release_channel": "local-preview",
                "local_only": true
            }))
            .unwrap(),
            "local-preview / 0.1.0"
        );
        assert_eq!(
            validate_doctor_models(&json!({
                "models": [{ "modelId": "legal", "tier": 3 }]
            }))
            .unwrap(),
            "1 model listed"
        );
        assert_eq!(
            validate_doctor_model_status_hints(&json!({
                "schemaVersion": "ignisprompt.model-status.v1",
                "generatedAt": "2026-05-21T00:00:00Z",
                "source": "local-daemon",
                "statusHints": [{
                    "modelId": "legal",
                    "configured": true,
                    "localPathDeclared": true,
                    "localPathExists": false,
                    "runnerConfigured": true,
                    "runnerKind": "stub-legal-runner",
                    "runnerExecutableExists": true,
                    "availability": "model-file-missing",
                    "warnings": [
                        "Status is a local hint, not a production readiness, legal accuracy, or compliance claim."
                    ]
                }]
            }))
            .unwrap(),
            "available (1 hint; status hints only)"
        );
        assert_eq!(
            validate_doctor_sustainability_metrics(&json!({
                "period": "30d",
                "requests_total": 3,
                "local_request_rate": 1.0,
                "tier_breakdown": { "TIER_3": 3 },
                "estimated_cloud_cost_avoided_usd": 0.000034,
                "estimated_carbon_avoided_kgco2e": 0.000003,
                "estimated_data_kept_local_gb": 0.000001,
                "methodology_version": "aethra-impact-0.1",
                "confidence": "low",
                "disclaimer": "Local-only counterfactual proxy estimates; not actual carbon accounting."
            }))
            .unwrap(),
            "methodology aethra-impact-0.1, confidence low"
        );
    }

    #[test]
    fn doctor_rejects_missing_required_fields() {
        assert!(validate_doctor_health(&json!({
            "status": "ok",
            "service": "ignispromptd",
            "version": "0.1.0"
        }))
        .is_err());
        assert!(validate_doctor_version_status(&json!({
            "service": "ignispromptd",
            "version": "0.1.0",
            "release_channel": "local-preview",
            "local_only": false
        }))
        .unwrap_err()
        .contains("local_only"));
        assert!(validate_doctor_models(&json!({ "items": [] })).is_err());
        assert!(validate_doctor_model_status_hints(&json!({
            "schemaVersion": "ignisprompt.model-status.v1",
            "generatedAt": "2026-05-21T00:00:00Z",
            "source": "local-daemon"
        }))
        .is_err());
        assert!(validate_doctor_model_status_hints(&json!({
            "schemaVersion": "ignisprompt.model-status.v1",
            "generatedAt": "2026-05-21T00:00:00Z",
            "source": "local-daemon",
            "statusHints": [{
                "modelId": "legal",
                "configured": true,
                "runnerKind": "stub-legal-runner"
            }]
        }))
        .is_err());
    }

    #[test]
    fn doctor_summary_reports_ready_and_informational_checks() {
        let report = DoctorReport {
            base_url: "http://127.0.0.1:8765".to_string(),
            checks: vec![
                DoctorCheckResult {
                    id: "health",
                    label: "health",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://127.0.0.1:8765/health".to_string(),
                    ok: true,
                    summary: "ok".to_string(),
                    error: None,
                },
                DoctorCheckResult {
                    id: "sustainability_metrics",
                    label: "sustainability metrics",
                    level: DoctorCheckLevel::Informational,
                    endpoint: "http://127.0.0.1:8765/v1/metrics/sustainability?period=30d"
                        .to_string(),
                    ok: true,
                    summary: "methodology aethra-impact-0.1, confidence low".to_string(),
                    error: None,
                },
            ],
        };

        let summary = format_doctor_summary(&report);
        assert!(summary.contains("IgnisPrompt Doctor"));
        assert!(summary.contains("✓ health: ok"));
        assert!(summary.contains("Informational checks:"));
        assert!(summary.contains("✓ Local preview daemon appears ready."));
    }

    #[test]
    fn doctor_failed_required_check_reports_next_steps_and_failed_json() {
        let report = DoctorReport {
            base_url: "http://127.0.0.1:8765".to_string(),
            checks: vec![DoctorCheckResult {
                id: "health",
                label: "health",
                level: DoctorCheckLevel::Required,
                endpoint: "http://127.0.0.1:8765/health".to_string(),
                ok: false,
                summary: "daemon unreachable".to_string(),
                error: Some("daemon unreachable".to_string()),
            }],
        };

        assert!(!report.required_checks_passed());
        let summary = format_doctor_summary(&report);
        assert!(summary.contains("✗ health: daemon unreachable"));
        assert!(summary.contains("start the daemon with ./scripts/start-dev.sh"));
        assert!(summary.contains("check http://127.0.0.1:8765/health"));

        let json_report: serde_json::Value =
            serde_json::from_str(&format_doctor_json(&report)).unwrap();
        assert_eq!(json_report["base_url"], "http://127.0.0.1:8765");
        assert_eq!(json_report["overall_status"], "failed");
        assert_eq!(json_report["checks"][0]["status"], "failed");
        assert!(json_report["next_steps"].as_array().unwrap().len() >= 3);
    }

    #[test]
    fn route_explain_reads_decision_nested_fields() {
        let response = json!({
            "request_id": "abc",
            "decision": {
                "tier": "TIER_3",
                "route_code": "DOMAIN_MODEL_SELECTED",
                "domain": "legal",
                "model_id": "legal-qwen2.5",
                "cloud_considered": false,
                "cloud_allowed": false,
                "data_left_device": false
            },
            "explanation": "Routed to local legal model.",
            "warnings": []
        });
        let decision = response.get("decision").unwrap();
        assert_eq!(
            decision.get("tier").and_then(|v| v.as_str()).unwrap(),
            "TIER_3"
        );
        assert_eq!(
            decision.get("route_code").and_then(|v| v.as_str()).unwrap(),
            "DOMAIN_MODEL_SELECTED"
        );
        assert_eq!(
            decision
                .get("data_left_device")
                .and_then(|v| v.as_bool())
                .unwrap(),
            false
        );
    }

    #[test]
    fn models_reads_correct_fields() {
        let response = json!({
            "models": [
                {
                    "modelId": "legal-qwen2.5-0.5b",
                    "displayName": "Qwen2.5 0.5B Instruct",
                    "tier": 3,
                    "domains": ["legal"],
                    "installed": true
                }
            ]
        });
        let models = response.get("models").and_then(|d| d.as_array()).unwrap();
        assert_eq!(models.len(), 1);
        assert_eq!(
            string_field(&models[0], &["modelId", "model_id"]).unwrap(),
            "legal-qwen2.5-0.5b"
        );
        let line = format_model_manifest_line(&models[0]);
        assert!(line.starts_with("legal-qwen2.5-0.5b"));
        assert!(line.contains("TIER_3"));
        assert!(line.contains("domains=legal"));
        assert!(line.ends_with("installed"));
    }

    #[test]
    fn models_keeps_legacy_snake_case_fallback() {
        let model = json!({
            "model_id": "legacy-legal-model",
            "tier": 1,
            "domains": ["legal", "contracts"],
            "installed": false
        });

        let line = format_model_manifest_line(&model);
        assert!(line.starts_with("legacy-legal-model"));
        assert!(line.contains("TIER_1"));
        assert!(line.contains("domains=legal,contracts"));
        assert!(line.ends_with("missing"));
    }

    #[test]
    fn sustainability_summary_reads_representative_response_fields() {
        let response = json!({
            "period": "30d",
            "requests_total": 3,
            "local_request_rate": 1.0,
            "tier_breakdown": {
                "TIER_1": 1,
                "TIER_3": 2
            },
            "estimated_cloud_cost_avoided_usd": 0.000034,
            "estimated_carbon_avoided_kgco2e": 0.000003,
            "estimated_data_kept_local_gb": 0.000001,
            "baseline_provider": "openai",
            "baseline_model": "gpt-4.1-mini",
            "methodology_version": "aethra-impact-0.1",
            "confidence": "low",
            "disclaimer": "Local-only counterfactual proxy estimates; not actual carbon accounting."
        });

        assert!(is_sustainability_metrics_response(&response));
        let summary = format_sustainability_summary(&response);

        assert!(summary.contains("Aethra Sustainability Summary"));
        assert!(summary.contains("Period: 30d"));
        assert!(summary.contains("Requests total: 3"));
        assert!(summary.contains("Local request rate: 100%"));
        assert!(summary.contains("Estimated cloud cost avoided: $0.000034"));
        assert!(summary.contains("Estimated CO₂e avoided: 0.000003 kgCO2e"));
        assert!(summary.contains("Estimated data kept local: 0.000001 GB"));
        assert!(summary.contains("Methodology: aethra-impact-0.1"));
        assert!(summary.contains("Confidence: low"));
        assert!(summary.contains("Disclaimer:"));
        assert!(summary.contains("- TIER_1: 1"));
        assert!(summary.contains("- TIER_3: 2"));
    }

    #[test]
    fn sustainability_response_shape_rejects_missing_required_fields() {
        let response = json!({
            "period": "30d",
            "requests_total": 3
        });

        assert!(!is_sustainability_metrics_response(&response));
    }
}
