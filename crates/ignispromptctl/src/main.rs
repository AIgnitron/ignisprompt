use clap::{ArgGroup, Parser, Subcommand};
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
    /// Inspect local audit events from the daemon
    AuditEvents {
        /// Print raw JSON response instead of a terminal summary
        #[arg(long)]
        json: bool,
    },
    /// Explain routing for synthetic or non-sensitive local preview text/request JSON
    #[command(group(
        ArgGroup::new("route_input")
            .required(true)
            .args(["text", "input", "file"])
    ))]
    RouteExplain {
        /// Synthetic or non-sensitive text to inspect locally
        #[arg(long)]
        text: Option<String>,
        /// Path to route-explain request JSON
        #[arg(long)]
        input: Option<String>,
        /// Path to route-explain request JSON; compatibility alias for --input
        #[arg(long)]
        file: Option<String>,
        /// Print raw JSON response instead of a terminal summary
        #[arg(long)]
        json: bool,
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
        Commands::AuditEvents { json } => cmd_audit_events(&cli.daemon_url, *json),
        Commands::RouteExplain {
            text,
            input,
            file,
            json,
        } => cmd_route_explain(&cli.daemon_url, text, input, file, *json),
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

fn cmd_audit_events(base_url: &str, json_output: bool) {
    let url = audit_events_url(base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let data = parse_response(resp);
            if !is_audit_event_list(&data) {
                eprintln!("{}", format_invalid_response_error("audit events", &url));
                process::exit(1);
            }

            if json_output {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&data).unwrap_or_default()
                );
            } else {
                println!("{}", format_audit_events_summary(&data));
            }
        }
        Err(ureq::Error::Status(status, resp)) => {
            let body = parse_response(resp);
            eprintln!("{}", format_http_error("audit events", status, &url, &body));
            process::exit(1);
        }
        Err(e) => {
            eprintln!(
                "{}",
                format_unreachable_error("audit events", &url, &e.to_string())
            );
            process::exit(1);
        }
    }
}

fn cmd_route_explain(
    base_url: &str,
    text: &Option<String>,
    input: &Option<String>,
    file: &Option<String>,
    json_output: bool,
) {
    let body = match build_route_explain_body(text.as_deref(), input.as_deref(), file.as_deref()) {
        Ok(body) => body,
        Err(message) => {
            eprintln!("error: {}", message);
            process::exit(1);
        }
    };

    // Daemon returns RouteExplainResponse:
    // { request_id, decision: { tier, route_code, domain, model_id,
    //   cloud_considered, cloud_allowed, data_left_device }, explanation, warnings }
    let url = route_explain_url(base_url);
    match ureq::post(&url)
        .set("content-type", "application/json")
        .send_string(&body)
    {
        Ok(resp) => {
            let data = parse_response(resp);
            if !is_route_explain_response(&data) {
                eprintln!("{}", format_invalid_response_error("route explain", &url));
                process::exit(1);
            }

            if json_output {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&data).unwrap_or_default()
                );
            } else {
                println!("{}", format_route_explain_summary(&data));
            }
        }
        Err(ureq::Error::Status(status, resp)) => {
            let body = parse_response(resp);
            eprintln!(
                "{}",
                format_http_error("route explain", status, &url, &body)
            );
            process::exit(1);
        }
        Err(e) => {
            eprintln!(
                "{}",
                format_unreachable_error("route explain", &url, &e.to_string())
            );
            process::exit(1);
        }
    }
}

