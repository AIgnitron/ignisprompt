use clap::{Parser, Subcommand};
use serde_json::Value;
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
    /// Check daemon health
    Health,
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
        Commands::Health => cmd_health(&cli.daemon_url),
        Commands::Models => cmd_models(&cli.daemon_url),
        Commands::RouteExplain { file } => cmd_route_explain(&cli.daemon_url, file),
        Commands::Audit { sub } => match sub {
            AuditCommands::Tail => cmd_audit_tail(&cli.daemon_url),
        },
    }
}

fn cmd_health(base_url: &str) {
    let url = format!("{}/health", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            println!("status: ok");
            if let Some(v) = body.get("version") {
                println!("version: {}", v);
            }
        }
        Err(e) => {
            eprintln!("error: daemon not reachable — {}", e);
            process::exit(1);
        }
    }
}

fn cmd_models(base_url: &str) {
    let url = format!("{}/v1/models", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            if let Some(models) = body.get("data").and_then(|d| d.as_array()) {
                if models.is_empty() {
                    println!("no models found");
                }
                for m in models {
                    let id = m.get("id").and_then(|v| v.as_str()).unwrap_or("unknown");
                    let tier = m.get("tier").and_then(|v| v.as_str()).unwrap_or("-");
                    let domain = m.get("domain").and_then(|v| v.as_str()).unwrap_or("-");
                    println!("{:<40} tier={} domain={}", id, tier, domain);
                }
            } else {
                println!("{}", serde_json::to_string_pretty(&body).unwrap_or_default());
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

fn cmd_route_explain(base_url: &str, file: &str) {
    let body = match fs::read_to_string(file) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("error reading file {}: {}", file, e);
            process::exit(1);
        }
    };
    let url = format!("{}/v1/route/explain", base_url);
    match ureq::post(&url)
        .set("content-type", "application/json")
        .send_string(&body)
    {
        Ok(resp) => {
            let data = parse_response(resp);
            println!(
                "tier:             {}",
                data.get("tier").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "route_code:       {}",
                data.get("route_code").and_then(|v| v.as_str()).unwrap_or("-")
            );
            println!(
                "data_left_device: {}",
                data.get("data_left_device")
                    .and_then(|v| v.as_bool())
                    .map(|b| if b { "true" } else { "false" })
                    .unwrap_or("-")
            );
            println!(
                "explanation:      {}",
                data.get("human_readable_explanation")
                    .and_then(|v| v.as_str())
                    .unwrap_or("-")
            );
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
                let start = if events.len() > 10 { events.len() - 10 } else { 0 };
                for event in &events[start..] {
                    let ts = event.get("timestamp").and_then(|v| v.as_str()).unwrap_or("-");
                    let et = event.get("event_type").and_then(|v| v.as_str()).unwrap_or("-");
                    let rc = event.get("route_code").and_then(|v| v.as_str()).unwrap_or("-");
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
    #[test]
    fn health_url_format() {
        let url = format!("{}/health", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/health");
    }

    #[test]
    fn models_url_format() {
        let url = format!("{}/v1/models", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/models");
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
}