fn cmd_audit_tail(base_url: &str) {
    let url = audit_events_url(base_url);
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

fn audit_events_url(base_url: &str) -> String {
    format!("{}/v1/audit/events", base_url.trim_end_matches('/'))
}

fn route_explain_url(base_url: &str) -> String {
    format!("{}/v1/route/explain", base_url.trim_end_matches('/'))
}

fn build_route_explain_body(
    text: Option<&str>,
    input: Option<&str>,
    file: Option<&str>,
) -> Result<String, String> {
    if let Some(text) = text {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return Err(
                "--text must not be empty; use synthetic or non-sensitive local preview text"
                    .to_string(),
            );
        }

        return serde_json::to_string(&json!({
            "messages": [
                {
                    "role": "user",
                    "content": trimmed,
                }
            ],
            "metadata": {
                "source": "ignispromptctl",
                "local_preview": true,
            }
        }))
        .map_err(|error| format!("could not build route explain request: {}", error));
    }

    let path = input.or(file).ok_or_else(|| {
        "provide --text or --input with synthetic/non-sensitive local preview content".to_string()
    })?;
    let body =
        fs::read_to_string(path).map_err(|error| format!("error reading {}: {}", path, error))?;
    let value: Value = serde_json::from_str(&body)
        .map_err(|error| format!("invalid JSON in {}: {}", path, error))?;

    if !value.is_object() {
        return Err(format!("{} must contain a JSON object request", path));
    }
    if value
        .get("messages")
        .and_then(|messages| messages.as_array())
        .filter(|messages| !messages.is_empty())
        .is_none()
    {
        return Err(format!("{} must include a non-empty messages array", path));
    }

    serde_json::to_string(&value)
        .map_err(|error| format!("could not serialize {}: {}", path, error))
}

fn is_route_explain_response(value: &Value) -> bool {
    let decision = value.get("decision").unwrap_or(&Value::Null);
    value.get("request_id").and_then(|v| v.as_str()).is_some()
        && decision.get("tier").and_then(|v| v.as_str()).is_some()
        && decision
            .get("route_code")
            .and_then(|v| v.as_str())
            .is_some()
        && decision.get("domain").and_then(|v| v.as_str()).is_some()
        && decision
            .get("cloud_considered")
            .and_then(|v| v.as_bool())
            .is_some()
        && decision
            .get("cloud_allowed")
            .and_then(|v| v.as_bool())
            .is_some()
        && decision
            .get("data_left_device")
            .and_then(|v| v.as_bool())
            .is_some()
        && value.get("explanation").and_then(|v| v.as_str()).is_some()
        && value.get("warnings").and_then(|v| v.as_array()).is_some()
}

fn is_audit_event_list(value: &Value) -> bool {
    value
        .as_array()
        .map(|events| events.iter().all(is_audit_event))
        .unwrap_or(false)
}

fn is_audit_event(value: &Value) -> bool {
    value.get("request_id").and_then(|v| v.as_str()).is_some()
        && value.get("event_type").and_then(|v| v.as_str()).is_some()
        && value.get("route_code").and_then(|v| v.as_str()).is_some()
        && value.get("tier").and_then(|v| v.as_str()).is_some()
        && value.get("domain").and_then(|v| v.as_str()).is_some()
        && value
            .get("data_left_device")
            .and_then(|v| v.as_bool())
            .is_some()
        && value.get("warnings").and_then(|v| v.as_array()).is_some()
}

fn format_route_explain_summary(response: &Value) -> String {
    let decision = response.get("decision").unwrap_or(&Value::Null);
    let route_code = decision
        .get("route_code")
        .and_then(|v| v.as_str())
        .unwrap_or("-");
    let data_left_device = decision
        .get("data_left_device")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    let cloud_allowed = decision
        .get("cloud_allowed")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    let local_only = !data_left_device && !cloud_allowed;
    let fail_closed = route_code.to_ascii_uppercase().contains("FAIL");

    let mut lines = vec![
        "IgnisPrompt Route Inspection".to_string(),
        "Use synthetic or non-sensitive text. This is route inspection, not legal advice or legal accuracy validation.".to_string(),
        format!(
            "request_id:         {}",
            response
                .get("request_id")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ),
        format!(
            "route_code:         {}",
            route_code
        ),
        format!(
            "tier:               {}",
            decision.get("tier").and_then(|v| v.as_str()).unwrap_or("-")
        ),
        format!(
            "domain:             {}",
            decision
                .get("domain")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ),
        format!(
            "model_id:           {}",
            decision
                .get("model_id")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ),
        format!("local_only:         {}", bool_label(local_only)),
        format!("fail_closed:        {}", bool_label(fail_closed)),
        format!("data_left_device:   {}", bool_label(data_left_device)),
        format!(
            "cloud_considered:   {}",
            bool_label(
                decision
                    .get("cloud_considered")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false),
            )
        ),
        format!("cloud_allowed:      {}", bool_label(cloud_allowed)),
        "".to_string(),
        "Explanation:".to_string(),
        response
            .get("explanation")
            .and_then(|v| v.as_str())
            .unwrap_or("-")
            .to_string(),
    ];

    append_warning_lines(&mut lines, response.get("warnings"));
    lines.join("\n")
}

fn format_audit_events_summary(value: &Value) -> String {
    let events = value.as_array().cloned().unwrap_or_default();
    let mut lines = vec![
        "IgnisPrompt Audit Events".to_string(),
        format!("Events: {}", events.len()),
    ];

    if events.is_empty() {
        lines.push("No local audit events returned by the daemon.".to_string());
        return lines.join("\n");
    }

    for event in events {
        lines.push("".to_string());
        lines.push(format!(
            "[{}] {}",
            event
                .get("timestamp")
                .and_then(|v| v.as_str())
                .unwrap_or("-"),
            event
                .get("event_type")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ));
        lines.push(format!(
            "request_id:       {}",
            event
                .get("request_id")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ));
        lines.push(format!(
            "route/domain/tier: {}/{}/{}",
            event
                .get("route_code")
                .and_then(|v| v.as_str())
                .unwrap_or("-"),
            event.get("domain").and_then(|v| v.as_str()).unwrap_or("-"),
            event.get("tier").and_then(|v| v.as_str()).unwrap_or("-")
        ));
        if let Some(model_id) = event.get("model_id").and_then(|v| v.as_str()) {
            lines.push(format!("model_id:         {}", model_id));
        }
        if let Some(data_left_device) = event.get("data_left_device").and_then(|v| v.as_bool()) {
            lines.push(format!(
                "local_only:       {}",
                bool_label(!data_left_device)
            ));
            lines.push(format!(
                "data_left_device: {}",
                bool_label(data_left_device)
            ));
        }
        append_warning_lines(&mut lines, event.get("warnings"));
        append_optional_audit_proxy_lines(&mut lines, &event);
    }

    lines.join("\n")
}

fn append_warning_lines(lines: &mut Vec<String>, warnings: Option<&Value>) {
    let warning_values = warnings
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    if warning_values.is_empty() {
        lines.push("warnings: none".to_string());
        return;
    }

    lines.push("warnings:".to_string());
    for warning in warning_values {
        if let Some(message) = warning.as_str() {
            lines.push(format!("- {}", message));
        }
    }
}

fn append_optional_audit_proxy_lines(lines: &mut Vec<String>, event: &Value) {
    let proxy_fields = [
        "input_tokens_est",
        "output_tokens_est",
        "baseline_provider",
        "baseline_model",
        "estimated_cloud_cost_usd",
        "estimated_cloud_cost_avoided_usd",
        "estimated_local_energy_wh",
        "estimated_cloud_baseline_wh",
        "estimated_carbon_avoided_gco2e",
        "methodology_version",
        "confidence",
    ];

    let mut emitted_header = false;
    for field in proxy_fields {
        if let Some(value) = event.get(field) {
            if !emitted_header {
                lines.push("local proxy fields:".to_string());
                emitted_header = true;
            }
            lines.push(format!("- {}: {}", field, format_json_scalar(value)));
        }
    }
}

fn format_json_scalar(value: &Value) -> String {
    value
        .as_str()
        .map(|value| value.to_string())
        .unwrap_or_else(|| value.to_string())
}

fn bool_label(value: bool) -> &'static str {
    if value {
        "true"
    } else {
        "false"
    }
}

fn format_http_error(kind: &str, status: u16, endpoint: &str, body: &Value) -> String {
    let mut lines = vec![
        format!("error: {} endpoint returned HTTP {}", kind, status),
        format!("endpoint: {}", endpoint),
    ];
    if let Some(message) = body.get("error").and_then(|v| v.as_str()) {
        lines.push(format!("daemon error: {}", message));
    }
    lines.push("next steps: start the daemon with ./scripts/start-dev.sh and retry against the local loopback endpoint.".to_string());
    lines.join("\n")
}

fn format_unreachable_error(kind: &str, endpoint: &str, error: &str) -> String {
    [
        format!("error: local daemon not reachable for {}", kind),
        format!("details: {}", error),
        format!("endpoint: {}", endpoint),
        "next steps: start the daemon with ./scripts/start-dev.sh and confirm /health responds locally.".to_string(),
    ]
    .join("\n")
}

fn format_invalid_response_error(kind: &str, endpoint: &str) -> String {
    [
        format!("error: invalid {} response shape from local daemon", kind),
        format!("endpoint: {}", endpoint),
        "next steps: confirm the daemon is the current local-preview build and rerun ./scripts/smoke.sh.".to_string(),
    ]
    .join("\n")
}

#[cfg(test)]
mod tests {
    use super::{
        audit_events_url, build_route_explain_body, doctor_endpoint_url,
        format_audit_events_summary, format_doctor_json, format_doctor_summary, format_http_error,
        format_invalid_response_error, format_model_manifest_line, format_route_explain_summary,
        format_sustainability_summary, format_unreachable_error, is_audit_event_list,
        is_route_explain_response, is_sustainability_metrics_response, route_explain_url,
        string_field, sustainability_url, validate_doctor_health,
        validate_doctor_model_status_hints, validate_doctor_models,
        validate_doctor_sustainability_metrics, validate_doctor_version_status,
        validate_sustainability_period, DoctorCheckLevel, DoctorCheckResult, DoctorReport,
        DOCTOR_CHECKS,
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
        let url = route_explain_url("http://127.0.0.1:8765/");
        assert_eq!(url, "http://127.0.0.1:8765/v1/route/explain");
    }

    #[test]
    fn audit_tail_url_format() {
        let url = audit_events_url("http://127.0.0.1:8765/");
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
        assert!(is_route_explain_response(&response));
    }

    #[test]
    fn route_explain_text_input_builds_synthetic_local_request() {
        let body =
            build_route_explain_body(Some(" Review this synthetic clause. "), None, None).unwrap();
        let value: serde_json::Value = serde_json::from_str(&body).unwrap();

        assert_eq!(value["messages"][0]["role"], "user");
        assert_eq!(
            value["messages"][0]["content"],
            "Review this synthetic clause."
        );
        assert_eq!(value["metadata"]["source"], "ignispromptctl");
        assert_eq!(value["metadata"]["local_preview"], true);
    }

    #[test]
    fn route_explain_input_rejects_invalid_requests() {
        let error = build_route_explain_body(Some("   "), None, None).unwrap_err();
        assert!(error.contains("--text must not be empty"));

        let path = std::env::temp_dir().join("ignispromptctl-invalid-route-request.json");
        std::fs::write(&path, "{\"messages\":[]}").unwrap();
        let error = build_route_explain_body(None, Some(path.to_str().unwrap()), None).unwrap_err();
        assert!(error.contains("non-empty messages array"));
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn route_explain_summary_and_json_shape_are_local_inspection_focused() {
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
            "warnings": ["Synthetic warning."]
        });

        let summary = format_route_explain_summary(&response);
        assert!(summary.contains("IgnisPrompt Route Inspection"));
        assert!(summary.contains("not legal advice"));
        assert!(summary.contains("request_id:         abc"));
        assert!(summary.contains("route_code:         DOMAIN_MODEL_SELECTED"));
        assert!(summary.contains("tier:               TIER_3"));
        assert!(summary.contains("domain:             legal"));
        assert!(summary.contains("local_only:         true"));
        assert!(summary.contains("fail_closed:        false"));
        assert!(summary.contains("warnings:"));
        assert!(summary.contains("- Synthetic warning."));

        let json_output = serde_json::to_string_pretty(&response).unwrap();
        assert!(json_output.contains("\"request_id\": \"abc\""));
        assert!(json_output.contains("\"data_left_device\": false"));
    }

    #[test]
    fn route_explain_invalid_response_is_rejected() {
        assert!(!is_route_explain_response(&json!({
            "request_id": "abc",
            "decision": { "tier": "TIER_3" }
        })));
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

    #[test]
    fn audit_events_summary_includes_route_signals_warnings_and_proxy_fields() {
        let response = json!([
            {
                "request_id": "req-1",
                "timestamp": "2026-05-23T00:00:00Z",
                "event_type": "route_explain",
                "route_code": "DOMAIN_MODEL_SELECTED",
                "tier": "TIER_3",
                "domain": "legal",
                "model_id": "legal-qwen2.5",
                "data_left_device": false,
                "explanation": "Local route.",
                "warnings": ["Document-contained instruction was ignored."],
                "input_tokens_est": 12,
                "baseline_provider": "openai",
                "methodology_version": "aethra-impact-0.1",
                "confidence": "low"
            }
        ]);

        assert!(is_audit_event_list(&response));
        let summary = format_audit_events_summary(&response);

        assert!(summary.contains("IgnisPrompt Audit Events"));
        assert!(summary.contains("Events: 1"));
        assert!(summary.contains("request_id:       req-1"));
        assert!(summary.contains("route/domain/tier: DOMAIN_MODEL_SELECTED/legal/TIER_3"));
        assert!(summary.contains("local_only:       true"));
        assert!(summary.contains("warnings:"));
        assert!(summary.contains("- Document-contained instruction was ignored."));
        assert!(summary.contains("local proxy fields:"));
        assert!(summary.contains("- input_tokens_est: 12"));
        assert!(summary.contains("- baseline_provider: openai"));
    }

    #[test]
    fn audit_events_json_output_preserves_endpoint_shape() {
        let response = json!([
            {
                "request_id": "req-1",
                "event_type": "route_explain",
                "route_code": "DOMAIN_MODEL_SELECTED",
                "tier": "TIER_3",
                "domain": "legal",
                "data_left_device": false,
                "warnings": []
            }
        ]);

        assert!(is_audit_event_list(&response));
        let json_output = serde_json::to_string_pretty(&response).unwrap();
        assert!(json_output.starts_with("["));
        assert!(json_output.contains("\"request_id\": \"req-1\""));
    }

    #[test]
    fn audit_events_invalid_response_is_rejected() {
        assert!(!is_audit_event_list(&json!({
            "events": []
        })));
        assert!(!is_audit_event_list(&json!([
            {
                "request_id": "req-1",
                "event_type": "route_explain"
            }
        ])));
    }

    #[test]
    fn local_inspection_error_messages_include_next_steps() {
        let unreachable = format_unreachable_error(
            "audit events",
            "http://127.0.0.1:8765/v1/audit/events",
            "connection refused",
        );
        assert!(unreachable.contains("local daemon not reachable"));
        assert!(unreachable.contains("./scripts/start-dev.sh"));

        let invalid = format_invalid_response_error(
            "route explain",
            "http://127.0.0.1:8765/v1/route/explain",
        );
        assert!(invalid.contains("invalid route explain response shape"));
        assert!(invalid.contains("./scripts/smoke.sh"));

        let http = format_http_error(
            "audit events",
            404,
            "http://127.0.0.1:8765/v1/audit/events",
            &json!({ "error": "missing endpoint" }),
        );
        assert!(http.contains("HTTP 404"));
        assert!(http.contains("daemon error: missing endpoint"));
    }
}
