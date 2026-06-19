use clap::{ArgGroup, Parser, Subcommand};
use flate2::{read::GzDecoder, write::GzEncoder, Compression};
use serde_json::{json, Value};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process;
use std::time::{SystemTime, UNIX_EPOCH};
use tar::{Archive, Builder};

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
    /// Summarize local preview readiness from existing daemon checks
    #[command(group(
        ArgGroup::new("readiness_action")
            .args(["package_output", "package_validate", "package_list"])
            .multiple(false)
    ))]
    Readiness {
        /// Print structured JSON diagnostics
        #[arg(long)]
        json: bool,
        /// Print a copy-safe Markdown report for local demo notes
        #[arg(long)]
        markdown: bool,
        /// Generate a local readiness package under ignored local-evidence/readiness/
        #[arg(long)]
        package_output: Option<String>,
        /// Validate an existing local readiness package without calling the daemon
        #[arg(long)]
        package_validate: Option<String>,
        /// List files and metadata for an existing local readiness package without calling the daemon
        #[arg(long)]
        package_list: Option<String>,
    },
    /// Summarize the local preview operator workflow without calling the daemon
    #[command(group(
        ArgGroup::new("operator_action")
            .args(["package_output", "package_validate", "package_list"])
            .multiple(false)
    ))]
    OperatorSummary {
        /// Print structured JSON operator guidance
        #[arg(long)]
        json: bool,
        /// Generate a local operator package under ignored local-evidence/operator/
        #[arg(long)]
        package_output: Option<String>,
        /// Validate an existing local operator package without calling the daemon
        #[arg(long)]
        package_validate: Option<String>,
        /// List files and metadata for an existing local operator package without calling the daemon
        #[arg(long)]
        package_list: Option<String>,
    },
    /// Inspect synthetic local preview policy scenarios without calling the daemon
    #[command(group(
        ArgGroup::new("policy_action")
            .args(["package_output", "package_validate", "package_list"])
            .multiple(false)
    ))]
    PolicyScenarios {
        /// Print structured JSON policy scenario guidance
        #[arg(long)]
        json: bool,
        /// Print a copy-safe Markdown report for local demo notes
        #[arg(long)]
        report: bool,
        /// Generate a local policy package under ignored local-evidence/policy/
        #[arg(long)]
        package_output: Option<String>,
        /// Validate an existing local policy package without calling the daemon
        #[arg(long)]
        package_validate: Option<String>,
        /// List files and metadata for an existing local policy package without calling the daemon
        #[arg(long)]
        package_list: Option<String>,
    },
    /// Summarize the local preview demo story without calling the daemon
    #[command(group(
        ArgGroup::new("demo_action")
            .args(["package_output", "package_validate", "package_list"])
            .multiple(false)
    ))]
    DemoSummary {
        /// Print structured JSON demo guidance
        #[arg(long)]
        json: bool,
        /// Print a copy-safe Markdown report for local demo notes
        #[arg(long)]
        report: bool,
        /// Generate a local demo package under ignored local-evidence/demo-studio/
        #[arg(long)]
        package_output: Option<String>,
        /// Validate an existing local demo package without calling the daemon
        #[arg(long)]
        package_validate: Option<String>,
        /// List files and metadata for an existing local demo package without calling the daemon
        #[arg(long)]
        package_list: Option<String>,
    },
    /// Check daemon health
    Health,
    /// Print daemon version and local preview status
    StatusVersion,
    /// Print local-preview connector and capability status metadata
    Capabilities {
        /// Print raw JSON response instead of a terminal summary
        #[arg(long)]
        json: bool,
    },
    /// Print read-only local model inventory metadata
    ModelInventory {
        /// Print raw JSON response instead of a terminal summary
        #[arg(long)]
        json: bool,
    },
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
    /// Build, list, or validate a local-only evidence bundle
    #[command(group(
        ArgGroup::new("bundle_mode")
            .args(["output", "validate", "list", "archive", "verify_archive", "print_manifest"])
            .multiple(false)
    ))]
    EvidenceBundle {
        /// Output directory for a new bundle; use an ignored local-evidence/ path
        #[arg(long)]
        output: Option<String>,
        /// Validate an existing bundle directory without calling the daemon
        #[arg(long)]
        validate: Option<String>,
        /// List files and metadata for an existing bundle directory without calling the daemon
        #[arg(long)]
        list: Option<String>,
        /// Archive an existing bundle directory without calling the daemon
        #[arg(long)]
        archive: Option<String>,
        /// Archive output path under ignored local-evidence/; defaults to local-evidence/archives/<bundle-name>.tar.gz
        #[arg(long)]
        archive_output: Option<String>,
        /// Verify an existing archive without calling the daemon
        #[arg(long)]
        verify_archive: Option<String>,
        /// Print the manifest for an existing bundle directory without calling the daemon
        #[arg(long)]
        print_manifest: Option<String>,
        /// Include the raw local audit events endpoint response in the bundle
        #[arg(long)]
        include_audit_events: bool,
        /// Print the bundle summary as JSON instead of a terminal summary
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
        Commands::Readiness {
            json,
            markdown,
            package_output,
            package_validate,
            package_list,
        } => cmd_readiness(
            &cli.daemon_url,
            *json,
            *markdown,
            package_output,
            package_validate,
            package_list,
        ),
        Commands::OperatorSummary {
            json,
            package_output,
            package_validate,
            package_list,
        } => cmd_operator_summary(*json, package_output, package_validate, package_list),
        Commands::PolicyScenarios {
            json,
            report,
            package_output,
            package_validate,
            package_list,
        } => cmd_policy_scenarios(
            *json,
            *report,
            package_output,
            package_validate,
            package_list,
        ),
        Commands::DemoSummary {
            json,
            report,
            package_output,
            package_validate,
            package_list,
        } => cmd_demo_summary(
            *json,
            *report,
            package_output,
            package_validate,
            package_list,
        ),
        Commands::Health => cmd_health(&cli.daemon_url),
        Commands::StatusVersion => cmd_status_version(&cli.daemon_url),
        Commands::Capabilities { json } => cmd_capabilities(&cli.daemon_url, *json),
        Commands::ModelInventory { json } => cmd_model_inventory(&cli.daemon_url, *json),
        Commands::Sustainability { period, json } => {
            cmd_sustainability(&cli.daemon_url, period, *json)
        }
        Commands::Models => cmd_models(&cli.daemon_url),
        Commands::AuditEvents { json } => cmd_audit_events(&cli.daemon_url, *json),
        Commands::EvidenceBundle {
            output,
            validate,
            list,
            archive,
            archive_output,
            verify_archive,
            print_manifest,
            include_audit_events,
            json,
        } => cmd_evidence_bundle(
            &cli.daemon_url,
            output,
            validate,
            list,
            archive,
            archive_output,
            verify_archive,
            print_manifest,
            *include_audit_events,
            *json,
        ),
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

#[derive(Clone, Debug)]
struct ReadinessPackageReport {
    output_dir: PathBuf,
    generated_at_unix_seconds: u64,
    generated_file_names: Vec<String>,
    readiness_json: Value,
    report_json: Value,
    manifest_json: Value,
    report_markdown: String,
    readme: String,
}

#[derive(Clone, Debug)]
struct ReadinessPackageFileState {
    file_name: &'static str,
    present: bool,
    json_valid: Option<bool>,
    text: Option<String>,
}

#[derive(Clone, Debug)]
struct ReadinessPackageValidationReport {
    package_dir: PathBuf,
    files: Vec<ReadinessPackageFileState>,
    issues: Vec<String>,
}

#[derive(Clone, Debug)]
struct OperatorPackageReport {
    output_dir: PathBuf,
    generated_at_unix_seconds: u64,
    generated_file_names: Vec<String>,
    operator_summary_json: Value,
    report_json: Value,
    manifest_json: Value,
    report_markdown: String,
    readme: String,
}

#[derive(Clone, Debug)]
struct OperatorPackageValidationReport {
    package_dir: PathBuf,
    files: Vec<ReadinessPackageFileState>,
    issues: Vec<String>,
}

#[derive(Clone, Debug)]
struct PolicyPackageReport {
    output_dir: PathBuf,
    generated_at_unix_seconds: u64,
    generated_file_names: Vec<String>,
    policy_scenarios_json: Value,
    report_json: Value,
    manifest_json: Value,
    report_markdown: String,
    readme: String,
}

#[derive(Clone, Debug)]
struct PolicyPackageValidationReport {
    package_dir: PathBuf,
    files: Vec<ReadinessPackageFileState>,
    issues: Vec<String>,
}

#[derive(Clone, Debug)]
struct DemoPackageReport {
    output_dir: PathBuf,
    generated_at_unix_seconds: u64,
    generated_file_names: Vec<String>,
    demo_summary_json: Value,
    report_json: Value,
    manifest_json: Value,
    report_markdown: String,
    readme: String,
}

#[derive(Clone, Debug)]
struct DemoPackageValidationReport {
    package_dir: PathBuf,
    files: Vec<ReadinessPackageFileState>,
    issues: Vec<String>,
}

const READINESS_PACKAGE_SCHEMA_VERSION: &str = "ignisprompt-readiness-package-0.1";
const READINESS_PACKAGE_TYPE: &str = "ignisprompt-local-readiness-package";
const READINESS_PACKAGE_MODE: &str = "local-preview";
const READINESS_PACKAGE_REQUIRED_FILES: &[&str] = &[
    "README.md",
    "manifest.json",
    "readiness-summary.json",
    "readiness-report.json",
    "readiness-report.md",
];
const OPERATOR_SUMMARY_SCHEMA_VERSION: &str = "ignisprompt-operator-summary-0.1";
const OPERATOR_PACKAGE_SCHEMA_VERSION: &str = "ignisprompt-operator-package-0.1";
const OPERATOR_PACKAGE_TYPE: &str = "ignisprompt-local-operator-package";
const OPERATOR_PACKAGE_MODE: &str = "local-preview";
const OPERATOR_PACKAGE_REQUIRED_FILES: &[&str] = &[
    "README.md",
    "manifest.json",
    "operator-summary.json",
    "operator-report.json",
    "operator-report.md",
];
const POLICY_SCENARIO_SCHEMA_VERSION: &str = "ignisprompt-policy-scenarios-0.1";
const POLICY_PACKAGE_SCHEMA_VERSION: &str = "ignisprompt-policy-package-0.1";
const POLICY_PACKAGE_TYPE: &str = "ignisprompt-local-policy-package";
const POLICY_PACKAGE_MODE: &str = "local-preview";
const POLICY_PACKAGE_REQUIRED_FILES: &[&str] = &[
    "README.md",
    "manifest.json",
    "policy-scenarios.json",
    "policy-report.json",
    "policy-report.md",
];
const DEMO_SUMMARY_SCHEMA_VERSION: &str = "ignisprompt-demo-summary-0.1";
const DEMO_PACKAGE_SCHEMA_VERSION: &str = "ignisprompt-demo-package-0.1";
const DEMO_PACKAGE_TYPE: &str = "ignisprompt-local-demo-package";
const DEMO_PACKAGE_MODE: &str = "local-preview";
const DEMO_PACKAGE_REQUIRED_FILES: &[&str] = &[
    "README.md",
    "manifest.json",
    "demo-summary.json",
    "demo-report.json",
    "demo-report.md",
];

#[derive(Clone, Copy, Debug)]
struct OperatorSummarySection {
    id: &'static str,
    name: &'static str,
    status: &'static str,
    summary: &'static str,
    next_step: &'static str,
    boundary_note: &'static str,
}

#[derive(Clone, Copy, Debug)]
struct OperatorCommandRecipe {
    id: &'static str,
    label: &'static str,
    command: &'static str,
    purpose: &'static str,
}

#[derive(Clone, Copy, Debug)]
struct PolicyScenario {
    id: &'static str,
    name: &'static str,
    group: &'static str,
    category: &'static str,
    synthetic_summary: &'static str,
    expected_tier: &'static str,
    expected_route: &'static str,
    expected_local_only: bool,
    fail_closed_expected: bool,
    expected_local_behavior: &'static str,
    expected_warning: &'static str,
    local_next_step: &'static str,
    boundary_note: &'static str,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct PolicyScenarioGroup {
    key: &'static str,
    count: usize,
}

#[derive(Clone, Copy, Debug)]
struct DemoStoryStep {
    id: &'static str,
    name: &'static str,
    source_surface: &'static str,
    summary: &'static str,
    talking_point: &'static str,
    local_next_step: &'static str,
    boundary_note: &'static str,
}

const OPERATOR_SUMMARY_SECTIONS: &[OperatorSummarySection] = &[
    OperatorSummarySection {
        id: "local-readiness",
        name: "Local preview readiness",
        status: "status_hints",
        summary: "Review daemon, endpoint, model, runner, audit, and Aethra readiness signals.",
        next_step: "Run cargo run -p ignispromptctl -- readiness, then make readiness-check.",
        boundary_note: "status hints, not controls",
    },
    OperatorSummarySection {
        id: "readiness-package",
        name: "CLI readiness package",
        status: "local_helper",
        summary: "Generate, list, and validate local readiness packages under ignored local-evidence/readiness/ paths.",
        next_step: "Run cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo.",
        boundary_note: "package validation is structural/local only",
    },
    OperatorSummarySection {
        id: "evidence-workflow",
        name: "Evidence bundle workflow",
        status: "local_helper",
        summary: "Use local evidence helpers and demo workflow self-tests for local preview notes.",
        next_step: "Run make evidence-check and ./scripts/demo-local-evidence-workflow.sh --self-test.",
        boundary_note: "local helper checks, not certification",
    },
    OperatorSummarySection {
        id: "aethra-demo-path",
        name: "Aethra demo path",
        status: "fixture_backed",
        summary: "Open Aethra views for fixture-backed readiness, evidence, and command guidance.",
        next_step: "Use manual live-local loading only when local daemon metadata is needed.",
        boundary_note: "read-only with manual live-local loading",
    },
    OperatorSummarySection {
        id: "local-boundaries",
        name: "Local safety boundaries",
        status: "boundary_notes",
        summary: "Keep results local preview only with no telemetry, cloud calls by default, or global aggregation.",
        next_step: "Treat command recipes as copy-only local guidance.",
        boundary_note: "archives and packages are not signed",
    },
    OperatorSummarySection {
        id: "local-policy-workbench",
        name: "Local policy workbench",
        status: "policy_preview",
        summary: "Review synthetic local policy scenarios, route hints, reports, and policy package previews.",
        next_step: "Run cargo run -p ignispromptctl -- policy-scenarios, then make policy-check.",
        boundary_note: "route hints, not guarantees",
    },
];

const POLICY_SCENARIOS: &[PolicyScenario] = &[
    PolicyScenario {
        id: "basic-summarization",
        name: "Basic summarization",
        group: "local task",
        category: "basic summarization",
        synthetic_summary: "Synthetic request for a short local summary using fixture-safe text.",
        expected_tier: "tier_1",
        expected_route: "local_stub",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "route locally with no cloud call by default",
        expected_warning: "route hints, not guarantees",
        local_next_step: "Use route-explain for live local route shape when needed.",
        boundary_note: "policy preview only",
    },
    PolicyScenario {
        id: "legal-sensitive-task",
        name: "Legal-sensitive task",
        group: "sensitive local task",
        category: "legal-sensitive task",
        synthetic_summary: "Synthetic legal-sensitive classification request without real facts.",
        expected_tier: "tier_3",
        expected_route: "local_legal_runner_or_stub",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "keep local and avoid formal legal guidance claims",
        expected_warning: "not a legal service and no formal legal correctness claim",
        local_next_step: "Review route explanation and local preview disclaimer.",
        boundary_note: "route hints, not formal legal guidance",
    },
    PolicyScenario {
        id: "adversarial-document-instruction",
        name: "Adversarial document instruction",
        group: "sensitive local task",
        category: "adversarial document instruction",
        synthetic_summary: "Synthetic document instruction attempts to override local policy.",
        expected_tier: "tier_3",
        expected_route: "fail_closed_or_local_review",
        expected_local_only: true,
        fail_closed_expected: true,
        expected_local_behavior: "treat embedded instruction as untrusted input",
        expected_warning: "route hints, not guarantees",
        local_next_step: "Keep adversarial document instructions separated from operator guidance.",
        boundary_note: "local helper checks, not certification",
    },
    PolicyScenario {
        id: "local-evidence-request",
        name: "Local evidence request",
        group: "local helper request",
        category: "local evidence request",
        synthetic_summary: "Synthetic request for local evidence bundle workflow guidance.",
        expected_tier: "helper",
        expected_route: "local_evidence_guidance",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior:
            "provide local evidence workflow guidance without package contents",
        expected_warning: "local helper checks, not certification",
        local_next_step: "Run make evidence-check and keep outputs under local-evidence/.",
        boundary_note: "local helper checks, not certification",
    },
    PolicyScenario {
        id: "local-readiness-request",
        name: "Local readiness request",
        group: "local helper request",
        category: "local readiness request",
        synthetic_summary: "Synthetic request for local readiness summary guidance.",
        expected_tier: "helper",
        expected_route: "local_readiness_guidance",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "provide readiness status hints and local next steps",
        expected_warning: "status hints, not controls",
        local_next_step: "Run make readiness-check before sharing local preview notes.",
        boundary_note: "status hints, not controls",
    },
    PolicyScenario {
        id: "local-operator-request",
        name: "Local operator request",
        group: "local helper request",
        category: "local operator request",
        synthetic_summary: "Synthetic request for local operator workflow guidance.",
        expected_tier: "helper",
        expected_route: "local_operator_guidance",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "provide copy-only operator workflow commands",
        expected_warning: "local helper checks, not certification",
        local_next_step: "Run make operator-check and treat commands as copy-only.",
        boundary_note: "status hints, not controls",
    },
    PolicyScenario {
        id: "policy-package-request",
        name: "Policy package request",
        group: "local helper request",
        category: "policy package request",
        synthetic_summary: "Synthetic request for policy package generation guidance.",
        expected_tier: "helper",
        expected_route: "local_policy_package_guidance",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "write only under ignored local-evidence/policy/ paths",
        expected_warning: "package validation is structural/local only",
        local_next_step: "Run policy-scenarios package output, list, and validate commands.",
        boundary_note: "package validation is structural/local only",
    },
    PolicyScenario {
        id: "sustainability-preview-request",
        name: "Sustainability preview request",
        group: "local preview request",
        category: "sustainability preview request",
        synthetic_summary: "Synthetic request for local proxy sustainability indicators.",
        expected_tier: "tier_2",
        expected_route: "local_metrics_preview",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "show proxy-only sustainability indicators",
        expected_warning: "not actual carbon accounting",
        local_next_step: "Check sustainability methodology notes before sharing demo copy.",
        boundary_note: "proxy-only indicators",
    },
    PolicyScenario {
        id: "unsupported-cloud-required-request",
        name: "Unsupported cloud-required request",
        group: "unsupported request",
        category: "unsupported/cloud-required request",
        synthetic_summary: "Synthetic request that would need cloud-only capabilities.",
        expected_tier: "unsupported",
        expected_route: "fail_closed",
        expected_local_only: true,
        fail_closed_expected: true,
        expected_local_behavior: "fail closed unless an explicit future policy allows otherwise",
        expected_warning: "no cloud calls by default",
        local_next_step: "Document unsupported scope instead of adding a cloud fallback.",
        boundary_note: "local preview only",
    },
    PolicyScenario {
        id: "ambiguous-sensitive-request",
        name: "Ambiguous sensitive request",
        group: "sensitive local task",
        category: "ambiguous request",
        synthetic_summary: "Synthetic ambiguous request with sensitive-sounding context.",
        expected_tier: "tier_3",
        expected_route: "conservative_local_review",
        expected_local_only: true,
        fail_closed_expected: false,
        expected_local_behavior: "prefer conservative local review over broad automation",
        expected_warning: "route hints, not guarantees",
        local_next_step: "Ask for clearer local-preview scope before expanding automation.",
        boundary_note: "policy preview only",
    },
];

const OPERATOR_COMMAND_RECIPES: &[OperatorCommandRecipe] = &[
    OperatorCommandRecipe {
        id: "start-dev",
        label: "Start local daemon",
        command: "./scripts/start-dev.sh",
        purpose: "Start the local preview daemon from the repo root.",
    },
    OperatorCommandRecipe {
        id: "doctor",
        label: "Run local doctor",
        command: "cargo run -p ignispromptctl -- doctor",
        purpose: "Check local daemon endpoint shape from the terminal.",
    },
    OperatorCommandRecipe {
        id: "readiness",
        label: "Run readiness summary",
        command: "cargo run -p ignispromptctl -- readiness",
        purpose: "Summarize local preview readiness.",
    },
    OperatorCommandRecipe {
        id: "readiness-json",
        label: "Run readiness JSON",
        command: "cargo run -p ignispromptctl -- readiness --json",
        purpose: "Print safe structured readiness diagnostics.",
    },
    OperatorCommandRecipe {
        id: "readiness-package-output",
        label: "Generate readiness package",
        command: "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo",
        purpose: "Write a local-only readiness package under ignored local-evidence/readiness/.",
    },
    OperatorCommandRecipe {
        id: "readiness-package-list",
        label: "List readiness package",
        command: "cargo run -p ignispromptctl -- readiness --package-list local-evidence/readiness/demo",
        purpose: "List package files without calling the daemon.",
    },
    OperatorCommandRecipe {
        id: "readiness-package-validate",
        label: "Validate readiness package",
        command: "cargo run -p ignispromptctl -- readiness --package-validate local-evidence/readiness/demo",
        purpose: "Validate required package files with local structural checks.",
    },
    OperatorCommandRecipe {
        id: "readiness-check",
        label: "Run readiness quality gate",
        command: "make readiness-check",
        purpose: "Run deterministic readiness and report safety checks.",
    },
    OperatorCommandRecipe {
        id: "operator-package-output",
        label: "Generate operator package",
        command: "cargo run -p ignispromptctl -- operator-summary --package-output local-evidence/operator/demo",
        purpose: "Write a local-only operator package under ignored local-evidence/operator/.",
    },
    OperatorCommandRecipe {
        id: "operator-package-list",
        label: "List operator package",
        command: "cargo run -p ignispromptctl -- operator-summary --package-list local-evidence/operator/demo",
        purpose: "List operator package files without calling the daemon.",
    },
    OperatorCommandRecipe {
        id: "operator-package-validate",
        label: "Validate operator package",
        command: "cargo run -p ignispromptctl -- operator-summary --package-validate local-evidence/operator/demo",
        purpose: "Validate required operator package files with local structural checks.",
    },
    OperatorCommandRecipe {
        id: "policy-scenarios",
        label: "Inspect policy scenarios",
        command: "cargo run -p ignispromptctl -- policy-scenarios",
        purpose: "Review synthetic local-preview policy route hints.",
    },
    OperatorCommandRecipe {
        id: "policy-scenarios-json",
        label: "Inspect policy scenario JSON",
        command: "cargo run -p ignispromptctl -- policy-scenarios --json",
        purpose: "Print safe structured policy scenario guidance.",
    },
    OperatorCommandRecipe {
        id: "policy-package-output",
        label: "Generate policy package",
        command: "cargo run -p ignispromptctl -- policy-scenarios --package-output local-evidence/policy/demo",
        purpose: "Write a local-only policy package under ignored local-evidence/policy/.",
    },
    OperatorCommandRecipe {
        id: "policy-package-validate",
        label: "Validate policy package",
        command: "cargo run -p ignispromptctl -- policy-scenarios --package-validate local-evidence/policy/demo",
        purpose: "Validate required policy package files with local structural checks.",
    },
    OperatorCommandRecipe {
        id: "policy-check",
        label: "Run policy quality gate",
        command: "make policy-check",
        purpose: "Run deterministic local policy workbench checks.",
    },
    OperatorCommandRecipe {
        id: "evidence-check",
        label: "Run evidence quality gate",
        command: "make evidence-check",
        purpose: "Run deterministic local evidence workflow checks.",
    },
    OperatorCommandRecipe {
        id: "demo-self-test",
        label: "Run demo workflow self-test",
        command: "./scripts/demo-local-evidence-workflow.sh --self-test",
        purpose: "Verify demo workflow command construction and ignored paths.",
    },
];

const DEMO_STORY_STEPS: &[DemoStoryStep] = &[
    DemoStoryStep {
        id: "local-readiness",
        name: "Local readiness",
        source_surface: "Aethra Local Readiness",
        summary: "Show local preview readiness status hints before the demo story.",
        talking_point: "Readiness values are local preview status hints, not controls.",
        local_next_step: "Run make readiness-check before a public local preview walkthrough.",
        boundary_note: "status hints, not controls",
    },
    DemoStoryStep {
        id: "operator-workflow",
        name: "Operator workflow",
        source_surface: "Aethra Local Operator Console",
        summary: "Review copy-only command recipes and local operator package status.",
        talking_point: "Commands are safe snippets for a terminal and are not executed by Aethra.",
        local_next_step: "Run make operator-check and keep packages under local-evidence/operator/.",
        boundary_note: "local helper checks, not certification",
    },
    DemoStoryStep {
        id: "evidence-workflow",
        name: "Evidence workflow",
        source_surface: "Aethra Evidence Bundle Viewer",
        summary: "Show local evidence bundle workflow shape without generated evidence contents.",
        talking_point: "Evidence bundles are local helper output and are not signed.",
        local_next_step: "Run make evidence-check and keep output under local-evidence/.",
        boundary_note: "package validation is structural/local only",
    },
    DemoStoryStep {
        id: "policy-scenarios",
        name: "Policy scenarios",
        source_surface: "Aethra Local Policy Workbench",
        summary: "Show synthetic policy scenarios and route hints.",
        talking_point: "Policy scenarios are synthetic route hints, not guarantees.",
        local_next_step: "Run make policy-check and review policy package validation locally.",
        boundary_note: "route hints, not guarantees",
    },
    DemoStoryStep {
        id: "aethra-review",
        name: "Aethra review",
        source_surface: "Aethra fixture-backed dashboard",
        summary: "Walk through read-only fixture-backed views with manual live-local loading only when selected.",
        talking_point: "Aethra observes local preview state and does not change routing or runner behavior.",
        local_next_step: "Use fixture mode by default and switch to live-local only for manual local checks.",
        boundary_note: "fixture-backed by default with manual live-local loading",
    },
    DemoStoryStep {
        id: "export-package-summary",
        name: "Export package summary",
        source_surface: "ignispromptctl demo-summary",
        summary: "Generate a copy-safe demo summary or local demo package.",
        talking_point: "Demo packages are local-only helper outputs and are not signed.",
        local_next_step: "Run cargo run -p ignispromptctl -- demo-summary --package-output local-evidence/demo-studio/demo.",
        boundary_note: "local preview demo only",
    },
];

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
        id: "model_inventory",
        label: "local model inventory",
        path: "/v1/models/inventory",
        level: DoctorCheckLevel::Informational,
        validate: validate_doctor_model_inventory,
    },
    DoctorCheckSpec {
        id: "capabilities",
        label: "connector and capability status",
        path: "/v1/capabilities",
        level: DoctorCheckLevel::Required,
        validate: validate_doctor_capabilities,
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

fn cmd_readiness(
    base_url: &str,
    json_output: bool,
    markdown_output: bool,
    package_output: &Option<String>,
    package_validate: &Option<String>,
    package_list: &Option<String>,
) {
    if let Some(package_dir) = package_validate {
        let report = match build_readiness_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_readiness_package_validation_json(&report));
        } else {
            println!("{}", format_readiness_package_validation_summary(&report));
        }
        if !report.issues.is_empty() {
            process::exit(1);
        }
        return;
    }

    if let Some(package_dir) = package_list {
        let report = match build_readiness_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_readiness_package_list_json(&report));
        } else {
            println!("{}", format_readiness_package_list_summary(&report));
        }
        return;
    }

    let report = build_doctor_report(base_url);
    let is_ready = report.required_checks_passed();

    if let Some(output) = package_output {
        let output_dir = match validate_readiness_package_output_dir(output) {
            Ok(path) => path,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        let package = match build_readiness_package_report(output_dir, &report) {
            Ok(package) => package,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if let Err(message) = write_readiness_package_report(&package) {
            eprintln!("error: {}", message);
            process::exit(1);
        }

        if json_output {
            println!("{}", format_readiness_package_summary_json(&package));
        } else if markdown_output {
            println!("{}", package.report_markdown);
        } else {
            println!("{}", format_readiness_package_summary(&package));
        }
    } else if json_output {
        println!("{}", format_readiness_json(&report));
    } else if markdown_output {
        println!("{}", format_readiness_markdown(&report));
    } else {
        println!("{}", format_readiness_summary(&report));
    }

    if !is_ready {
        process::exit(1);
    }
}

fn cmd_operator_summary(
    json_output: bool,
    package_output: &Option<String>,
    package_validate: &Option<String>,
    package_list: &Option<String>,
) {
    if let Some(package_dir) = package_validate {
        let report = match build_operator_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_operator_package_validation_json(&report));
        } else {
            println!("{}", format_operator_package_validation_summary(&report));
        }
        if !report.issues.is_empty() {
            process::exit(1);
        }
        return;
    }

    if let Some(package_dir) = package_list {
        let report = match build_operator_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_operator_package_list_json(&report));
        } else {
            println!("{}", format_operator_package_list_summary(&report));
        }
        return;
    }

    if let Some(output) = package_output {
        let output_dir = match validate_operator_package_output_dir(output) {
            Ok(path) => path,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        let package = match build_operator_package_report(output_dir) {
            Ok(package) => package,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if let Err(message) = write_operator_package_report(&package) {
            eprintln!("error: {}", message);
            process::exit(1);
        }

        if json_output {
            println!("{}", format_operator_package_summary_json(&package));
        } else {
            println!("{}", format_operator_package_summary(&package));
        }
        return;
    }

    if json_output {
        println!("{}", format_operator_summary_json());
    } else {
        println!("{}", format_operator_summary());
    }
}

fn cmd_policy_scenarios(
    json_output: bool,
    report_output: bool,
    package_output: &Option<String>,
    package_validate: &Option<String>,
    package_list: &Option<String>,
) {
    if let Some(package_dir) = package_validate {
        let report = match build_policy_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_policy_package_validation_json(&report));
        } else {
            println!("{}", format_policy_package_validation_summary(&report));
        }
        if !report.issues.is_empty() {
            process::exit(1);
        }
        return;
    }

    if let Some(package_dir) = package_list {
        let report = match build_policy_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_policy_package_list_json(&report));
        } else {
            println!("{}", format_policy_package_list_summary(&report));
        }
        return;
    }

    if let Some(output) = package_output {
        let output_dir = match validate_policy_package_output_dir(output) {
            Ok(path) => path,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        let package = match build_policy_package_report(output_dir) {
            Ok(package) => package,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if let Err(message) = write_policy_package_report(&package) {
            eprintln!("error: {}", message);
            process::exit(1);
        }

        if json_output {
            println!("{}", format_policy_package_summary_json(&package));
        } else {
            println!("{}", format_policy_package_summary(&package));
        }
        return;
    }

    if json_output {
        println!("{}", format_policy_scenarios_json());
    } else if report_output {
        println!("{}", format_policy_scenarios_report());
    } else {
        println!("{}", format_policy_scenarios_summary());
    }
}

fn cmd_demo_summary(
    json_output: bool,
    report_output: bool,
    package_output: &Option<String>,
    package_validate: &Option<String>,
    package_list: &Option<String>,
) {
    if let Some(package_dir) = package_validate {
        let report = match build_demo_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_demo_package_validation_json(&report));
        } else {
            println!("{}", format_demo_package_validation_summary(&report));
        }
        if !report.issues.is_empty() {
            process::exit(1);
        }
        return;
    }

    if let Some(package_dir) = package_list {
        let report = match build_demo_package_validation_report(Path::new(package_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_demo_package_list_json(&report));
        } else {
            println!("{}", format_demo_package_list_summary(&report));
        }
        return;
    }

    if let Some(output) = package_output {
        let output_dir = match validate_demo_package_output_dir(output) {
            Ok(path) => path,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        let package = match build_demo_package_report(output_dir) {
            Ok(package) => package,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if let Err(message) = write_demo_package_report(&package) {
            eprintln!("error: {}", message);
            process::exit(1);
        }

        if json_output {
            println!("{}", format_demo_package_summary_json(&package));
        } else {
            println!("{}", format_demo_package_summary(&package));
        }
        return;
    }

    if json_output {
        println!("{}", format_demo_summary_json());
    } else if report_output {
        println!("{}", format_demo_summary_report());
    } else {
        println!("{}", format_demo_summary());
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
        lines.push("[ok] Local preview daemon appears ready.".to_string());
    } else {
        lines.push("[failed] Required local preview checks failed.".to_string());
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
        format!("[ok] {}: {}", check.label, check.summary)
    } else {
        format!(
            "[failed] {}: {}",
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

fn format_readiness_summary(report: &DoctorReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Readiness".to_string(),
        "Daemon endpoint details: summarized without local URL values".to_string(),
        "".to_string(),
        "Scope:".to_string(),
        "- local preview readiness only".to_string(),
        "- status hints, not controls".to_string(),
        "- local helper checks, not certification".to_string(),
        "- manual live-local loading remains explicit in Aethra".to_string(),
        "- no telemetry or cloud calls are added by this command".to_string(),
        "".to_string(),
    ];

    let required_checks = report
        .checks
        .iter()
        .filter(|check| check.level == DoctorCheckLevel::Required)
        .collect::<Vec<_>>();
    if !required_checks.is_empty() {
        lines.push("Readiness checks:".to_string());
        for check in required_checks {
            lines.push(format_readiness_summary_check_line(check));
        }
        lines.push("".to_string());
    }

    let informational_checks = report
        .checks
        .iter()
        .filter(|check| check.level == DoctorCheckLevel::Informational)
        .collect::<Vec<_>>();
    if !informational_checks.is_empty() {
        lines.push("Status hints:".to_string());
        for check in informational_checks {
            lines.push(format_readiness_summary_check_line(check));
        }
        lines.push("".to_string());
    }

    lines.push("Local helper checks:".to_string());
    lines.push("- make readiness-check".to_string());
    lines.push("- make evidence-check".to_string());
    lines.push("- make dev-check".to_string());
    lines.push("".to_string());

    lines.push("Result:".to_string());
    if report.required_checks_passed() {
        lines.push("[ok] Local preview readiness checks passed.".to_string());
    } else {
        lines.push("[failed] Required local preview readiness checks failed.".to_string());
        lines.push("".to_string());
        lines.push("Next steps:".to_string());
        for step in readiness_report_next_steps(report) {
            lines.push(format!("- {}", step));
        }
    }

    lines.join("\n")
}

fn format_readiness_summary_check_line(check: &DoctorCheckResult) -> String {
    let status = if check.ok { "ok" } else { "failed" };
    format!(
        "[{}] {}: {}",
        status,
        sanitize_readiness_report_text(check.label),
        sanitize_readiness_report_text(&check.summary)
    )
}

fn format_readiness_json(report: &DoctorReport) -> String {
    let checks = report
        .checks
        .iter()
        .map(|check| {
            json!({
                "id": check.id,
                "name": sanitize_readiness_report_text(check.label),
                "category": readiness_check_category(check.id),
                "severity": readiness_check_severity(check),
                "status": if check.ok { "ok" } else { "needs_attention" },
                "result": if check.ok { "passed" } else { "needs_attention" },
                "local_next_step": readiness_check_next_step(check),
                "boundary_note": readiness_check_boundary_note(check),
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "readiness_schema_version": "ignisprompt-readiness-diagnostics-0.1",
        "status": if report.required_checks_passed() { "local_preview_ready" } else { "needs_attention" },
        "overall_status": if report.required_checks_passed() { "local_preview_ready" } else { "needs_attention" },
        "scope": {
            "local_preview_readiness_only": true,
            "status_hints_not_controls": true,
            "local_helper_checks_not_certification": true,
            "manual_live_local_loading": true,
            "no_telemetry_added": true,
            "no_cloud_calls_added": true,
        },
        "checks": checks,
        "local_helper_checks": [
            "make readiness-check",
            "make evidence-check",
            "make dev-check",
        ],
        "next_steps": readiness_report_next_steps(report),
    }))
    .unwrap_or_default()
}

fn format_readiness_markdown(report: &DoctorReport) -> String {
    let mut lines = vec![
        "# IgnisPrompt Local Readiness Report".to_string(),
        "".to_string(),
        "This report is local preview readiness only. It is safe to paste into an issue or demo note because it omits daemon URLs, network names, user account names, device-specific identifiers, absolute paths, sensitive input content, audit event bodies, private credentials, and generated evidence contents.".to_string(),
        "".to_string(),
        "## Summary".to_string(),
        "".to_string(),
        format!(
            "- overall_status: {}",
            if report.required_checks_passed() {
                "local_preview_ready"
            } else {
                "needs_attention"
            }
        ),
        "- daemon_endpoint_checks: summarized when available".to_string(),
        "- Aethra loading: manual live-local loading".to_string(),
        "- report_mode: copy-safe Markdown".to_string(),
        "".to_string(),
        "## Readiness Checks".to_string(),
        "".to_string(),
    ];

    let required_checks = report
        .checks
        .iter()
        .filter(|check| check.level == DoctorCheckLevel::Required)
        .collect::<Vec<_>>();
    if required_checks.is_empty() {
        lines.push("- No required check summaries available.".to_string());
    } else {
        for check in required_checks {
            lines.push(format_readiness_report_check_line(check));
        }
    }

    let informational_checks = report
        .checks
        .iter()
        .filter(|check| check.level == DoctorCheckLevel::Informational)
        .collect::<Vec<_>>();
    lines.push("".to_string());
    lines.push("## Status Hints".to_string());
    lines.push("".to_string());
    if informational_checks.is_empty() {
        lines.push("- No informational status hints available.".to_string());
    } else {
        for check in informational_checks {
            lines.push(format_readiness_report_check_line(check));
        }
    }

    lines.extend([
        "".to_string(),
        "## Local Preview Checklist".to_string(),
        "".to_string(),
        "- Fixture-backed Aethra data can render without a daemon.".to_string(),
        "- Manual live-local loading is explicit in Aethra.".to_string(),
        "- Daemon health, version/status, configured models, and model/runner status hints are review inputs.".to_string(),
        "- Evidence workflow availability is checked through local helper checks.".to_string(),
        "- Security and evidence checks are local helper checks, not certification.".to_string(),
        "".to_string(),
        "## Boundary Notes".to_string(),
        "".to_string(),
        "- status hints, not controls".to_string(),
        "- local helper checks, not certification".to_string(),
        "- no production deployment approval".to_string(),
        "- no telemetry added".to_string(),
        "- no cloud calls added".to_string(),
        "- no uploads or persistence added".to_string(),
        "".to_string(),
        "## Local Helper Commands".to_string(),
        "".to_string(),
        "- cargo run -p ignispromptctl -- readiness".to_string(),
        "- cargo run -p ignispromptctl -- readiness --json".to_string(),
        "- cargo run -p ignispromptctl -- readiness --markdown".to_string(),
        "- make readiness-check".to_string(),
        "- make evidence-check".to_string(),
        "- make dev-check".to_string(),
        "".to_string(),
    ]);

    lines.join("\n")
}

fn format_readiness_report_check_line(check: &DoctorCheckResult) -> String {
    let status = if check.ok { "ok" } else { "needs_attention" };
    format!(
        "- {}: {} (category: {}; severity: {}; next step: {})",
        sanitize_readiness_report_text(check.label),
        status,
        readiness_check_category(check.id),
        readiness_check_severity(check),
        sanitize_readiness_report_text(&readiness_check_next_step(check))
    )
}

fn format_operator_summary() -> String {
    let mut lines = vec![
        "IgnisPrompt Local Operator Summary".to_string(),
        "".to_string(),
        "Scope:".to_string(),
        "- local preview operator workflow only".to_string(),
        "- status hints, not controls".to_string(),
        "- local helper checks, not certification".to_string(),
        "- package validation is structural/local only".to_string(),
        "- archives and packages are not signed".to_string(),
        "- no telemetry, no global aggregation, and no cloud calls by default".to_string(),
        "- Aethra remains fixture-backed by default with manual live-local loading".to_string(),
        "".to_string(),
        "Operator sections:".to_string(),
    ];

    for section in OPERATOR_SUMMARY_SECTIONS {
        lines.push(format!(
            "- {}: {} ({})",
            sanitize_readiness_report_text(section.name),
            sanitize_readiness_report_text(section.summary),
            sanitize_readiness_report_text(section.boundary_note)
        ));
        lines.push(format!(
            "  next step: {}",
            sanitize_readiness_report_text(section.next_step)
        ));
    }

    lines.push("".to_string());
    lines.push("Copy-only command recipes:".to_string());
    for recipe in OPERATOR_COMMAND_RECIPES {
        lines.push(format!(
            "- {}",
            sanitize_readiness_report_text(recipe.command)
        ));
    }

    lines.join("\n")
}

fn format_operator_summary_json() -> String {
    let sections = OPERATOR_SUMMARY_SECTIONS
        .iter()
        .map(|section| {
            json!({
                "id": section.id,
                "name": sanitize_readiness_report_text(section.name),
                "status": section.status,
                "summary": sanitize_readiness_report_text(section.summary),
                "local_next_step": sanitize_readiness_report_text(section.next_step),
                "boundary_note": sanitize_readiness_report_text(section.boundary_note),
            })
        })
        .collect::<Vec<_>>();
    let commands = OPERATOR_COMMAND_RECIPES
        .iter()
        .map(|recipe| {
            json!({
                "id": recipe.id,
                "label": sanitize_readiness_report_text(recipe.label),
                "command": sanitize_readiness_report_text(recipe.command),
                "purpose": sanitize_readiness_report_text(recipe.purpose),
                "execution_mode": "copy_only",
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "operator_summary_schema_version": OPERATOR_SUMMARY_SCHEMA_VERSION,
        "mode": "local-preview",
        "status": "operator_guidance",
        "scope": {
            "local_preview_operator_workflow_only": true,
            "status_hints_not_controls": true,
            "local_helper_checks_not_certification": true,
            "structural_local_package_validation_only": true,
            "archives_and_packages_not_signed": true,
            "aethra_fixture_backed_by_default": true,
            "manual_live_local_loading": true,
            "no_telemetry": true,
            "no_cloud_calls_by_default": true,
            "no_global_aggregation": true,
        },
        "sections": sections,
        "commands": commands,
        "boundary_notes": [
            "local preview operator workflow only",
            "status hints, not controls",
            "local helper checks, not certification",
            "package validation is structural/local only",
            "archives and packages are not signed",
            "not production attestation",
        ],
    }))
    .unwrap_or_default()
}

fn format_policy_scenarios_summary() -> String {
    let mut lines = vec![
        "IgnisPrompt Local Policy Scenarios".to_string(),
        "".to_string(),
        "Scope:".to_string(),
        "- policy preview only".to_string(),
        "- synthetic scenarios only".to_string(),
        "- route hints, not guarantees".to_string(),
        "- local helper checks, not certification".to_string(),
        "- no formal legal guidance or correctness claim".to_string(),
        "- no telemetry, no global aggregation, and no cloud calls by default".to_string(),
        "".to_string(),
        "Scenario groups:".to_string(),
    ];

    for group in policy_scenario_groups_by_category() {
        lines.push(format!("- {}: {}", group.key, group.count));
    }

    lines.extend(["".to_string(), "Scenarios:".to_string()]);

    for scenario in POLICY_SCENARIOS {
        lines.push(format!(
            "- {}: {} -> {} ({})",
            sanitize_readiness_report_text(scenario.name),
            sanitize_readiness_report_text(scenario.category),
            sanitize_readiness_report_text(scenario.expected_route),
            sanitize_readiness_report_text(scenario.boundary_note)
        ));
        lines.push(format!(
            "  next step: {}",
            sanitize_readiness_report_text(scenario.local_next_step)
        ));
    }

    lines.push("".to_string());
    lines.push("Local helper commands:".to_string());
    lines.push("- cargo run -p ignispromptctl -- policy-scenarios --json".to_string());
    lines.push("- cargo run -p ignispromptctl -- policy-scenarios --report".to_string());
    lines.push(
        "- cargo run -p ignispromptctl -- policy-scenarios --package-output local-evidence/policy/demo"
            .to_string(),
    );
    lines.push("- make policy-check".to_string());
    lines.join("\n")
}

fn format_policy_scenarios_json() -> String {
    let scenarios = POLICY_SCENARIOS
        .iter()
        .map(|scenario| {
            json!({
                "id": scenario.id,
                "name": sanitize_readiness_report_text(scenario.name),
                "group": sanitize_readiness_report_text(scenario.group),
                "category": sanitize_readiness_report_text(scenario.category),
                "synthetic_summary": sanitize_readiness_report_text(scenario.synthetic_summary),
                "expected_tier": scenario.expected_tier,
                "expected_route": scenario.expected_route,
                "expected_local_only": scenario.expected_local_only,
                "fail_closed_expected": scenario.fail_closed_expected,
                "expected_local_behavior": sanitize_readiness_report_text(scenario.expected_local_behavior),
                "expected_warning": sanitize_readiness_report_text(scenario.expected_warning),
                "local_next_step": sanitize_readiness_report_text(scenario.local_next_step),
                "boundary_note": sanitize_readiness_report_text(scenario.boundary_note),
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "policy_scenario_schema_version": POLICY_SCENARIO_SCHEMA_VERSION,
        "mode": "local-preview",
        "status": "policy_preview",
        "scope": {
            "policy_preview_only": true,
            "synthetic_scenarios_only": true,
            "route_hints_not_guarantees": true,
            "local_helper_checks_not_certification": true,
            "no_formal_legal_guidance": true,
            "no_formal_legal_correctness_claim": true,
            "no_telemetry": true,
            "no_cloud_calls_by_default": true,
            "no_global_aggregation": true,
        },
        "groups": policy_scenario_groups_json(),
        "scenarios": scenarios,
        "boundary_notes": policy_package_boundaries(),
    }))
    .unwrap_or_default()
}

fn format_policy_scenarios_report() -> String {
    let mut lines = vec![
        "# IgnisPrompt Local Policy Scenario Report".to_string(),
        "".to_string(),
        "This report is policy preview only. It uses synthetic scenarios and route hints, not guarantees. It omits sensitive input content, daemon URLs, network names, user account names, device-specific identifiers, absolute paths, audit event bodies, private credentials, generated evidence contents, and model file contents.".to_string(),
        "".to_string(),
        "## Boundaries".to_string(),
        "".to_string(),
    ];
    for boundary in policy_package_boundaries() {
        lines.push(format!("- {}", boundary));
    }

    lines.extend([
        "".to_string(),
        "## Scenario Groups".to_string(),
        "".to_string(),
    ]);
    for group in policy_scenario_groups_by_category() {
        lines.push(format!("- category {}: {}", group.key, group.count));
    }
    for group in policy_scenario_groups_by_expected_tier() {
        lines.push(format!("- expected_tier {}: {}", group.key, group.count));
    }
    for group in policy_scenario_groups_by_boundary_note() {
        lines.push(format!("- boundary {}: {}", group.key, group.count));
    }
    lines.push(format!(
        "- local_only_expected: {}",
        policy_scenarios_expected_local_only().len()
    ));
    lines.push(format!(
        "- fail_closed_expected: {}",
        policy_scenarios_expected_fail_closed().len()
    ));

    lines.extend([
        "".to_string(),
        "## Synthetic Scenarios".to_string(),
        "".to_string(),
    ]);
    for scenario in POLICY_SCENARIOS {
        lines.push(format!(
            "- {}: category={}, expected_route={}, expected_tier={}, next_step={}, boundary={}",
            sanitize_readiness_report_text(scenario.name),
            sanitize_readiness_report_text(scenario.category),
            sanitize_readiness_report_text(scenario.expected_route),
            sanitize_readiness_report_text(scenario.expected_tier),
            sanitize_readiness_report_text(scenario.local_next_step),
            sanitize_readiness_report_text(scenario.boundary_note)
        ));
    }

    lines.extend([
        "".to_string(),
        "## Local Helper Commands".to_string(),
        "".to_string(),
        "- cargo run -p ignispromptctl -- policy-scenarios".to_string(),
        "- cargo run -p ignispromptctl -- policy-scenarios --json".to_string(),
        "- cargo run -p ignispromptctl -- policy-scenarios --report".to_string(),
        "- make policy-check".to_string(),
        "".to_string(),
    ]);
    lines.join("\n")
}

fn policy_scenario_groups_by_category() -> Vec<PolicyScenarioGroup> {
    policy_scenario_groups_by(|scenario| scenario.group)
}

fn policy_scenario_groups_by_expected_tier() -> Vec<PolicyScenarioGroup> {
    policy_scenario_groups_by(|scenario| scenario.expected_tier)
}

fn policy_scenario_groups_by_boundary_note() -> Vec<PolicyScenarioGroup> {
    policy_scenario_groups_by(|scenario| scenario.boundary_note)
}

fn policy_scenarios_expected_local_only() -> Vec<&'static PolicyScenario> {
    POLICY_SCENARIOS
        .iter()
        .filter(|scenario| scenario.expected_local_only)
        .collect()
}

fn policy_scenarios_expected_fail_closed() -> Vec<&'static PolicyScenario> {
    POLICY_SCENARIOS
        .iter()
        .filter(|scenario| scenario.fail_closed_expected)
        .collect()
}

fn policy_scenarios_with_boundary_note(note: &str) -> Vec<&'static PolicyScenario> {
    POLICY_SCENARIOS
        .iter()
        .filter(|scenario| scenario.boundary_note == note)
        .collect()
}

fn policy_scenario_groups_by(
    key_fn: fn(&PolicyScenario) -> &'static str,
) -> Vec<PolicyScenarioGroup> {
    let mut groups: Vec<PolicyScenarioGroup> = Vec::new();
    for scenario in POLICY_SCENARIOS {
        let key = key_fn(scenario);
        if let Some(group) = groups.iter_mut().find(|group| group.key == key) {
            group.count += 1;
        } else {
            groups.push(PolicyScenarioGroup { key, count: 1 });
        }
    }
    groups.sort_by(|left, right| left.key.cmp(right.key));
    groups
}

fn policy_scenario_groups_json() -> Value {
    json!({
        "by_category": policy_scenario_groups_by_category()
            .iter()
            .map(|group| json!({ "key": group.key, "count": group.count }))
            .collect::<Vec<_>>(),
        "by_expected_tier": policy_scenario_groups_by_expected_tier()
            .iter()
            .map(|group| json!({ "key": group.key, "count": group.count }))
            .collect::<Vec<_>>(),
        "by_boundary_note": policy_scenario_groups_by_boundary_note()
            .iter()
            .map(|group| json!({ "key": group.key, "count": group.count }))
            .collect::<Vec<_>>(),
        "structural_local_package_validation_count": policy_scenarios_with_boundary_note(
            "package validation is structural/local only",
        ).len(),
        "local_only_expected_count": policy_scenarios_expected_local_only().len(),
        "fail_closed_expected_count": policy_scenarios_expected_fail_closed().len(),
    })
}

fn format_demo_summary() -> String {
    let mut lines = vec![
        "IgnisPrompt Local Demo Summary".to_string(),
        "".to_string(),
        "Scope:".to_string(),
        "- local preview demo only".to_string(),
        "- route/status/package values are hints, not guarantees".to_string(),
        "- local helper checks, not certification".to_string(),
        "- no formal legal guidance or correctness claim".to_string(),
        "- no telemetry, no global aggregation, and no cloud calls by default".to_string(),
        "- Aethra remains fixture-backed by default with manual live-local loading".to_string(),
        "".to_string(),
        "Demo story steps:".to_string(),
    ];

    for step in DEMO_STORY_STEPS {
        lines.push(format!(
            "- {}: {} ({})",
            sanitize_readiness_report_text(step.name),
            sanitize_readiness_report_text(step.summary),
            sanitize_readiness_report_text(step.boundary_note)
        ));
        lines.push(format!(
            "  next step: {}",
            sanitize_readiness_report_text(step.local_next_step)
        ));
    }

    lines.push("".to_string());
    lines.push("Local helper commands:".to_string());
    lines.push("- cargo run -p ignispromptctl -- demo-summary --json".to_string());
    lines.push("- cargo run -p ignispromptctl -- demo-summary --report".to_string());
    lines.push(
        "- cargo run -p ignispromptctl -- demo-summary --package-output local-evidence/demo-studio/demo"
            .to_string(),
    );
    lines.push("- make demo-check".to_string());
    lines.join("\n")
}

fn format_demo_summary_json() -> String {
    let steps = DEMO_STORY_STEPS
        .iter()
        .map(|step| {
            json!({
                "id": step.id,
                "name": sanitize_readiness_report_text(step.name),
                "source_surface": sanitize_readiness_report_text(step.source_surface),
                "summary": sanitize_readiness_report_text(step.summary),
                "talking_point": sanitize_readiness_report_text(step.talking_point),
                "local_next_step": sanitize_readiness_report_text(step.local_next_step),
                "boundary_note": sanitize_readiness_report_text(step.boundary_note),
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "demo_summary_schema_version": DEMO_SUMMARY_SCHEMA_VERSION,
        "mode": "local-preview",
        "status": "demo_guidance",
        "scope": {
            "local_preview_demo_only": true,
            "synthetic_story_steps_only": true,
            "route_status_package_values_are_hints_not_guarantees": true,
            "route_status_package_hints_only": true,
            "local_helper_checks_not_certification": true,
            "package_validation_structural_local_only": true,
            "not_signed": true,
            "no_formal_legal_guidance": true,
            "no_formal_legal_correctness_claim": true,
            "aethra_fixture_backed_by_default": true,
            "manual_live_local_loading": true,
            "no_telemetry": true,
            "no_cloud_calls_by_default": true,
            "no_global_aggregation": true,
        },
        "story_steps": steps,
        "related_checks": [
            "make readiness-check",
            "make operator-check",
            "make evidence-check",
            "make policy-check",
            "make demo-check"
        ],
        "boundary_notes": demo_package_boundaries(),
    }))
    .unwrap_or_default()
}

fn format_demo_summary_report() -> String {
    let mut lines = vec![
        "# IgnisPrompt Local Demo Summary Report".to_string(),
        "".to_string(),
        "This report is local preview demo guidance only. It uses synthetic story steps and local helper status hints, not guarantees. It omits sensitive input content, daemon URLs, network names, user account names, device-specific identifiers, absolute paths, audit event bodies, private credentials, generated evidence contents, package contents, and model file contents.".to_string(),
        "".to_string(),
        "## Boundaries".to_string(),
        "".to_string(),
    ];
    for boundary in demo_package_boundaries() {
        lines.push(format!("- {}", boundary));
    }

    lines.extend(["".to_string(), "## Demo Story".to_string(), "".to_string()]);
    for step in DEMO_STORY_STEPS {
        lines.push(format!(
            "- {}: surface={}, talking_point={}, next_step={}, boundary={}",
            sanitize_readiness_report_text(step.name),
            sanitize_readiness_report_text(step.source_surface),
            sanitize_readiness_report_text(step.talking_point),
            sanitize_readiness_report_text(step.local_next_step),
            sanitize_readiness_report_text(step.boundary_note)
        ));
    }

    lines.extend([
        "".to_string(),
        "## Local Helper Commands".to_string(),
        "".to_string(),
        "- cargo run -p ignispromptctl -- demo-summary".to_string(),
        "- cargo run -p ignispromptctl -- demo-summary --json".to_string(),
        "- cargo run -p ignispromptctl -- demo-summary --report".to_string(),
        "- make demo-check".to_string(),
        "".to_string(),
    ]);
    lines.join("\n")
}

fn readiness_report_next_steps(report: &DoctorReport) -> Vec<String> {
    if report.required_checks_passed() {
        return vec![
            "Continue manual live-local loading in Aethra when needed.".to_string(),
            "Run make readiness-check before sharing local preview notes.".to_string(),
        ];
    }

    let mut steps = report
        .checks
        .iter()
        .filter(|check| !check.ok)
        .map(readiness_check_next_step)
        .collect::<Vec<_>>();
    steps.sort();
    steps.dedup();
    steps
}

fn readiness_check_category(check_id: &str) -> &'static str {
    match check_id {
        "health" => "daemon",
        "version_status" => "endpoints",
        "models" => "models",
        "capabilities" => "connector status",
        "model_status_hints" => "runner hints",
        "sustainability_metrics" => "endpoints",
        _ => "endpoints",
    }
}

fn readiness_check_severity(check: &DoctorCheckResult) -> &'static str {
    if check.ok {
        "info"
    } else {
        match check.level {
            DoctorCheckLevel::Required => "required",
            DoctorCheckLevel::Informational => "advisory",
        }
    }
}

fn readiness_check_next_step(check: &DoctorCheckResult) -> String {
    if check.ok {
        return "No local action needed for this status hint.".to_string();
    }

    match check.id {
        "health" => "Start the local daemon with ./scripts/start-dev.sh, then rerun cargo run -p ignispromptctl -- readiness.".to_string(),
        "version_status" => "Confirm the daemon is the current local preview build, then rerun cargo run -p ignispromptctl -- readiness.".to_string(),
        "models" => "Review local model manifest configuration; model weights are optional and must stay under ignored models/ paths.".to_string(),
        "capabilities" => "Review connector and capability status as local-preview metadata only; do not treat it as a control plane.".to_string(),
        "model_status_hints" => "Review model and runner status hints as prerequisites only; Aethra remains read-only.".to_string(),
        "sustainability_metrics" => "Treat sustainability metrics as advisory local preview data and continue if required checks pass.".to_string(),
        _ => "Review the local preview endpoint shape and rerun cargo run -p ignispromptctl -- readiness.".to_string(),
    }
}

fn readiness_check_boundary_note(check: &DoctorCheckResult) -> &'static str {
    match check.id {
        "capabilities" => "connector status metadata, not controls",
        "model_status_hints" => "status hints, not controls",
        "sustainability_metrics" => "local helper checks, not certification",
        "models" => "configured models are readiness inputs, not operator actions",
        _ => "local preview readiness only",
    }
}

fn sanitize_readiness_report_text(value: &str) -> String {
    if contains_sensitive_readiness_report_text(value) {
        return "[redacted local readiness field]".to_string();
    }

    value
        .replace("production readiness", "production deployment approval")
        .replace("Production readiness", "Production deployment approval")
        .replace("compliance certification", "external assurance")
        .replace("Compliance certification", "External assurance")
        .replace("security certification", "external assurance")
        .replace("Security certification", "External assurance")
        .replace("signed attestation", "local evidence note")
        .replace("Signed attestation", "Local evidence note")
        .replace("tamper-evident storage", "storage claim")
        .replace("Tamper-evident storage", "Storage claim")
        .replace("cryptographic verification", "verification claim")
        .replace("Cryptographic verification", "Verification claim")
        .replace("model controls", "model status hints")
        .replace("Model controls", "Model status hints")
        .replace("runner controls", "runner status hints")
        .replace("Runner controls", "Runner status hints")
        .replace("model control", "model status hint")
        .replace("Model control", "Model status hint")
        .replace("runner control", "runner status hint")
        .replace("Runner control", "Runner status hint")
}

fn contains_sensitive_readiness_report_text(value: &str) -> bool {
    [
        "prompt:",
        "raw audit",
        "raw user text",
        "request text",
        "api_key",
        "api key",
        "secret",
        "token",
        "localhost",
        "127.0.0.1",
        "[::1]",
        "/Users/",
        "/home/",
        "/private/",
        "/var/",
        "C:\\",
        "hostname",
        "host ",
        "username",
        "machine identifier",
        "machine id",
    ]
    .iter()
    .any(|needle| {
        value
            .to_ascii_lowercase()
            .contains(&needle.to_ascii_lowercase())
    }) || value.contains("sk-")
        || value.contains("ghp_")
}

fn build_readiness_package_report(
    output_dir: PathBuf,
    report: &DoctorReport,
) -> Result<ReadinessPackageReport, String> {
    let generated_at_unix_seconds = current_unix_seconds()?;
    let generated_file_names = READINESS_PACKAGE_REQUIRED_FILES
        .iter()
        .map(|file_name| (*file_name).to_string())
        .collect::<Vec<_>>();
    let readiness_json: Value = serde_json::from_str(&format_readiness_json(report))
        .map_err(|error| format!("could not build readiness JSON: {}", error))?;
    let report_markdown = format_readiness_markdown(report).replace(
        "no production deployment approval",
        "no release approval claim",
    );
    let report_json = build_readiness_package_report_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &readiness_json,
    );
    let manifest_json = build_readiness_package_manifest_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &readiness_json,
    );
    let readme = build_readiness_package_readme();

    validate_no_placeholder_string_values("readiness-summary", &readiness_json)?;
    validate_no_placeholder_string_values("readiness-report", &report_json)?;
    validate_no_placeholder_string_values("readiness-manifest", &manifest_json)?;
    validate_readiness_package_safe_text("readiness-report.md", &report_markdown)?;
    validate_readiness_package_safe_text("README.md", &readme)?;

    Ok(ReadinessPackageReport {
        output_dir,
        generated_at_unix_seconds,
        generated_file_names,
        readiness_json,
        report_json,
        manifest_json,
        report_markdown,
        readme,
    })
}

fn build_readiness_package_report_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    readiness_json: &Value,
) -> Value {
    json!({
        "readiness_package_schema_version": READINESS_PACKAGE_SCHEMA_VERSION,
        "package_type": READINESS_PACKAGE_TYPE,
        "package_mode": READINESS_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "local_preview_readiness_only": true,
        "no_cloud_calls_by_default": true,
        "no_telemetry": true,
        "no_global_aggregation": true,
        "external_assurance_claim": false,
        "external_integrity_claim": false,
        "generated_file_names": generated_file_names,
        "readiness_status": readiness_json.get("status").cloned().unwrap_or(Value::Null),
        "checks": readiness_json.get("checks").cloned().unwrap_or_else(|| json!([])),
        "local_next_steps": readiness_json.get("next_steps").cloned().unwrap_or_else(|| json!([])),
        "package_boundaries": readiness_package_boundaries(),
    })
}

fn build_readiness_package_manifest_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    readiness_json: &Value,
) -> Value {
    json!({
        "readiness_package_schema_version": READINESS_PACKAGE_SCHEMA_VERSION,
        "package_type": READINESS_PACKAGE_TYPE,
        "package_mode": READINESS_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "generated_file_names": generated_file_names,
        "files": generated_file_names
            .iter()
            .map(|file_name| json!({
                "name": file_name,
                "purpose": readiness_package_file_purpose(file_name),
            }))
            .collect::<Vec<_>>(),
        "readiness_status": readiness_json.get("status").cloned().unwrap_or(Value::Null),
        "package_boundaries": readiness_package_boundaries(),
    })
}

fn readiness_package_file_purpose(file_name: &str) -> &'static str {
    match file_name {
        "README.md" => "local preview package guide",
        "manifest.json" => "package manifest",
        "readiness-summary.json" => "safe CLI readiness diagnostics",
        "readiness-report.json" => "copy-safe package summary",
        "readiness-report.md" => "copy-safe package report",
        _ => "package file",
    }
}

fn readiness_package_boundaries() -> Vec<&'static str> {
    vec![
        "local preview readiness only",
        "status hints, not controls",
        "local helper checks, not certification",
        "manual live-local loading",
        "no telemetry",
        "no cloud calls by default",
        "no global aggregation",
        "no external assurance or integrity claim",
        "no sensitive input content, audit event bodies, evidence payloads, model file payloads, private credentials, or local machine-specific values",
    ]
}

fn build_readiness_package_readme() -> String {
    [
        "# IgnisPrompt Local Readiness Package",
        "",
        "This package is a local preview readiness summary generated by `ignispromptctl readiness --package-output`.",
        "",
        "Boundaries:",
        "- local preview readiness only",
        "- status hints, not controls",
        "- local helper checks, not certification",
        "- manual live-local loading",
        "- no telemetry",
        "- no cloud calls by default",
        "- no global aggregation",
        "- no external assurance or integrity claim",
        "- no sensitive input content, audit event bodies, evidence payloads, model file payloads, private credentials, or local machine-specific values",
        "",
        "Contents:",
        "- README.md",
        "- manifest.json",
        "- readiness-summary.json",
        "- readiness-report.json",
        "- readiness-report.md",
        "",
        "Keep this output under ignored `local-evidence/readiness/` and do not commit generated readiness packages.",
        "",
    ]
    .join("\n")
}

fn write_readiness_package_report(report: &ReadinessPackageReport) -> Result<(), String> {
    if report.output_dir.exists() {
        return Err(format!(
            "output directory already exists: {}",
            report.output_dir.display()
        ));
    }

    let parent = report.output_dir.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)
        .map_err(|error| format!("could not create readiness package parent: {}", error))?;

    let staging_dir = package_staging_dir(
        parent,
        ".ignispromptctl-readiness-package",
        &report.output_dir,
    );
    if staging_dir.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
    }
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("could not create readiness package staging: {}", error))?;

    let write_result = (|| -> Result<(), String> {
        write_text_file(&staging_dir.join("README.md"), &report.readme)?;
        write_pretty_json_file(&staging_dir.join("manifest.json"), &report.manifest_json)?;
        write_pretty_json_file(
            &staging_dir.join("readiness-summary.json"),
            &report.readiness_json,
        )?;
        write_pretty_json_file(
            &staging_dir.join("readiness-report.json"),
            &report.report_json,
        )?;
        write_text_file(
            &staging_dir.join("readiness-report.md"),
            &report.report_markdown,
        )?;
        Ok(())
    })();

    if let Err(message) = write_result {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(message);
    }

    fs::rename(&staging_dir, &report.output_dir).map_err(|error| {
        let _ = fs::remove_dir_all(&staging_dir);
        format!(
            "could not finalize readiness package at {}: {}",
            report.output_dir.display(),
            error
        )
    })?;

    Ok(())
}

fn format_readiness_package_summary(report: &ReadinessPackageReport) -> String {
    let status = report
        .readiness_json
        .get("status")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown");
    let mut lines = vec![
        "IgnisPrompt Local Readiness Package".to_string(),
        format!("Schema version: {}", READINESS_PACKAGE_SCHEMA_VERSION),
        format!("Package mode: {}", READINESS_PACKAGE_MODE),
        format!("Output dir: {}", report.output_dir.display()),
        format!(
            "Generated at (unix seconds): {}",
            report.generated_at_unix_seconds
        ),
        format!("Readiness status: {}", status),
        "Boundaries: local preview readiness only; status hints, not controls; local helper checks, not certification; no telemetry; no cloud calls by default.".to_string(),
        "".to_string(),
        "Generated files:".to_string(),
    ];
    for file_name in &report.generated_file_names {
        lines.push(format!("- {}", file_name));
    }
    lines.push("".to_string());
    lines.push("Next steps:".to_string());
    lines.push(
        "- run cargo run -p ignispromptctl -- readiness --package-validate <package-dir>"
            .to_string(),
    );
    lines
        .push("- review Aethra Local Readiness package preview as read-only guidance.".to_string());
    lines.join("\n")
}

fn format_readiness_package_summary_json(report: &ReadinessPackageReport) -> String {
    serde_json::to_string_pretty(&report.report_json).unwrap_or_default()
}

fn validate_relative_path(output: &str, label: &str) -> Result<PathBuf, String> {
    if output.trim().is_empty() {
        return Err(format!("{} is required", label));
    }

    let path = PathBuf::from(output);
    if path.is_absolute() {
        return Err(format!("{} must be a relative path", label));
    }

    for component in path.components() {
        match component {
            Component::Normal(_) => {}
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!("{} must not use parent traversal", label));
            }
        }
    }

    Ok(path)
}

fn validate_package_path_under_root(
    input: &str,
    label: &str,
    root: &str,
    require_leaf_dir: bool,
) -> Result<PathBuf, String> {
    let path = validate_relative_path(input, label)?;
    let root_path = Path::new(root);
    if !path.starts_with(root_path) {
        return Err(format!("{} must stay under ignored {}/", label, root));
    }
    if require_leaf_dir && path == root_path {
        return Err(format!(
            "{} must include a package directory under {}/",
            label, root
        ));
    }
    reject_existing_symlink_component(&path, label)?;
    Ok(path)
}

fn validate_package_output_dir(output: &str, label: &str, root: &str) -> Result<PathBuf, String> {
    let path = validate_package_path_under_root(output, label, root, true)?;
    if path.exists() {
        return Err(format!("{} already exists: {}", label, path.display()));
    }
    Ok(path)
}

fn validate_package_input_dir(input: &Path, label: &str, root: &str) -> Result<PathBuf, String> {
    let input_text = input
        .to_str()
        .ok_or_else(|| format!("{} must be valid UTF-8", label))?;
    let path = validate_package_path_under_root(input_text, label, root, true)?;
    if !path.exists() {
        return Err(format!(
            "{} directory does not exist: {}",
            label,
            safe_relative_package_path(&path, label)
        ));
    }
    let metadata = fs::symlink_metadata(&path)
        .map_err(|error| format!("could not inspect {}: {}", label, error))?;
    if metadata.file_type().is_symlink() {
        return Err(format!("{} must not be a symlink", label));
    }
    if !metadata.is_dir() {
        return Err(format!(
            "{} path is not a directory: {}",
            label,
            safe_relative_package_path(&path, label)
        ));
    }
    Ok(path)
}

fn reject_existing_symlink_component(path: &Path, label: &str) -> Result<(), String> {
    let mut current = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Normal(part) => {
                current.push(part);
                match fs::symlink_metadata(&current) {
                    Ok(metadata) if metadata.file_type().is_symlink() => {
                        return Err(format!("{} must not traverse symlinks", label));
                    }
                    Ok(_) => {}
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                    Err(error) => {
                        return Err(format!(
                            "could not inspect {} component {}: {}",
                            label,
                            current.display(),
                            error
                        ));
                    }
                }
            }
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!("{} must not use parent traversal", label));
            }
        }
    }
    Ok(())
}

fn safe_relative_package_path(path: &Path, label: &str) -> String {
    if path.is_absolute() {
        format!("[redacted {} path]", label)
    } else {
        path.display().to_string()
    }
}

fn validate_readiness_package_output_dir(output: &str) -> Result<PathBuf, String> {
    validate_package_output_dir(
        output,
        "readiness package output",
        "local-evidence/readiness",
    )
}

fn safe_readiness_package_path(path: &Path) -> String {
    safe_relative_package_path(path, "readiness package")
}

fn build_readiness_package_validation_report(
    package_dir: &Path,
) -> Result<ReadinessPackageValidationReport, String> {
    let package_dir =
        validate_package_input_dir(package_dir, "readiness package", "local-evidence/readiness")?;

    let mut files = Vec::new();
    let mut issues = Vec::new();
    for file_name in READINESS_PACKAGE_REQUIRED_FILES {
        let path = package_dir.join(file_name);
        if !path.exists() {
            issues.push(format!("missing required file: {}", file_name));
            files.push(ReadinessPackageFileState {
                file_name,
                present: false,
                json_valid: None,
                text: None,
            });
            continue;
        }

        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                issues.push(format!("{} must not be a symlink", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(metadata) if !metadata.is_file() => {
                issues.push(format!("{} must be a regular file", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(_) => {}
            Err(error) => {
                issues.push(format!("could not inspect {}: {}", file_name, error));
                continue;
            }
        }

        let text = fs::read_to_string(&path)
            .map_err(|error| format!("could not read {}: {}", file_name, error))?;
        if let Err(message) = validate_readiness_package_safe_text(file_name, &text) {
            issues.push(message);
        }
        let json_valid = if file_name.ends_with(".json") {
            match serde_json::from_str::<Value>(&text) {
                Ok(value) => {
                    if let Err(message) = validate_no_placeholder_string_values(file_name, &value) {
                        issues.push(message);
                    }
                    Some(true)
                }
                Err(error) => {
                    issues.push(format!("invalid JSON in {}: {}", file_name, error));
                    Some(false)
                }
            }
        } else {
            None
        };
        files.push(ReadinessPackageFileState {
            file_name,
            present: true,
            json_valid,
            text: Some(text),
        });
    }
    issues.extend(package_directory_issues(
        &package_dir,
        READINESS_PACKAGE_REQUIRED_FILES,
        "readiness package",
    ));

    if let Some(readme) = files
        .iter()
        .find(|file| file.file_name == "README.md")
        .and_then(|file| file.text.as_deref())
    {
        for term in [
            "local preview readiness only",
            "status hints, not controls",
            "local helper checks, not certification",
            "no telemetry",
            "no cloud calls by default",
        ] {
            if !readme.contains(term) {
                issues.push(format!("README.md is missing boundary term: {}", term));
            }
        }
    }

    Ok(ReadinessPackageValidationReport {
        package_dir,
        files,
        issues,
    })
}

fn package_directory_issues(
    package_dir: &Path,
    required_files: &[&'static str],
    label: &str,
) -> Vec<String> {
    let mut issues = Vec::new();
    let entries = match fs::read_dir(package_dir) {
        Ok(entries) => entries,
        Err(error) => {
            issues.push(format!("could not list {} directory: {}", label, error));
            return issues;
        }
    };

    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(error) => {
                issues.push(format!("could not inspect {} entry: {}", label, error));
                continue;
            }
        };
        let name = match entry.file_name().into_string() {
            Ok(name) => name,
            Err(_) => {
                issues.push(format!("{} contains non-UTF-8 file name", label));
                continue;
            }
        };
        if !required_files.iter().any(|required| *required == name) {
            issues.push(format!("unexpected package file: {}", name));
            continue;
        }
        match entry.file_type() {
            Ok(file_type) if file_type.is_symlink() => {
                issues.push(format!("{} must not be a symlink", name));
            }
            Ok(file_type) if !file_type.is_file() => {
                issues.push(format!("{} must be a regular file", name));
            }
            Ok(_) => {}
            Err(error) => {
                issues.push(format!("could not inspect {}: {}", name, error));
            }
        }
    }

    issues
}

fn validate_readiness_package_safe_text(label: &str, text: &str) -> Result<(), String> {
    const MAX_PACKAGE_TEXT_BYTES: usize = 256 * 1024;
    if text.len() > MAX_PACKAGE_TEXT_BYTES {
        return Err(format!("{} exceeds package text size limit", label));
    }
    if text
        .chars()
        .any(|ch| ch.is_control() && ch != '\n' && ch != '\r' && ch != '\t')
    {
        return Err(format!("{} contains control characters", label));
    }
    let lower = text.to_ascii_lowercase();
    for unsafe_term in [
        "\u{1b}[",
        "<script",
        "</script",
        "javascript:",
        "<iframe",
        "<html",
        "<body",
        "prompt:",
        "raw user text",
        "raw audit text",
        "generated evidence contents:",
        "model file contents:",
        "api_key",
        "api key",
        "sk-",
        "ghp_",
        "localhost",
        "127.0.0.1",
        "/users/",
        "/home/",
        "/private/",
        "hostname",
        "username",
        "machine identifier",
        "production security",
        "production deployment",
        "legal accuracy",
        "esg certification",
        "compliance certification",
        "supply-chain certification",
        "production-grade inference",
        "production-grade security",
        "tamper-evident",
        "cryptographic verification",
        "signed attestation",
    ] {
        if lower.contains(unsafe_term) {
            return Err(format!(
                "{} contains unsafe content: {}",
                label, unsafe_term
            ));
        }
    }
    Ok(())
}

fn format_readiness_package_validation_summary(
    report: &ReadinessPackageValidationReport,
) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Readiness Package Validation".to_string(),
        format!(
            "Package dir: {}",
            safe_readiness_package_path(&report.package_dir)
        ),
        format!(
            "Status: {}",
            if report.issues.is_empty() {
                "ok"
            } else {
                "failed"
            }
        ),
        "".to_string(),
        "Files:".to_string(),
    ];
    for file in &report.files {
        lines.push(format!(
            "- {}: {}",
            file.file_name,
            if file.present { "present" } else { "missing" }
        ));
    }
    if !report.issues.is_empty() {
        lines.push("".to_string());
        lines.push("Issues:".to_string());
        for issue in &report.issues {
            lines.push(format!("- {}", issue));
        }
    }
    lines.join("\n")
}

fn format_readiness_package_list_summary(report: &ReadinessPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Readiness Package Files".to_string(),
        format!(
            "Package dir: {}",
            safe_readiness_package_path(&report.package_dir)
        ),
        "".to_string(),
    ];
    for file in &report.files {
        let json_label = match file.json_valid {
            Some(true) => " json=valid",
            Some(false) => " json=invalid",
            None => "",
        };
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            if file.present { "present" } else { "missing" },
            json_label
        ));
    }
    lines.join("\n")
}

fn format_readiness_package_validation_json(report: &ReadinessPackageValidationReport) -> String {
    serde_json::to_string_pretty(&readiness_package_validation_value(report)).unwrap_or_default()
}

fn format_readiness_package_list_json(report: &ReadinessPackageValidationReport) -> String {
    serde_json::to_string_pretty(&readiness_package_validation_value(report)).unwrap_or_default()
}

fn readiness_package_validation_value(report: &ReadinessPackageValidationReport) -> Value {
    json!({
        "readiness_package_schema_version": READINESS_PACKAGE_SCHEMA_VERSION,
        "status": if report.issues.is_empty() { "ok" } else { "failed" },
        "package_dir": safe_readiness_package_path(&report.package_dir),
        "files": report.files.iter().map(|file| json!({
            "name": file.file_name,
            "present": file.present,
            "json_valid": file.json_valid,
        })).collect::<Vec<_>>(),
        "issues": report.issues,
        "package_boundaries": readiness_package_boundaries(),
    })
}

fn build_operator_package_report(output_dir: PathBuf) -> Result<OperatorPackageReport, String> {
    let generated_at_unix_seconds = current_unix_seconds()?;
    let generated_file_names = OPERATOR_PACKAGE_REQUIRED_FILES
        .iter()
        .map(|file_name| (*file_name).to_string())
        .collect::<Vec<_>>();
    let operator_summary_json: Value = serde_json::from_str(&format_operator_summary_json())
        .map_err(|error| format!("could not build operator summary JSON: {}", error))?;
    let report_markdown = build_operator_package_markdown(&operator_summary_json);
    let report_json = build_operator_package_report_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &operator_summary_json,
    );
    let manifest_json = build_operator_package_manifest_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &operator_summary_json,
    );
    let readme = build_operator_package_readme();

    validate_no_placeholder_string_values("operator-summary", &operator_summary_json)?;
    validate_no_placeholder_string_values("operator-report", &report_json)?;
    validate_no_placeholder_string_values("operator-manifest", &manifest_json)?;
    validate_operator_package_safe_text("operator-report.md", &report_markdown)?;
    validate_operator_package_safe_text("README.md", &readme)?;

    Ok(OperatorPackageReport {
        output_dir,
        generated_at_unix_seconds,
        generated_file_names,
        operator_summary_json,
        report_json,
        manifest_json,
        report_markdown,
        readme,
    })
}

fn build_operator_package_report_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    operator_summary_json: &Value,
) -> Value {
    json!({
        "operator_package_schema_version": OPERATOR_PACKAGE_SCHEMA_VERSION,
        "package_type": OPERATOR_PACKAGE_TYPE,
        "package_mode": OPERATOR_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "local_preview_operator_workflow_only": true,
        "no_cloud_calls_by_default": true,
        "no_telemetry": true,
        "no_global_aggregation": true,
        "external_assurance_claim": false,
        "external_integrity_claim": false,
        "generated_file_names": generated_file_names,
        "operator_status": operator_summary_json.get("status").cloned().unwrap_or(Value::Null),
        "sections": operator_summary_json.get("sections").cloned().unwrap_or_else(|| json!([])),
        "commands": operator_summary_json.get("commands").cloned().unwrap_or_else(|| json!([])),
        "package_boundaries": operator_package_boundaries(),
    })
}

fn build_operator_package_manifest_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    operator_summary_json: &Value,
) -> Value {
    json!({
        "operator_package_schema_version": OPERATOR_PACKAGE_SCHEMA_VERSION,
        "package_type": OPERATOR_PACKAGE_TYPE,
        "package_mode": OPERATOR_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "generated_file_names": generated_file_names,
        "files": generated_file_names
            .iter()
            .map(|file_name| json!({
                "name": file_name,
                "purpose": operator_package_file_purpose(file_name),
            }))
            .collect::<Vec<_>>(),
        "operator_status": operator_summary_json.get("status").cloned().unwrap_or(Value::Null),
        "package_boundaries": operator_package_boundaries(),
    })
}

fn operator_package_file_purpose(file_name: &str) -> &'static str {
    match file_name {
        "README.md" => "local preview operator package guide",
        "manifest.json" => "operator package manifest",
        "operator-summary.json" => "safe CLI operator workflow guidance",
        "operator-report.json" => "copy-safe operator package summary",
        "operator-report.md" => "copy-safe operator package report",
        _ => "operator package file",
    }
}

fn operator_package_boundaries() -> Vec<&'static str> {
    vec![
        "local preview operator workflow only",
        "status hints, not controls",
        "local helper checks, not certification",
        "package validation is structural/local only",
        "not signed",
        "no cryptographic validation",
        "not tamper evident",
        "not production attestation",
        "no telemetry",
        "no cloud calls by default",
        "no global aggregation",
        "no sensitive input content, audit event bodies, evidence payloads, model file payloads, private credentials, or local machine-specific values",
    ]
}

fn build_operator_package_readme() -> String {
    [
        "# IgnisPrompt Local Operator Package",
        "",
        "This package is a local preview operator workflow summary generated by `ignispromptctl operator-summary --package-output`.",
        "",
        "Boundaries:",
        "- local preview operator workflow only",
        "- status hints, not controls",
        "- local helper checks, not certification",
        "- package validation is structural/local only",
        "- not signed",
        "- no cryptographic validation",
        "- not tamper evident",
        "- not production attestation",
        "- no telemetry",
        "- no cloud calls by default",
        "- no global aggregation",
        "- no sensitive input content, audit event bodies, evidence payloads, model file payloads, private credentials, or local machine-specific values",
        "",
        "Contents:",
        "- README.md",
        "- manifest.json",
        "- operator-summary.json",
        "- operator-report.json",
        "- operator-report.md",
        "",
        "Keep this output under ignored `local-evidence/operator/` and do not commit generated operator packages.",
        "",
    ]
    .join("\n")
}

fn build_operator_package_markdown(operator_summary_json: &Value) -> String {
    let sections = operator_summary_json
        .get("sections")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    let commands = operator_summary_json
        .get("commands")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    let mut lines = vec![
        "# IgnisPrompt Local Operator Package Report".to_string(),
        "".to_string(),
        "This report is local preview operator workflow only. It is copy-safe by default and omits daemon URLs, network names, user account names, device-specific identifiers, absolute paths, sensitive input content, audit event bodies, private credentials, generated evidence contents, and model file contents.".to_string(),
        "".to_string(),
        "## Summary".to_string(),
        "".to_string(),
        "- report_mode: local helper output".to_string(),
        "- package_mode: local-preview".to_string(),
        "- package validation: structural/local only".to_string(),
        "- Aethra loading: fixture-backed by default with manual live-local loading".to_string(),
        "- telemetry: no telemetry".to_string(),
        "- cloud behavior: no cloud calls by default".to_string(),
        "".to_string(),
        "## Operator Sections".to_string(),
        "".to_string(),
    ];

    for section in sections {
        let name = section
            .get("name")
            .and_then(|value| value.as_str())
            .unwrap_or("operator section");
        let status = section
            .get("status")
            .and_then(|value| value.as_str())
            .unwrap_or("status_hint");
        let next_step = section
            .get("local_next_step")
            .and_then(|value| value.as_str())
            .unwrap_or("Review local preview guidance.");
        let boundary = section
            .get("boundary_note")
            .and_then(|value| value.as_str())
            .unwrap_or("local preview operator workflow only");
        lines.push(format!(
            "- {}: {} (next step: {}; boundary: {})",
            sanitize_readiness_report_text(name),
            sanitize_readiness_report_text(status),
            sanitize_readiness_report_text(next_step),
            sanitize_readiness_report_text(boundary)
        ));
    }

    lines.extend([
        "".to_string(),
        "## Copy-Only Command Recipes".to_string(),
        "".to_string(),
    ]);

    for command in commands {
        let label = command
            .get("label")
            .and_then(|value| value.as_str())
            .unwrap_or("command");
        let snippet = command
            .get("command")
            .and_then(|value| value.as_str())
            .unwrap_or("");
        lines.push(format!(
            "- {}: `{}`",
            sanitize_readiness_report_text(label),
            sanitize_readiness_report_text(snippet)
        ));
    }

    lines.extend([
        "".to_string(),
        "## Boundary Notes".to_string(),
        "".to_string(),
        "- local preview operator workflow only".to_string(),
        "- status hints, not controls".to_string(),
        "- local helper checks, not certification".to_string(),
        "- package validation is structural/local only".to_string(),
        "- not signed".to_string(),
        "- not production attestation".to_string(),
        "- no telemetry".to_string(),
        "- no cloud calls by default".to_string(),
        "- no global aggregation".to_string(),
        "".to_string(),
    ]);

    lines.join("\n")
}

fn write_operator_package_report(report: &OperatorPackageReport) -> Result<(), String> {
    if report.output_dir.exists() {
        return Err(format!(
            "operator package output already exists: {}",
            report.output_dir.display()
        ));
    }

    let parent = report.output_dir.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)
        .map_err(|error| format!("could not create operator package parent: {}", error))?;

    let staging_dir = package_staging_dir(
        parent,
        ".ignispromptctl-operator-package",
        &report.output_dir,
    );
    if staging_dir.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
    }
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("could not create operator package staging: {}", error))?;

    let write_result = (|| -> Result<(), String> {
        write_text_file(&staging_dir.join("README.md"), &report.readme)?;
        write_pretty_json_file(&staging_dir.join("manifest.json"), &report.manifest_json)?;
        write_pretty_json_file(
            &staging_dir.join("operator-summary.json"),
            &report.operator_summary_json,
        )?;
        write_pretty_json_file(
            &staging_dir.join("operator-report.json"),
            &report.report_json,
        )?;
        write_text_file(
            &staging_dir.join("operator-report.md"),
            &report.report_markdown,
        )?;
        Ok(())
    })();

    if let Err(message) = write_result {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(message);
    }

    fs::rename(&staging_dir, &report.output_dir).map_err(|error| {
        let _ = fs::remove_dir_all(&staging_dir);
        format!(
            "could not finalize operator package at {}: {}",
            report.output_dir.display(),
            error
        )
    })?;

    Ok(())
}

fn validate_operator_package_output_dir(output: &str) -> Result<PathBuf, String> {
    validate_package_output_dir(output, "operator package output", "local-evidence/operator")
}

fn safe_operator_package_path(path: &Path) -> String {
    if path.is_absolute() {
        "[redacted operator package path]".to_string()
    } else {
        path.display().to_string()
    }
}

fn build_operator_package_validation_report(
    package_dir: &Path,
) -> Result<OperatorPackageValidationReport, String> {
    let package_dir =
        validate_package_input_dir(package_dir, "operator package", "local-evidence/operator")?;

    let mut files = Vec::new();
    let mut issues = Vec::new();
    for file_name in OPERATOR_PACKAGE_REQUIRED_FILES {
        let path = package_dir.join(file_name);
        if !path.exists() {
            issues.push(format!("missing required file: {}", file_name));
            files.push(ReadinessPackageFileState {
                file_name,
                present: false,
                json_valid: None,
                text: None,
            });
            continue;
        }

        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                issues.push(format!("{} must not be a symlink", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(metadata) if !metadata.is_file() => {
                issues.push(format!("{} must be a regular file", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(_) => {}
            Err(error) => {
                issues.push(format!("could not inspect {}: {}", file_name, error));
                continue;
            }
        }

        let text = fs::read_to_string(&path)
            .map_err(|error| format!("could not read {}: {}", file_name, error))?;
        if let Err(message) = validate_operator_package_safe_text(file_name, &text) {
            issues.push(message);
        }
        let json_valid = if file_name.ends_with(".json") {
            match serde_json::from_str::<Value>(&text) {
                Ok(value) => {
                    if let Err(message) = validate_no_placeholder_string_values(file_name, &value) {
                        issues.push(message);
                    }
                    Some(true)
                }
                Err(error) => {
                    issues.push(format!("invalid JSON in {}: {}", file_name, error));
                    Some(false)
                }
            }
        } else {
            None
        };
        files.push(ReadinessPackageFileState {
            file_name,
            present: true,
            json_valid,
            text: Some(text),
        });
    }
    issues.extend(package_directory_issues(
        &package_dir,
        OPERATOR_PACKAGE_REQUIRED_FILES,
        "operator package",
    ));

    if let Some(readme) = files
        .iter()
        .find(|file| file.file_name == "README.md")
        .and_then(|file| file.text.as_deref())
    {
        for term in [
            "local preview operator workflow only",
            "status hints, not controls",
            "local helper checks, not certification",
            "package validation is structural/local only",
            "not signed",
            "no cryptographic validation",
            "not tamper evident",
            "not production attestation",
            "no telemetry",
            "no cloud calls by default",
        ] {
            if !readme.contains(term) {
                issues.push(format!("README.md is missing boundary term: {}", term));
            }
        }
    }

    Ok(OperatorPackageValidationReport {
        package_dir,
        files,
        issues,
    })
}

fn validate_operator_package_safe_text(label: &str, text: &str) -> Result<(), String> {
    validate_readiness_package_safe_text(label, text)?;
    let lower = text.to_ascii_lowercase();
    if lower.contains("production readiness") {
        return Err(format!(
            "{} contains unsafe content: production readiness",
            label
        ));
    }
    Ok(())
}

fn format_operator_package_summary(report: &OperatorPackageReport) -> String {
    let status = report
        .operator_summary_json
        .get("status")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown");
    let mut lines = vec![
        "IgnisPrompt Local Operator Package".to_string(),
        format!("Schema version: {}", OPERATOR_PACKAGE_SCHEMA_VERSION),
        format!("Package mode: {}", OPERATOR_PACKAGE_MODE),
        format!("Output dir: {}", report.output_dir.display()),
        format!(
            "Generated at (unix seconds): {}",
            report.generated_at_unix_seconds
        ),
        format!("Operator status: {}", status),
        "Boundaries: local preview operator workflow only; status hints, not controls; local helper checks, not certification; package validation is structural/local only; not signed.".to_string(),
        "".to_string(),
        "Generated files:".to_string(),
    ];
    for file_name in &report.generated_file_names {
        lines.push(format!("- {}", file_name));
    }
    lines.push("".to_string());
    lines.push("Next steps:".to_string());
    lines.push(
        "- run cargo run -p ignispromptctl -- operator-summary --package-validate <package-dir>"
            .to_string(),
    );
    lines.push(
        "- review Aethra Local Operator Console package preview as read-only guidance.".to_string(),
    );
    lines.join("\n")
}

fn format_operator_package_summary_json(report: &OperatorPackageReport) -> String {
    serde_json::to_string_pretty(&report.report_json).unwrap_or_default()
}

fn format_operator_package_validation_summary(report: &OperatorPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Operator Package Validation".to_string(),
        format!(
            "Package dir: {}",
            safe_operator_package_path(&report.package_dir)
        ),
        format!(
            "Status: {}",
            if report.issues.is_empty() {
                "ok"
            } else {
                "failed"
            }
        ),
        "".to_string(),
        "Files:".to_string(),
    ];
    for file in &report.files {
        lines.push(format!(
            "- {}: {}",
            file.file_name,
            if file.present { "present" } else { "missing" }
        ));
    }
    if !report.issues.is_empty() {
        lines.push("".to_string());
        lines.push("Issues:".to_string());
        for issue in &report.issues {
            lines.push(format!("- {}", issue));
        }
    }
    lines.join("\n")
}

fn format_operator_package_list_summary(report: &OperatorPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Operator Package Files".to_string(),
        format!(
            "Package dir: {}",
            safe_operator_package_path(&report.package_dir)
        ),
        "".to_string(),
    ];
    for file in &report.files {
        let json_label = match file.json_valid {
            Some(true) => " json=valid",
            Some(false) => " json=invalid",
            None => "",
        };
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            if file.present { "present" } else { "missing" },
            json_label
        ));
    }
    lines.join("\n")
}

fn format_operator_package_validation_json(report: &OperatorPackageValidationReport) -> String {
    serde_json::to_string_pretty(&operator_package_validation_value(report)).unwrap_or_default()
}

fn format_operator_package_list_json(report: &OperatorPackageValidationReport) -> String {
    serde_json::to_string_pretty(&operator_package_validation_value(report)).unwrap_or_default()
}

fn operator_package_validation_value(report: &OperatorPackageValidationReport) -> Value {
    json!({
        "operator_package_schema_version": OPERATOR_PACKAGE_SCHEMA_VERSION,
        "status": if report.issues.is_empty() { "ok" } else { "failed" },
        "package_dir": safe_operator_package_path(&report.package_dir),
        "files": report.files.iter().map(|file| json!({
            "name": file.file_name,
            "present": file.present,
            "json_valid": file.json_valid,
        })).collect::<Vec<_>>(),
        "issues": report.issues,
        "package_boundaries": operator_package_boundaries(),
    })
}

fn build_policy_package_report(output_dir: PathBuf) -> Result<PolicyPackageReport, String> {
    let generated_at_unix_seconds = current_unix_seconds()?;
    let generated_file_names = POLICY_PACKAGE_REQUIRED_FILES
        .iter()
        .map(|file_name| (*file_name).to_string())
        .collect::<Vec<_>>();
    let policy_scenarios_json: Value = serde_json::from_str(&format_policy_scenarios_json())
        .map_err(|error| format!("could not build policy scenario JSON: {}", error))?;
    let report_markdown = format_policy_scenarios_report();
    let report_json = build_policy_package_report_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &policy_scenarios_json,
    );
    let manifest_json = build_policy_package_manifest_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &policy_scenarios_json,
    );
    let readme = build_policy_package_readme();

    validate_no_placeholder_string_values("policy-scenarios", &policy_scenarios_json)?;
    validate_no_placeholder_string_values("policy-report", &report_json)?;
    validate_no_placeholder_string_values("policy-manifest", &manifest_json)?;
    validate_policy_package_safe_text("policy-report.md", &report_markdown)?;
    validate_policy_package_safe_text("README.md", &readme)?;

    Ok(PolicyPackageReport {
        output_dir,
        generated_at_unix_seconds,
        generated_file_names,
        policy_scenarios_json,
        report_json,
        manifest_json,
        report_markdown,
        readme,
    })
}

fn build_policy_package_report_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    policy_scenarios_json: &Value,
) -> Value {
    json!({
        "policy_package_schema_version": POLICY_PACKAGE_SCHEMA_VERSION,
        "package_type": POLICY_PACKAGE_TYPE,
        "package_mode": POLICY_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "policy_preview_only": true,
        "synthetic_scenarios_only": true,
        "no_cloud_calls_by_default": true,
        "no_telemetry": true,
        "no_global_aggregation": true,
        "external_assurance_claim": false,
        "external_integrity_claim": false,
        "generated_file_names": generated_file_names,
        "policy_status": policy_scenarios_json.get("status").cloned().unwrap_or(Value::Null),
        "scenarios": policy_scenarios_json.get("scenarios").cloned().unwrap_or_else(|| json!([])),
        "package_boundaries": policy_package_boundaries(),
    })
}

fn build_policy_package_manifest_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    policy_scenarios_json: &Value,
) -> Value {
    json!({
        "policy_package_schema_version": POLICY_PACKAGE_SCHEMA_VERSION,
        "package_type": POLICY_PACKAGE_TYPE,
        "package_mode": POLICY_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "generated_file_names": generated_file_names,
        "files": generated_file_names
            .iter()
            .map(|file_name| json!({
                "name": file_name,
                "purpose": policy_package_file_purpose(file_name),
            }))
            .collect::<Vec<_>>(),
        "policy_status": policy_scenarios_json.get("status").cloned().unwrap_or(Value::Null),
        "package_boundaries": policy_package_boundaries(),
    })
}

fn policy_package_file_purpose(file_name: &str) -> &'static str {
    match file_name {
        "README.md" => "local preview policy package guide",
        "manifest.json" => "policy package manifest",
        "policy-scenarios.json" => "safe synthetic policy scenario guidance",
        "policy-report.json" => "copy-safe policy package summary",
        "policy-report.md" => "copy-safe policy package report",
        _ => "policy package file",
    }
}

fn policy_package_boundaries() -> Vec<&'static str> {
    vec![
        "policy preview only",
        "synthetic scenarios only",
        "route hints, not guarantees",
        "local helper checks, not certification",
        "package validation is structural/local only",
        "not signed",
        "no cryptographic validation",
        "not tamper evident",
        "not production attestation",
        "no formal legal guidance",
        "no formal legal correctness claim",
        "no telemetry",
        "no cloud calls by default",
        "no global aggregation",
        "no sensitive input content, audit event bodies, evidence payloads, model file payloads, private credentials, or local machine-specific values",
    ]
}

fn build_policy_package_readme() -> String {
    [
        "# IgnisPrompt Local Policy Package",
        "",
        "This package is a local preview policy scenario summary generated by `ignispromptctl policy-scenarios --package-output`.",
        "",
        "Boundaries:",
        "- policy preview only",
        "- synthetic scenarios only",
        "- route hints, not guarantees",
        "- local helper checks, not certification",
        "- package validation is structural/local only",
        "- not signed",
        "- no cryptographic validation",
        "- not tamper evident",
        "- not production attestation",
        "- no formal legal guidance",
        "- no formal legal correctness claim",
        "- no telemetry",
        "- no cloud calls by default",
        "- no global aggregation",
        "- no sensitive input content, audit event bodies, evidence payloads, model file payloads, private credentials, or local machine-specific values",
        "",
        "Contents:",
        "- README.md",
        "- manifest.json",
        "- policy-scenarios.json",
        "- policy-report.json",
        "- policy-report.md",
        "",
        "Keep this output under ignored `local-evidence/policy/` and do not commit generated policy packages.",
        "",
    ]
    .join("\n")
}

fn write_policy_package_report(report: &PolicyPackageReport) -> Result<(), String> {
    if report.output_dir.exists() {
        return Err(format!(
            "policy package output already exists: {}",
            report.output_dir.display()
        ));
    }

    let parent = report.output_dir.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)
        .map_err(|error| format!("could not create policy package parent: {}", error))?;

    let staging_dir =
        package_staging_dir(parent, ".ignispromptctl-policy-package", &report.output_dir);
    if staging_dir.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
    }
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("could not create policy package staging: {}", error))?;

    let write_result = (|| -> Result<(), String> {
        write_text_file(&staging_dir.join("README.md"), &report.readme)?;
        write_pretty_json_file(&staging_dir.join("manifest.json"), &report.manifest_json)?;
        write_pretty_json_file(
            &staging_dir.join("policy-scenarios.json"),
            &report.policy_scenarios_json,
        )?;
        write_pretty_json_file(&staging_dir.join("policy-report.json"), &report.report_json)?;
        write_text_file(
            &staging_dir.join("policy-report.md"),
            &report.report_markdown,
        )?;
        Ok(())
    })();

    if let Err(message) = write_result {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(message);
    }

    fs::rename(&staging_dir, &report.output_dir).map_err(|error| {
        let _ = fs::remove_dir_all(&staging_dir);
        format!(
            "could not finalize policy package at {}: {}",
            report.output_dir.display(),
            error
        )
    })?;

    Ok(())
}

fn validate_policy_package_output_dir(output: &str) -> Result<PathBuf, String> {
    validate_package_output_dir(output, "policy package output", "local-evidence/policy")
}

fn safe_policy_package_path(path: &Path) -> String {
    if path.is_absolute() {
        "[redacted policy package path]".to_string()
    } else {
        path.display().to_string()
    }
}

fn build_policy_package_validation_report(
    package_dir: &Path,
) -> Result<PolicyPackageValidationReport, String> {
    let package_dir =
        validate_package_input_dir(package_dir, "policy package", "local-evidence/policy")?;

    let mut files = Vec::new();
    let mut issues = Vec::new();
    for file_name in POLICY_PACKAGE_REQUIRED_FILES {
        let path = package_dir.join(file_name);
        if !path.exists() {
            issues.push(format!("missing required file: {}", file_name));
            files.push(ReadinessPackageFileState {
                file_name,
                present: false,
                json_valid: None,
                text: None,
            });
            continue;
        }

        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                issues.push(format!("{} must not be a symlink", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(metadata) if !metadata.is_file() => {
                issues.push(format!("{} must be a regular file", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(_) => {}
            Err(error) => {
                issues.push(format!("could not inspect {}: {}", file_name, error));
                continue;
            }
        }

        let text = fs::read_to_string(&path)
            .map_err(|error| format!("could not read {}: {}", file_name, error))?;
        if let Err(message) = validate_policy_package_safe_text(file_name, &text) {
            issues.push(message);
        }
        let json_valid = if file_name.ends_with(".json") {
            match serde_json::from_str::<Value>(&text) {
                Ok(value) => {
                    if let Err(message) = validate_no_placeholder_string_values(file_name, &value) {
                        issues.push(message);
                    }
                    if let Err(message) = validate_policy_package_json_shape(file_name, &value) {
                        issues.push(message);
                    }
                    Some(true)
                }
                Err(error) => {
                    issues.push(format!("invalid JSON in {}: {}", file_name, error));
                    Some(false)
                }
            }
        } else {
            None
        };
        files.push(ReadinessPackageFileState {
            file_name,
            present: true,
            json_valid,
            text: Some(text),
        });
    }
    issues.extend(package_directory_issues(
        &package_dir,
        POLICY_PACKAGE_REQUIRED_FILES,
        "policy package",
    ));

    if let Some(readme) = files
        .iter()
        .find(|file| file.file_name == "README.md")
        .and_then(|file| file.text.as_deref())
    {
        for term in [
            "policy preview only",
            "synthetic scenarios only",
            "route hints, not guarantees",
            "local helper checks, not certification",
            "package validation is structural/local only",
            "not signed",
            "no cryptographic validation",
            "not tamper evident",
            "not production attestation",
            "no formal legal guidance",
            "no formal legal correctness claim",
            "no telemetry",
            "no cloud calls by default",
        ] {
            if !readme.contains(term) {
                issues.push(format!("README.md is missing boundary term: {}", term));
            }
        }
    }

    Ok(PolicyPackageValidationReport {
        package_dir,
        files,
        issues,
    })
}

fn validate_policy_package_json_shape(file_name: &str, value: &Value) -> Result<(), String> {
    match file_name {
        "manifest.json" => validate_policy_manifest_json(value),
        "policy-scenarios.json" => validate_policy_scenarios_json_value(value),
        "policy-report.json" => validate_policy_report_json(value),
        _ => Ok(()),
    }
    .map_err(|message| format!("{} {}", file_name, message))
}

fn validate_policy_manifest_json(value: &Value) -> Result<(), String> {
    expect_json_string(
        value,
        "policy_package_schema_version",
        POLICY_PACKAGE_SCHEMA_VERSION,
    )?;
    expect_json_string(value, "package_type", POLICY_PACKAGE_TYPE)?;
    expect_json_string(value, "package_mode", POLICY_PACKAGE_MODE)?;
    expect_json_bool(value, "local_only", true)?;
    expect_json_array_len(
        value,
        "generated_file_names",
        POLICY_PACKAGE_REQUIRED_FILES.len(),
    )?;
    expect_json_array_len(value, "files", POLICY_PACKAGE_REQUIRED_FILES.len())?;
    expect_json_string(value, "policy_status", "policy_preview")?;
    Ok(())
}

fn validate_policy_scenarios_json_value(value: &Value) -> Result<(), String> {
    expect_json_string(
        value,
        "policy_scenario_schema_version",
        POLICY_SCENARIO_SCHEMA_VERSION,
    )?;
    expect_json_string(value, "mode", "local-preview")?;
    expect_json_string(value, "status", "policy_preview")?;
    expect_json_array_len(value, "scenarios", POLICY_SCENARIOS.len())?;
    let scenarios = value
        .get("scenarios")
        .and_then(|field| field.as_array())
        .ok_or_else(|| "is missing scenarios array".to_string())?;
    for scenario in scenarios {
        for field in [
            "id",
            "name",
            "group",
            "category",
            "synthetic_summary",
            "expected_tier",
            "expected_route",
            "expected_local_behavior",
            "expected_warning",
            "local_next_step",
            "boundary_note",
        ] {
            if scenario
                .get(field)
                .and_then(|value| value.as_str())
                .is_none()
            {
                return Err(format!("scenario is missing string field: {}", field));
            }
        }
        for field in ["expected_local_only", "fail_closed_expected"] {
            if scenario
                .get(field)
                .and_then(|value| value.as_bool())
                .is_none()
            {
                return Err(format!("scenario is missing bool field: {}", field));
            }
        }
    }
    Ok(())
}

fn validate_policy_report_json(value: &Value) -> Result<(), String> {
    expect_json_string(
        value,
        "policy_package_schema_version",
        POLICY_PACKAGE_SCHEMA_VERSION,
    )?;
    expect_json_string(value, "package_type", POLICY_PACKAGE_TYPE)?;
    expect_json_string(value, "package_mode", POLICY_PACKAGE_MODE)?;
    expect_json_bool(value, "local_only", true)?;
    expect_json_bool(value, "policy_preview_only", true)?;
    expect_json_bool(value, "synthetic_scenarios_only", true)?;
    expect_json_bool(value, "no_cloud_calls_by_default", true)?;
    expect_json_bool(value, "no_telemetry", true)?;
    expect_json_bool(value, "no_global_aggregation", true)?;
    expect_json_string(value, "policy_status", "policy_preview")?;
    expect_json_array_len(
        value,
        "generated_file_names",
        POLICY_PACKAGE_REQUIRED_FILES.len(),
    )?;
    expect_json_array_len(value, "scenarios", POLICY_SCENARIOS.len())?;
    Ok(())
}

fn expect_json_string(value: &Value, field: &str, expected: &str) -> Result<(), String> {
    match value.get(field).and_then(|field| field.as_str()) {
        Some(actual) if actual == expected => Ok(()),
        Some(actual) => Err(format!(
            "has unexpected {}: {}, expected {}",
            field, actual, expected
        )),
        None => Err(format!("is missing string field: {}", field)),
    }
}

fn expect_json_bool(value: &Value, field: &str, expected: bool) -> Result<(), String> {
    match value.get(field).and_then(|field| field.as_bool()) {
        Some(actual) if actual == expected => Ok(()),
        Some(actual) => Err(format!(
            "has unexpected {}: {}, expected {}",
            field, actual, expected
        )),
        None => Err(format!("is missing bool field: {}", field)),
    }
}

fn expect_json_array_len(value: &Value, field: &str, expected: usize) -> Result<(), String> {
    match value.get(field).and_then(|field| field.as_array()) {
        Some(actual) if actual.len() == expected => Ok(()),
        Some(actual) => Err(format!(
            "has unexpected {} length: {}, expected {}",
            field,
            actual.len(),
            expected
        )),
        None => Err(format!("is missing array field: {}", field)),
    }
}

fn expect_json_array_strings(
    value: &Value,
    field: &str,
    expected: &[&'static str],
) -> Result<(), String> {
    let actual = value
        .get(field)
        .and_then(|field| field.as_array())
        .ok_or_else(|| format!("is missing array field: {}", field))?
        .iter()
        .map(|item| {
            item.as_str()
                .ok_or_else(|| format!("{} contains a non-string item", field))
        })
        .collect::<Result<Vec<_>, _>>()?;
    if actual == expected {
        Ok(())
    } else {
        Err(format!(
            "has unexpected {} values: {}, expected {}",
            field,
            actual.join(", "),
            expected.join(", ")
        ))
    }
}

fn expect_json_bool_at_path(value: &Value, path: &[&str], expected: bool) -> Result<(), String> {
    let mut current = value;
    for segment in path {
        current = current
            .get(*segment)
            .ok_or_else(|| format!("is missing field path: {}", path.join(".")))?;
    }
    match current.as_bool() {
        Some(actual) if actual == expected => Ok(()),
        Some(actual) => Err(format!(
            "has unexpected {}: {}, expected {}",
            path.join("."),
            actual,
            expected
        )),
        None => Err(format!("is missing bool field: {}", path.join("."))),
    }
}

fn expect_boundary_terms(
    value: &Value,
    field: &str,
    expected_terms: &[&'static str],
) -> Result<(), String> {
    let actual = value
        .get(field)
        .and_then(|field| field.as_array())
        .ok_or_else(|| format!("is missing array field: {}", field))?;
    for term in expected_terms {
        if !actual.iter().any(|item| item.as_str() == Some(*term)) {
            return Err(format!("{} is missing boundary term: {}", field, term));
        }
    }
    Ok(())
}

fn expect_package_file_entries(
    value: &Value,
    expected_files: &[&'static str],
) -> Result<(), String> {
    let files = value
        .get("files")
        .and_then(|field| field.as_array())
        .ok_or_else(|| "is missing files array".to_string())?;
    for file_name in expected_files {
        if !files.iter().any(|file| {
            file.get("name").and_then(|name| name.as_str()) == Some(*file_name)
                && file
                    .get("purpose")
                    .and_then(|purpose| purpose.as_str())
                    .is_some()
        }) {
            return Err(format!(
                "files is missing generated file entry: {}",
                file_name
            ));
        }
    }
    Ok(())
}

fn validate_policy_package_safe_text(label: &str, text: &str) -> Result<(), String> {
    validate_operator_package_safe_text(label, text)?;
    let lower = text.to_ascii_lowercase();
    for unsafe_term in [
        "real prompt",
        "real prompts",
        "route guarantee",
        "certified",
        "security certification",
        "model controls",
        "runner controls",
    ] {
        if lower.contains(unsafe_term) {
            return Err(format!(
                "{} contains unsafe content: {}",
                label, unsafe_term
            ));
        }
    }
    Ok(())
}

fn format_policy_package_summary(report: &PolicyPackageReport) -> String {
    let status = report
        .policy_scenarios_json
        .get("status")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown");
    let mut lines = vec![
        "IgnisPrompt Local Policy Package".to_string(),
        format!("Schema version: {}", POLICY_PACKAGE_SCHEMA_VERSION),
        format!("Package mode: {}", POLICY_PACKAGE_MODE),
        format!("Output dir: {}", report.output_dir.display()),
        format!(
            "Generated at (unix seconds): {}",
            report.generated_at_unix_seconds
        ),
        format!("Policy status: {}", status),
        "Boundaries: policy preview only; synthetic scenarios only; route hints, not guarantees; local helper checks, not certification; package validation is structural/local only; not signed.".to_string(),
        "".to_string(),
        "Generated files:".to_string(),
    ];
    for file_name in &report.generated_file_names {
        lines.push(format!("- {}", file_name));
    }
    lines.push("".to_string());
    lines.push("Next steps:".to_string());
    lines.push(
        "- run cargo run -p ignispromptctl -- policy-scenarios --package-validate <package-dir>"
            .to_string(),
    );
    lines.push(
        "- review Aethra Local Policy Workbench package preview as read-only guidance.".to_string(),
    );
    lines.join("\n")
}

fn format_policy_package_summary_json(report: &PolicyPackageReport) -> String {
    serde_json::to_string_pretty(&report.report_json).unwrap_or_default()
}

fn format_policy_package_validation_summary(report: &PolicyPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Policy Package Validation".to_string(),
        format!(
            "Package dir: {}",
            safe_policy_package_path(&report.package_dir)
        ),
        format!(
            "Status: {}",
            if report.issues.is_empty() {
                "ok"
            } else {
                "failed"
            }
        ),
        "".to_string(),
        "Files:".to_string(),
    ];
    for file in &report.files {
        lines.push(format!(
            "- {}: {}",
            file.file_name,
            if file.present { "present" } else { "missing" }
        ));
    }
    if !report.issues.is_empty() {
        lines.push("".to_string());
        lines.push("Issues:".to_string());
        for issue in &report.issues {
            lines.push(format!("- {}", issue));
        }
    }
    lines.join("\n")
}

fn format_policy_package_list_summary(report: &PolicyPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Policy Package Files".to_string(),
        format!(
            "Package dir: {}",
            safe_policy_package_path(&report.package_dir)
        ),
        "".to_string(),
    ];
    for file in &report.files {
        let json_label = match file.json_valid {
            Some(true) => " json=valid",
            Some(false) => " json=invalid",
            None => "",
        };
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            if file.present { "present" } else { "missing" },
            json_label
        ));
    }
    lines.join("\n")
}

fn format_policy_package_validation_json(report: &PolicyPackageValidationReport) -> String {
    serde_json::to_string_pretty(&policy_package_validation_value(report)).unwrap_or_default()
}

fn format_policy_package_list_json(report: &PolicyPackageValidationReport) -> String {
    serde_json::to_string_pretty(&policy_package_validation_value(report)).unwrap_or_default()
}

fn policy_package_validation_value(report: &PolicyPackageValidationReport) -> Value {
    json!({
        "policy_package_schema_version": POLICY_PACKAGE_SCHEMA_VERSION,
        "status": if report.issues.is_empty() { "ok" } else { "failed" },
        "package_dir": safe_policy_package_path(&report.package_dir),
        "files": report.files.iter().map(|file| json!({
            "name": file.file_name,
            "present": file.present,
            "json_valid": file.json_valid,
        })).collect::<Vec<_>>(),
        "issues": report.issues,
        "package_boundaries": policy_package_boundaries(),
    })
}

fn build_demo_package_report(output_dir: PathBuf) -> Result<DemoPackageReport, String> {
    let generated_at_unix_seconds = current_unix_seconds()?;
    let generated_file_names = DEMO_PACKAGE_REQUIRED_FILES
        .iter()
        .map(|file_name| (*file_name).to_string())
        .collect::<Vec<_>>();
    let demo_summary_json: Value = serde_json::from_str(&format_demo_summary_json())
        .map_err(|error| format!("could not build demo summary JSON: {}", error))?;
    let report_markdown = format_demo_summary_report();
    let report_json = build_demo_package_report_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &demo_summary_json,
    );
    let manifest_json = build_demo_package_manifest_json(
        generated_at_unix_seconds,
        &generated_file_names,
        &demo_summary_json,
    );
    let readme = build_demo_package_readme();

    validate_no_placeholder_string_values("demo-summary", &demo_summary_json)?;
    validate_no_placeholder_string_values("demo-report", &report_json)?;
    validate_no_placeholder_string_values("demo-manifest", &manifest_json)?;
    validate_demo_package_safe_text("demo-report.md", &report_markdown)?;
    validate_demo_package_safe_text("README.md", &readme)?;

    Ok(DemoPackageReport {
        output_dir,
        generated_at_unix_seconds,
        generated_file_names,
        demo_summary_json,
        report_json,
        manifest_json,
        report_markdown,
        readme,
    })
}

fn build_demo_package_report_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    demo_summary_json: &Value,
) -> Value {
    json!({
        "demo_package_schema_version": DEMO_PACKAGE_SCHEMA_VERSION,
        "package_type": DEMO_PACKAGE_TYPE,
        "package_mode": DEMO_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "local_preview_demo_only": true,
        "no_cloud_calls_by_default": true,
        "no_telemetry": true,
        "no_global_aggregation": true,
        "external_assurance_claim": false,
        "external_integrity_claim": false,
        "generated_file_names": generated_file_names,
        "demo_status": demo_summary_json.get("status").cloned().unwrap_or(Value::Null),
        "story_steps": demo_summary_json.get("story_steps").cloned().unwrap_or_else(|| json!([])),
        "related_checks": demo_summary_json.get("related_checks").cloned().unwrap_or_else(|| json!([])),
        "package_boundaries": demo_package_boundaries(),
    })
}

fn build_demo_package_manifest_json(
    generated_at_unix_seconds: u64,
    generated_file_names: &[String],
    demo_summary_json: &Value,
) -> Value {
    json!({
        "demo_package_schema_version": DEMO_PACKAGE_SCHEMA_VERSION,
        "package_type": DEMO_PACKAGE_TYPE,
        "package_mode": DEMO_PACKAGE_MODE,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "generated_file_names": generated_file_names,
        "files": generated_file_names
            .iter()
            .map(|file_name| json!({
                "name": file_name,
                "purpose": demo_package_file_purpose(file_name),
            }))
            .collect::<Vec<_>>(),
        "demo_status": demo_summary_json.get("status").cloned().unwrap_or(Value::Null),
        "package_boundaries": demo_package_boundaries(),
    })
}

fn demo_package_file_purpose(file_name: &str) -> &'static str {
    match file_name {
        "README.md" => "local preview demo package guide",
        "manifest.json" => "demo package manifest",
        "demo-summary.json" => "safe CLI demo story guidance",
        "demo-report.json" => "copy-safe demo package summary",
        "demo-report.md" => "copy-safe demo package report",
        _ => "demo package file",
    }
}

fn demo_package_boundaries() -> Vec<&'static str> {
    vec![
        "local preview demo only",
        "synthetic story steps only",
        "route/status/package values are hints, not guarantees",
        "local helper checks, not certification",
        "package validation is structural/local only",
        "not signed",
        "no cryptographic validation",
        "not tamper evident",
        "not production attestation",
        "no formal legal guidance",
        "no formal legal correctness claim",
        "no telemetry",
        "no cloud calls by default",
        "no global aggregation",
        "Aethra is fixture-backed by default with manual live-local loading",
        "no sensitive input content, audit event bodies, evidence payloads, package contents, model file payloads, private credentials, or local machine-specific values",
    ]
}

fn build_demo_package_readme() -> String {
    [
        "# IgnisPrompt Local Demo Package",
        "",
        "This package is a local preview demo story summary generated by `ignispromptctl demo-summary --package-output`.",
        "",
        "Boundaries:",
        "- local preview demo only",
        "- synthetic story steps only",
        "- route/status/package values are hints, not guarantees",
        "- local helper checks, not certification",
        "- package validation is structural/local only",
        "- not signed",
        "- no cryptographic validation",
        "- not tamper evident",
        "- not production attestation",
        "- no formal legal guidance",
        "- no formal legal correctness claim",
        "- no telemetry",
        "- no cloud calls by default",
        "- no global aggregation",
        "- Aethra is fixture-backed by default with manual live-local loading",
        "- no sensitive input content, audit event bodies, evidence payloads, package contents, model file payloads, private credentials, or local machine-specific values",
        "",
        "Contents:",
        "- README.md",
        "- manifest.json",
        "- demo-summary.json",
        "- demo-report.json",
        "- demo-report.md",
        "",
        "Keep this output under ignored `local-evidence/demo-studio/` and do not commit generated demo packages.",
        "",
    ]
    .join("\n")
}

fn write_demo_package_report(report: &DemoPackageReport) -> Result<(), String> {
    if report.output_dir.exists() {
        return Err(format!(
            "demo package output already exists: {}",
            report.output_dir.display()
        ));
    }

    let parent = report.output_dir.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)
        .map_err(|error| format!("could not create demo package parent: {}", error))?;

    let staging_dir =
        package_staging_dir(parent, ".ignispromptctl-demo-package", &report.output_dir);
    if staging_dir.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
    }
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("could not create demo package staging: {}", error))?;

    let write_result = (|| -> Result<(), String> {
        write_text_file(&staging_dir.join("README.md"), &report.readme)?;
        write_pretty_json_file(&staging_dir.join("manifest.json"), &report.manifest_json)?;
        write_pretty_json_file(
            &staging_dir.join("demo-summary.json"),
            &report.demo_summary_json,
        )?;
        write_pretty_json_file(&staging_dir.join("demo-report.json"), &report.report_json)?;
        write_text_file(&staging_dir.join("demo-report.md"), &report.report_markdown)?;
        Ok(())
    })();

    if let Err(message) = write_result {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(message);
    }

    fs::rename(&staging_dir, &report.output_dir).map_err(|error| {
        let _ = fs::remove_dir_all(&staging_dir);
        format!(
            "could not finalize demo package at {}: {}",
            report.output_dir.display(),
            error
        )
    })?;

    Ok(())
}

fn validate_demo_package_output_dir(output: &str) -> Result<PathBuf, String> {
    validate_package_output_dir(output, "demo package output", "local-evidence/demo-studio")
}

fn safe_demo_package_path(path: &Path) -> String {
    if path.is_absolute() {
        "[redacted demo package path]".to_string()
    } else {
        path.display().to_string()
    }
}

fn build_demo_package_validation_report(
    package_dir: &Path,
) -> Result<DemoPackageValidationReport, String> {
    let package_dir =
        validate_package_input_dir(package_dir, "demo package", "local-evidence/demo-studio")?;

    let mut files = Vec::new();
    let mut issues = Vec::new();
    for file_name in DEMO_PACKAGE_REQUIRED_FILES {
        let path = package_dir.join(file_name);
        if !path.exists() {
            issues.push(format!("missing required file: {}", file_name));
            files.push(ReadinessPackageFileState {
                file_name,
                present: false,
                json_valid: None,
                text: None,
            });
            continue;
        }

        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                issues.push(format!("{} must not be a symlink", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(metadata) if !metadata.is_file() => {
                issues.push(format!("{} must be a regular file", file_name));
                files.push(ReadinessPackageFileState {
                    file_name,
                    present: true,
                    json_valid: None,
                    text: None,
                });
                continue;
            }
            Ok(_) => {}
            Err(error) => {
                issues.push(format!("could not inspect {}: {}", file_name, error));
                continue;
            }
        }

        let text = fs::read_to_string(&path)
            .map_err(|error| format!("could not read {}: {}", file_name, error))?;
        if let Err(message) = validate_demo_package_safe_text(file_name, &text) {
            issues.push(message);
        }
        let json_valid = if file_name.ends_with(".json") {
            match serde_json::from_str::<Value>(&text) {
                Ok(value) => {
                    if let Err(message) = validate_no_placeholder_string_values(file_name, &value) {
                        issues.push(message);
                    }
                    if let Err(message) = validate_demo_package_json_shape(file_name, &value) {
                        issues.push(message);
                    }
                    Some(true)
                }
                Err(error) => {
                    issues.push(format!("invalid JSON in {}: {}", file_name, error));
                    Some(false)
                }
            }
        } else {
            None
        };
        files.push(ReadinessPackageFileState {
            file_name,
            present: true,
            json_valid,
            text: Some(text),
        });
    }
    issues.extend(package_directory_issues(
        &package_dir,
        DEMO_PACKAGE_REQUIRED_FILES,
        "demo package",
    ));

    if let Some(readme) = files
        .iter()
        .find(|file| file.file_name == "README.md")
        .and_then(|file| file.text.as_deref())
    {
        for term in [
            "local preview demo only",
            "synthetic story steps only",
            "route/status/package values are hints, not guarantees",
            "local helper checks, not certification",
            "package validation is structural/local only",
            "not signed",
            "no cryptographic validation",
            "not tamper evident",
            "not production attestation",
            "no formal legal guidance",
            "no formal legal correctness claim",
            "no telemetry",
            "no cloud calls by default",
        ] {
            if !readme.contains(term) {
                issues.push(format!("README.md is missing boundary term: {}", term));
            }
        }
    }

    Ok(DemoPackageValidationReport {
        package_dir,
        files,
        issues,
    })
}

fn validate_demo_package_json_shape(file_name: &str, value: &Value) -> Result<(), String> {
    match file_name {
        "manifest.json" => validate_demo_manifest_json(value),
        "demo-summary.json" => validate_demo_summary_json_value(value),
        "demo-report.json" => validate_demo_report_json(value),
        _ => Ok(()),
    }
    .map_err(|message| format!("{} {}", file_name, message))
}

fn validate_demo_manifest_json(value: &Value) -> Result<(), String> {
    expect_json_string(
        value,
        "demo_package_schema_version",
        DEMO_PACKAGE_SCHEMA_VERSION,
    )?;
    expect_json_string(value, "package_type", DEMO_PACKAGE_TYPE)?;
    expect_json_string(value, "package_mode", DEMO_PACKAGE_MODE)?;
    expect_json_bool(value, "local_only", true)?;
    expect_json_array_len(
        value,
        "generated_file_names",
        DEMO_PACKAGE_REQUIRED_FILES.len(),
    )?;
    expect_json_array_strings(value, "generated_file_names", DEMO_PACKAGE_REQUIRED_FILES)?;
    expect_json_array_len(value, "files", DEMO_PACKAGE_REQUIRED_FILES.len())?;
    expect_json_string(value, "demo_status", "demo_guidance")?;
    expect_package_file_entries(value, DEMO_PACKAGE_REQUIRED_FILES)?;
    expect_boundary_terms(value, "package_boundaries", &demo_package_boundaries())?;
    Ok(())
}

fn validate_demo_summary_json_value(value: &Value) -> Result<(), String> {
    expect_json_string(
        value,
        "demo_summary_schema_version",
        DEMO_SUMMARY_SCHEMA_VERSION,
    )?;
    expect_json_string(value, "mode", "local-preview")?;
    expect_json_string(value, "status", "demo_guidance")?;
    expect_json_array_len(value, "story_steps", DEMO_STORY_STEPS.len())?;
    expect_json_bool_at_path(value, &["scope", "local_preview_demo_only"], true)?;
    expect_json_bool_at_path(value, &["scope", "synthetic_story_steps_only"], true)?;
    expect_json_bool_at_path(
        value,
        &[
            "scope",
            "route_status_package_values_are_hints_not_guarantees",
        ],
        true,
    )?;
    expect_json_bool_at_path(value, &["scope", "route_status_package_hints_only"], true)?;
    expect_json_bool_at_path(
        value,
        &["scope", "local_helper_checks_not_certification"],
        true,
    )?;
    expect_json_bool_at_path(
        value,
        &["scope", "package_validation_structural_local_only"],
        true,
    )?;
    expect_json_bool_at_path(value, &["scope", "not_signed"], true)?;
    expect_json_bool_at_path(value, &["scope", "no_telemetry"], true)?;
    expect_json_bool_at_path(value, &["scope", "no_cloud_calls_by_default"], true)?;
    expect_json_bool_at_path(value, &["scope", "no_global_aggregation"], true)?;
    expect_json_bool_at_path(value, &["scope", "aethra_fixture_backed_by_default"], true)?;
    let steps = value
        .get("story_steps")
        .and_then(|field| field.as_array())
        .ok_or_else(|| "is missing story_steps array".to_string())?;
    for step in steps {
        for field in [
            "id",
            "name",
            "source_surface",
            "summary",
            "talking_point",
            "local_next_step",
            "boundary_note",
        ] {
            if step.get(field).and_then(|value| value.as_str()).is_none() {
                return Err(format!("story step is missing string field: {}", field));
            }
        }
    }
    Ok(())
}

fn validate_demo_report_json(value: &Value) -> Result<(), String> {
    expect_json_string(
        value,
        "demo_package_schema_version",
        DEMO_PACKAGE_SCHEMA_VERSION,
    )?;
    expect_json_string(value, "package_type", DEMO_PACKAGE_TYPE)?;
    expect_json_string(value, "package_mode", DEMO_PACKAGE_MODE)?;
    expect_json_bool(value, "local_only", true)?;
    expect_json_bool(value, "local_preview_demo_only", true)?;
    expect_json_bool(value, "no_cloud_calls_by_default", true)?;
    expect_json_bool(value, "no_telemetry", true)?;
    expect_json_bool(value, "no_global_aggregation", true)?;
    expect_json_string(value, "demo_status", "demo_guidance")?;
    expect_json_array_len(
        value,
        "generated_file_names",
        DEMO_PACKAGE_REQUIRED_FILES.len(),
    )?;
    expect_json_array_strings(value, "generated_file_names", DEMO_PACKAGE_REQUIRED_FILES)?;
    expect_json_array_len(value, "story_steps", DEMO_STORY_STEPS.len())?;
    expect_json_bool(value, "external_assurance_claim", false)?;
    expect_json_bool(value, "external_integrity_claim", false)?;
    expect_boundary_terms(value, "package_boundaries", &demo_package_boundaries())?;
    Ok(())
}

fn validate_demo_package_safe_text(label: &str, text: &str) -> Result<(), String> {
    validate_policy_package_safe_text(label, text)?;
    let lower = text.to_ascii_lowercase();
    for unsafe_term in [
        "demo package contents:",
        "generated package contents:",
        "route guarantee",
        "model controls",
        "runner controls",
    ] {
        if lower.contains(unsafe_term) {
            return Err(format!(
                "{} contains unsafe content: {}",
                label, unsafe_term
            ));
        }
    }
    Ok(())
}

fn format_demo_package_summary(report: &DemoPackageReport) -> String {
    let status = report
        .demo_summary_json
        .get("status")
        .and_then(|value| value.as_str())
        .unwrap_or("unknown");
    let mut lines = vec![
        "IgnisPrompt Local Demo Package".to_string(),
        format!("Schema version: {}", DEMO_PACKAGE_SCHEMA_VERSION),
        format!("Package mode: {}", DEMO_PACKAGE_MODE),
        format!("Output dir: {}", report.output_dir.display()),
        format!(
            "Generated at (unix seconds): {}",
            report.generated_at_unix_seconds
        ),
        format!("Demo status: {}", status),
        "Boundaries: local preview demo only; route/status/package values are hints, not guarantees; local helper checks, not certification; package validation is structural/local only; not signed.".to_string(),
        "".to_string(),
        "Generated files:".to_string(),
    ];
    for file_name in &report.generated_file_names {
        lines.push(format!("- {}", file_name));
    }
    lines.push("".to_string());
    lines.push("Next steps:".to_string());
    lines.push(
        "- run cargo run -p ignispromptctl -- demo-summary --package-validate <package-dir>"
            .to_string(),
    );
    lines.push(
        "- review Aethra Local Demo Studio package preview as read-only guidance.".to_string(),
    );
    lines.join("\n")
}

fn format_demo_package_summary_json(report: &DemoPackageReport) -> String {
    serde_json::to_string_pretty(&report.report_json).unwrap_or_default()
}

fn format_demo_package_validation_summary(report: &DemoPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Demo Package Validation".to_string(),
        format!(
            "Package dir: {}",
            safe_demo_package_path(&report.package_dir)
        ),
        format!(
            "Status: {}",
            if report.issues.is_empty() {
                "ok"
            } else {
                "failed"
            }
        ),
        "".to_string(),
        "Files:".to_string(),
    ];
    for file in &report.files {
        lines.push(format!(
            "- {}: {}",
            file.file_name,
            if file.present { "present" } else { "missing" }
        ));
    }
    if !report.issues.is_empty() {
        lines.push("".to_string());
        lines.push("Issues:".to_string());
        for issue in &report.issues {
            lines.push(format!("- {}", issue));
        }
    }
    lines.join("\n")
}

fn format_demo_package_list_summary(report: &DemoPackageValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Demo Package Files".to_string(),
        format!(
            "Package dir: {}",
            safe_demo_package_path(&report.package_dir)
        ),
        "".to_string(),
    ];
    for file in &report.files {
        let json_label = match file.json_valid {
            Some(true) => " json=valid",
            Some(false) => " json=invalid",
            None => "",
        };
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            if file.present { "present" } else { "missing" },
            json_label
        ));
    }
    lines.join("\n")
}

fn format_demo_package_validation_json(report: &DemoPackageValidationReport) -> String {
    serde_json::to_string_pretty(&demo_package_validation_value(report)).unwrap_or_default()
}

fn format_demo_package_list_json(report: &DemoPackageValidationReport) -> String {
    serde_json::to_string_pretty(&demo_package_validation_value(report)).unwrap_or_default()
}

fn demo_package_validation_value(report: &DemoPackageValidationReport) -> Value {
    json!({
        "demo_package_schema_version": DEMO_PACKAGE_SCHEMA_VERSION,
        "status": if report.issues.is_empty() { "ok" } else { "failed" },
        "package_dir": safe_demo_package_path(&report.package_dir),
        "files": report.files.iter().map(|file| json!({
            "name": file.file_name,
            "present": file.present,
            "json_valid": file.json_valid,
        })).collect::<Vec<_>>(),
        "issues": report.issues,
        "package_boundaries": demo_package_boundaries(),
    })
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

fn validate_doctor_model_inventory(body: &Value) -> Result<String, String> {
    required_string(body, "schema_version")?;
    required_string(body, "generated_at")?;
    required_array(body, "base_paths_scanned")?;
    required_string(body, "inventory_source")?;
    let files = required_array(body, "files")?;
    let summary = body
        .get("summary")
        .ok_or_else(|| "missing required object field 'summary'".to_string())?;
    let total_files = summary
        .get("total_files")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "missing required integer field 'summary.total_files'".to_string())?;
    let gguf_files = summary
        .get("gguf_files")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "missing required integer field 'summary.gguf_files'".to_string())?;
    let safetensors_files = summary
        .get("safetensors_files")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "missing required integer field 'summary.safetensors_files'".to_string())?;
    required_array(body, "boundary_notes")?;

    for file in files {
        required_string(file, "filename")?;
        required_string(file, "relative_path")?;
        required_string(file, "extension")?;
        required_string(file, "status")?;
        required_string(file, "boundary_note")?;
        file.get("size_bytes")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| "missing required integer field 'size_bytes'".to_string())?;
    }

    Ok(format!(
        "{} files ({} GGUF, {} safetensors)",
        total_files, gguf_files, safetensors_files
    ))
}

fn validate_doctor_capabilities(body: &Value) -> Result<String, String> {
    let release_channel = required_string(body, "release_channel")?;
    let local_only = required_bool(body, "local_only")?;
    let cloud_enabled = required_bool(body, "cloud_enabled")?;
    let routing_order = required_array(body, "routing_order")?;
    let capabilities = required_array(body, "capabilities")?;

    if release_channel != "local-preview" {
        return Err(format!(
            "release_channel is '{}', expected local-preview",
            release_channel
        ));
    }
    if !local_only {
        return Err("local_only is false".to_string());
    }
    if cloud_enabled {
        return Err("cloud_enabled is true".to_string());
    }
    if routing_order.is_empty() {
        return Err("routing_order is empty".to_string());
    }

    let mut cloud_disabled = false;
    for capability in capabilities {
        required_string(capability, "provider_id")?;
        required_string(capability, "display_name")?;
        required_string(capability, "tier")?;
        required_string(capability, "connector_type")?;
        required_string(capability, "status")?;
        required_bool(capability, "available")?;
        required_bool(capability, "configured")?;
        required_string(capability, "data_boundary")?;
        required_string(capability, "reason")?;
        required_string(capability, "confidence")?;
        required_array(capability, "warnings")?;

        if capability.get("provider_id").and_then(|v| v.as_str()) == Some("cloud-disabled") {
            cloud_disabled = true;
            if capability.get("status").and_then(|v| v.as_str()) != Some("disabled") {
                return Err("cloud-disabled capability is not disabled".to_string());
            }
            if capability.get("available").and_then(|v| v.as_bool()) != Some(false) {
                return Err("cloud-disabled capability is available".to_string());
            }
            if capability.get("configured").and_then(|v| v.as_bool()) != Some(false) {
                return Err("cloud-disabled capability is configured".to_string());
            }
        }
    }

    if !cloud_disabled {
        return Err("missing cloud-disabled capability".to_string());
    }

    Ok(format!(
        "available ({} {}; cloud disabled)",
        capabilities.len(),
        if capabilities.len() == 1 {
            "capability"
        } else {
            "capabilities"
        }
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
            eprintln!("error: daemon not reachable - {}", e);
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
            "Estimated CO2e avoided: {}",
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
            eprintln!("error: daemon not reachable - {}", e);
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

fn cmd_capabilities(base_url: &str, json_output: bool) {
    let url = format!("{}/v1/capabilities", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            if json_output {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&body).unwrap_or_default()
                );
            } else {
                println!("{}", format_capabilities_summary(&body));
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

fn format_capabilities_summary(body: &Value) -> String {
    let mut lines = vec![
        "IgnisPrompt Capabilities".to_string(),
        format!(
            "release_channel: {}",
            body.get("release_channel")
                .and_then(|v| v.as_str())
                .unwrap_or("-")
        ),
        format!(
            "local_only:      {}",
            body.get("local_only")
                .and_then(|v| v.as_bool())
                .map(|b| if b { "true" } else { "false" })
                .unwrap_or("-")
        ),
        format!(
            "cloud_enabled:   {}",
            body.get("cloud_enabled")
                .and_then(|v| v.as_bool())
                .map(|b| if b { "true" } else { "false" })
                .unwrap_or("-")
        ),
        "".to_string(),
        "Capabilities:".to_string(),
    ];

    if let Some(capabilities) = body.get("capabilities").and_then(|v| v.as_array()) {
        if capabilities.is_empty() {
            lines.push("- none reported".to_string());
        } else {
            for capability in capabilities {
                lines.push(format_capability_line(capability));
            }
        }
    } else {
        lines.push("- invalid response shape".to_string());
    }

    lines.push("".to_string());
    lines.push("Boundaries: status metadata only; no cloud calls; no telemetry; no runner execution; no secrets returned.".to_string());
    lines.join("\n")
}

fn format_capability_line(capability: &Value) -> String {
    let tier = capability
        .get("tier")
        .and_then(|v| v.as_str())
        .unwrap_or("-");
    let provider_id = capability
        .get("provider_id")
        .and_then(|v| v.as_str())
        .unwrap_or("-");
    let status = capability
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("-");
    let available = capability
        .get("available")
        .and_then(|v| v.as_bool())
        .map(|b| if b { "available" } else { "not available" })
        .unwrap_or("unknown");
    let configured = capability
        .get("configured")
        .and_then(|v| v.as_bool())
        .map(|b| if b { "configured" } else { "not configured" })
        .unwrap_or("unknown");
    let boundary = capability
        .get("data_boundary")
        .and_then(|v| v.as_str())
        .unwrap_or("-");
    let reason = capability
        .get("reason")
        .and_then(|v| v.as_str())
        .unwrap_or("-");

    format!(
        "- {} {}: {} / {} / {} / boundary={} / reason={}",
        tier, provider_id, status, available, configured, boundary, reason
    )
}

fn cmd_model_inventory(base_url: &str, json_output: bool) {
    let url = format!("{}/v1/models/inventory", base_url);
    match ureq::get(&url).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            if json_output {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&body).unwrap_or_default()
                );
            } else {
                println!("{}", format_model_inventory_summary(&body));
            }
        }
        Err(e) => {
            eprintln!("error: {}", e);
            process::exit(1);
        }
    }
}

fn format_model_inventory_summary(body: &Value) -> String {
    let summary = body.get("summary").unwrap_or(&Value::Null);
    let files = body
        .get("files")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    let largest_file_mb = summary
        .get("largest_file_mb")
        .and_then(|value| value.as_f64())
        .unwrap_or(0.0);

    let mut lines = vec![
        "IgnisPrompt Local Model Inventory".to_string(),
        format!(
            "schema_version:     {}",
            body.get("schema_version")
                .and_then(|value| value.as_str())
                .unwrap_or("-")
        ),
        format!(
            "inventory_source:   {}",
            body.get("inventory_source")
                .and_then(|value| value.as_str())
                .unwrap_or("-")
        ),
        format!(
            "total_files:        {}",
            summary
                .get("total_files")
                .and_then(|value| value.as_u64())
                .unwrap_or(0)
        ),
        format!(
            "total_size:         {}",
            format_bytes(
                summary
                    .get("total_size_bytes")
                    .and_then(|value| value.as_u64())
                    .unwrap_or(0)
            )
        ),
        format!(
            "gguf_files:         {}",
            summary
                .get("gguf_files")
                .and_then(|value| value.as_u64())
                .unwrap_or(0)
        ),
        format!("largest_file_mb:    {:.2}", largest_file_mb),
        "".to_string(),
        "Files:".to_string(),
    ];

    if files.is_empty() {
        lines.push("- none found".to_string());
    } else {
        for file in files.iter().take(20) {
            lines.push(format_model_inventory_file_line(file));
        }
        if files.len() > 20 {
            lines.push(format!(
                "- ... {} additional files omitted",
                files.len() - 20
            ));
        }
    }

    if let Some(notes) = summary.get("notes").and_then(|value| value.as_array()) {
        if !notes.is_empty() {
            lines.push("".to_string());
            lines.push("Notes:".to_string());
            for note in notes {
                if let Some(note) = note.as_str() {
                    lines.push(format!("- {}", note));
                }
            }
        }
    }

    lines.push("".to_string());
    lines.push("Boundaries: read-only inventory only; no model execution; no downloads; no deletes; no file contents or hashes returned.".to_string());
    lines.join("\n")
}

fn format_model_inventory_file_line(file: &Value) -> String {
    let relative_path = file
        .get("relative_path")
        .and_then(|value| value.as_str())
        .unwrap_or("-");
    let extension = file
        .get("extension")
        .and_then(|value| value.as_str())
        .unwrap_or("-");
    let status = file
        .get("status")
        .and_then(|value| value.as_str())
        .unwrap_or("-");
    let size_bytes = file
        .get("size_bytes")
        .and_then(|value| value.as_u64())
        .unwrap_or(0);
    let quantization = file
        .get("quantization")
        .and_then(|value| value.as_str())
        .unwrap_or("-");

    format!(
        "- {}: {} / {} / {} / quantization={}",
        relative_path,
        extension,
        format_bytes(size_bytes),
        status,
        quantization
    )
}

fn format_bytes(size_bytes: u64) -> String {
    if size_bytes >= 1_073_741_824 {
        format!("{:.2} GB", size_bytes as f64 / 1_073_741_824.0)
    } else if size_bytes >= 1_048_576 {
        format!("{:.2} MB", size_bytes as f64 / 1_048_576.0)
    } else if size_bytes >= 1024 {
        format!("{:.2} KB", size_bytes as f64 / 1024.0)
    } else {
        format!("{} B", size_bytes)
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

const EVIDENCE_BUNDLE_SCHEMA_VERSION: &str = "ignisprompt-local-evidence-bundle-v1";
const EVIDENCE_BUNDLE_BUNDLE_TYPE: &str = "ignisprompt-local-evidence-bundle";
const EVIDENCE_BUNDLE_BUNDLE_MODE: &str = "local-preview";

#[derive(Clone, Copy, Debug)]
struct EvidenceBundleFileSpec {
    file_name: &'static str,
    kind: &'static str,
    required: bool,
    json_expected: bool,
    endpoint_name: Option<&'static str>,
}

#[derive(Clone, Copy, Debug)]
struct EvidenceBundleCaptureSpec {
    name: &'static str,
    file_name: &'static str,
    endpoint_path: &'static str,
    validate: fn(&Value) -> Result<String, String>,
}

#[derive(Clone, Debug)]
struct EvidenceBundleCapture {
    name: &'static str,
    file_name: &'static str,
    endpoint_path: &'static str,
    summary: String,
    body: Value,
}

#[derive(Clone, Debug)]
struct EvidenceBundleReport {
    bundle_schema_version: &'static str,
    bundle_type: &'static str,
    bundle_mode: &'static str,
    output_dir: PathBuf,
    include_audit_events: bool,
    generated_at_unix_seconds: u64,
    captures: Vec<EvidenceBundleCapture>,
    generated_file_names: Vec<String>,
    included_endpoints: Vec<String>,
    summary_json: Value,
    manifest_json: Value,
    readme: String,
}

#[derive(Clone, Debug, Default)]
struct EvidenceBundleMetadata {
    bundle_schema_version: Option<String>,
    bundle_type: Option<String>,
    bundle_mode: Option<String>,
    local_only: Option<bool>,
    non_certified: Option<bool>,
    signed: Option<bool>,
    production_attestation: Option<bool>,
    include_audit_events: Option<bool>,
    generated_at_unix_seconds: Option<u64>,
    generated_file_names: Vec<String>,
    included_endpoints: Vec<String>,
}

#[derive(Clone, Debug)]
struct EvidenceBundleFileState {
    file_name: &'static str,
    required: bool,
    kind: &'static str,
    endpoint_name: Option<&'static str>,
    present: bool,
    read_error: Option<String>,
    json: Option<Value>,
    text: Option<String>,
}

#[derive(Clone, Debug)]
struct EvidenceBundleSnapshot {
    bundle_dir: PathBuf,
    files: Vec<EvidenceBundleFileState>,
}

#[derive(Clone, Debug)]
struct EvidenceBundleValidationReport {
    snapshot: EvidenceBundleSnapshot,
    metadata: EvidenceBundleMetadata,
    issues: Vec<String>,
}

#[derive(Clone, Debug)]
struct EvidenceBundleManifestReport {
    bundle_dir: PathBuf,
    manifest_json: Value,
    metadata: EvidenceBundleMetadata,
}

#[derive(Clone, Debug)]
struct EvidenceBundleArchiveReport {
    bundle_dir: PathBuf,
    archive_path: PathBuf,
    validation: EvidenceBundleValidationReport,
    archived_file_names: Vec<String>,
    archive_size_bytes: u64,
}

#[derive(Clone, Debug)]
struct EvidenceBundleArchiveVerificationReport {
    archive_path: PathBuf,
    bundle_root: String,
    validation: EvidenceBundleValidationReport,
}

fn evidence_bundle_capture_specs(include_audit_events: bool) -> Vec<EvidenceBundleCaptureSpec> {
    let mut specs = vec![
        EvidenceBundleCaptureSpec {
            name: "health",
            file_name: "health.json",
            endpoint_path: "/health",
            validate: validate_doctor_health,
        },
        EvidenceBundleCaptureSpec {
            name: "version_status",
            file_name: "version.json",
            endpoint_path: "/v1/status/version",
            validate: validate_doctor_version_status,
        },
        EvidenceBundleCaptureSpec {
            name: "models",
            file_name: "models.json",
            endpoint_path: "/v1/models",
            validate: validate_doctor_models,
        },
        EvidenceBundleCaptureSpec {
            name: "model_status_hints",
            file_name: "model-status.json",
            endpoint_path: "/v1/status/models",
            validate: validate_doctor_model_status_hints,
        },
        EvidenceBundleCaptureSpec {
            name: "sustainability_metrics",
            file_name: "sustainability-30d.json",
            endpoint_path: "/v1/metrics/sustainability?period=30d",
            validate: validate_doctor_sustainability_metrics,
        },
    ];

    if include_audit_events {
        specs.push(EvidenceBundleCaptureSpec {
            name: "audit_events",
            file_name: "audit-events.json",
            endpoint_path: "/v1/audit/events",
            validate: validate_bundle_audit_events,
        });
    }

    specs
}

fn evidence_bundle_file_specs() -> Vec<EvidenceBundleFileSpec> {
    vec![
        EvidenceBundleFileSpec {
            file_name: "README.md",
            kind: "readme",
            required: true,
            json_expected: false,
            endpoint_name: None,
        },
        EvidenceBundleFileSpec {
            file_name: "manifest.json",
            kind: "manifest",
            required: true,
            json_expected: true,
            endpoint_name: None,
        },
        EvidenceBundleFileSpec {
            file_name: "summary.json",
            kind: "summary",
            required: true,
            json_expected: true,
            endpoint_name: None,
        },
        EvidenceBundleFileSpec {
            file_name: "health.json",
            kind: "endpoint_response",
            required: true,
            json_expected: true,
            endpoint_name: Some("health"),
        },
        EvidenceBundleFileSpec {
            file_name: "version.json",
            kind: "endpoint_response",
            required: true,
            json_expected: true,
            endpoint_name: Some("version_status"),
        },
        EvidenceBundleFileSpec {
            file_name: "models.json",
            kind: "endpoint_response",
            required: true,
            json_expected: true,
            endpoint_name: Some("models"),
        },
        EvidenceBundleFileSpec {
            file_name: "model-status.json",
            kind: "endpoint_response",
            required: true,
            json_expected: true,
            endpoint_name: Some("model_status_hints"),
        },
        EvidenceBundleFileSpec {
            file_name: "sustainability-30d.json",
            kind: "endpoint_response",
            required: true,
            json_expected: true,
            endpoint_name: Some("sustainability_metrics"),
        },
        EvidenceBundleFileSpec {
            file_name: "audit-events.json",
            kind: "endpoint_response",
            required: false,
            json_expected: true,
            endpoint_name: Some("audit_events"),
        },
    ]
}

fn evidence_bundle_generated_file_names(include_audit_events: bool) -> Vec<String> {
    evidence_bundle_capture_specs(include_audit_events)
        .into_iter()
        .map(|spec| spec.file_name.to_string())
        .chain(
            ["README.md", "manifest.json", "summary.json"]
                .into_iter()
                .map(str::to_string),
        )
        .collect()
}

fn evidence_bundle_included_endpoints(include_audit_events: bool) -> Vec<String> {
    evidence_bundle_capture_specs(include_audit_events)
        .into_iter()
        .map(|spec| spec.name.to_string())
        .collect()
}

fn evidence_bundle_manifest_files(include_audit_events: bool) -> Vec<Value> {
    let mut files = vec![
        json!({"file_name": "README.md", "kind": "readme", "required": true}),
        json!({"file_name": "manifest.json", "kind": "manifest", "required": true}),
        json!({"file_name": "summary.json", "kind": "summary", "required": true}),
    ];

    files.extend(
        evidence_bundle_capture_specs(include_audit_events)
            .into_iter()
            .map(|capture| {
                json!({
                    "file_name": capture.file_name,
                    "kind": "endpoint_response",
                    "required": true,
                    "endpoint_name": capture.name,
                })
            }),
    );

    files
}

fn evidence_bundle_bundle_boundary() -> Value {
    json!({
        "bundle_mode": EVIDENCE_BUNDLE_BUNDLE_MODE,
        "local_only": true,
        "non_certified": true,
        "signed": false,
        "production_attestation": false,
    })
}

fn evidence_bundle_boundary_notes() -> Vec<&'static str> {
    vec![
        "Local-preview diagnostic bundle only.",
        "Local-only bundle metadata only.",
        "Non-certified.",
        "Not signed.",
        "Not production attestation.",
        "No prompts or raw user text are added by the CLI summary files.",
    ]
}

fn cmd_evidence_bundle(
    base_url: &str,
    output: &Option<String>,
    validate: &Option<String>,
    list: &Option<String>,
    archive: &Option<String>,
    archive_output: &Option<String>,
    verify_archive: &Option<String>,
    print_manifest: &Option<String>,
    include_audit_events: bool,
    json_output: bool,
) {
    if archive_output.is_some() && archive.is_none() {
        eprintln!("error: --archive-output requires --archive");
        process::exit(1);
    }

    if let Some(bundle_dir) = validate {
        let report = match build_evidence_bundle_validation_report(Path::new(bundle_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_evidence_bundle_validation_json(&report));
        } else {
            println!("{}", format_evidence_bundle_validation_summary(&report));
        }
        if !report.issues.is_empty() {
            process::exit(1);
        }
        return;
    }

    if let Some(bundle_dir) = list {
        let report = match build_evidence_bundle_validation_report(Path::new(bundle_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_evidence_bundle_list_json(&report));
        } else {
            println!("{}", format_evidence_bundle_list_summary(&report));
        }
        return;
    }

    if let Some(archive_path) = verify_archive {
        let report =
            match build_evidence_bundle_archive_verification_report(Path::new(archive_path)) {
                Ok(report) => report,
                Err(message) => {
                    eprintln!("error: {}", message);
                    process::exit(1);
                }
            };
        if json_output {
            println!(
                "{}",
                format_evidence_bundle_archive_verification_json(&report)
            );
        } else {
            println!(
                "{}",
                format_evidence_bundle_archive_verification_summary(&report)
            );
        }
        if !report.validation.issues.is_empty() {
            process::exit(1);
        }
        return;
    }

    if let Some(bundle_dir) = print_manifest {
        let report = match build_evidence_bundle_manifest_report(Path::new(bundle_dir)) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_evidence_bundle_manifest_json(&report));
        } else {
            println!("{}", format_evidence_bundle_manifest_summary(&report));
        }
        return;
    }

    if let Some(bundle_dir) = archive {
        let report = match build_evidence_bundle_archive_report(
            Path::new(bundle_dir),
            archive_output.as_deref(),
        ) {
            Ok(report) => report,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        };
        if json_output {
            println!("{}", format_evidence_bundle_archive_json(&report));
        } else {
            println!("{}", format_evidence_bundle_archive_summary(&report));
        }
        return;
    }

    let output_dir = match output {
        Some(output) => match validate_evidence_bundle_output_dir(output) {
            Ok(path) => path,
            Err(message) => {
                eprintln!("error: {}", message);
                process::exit(1);
            }
        },
        None => {
            eprintln!(
                "error: provide --output for bundle creation, or --validate/--list/--archive/--verify-archive/--print-manifest for an existing bundle"
            );
            process::exit(1);
        }
    };

    let captures = match fetch_evidence_bundle_captures(base_url, include_audit_events) {
        Ok(captures) => captures,
        Err(message) => {
            eprintln!("{}", message);
            process::exit(1);
        }
    };

    let report = match build_evidence_bundle_report(output_dir, include_audit_events, captures) {
        Ok(report) => report,
        Err(message) => {
            eprintln!("error: {}", message);
            process::exit(1);
        }
    };

    if let Err(message) = write_evidence_bundle_report(&report) {
        eprintln!("error: {}", message);
        process::exit(1);
    }

    if json_output {
        println!(
            "{}",
            serde_json::to_string_pretty(&report.summary_json).unwrap_or_default()
        );
    } else {
        println!("{}", format_evidence_bundle_summary(&report));
    }
}

fn fetch_evidence_bundle_captures(
    base_url: &str,
    include_audit_events: bool,
) -> Result<Vec<EvidenceBundleCapture>, String> {
    evidence_bundle_capture_specs(include_audit_events)
        .iter()
        .map(|spec| fetch_evidence_bundle_capture(base_url, spec))
        .collect()
}

fn fetch_evidence_bundle_capture(
    base_url: &str,
    spec: &EvidenceBundleCaptureSpec,
) -> Result<EvidenceBundleCapture, String> {
    let endpoint = doctor_endpoint_url(base_url, spec.endpoint_path);

    match ureq::get(&endpoint).call() {
        Ok(resp) => {
            let body = parse_response(resp);
            let summary = (spec.validate)(&body).map_err(|message| {
                format_evidence_bundle_invalid_response_error(
                    spec.name,
                    spec.endpoint_path,
                    &message,
                )
            })?;

            Ok(EvidenceBundleCapture {
                name: spec.name,
                file_name: spec.file_name,
                endpoint_path: spec.endpoint_path,
                summary,
                body,
            })
        }
        Err(ureq::Error::Status(status, resp)) => {
            let body = parse_response(resp);
            Err(format_http_error(
                "evidence bundle",
                status,
                spec.endpoint_path,
                &body,
            ))
        }
        Err(error) => Err(format_evidence_bundle_unreachable_error(
            spec.name,
            spec.endpoint_path,
            &error.to_string(),
        )),
    }
}

fn build_evidence_bundle_report(
    output_dir: PathBuf,
    include_audit_events: bool,
    captures: Vec<EvidenceBundleCapture>,
) -> Result<EvidenceBundleReport, String> {
    let generated_at_unix_seconds = current_unix_seconds()?;
    let output_dir_string = output_dir.to_string_lossy().to_string();
    let generated_file_names = evidence_bundle_generated_file_names(include_audit_events);
    let included_endpoints = evidence_bundle_included_endpoints(include_audit_events);

    let summary_json = build_evidence_bundle_summary_json(
        &output_dir_string,
        generated_at_unix_seconds,
        include_audit_events,
        &generated_file_names,
        &included_endpoints,
        &captures,
    );
    let manifest_json = build_evidence_bundle_manifest_json(
        &output_dir_string,
        generated_at_unix_seconds,
        include_audit_events,
        &generated_file_names,
        &included_endpoints,
        &captures,
    );
    let readme = build_evidence_bundle_readme(include_audit_events);

    validate_no_placeholder_string_values("summary", &summary_json)?;
    validate_no_placeholder_string_values("manifest", &manifest_json)?;

    Ok(EvidenceBundleReport {
        bundle_schema_version: EVIDENCE_BUNDLE_SCHEMA_VERSION,
        bundle_type: EVIDENCE_BUNDLE_BUNDLE_TYPE,
        bundle_mode: EVIDENCE_BUNDLE_BUNDLE_MODE,
        output_dir,
        include_audit_events,
        generated_at_unix_seconds,
        captures,
        generated_file_names,
        included_endpoints,
        summary_json,
        manifest_json,
        readme,
    })
}

fn build_evidence_bundle_summary_json(
    output_dir: &str,
    generated_at_unix_seconds: u64,
    include_audit_events: bool,
    generated_file_names: &[String],
    included_endpoints: &[String],
    captures: &[EvidenceBundleCapture],
) -> Value {
    json!({
        "bundle_schema_version": EVIDENCE_BUNDLE_SCHEMA_VERSION,
        "bundle_type": EVIDENCE_BUNDLE_BUNDLE_TYPE,
        "bundle_mode": EVIDENCE_BUNDLE_BUNDLE_MODE,
        "output_dir": output_dir,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "developer_evidence_only": true,
        "non_certified": true,
        "signed": false,
        "production_attestation": false,
        "include_audit_events": include_audit_events,
        "generated_file_names": generated_file_names,
        "included_endpoints": included_endpoints,
        "bundle_boundary": evidence_bundle_bundle_boundary(),
        "captured_endpoints": captures
            .iter()
            .map(|capture| json!({
                "name": capture.name,
                "file_name": capture.file_name,
                "endpoint_path": capture.endpoint_path,
                "summary": capture.summary,
            }))
            .collect::<Vec<_>>(),
        "notes": evidence_bundle_boundary_notes(),
    })
}

fn build_evidence_bundle_manifest_json(
    output_dir: &str,
    generated_at_unix_seconds: u64,
    include_audit_events: bool,
    generated_file_names: &[String],
    included_endpoints: &[String],
    captures: &[EvidenceBundleCapture],
) -> Value {
    json!({
        "bundle_schema_version": EVIDENCE_BUNDLE_SCHEMA_VERSION,
        "bundle_type": EVIDENCE_BUNDLE_BUNDLE_TYPE,
        "bundle_mode": EVIDENCE_BUNDLE_BUNDLE_MODE,
        "output_dir": output_dir,
        "generated_at_unix_seconds": generated_at_unix_seconds,
        "local_only": true,
        "developer_evidence_only": true,
        "non_certified": true,
        "signed": false,
        "production_attestation": false,
        "include_audit_events": include_audit_events,
        "generated_file_names": generated_file_names,
        "included_endpoints": included_endpoints,
        "bundle_boundary": evidence_bundle_bundle_boundary(),
        "files": evidence_bundle_manifest_files(include_audit_events),
        "captured_endpoints": captures
            .iter()
            .map(|capture| json!({
                "name": capture.name,
                "file_name": capture.file_name,
                "endpoint_path": capture.endpoint_path,
                "summary": capture.summary,
            }))
            .collect::<Vec<_>>(),
        "notes": evidence_bundle_boundary_notes(),
    })
}

fn build_evidence_bundle_readme(include_audit_events: bool) -> String {
    let audit_line = if include_audit_events {
        "Audit events are included because they were explicitly requested."
    } else {
        "Audit events are omitted by default and are only included when explicitly requested."
    };

    [
        "# IgnisPrompt Local Evidence Bundle",
        "",
        "This directory contains a local-preview diagnostic bundle generated by `ignispromptctl evidence-bundle`.",
        "",
        "Boundaries:",
        "- local-only",
        "- not signed",
        "- non-certified",
        "- not production attestation",
        "- no prompts or raw user text are added by the CLI summary files",
        "- the bundle uses existing local daemon endpoints only",
        "",
        audit_line,
        "",
        "Contents:",
        "- README.md",
        "- manifest.json",
        "- summary.json",
        "- health.json",
        "- version.json",
        "- models.json",
        "- model-status.json",
        "- sustainability-30d.json",
        "- optional audit-events.json when explicitly requested",
        "",
        "Keep this output under ignored `local-evidence/` and do not commit the generated bundle.",
        "",
    ]
    .join("\n")
}

fn write_evidence_bundle_report(report: &EvidenceBundleReport) -> Result<(), String> {
    if report.output_dir.exists() {
        return Err(format!(
            "output directory already exists: {}",
            report.output_dir.display()
        ));
    }

    let parent = report.output_dir.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)
        .map_err(|error| format!("could not create bundle parent directory: {}", error))?;

    let staging_dir = parent.join(format!(
        ".ignispromptctl-evidence-bundle-{}-{}",
        report.generated_at_unix_seconds,
        process::id()
    ));
    if staging_dir.exists() {
        let _ = fs::remove_dir_all(&staging_dir);
    }
    fs::create_dir_all(&staging_dir)
        .map_err(|error| format!("could not create bundle staging directory: {}", error))?;

    let write_result = (|| -> Result<(), String> {
        write_pretty_json_file(&staging_dir.join("summary.json"), &report.summary_json)?;
        write_pretty_json_file(&staging_dir.join("manifest.json"), &report.manifest_json)?;
        fs::write(staging_dir.join("README.md"), &report.readme)
            .map_err(|error| format!("could not write README.md: {}", error))?;

        for capture in &report.captures {
            write_pretty_json_file(&staging_dir.join(capture.file_name), &capture.body)?;
        }

        Ok(())
    })();

    if let Err(message) = write_result {
        let _ = fs::remove_dir_all(&staging_dir);
        return Err(message);
    }

    fs::rename(&staging_dir, &report.output_dir).map_err(|error| {
        let _ = fs::remove_dir_all(&staging_dir);
        format!(
            "could not finalize evidence bundle at {}: {}",
            report.output_dir.display(),
            error
        )
    })?;

    Ok(())
}

fn format_evidence_bundle_summary(report: &EvidenceBundleReport) -> String {
    let output_dir = report
        .summary_json
        .get("output_dir")
        .and_then(|value| value.as_str())
        .unwrap_or("-");
    let mut lines = vec![
        "IgnisPrompt Local Evidence Bundle".to_string(),
        format!("Schema version: {}", report.bundle_schema_version),
        format!("Bundle type: {}", report.bundle_type),
        format!("Bundle mode: {}", report.bundle_mode),
        format!("Output dir: {}", output_dir),
        format!(
            "Generated at (unix seconds): {}",
            report.generated_at_unix_seconds
        ),
        format!(
            "Local-only: {}",
            bool_label(
                report
                    .summary_json
                    .get("local_only")
                    .and_then(|value| value.as_bool())
                    .unwrap_or(true),
            )
        ),
        format!(
            "Signed: {}",
            bool_label(
                report
                    .summary_json
                    .get("signed")
                    .and_then(|value| value.as_bool())
                    .unwrap_or(false),
            )
        ),
        format!(
            "Non-certified: {}",
            bool_label(
                report
                    .summary_json
                    .get("non_certified")
                    .and_then(|value| value.as_bool())
                    .unwrap_or(true),
            )
        ),
        format!(
            "Production attestation: {}",
            bool_label(
                report
                    .summary_json
                    .get("production_attestation")
                    .and_then(|value| value.as_bool())
                    .unwrap_or(false),
            )
        ),
        format!(
            "Audit events included: {}",
            bool_label(report.include_audit_events)
        ),
        "".to_string(),
        "Generated files:".to_string(),
    ];

    for file_name in &report.generated_file_names {
        lines.push(format!("- {}", file_name));
    }

    lines.push("".to_string());
    lines.push("Included endpoints:".to_string());
    for endpoint in &report.included_endpoints {
        lines.push(format!("- {}", endpoint));
    }

    lines.join("\n")
}

fn build_evidence_bundle_manifest_report(
    bundle_dir: &Path,
) -> Result<EvidenceBundleManifestReport, String> {
    let snapshot = read_evidence_bundle_snapshot(bundle_dir)?;
    let manifest = snapshot
        .file_state("manifest.json")
        .ok_or_else(|| "missing required file: manifest.json".to_string())?;

    if !manifest.present {
        return Err("missing required file: manifest.json".to_string());
    }
    if let Some(error) = &manifest.read_error {
        return Err(error.clone());
    }

    let manifest_json = manifest
        .json
        .clone()
        .ok_or_else(|| "invalid JSON in manifest.json".to_string())?;
    let metadata = evidence_bundle_metadata_from_value(&manifest_json);

    Ok(EvidenceBundleManifestReport {
        bundle_dir: bundle_dir.to_path_buf(),
        manifest_json,
        metadata,
    })
}

fn build_evidence_bundle_archive_report(
    bundle_dir: &Path,
    archive_output: Option<&str>,
) -> Result<EvidenceBundleArchiveReport, String> {
    let validation = build_evidence_bundle_validation_report(bundle_dir)?;
    if !validation.issues.is_empty() {
        return Err(format!(
            "bundle validation failed before archiving:\n{}",
            validation
                .issues
                .iter()
                .map(|issue| format!("- {}", issue))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    validate_bundle_path_is_not_symlink(bundle_dir)?;

    let archive_path = validate_evidence_bundle_archive_output(bundle_dir, archive_output)?;
    if archive_path.exists() {
        return Err(format!(
            "archive output already exists: {}",
            archive_path.display()
        ));
    }

    if let Some(parent) = archive_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("could not create archive parent directory: {}", error))?;
    }

    let archived_file_names = evidence_bundle_generated_file_names(
        validation.metadata.include_audit_events.unwrap_or(false),
    );
    write_evidence_bundle_archive(bundle_dir, &archive_path, &archived_file_names)?;
    let archive_size_bytes = fs::metadata(&archive_path)
        .map_err(|error| {
            format!(
                "could not stat archive {}: {}",
                archive_path.display(),
                error
            )
        })?
        .len();

    Ok(EvidenceBundleArchiveReport {
        bundle_dir: bundle_dir.to_path_buf(),
        archive_path,
        validation,
        archived_file_names,
        archive_size_bytes,
    })
}

fn build_evidence_bundle_archive_verification_report(
    archive_path: &Path,
) -> Result<EvidenceBundleArchiveVerificationReport, String> {
    let bundle_root = inspect_evidence_bundle_archive(archive_path)?;
    let temp_root = create_unique_temp_dir("ignispromptctl-archive-verify")?;
    let cleanup_root = temp_root.clone();
    let verification_result = (|| -> Result<EvidenceBundleArchiveVerificationReport, String> {
        extract_evidence_bundle_archive(archive_path, &temp_root)?;
        let bundle_dir = temp_root.join(&bundle_root);
        let validation = build_evidence_bundle_validation_report(&bundle_dir)?;
        Ok(EvidenceBundleArchiveVerificationReport {
            archive_path: archive_path.to_path_buf(),
            bundle_root,
            validation,
        })
    })();

    let _ = fs::remove_dir_all(cleanup_root);
    verification_result
}

fn validate_bundle_path_is_not_symlink(bundle_dir: &Path) -> Result<(), String> {
    let metadata = fs::symlink_metadata(bundle_dir).map_err(|error| {
        format!(
            "could not inspect bundle directory {}: {}",
            bundle_dir.display(),
            error
        )
    })?;
    if metadata.file_type().is_symlink() {
        return Err(format!(
            "bundle directory must not be a symlink: {}",
            bundle_dir.display()
        ));
    }
    Ok(())
}

fn validate_evidence_bundle_archive_output(
    bundle_dir: &Path,
    archive_output: Option<&str>,
) -> Result<PathBuf, String> {
    let bundle_name = bundle_dir
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| {
            format!(
                "could not derive archive name from bundle directory: {}",
                bundle_dir.display()
            )
        })?;

    let default_output = Path::new("local-evidence")
        .join("archives")
        .join(format!("{}.tar.gz", bundle_name));

    let output = match archive_output {
        Some(output) => validate_evidence_bundle_archive_output_path(output)?,
        None => default_output,
    };

    Ok(output)
}

fn validate_evidence_bundle_archive_output_path(output: &str) -> Result<PathBuf, String> {
    let trimmed = output.trim();
    if trimmed.is_empty() {
        return Err(
            "archive output is required; use an ignored local-evidence/ path such as local-evidence/archives/demo-bundle.tar.gz"
                .to_string(),
        );
    }

    let path = Path::new(trimmed);
    if path.is_absolute() {
        return Err(
            "archive output must be relative and under ignored local-evidence/; use local-evidence/archives/demo-bundle.tar.gz"
                .to_string(),
        );
    }

    for component in path.components() {
        match component {
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(
                    "archive output must stay under ignored local-evidence/ without parent traversal"
                        .to_string(),
                );
            }
            _ => {}
        }
    }

    let mut components = path.components().peekable();
    while matches!(components.peek(), Some(&Component::CurDir)) {
        components.next();
    }

    match components.next() {
        Some(Component::Normal(name)) if name == "local-evidence" => {}
        _ => {
            return Err(
                "archive output must start with local-evidence/; use local-evidence/archives/demo-bundle.tar.gz"
                    .to_string(),
            );
        }
    }

    if path.exists() {
        return Err(format!("archive output already exists: {}", path.display()));
    }

    Ok(path.to_path_buf())
}

fn write_evidence_bundle_archive(
    bundle_dir: &Path,
    archive_path: &Path,
    archived_file_names: &[String],
) -> Result<(), String> {
    let bundle_name = bundle_dir
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| {
            format!(
                "could not derive archive bundle root from {}",
                bundle_dir.display()
            )
        })?;

    let archive_file = fs::File::create(archive_path).map_err(|error| {
        format!(
            "could not create archive output {}: {}",
            archive_path.display(),
            error
        )
    })?;
    let encoder = GzEncoder::new(archive_file, Compression::default());
    let mut builder = Builder::new(encoder);

    let write_result = (|| -> Result<(), String> {
        for file_name in archived_file_names {
            let source = bundle_dir.join(file_name);
            let metadata = fs::symlink_metadata(&source)
                .map_err(|error| format!("could not inspect {}: {}", source.display(), error))?;
            if metadata.file_type().is_symlink() {
                return Err(format!(
                    "refusing to archive symlinked file: {}",
                    source.display()
                ));
            }
            if !metadata.is_file() {
                return Err(format!(
                    "expected regular file for archive entry: {}",
                    source.display()
                ));
            }

            builder
                .append_path_with_name(&source, Path::new(bundle_name).join(file_name))
                .map_err(|error| {
                    format!("could not add {} to archive: {}", source.display(), error)
                })?;
        }

        builder
            .finish()
            .map_err(|error| format!("could not finalize tar archive: {}", error))?;
        let encoder = builder
            .into_inner()
            .map_err(|error| format!("could not finalize archive encoder: {}", error))?;
        encoder
            .finish()
            .map_err(|error| format!("could not finish gzip archive: {}", error))?;
        Ok(())
    })();

    if let Err(message) = write_result {
        let _ = fs::remove_file(archive_path);
        return Err(message);
    }

    Ok(())
}

fn inspect_evidence_bundle_archive(archive_path: &Path) -> Result<String, String> {
    let archive_file = fs::File::open(archive_path).map_err(|error| {
        format!(
            "could not open archive {}: {}",
            archive_path.display(),
            error
        )
    })?;
    let decoder = GzDecoder::new(archive_file);
    let mut archive = Archive::new(decoder);
    let mut bundle_root: Option<String> = None;
    let mut has_entries = false;

    for entry_result in archive
        .entries()
        .map_err(|error| format!("could not read archive entries: {}", error))?
    {
        let entry =
            entry_result.map_err(|error| format!("could not read archive entry: {}", error))?;
        let entry_path = entry
            .path()
            .map_err(|error| format!("could not read archive entry path: {}", error))?;
        validate_archive_entry_path(&entry_path)?;

        let mut components = entry_path.components();
        let root_component = components
            .next()
            .ok_or_else(|| format!("archive entry path is empty in {}", archive_path.display()))?;
        let root_name = root_component.as_os_str().to_string_lossy().to_string();
        if root_name.is_empty() {
            return Err(format!(
                "archive entry path has an empty root in {}",
                archive_path.display()
            ));
        }

        if let Some(existing) = &bundle_root {
            if existing != &root_name {
                return Err(format!(
                    "archive contains multiple bundle roots: {} and {}",
                    existing, root_name
                ));
            }
        } else {
            bundle_root = Some(root_name);
        }

        let entry_type = entry.header().entry_type();
        if entry_type.is_symlink() || entry_type.is_hard_link() {
            return Err(format!(
                "archive contains unsupported link entry: {}",
                entry_path.display()
            ));
        }
        has_entries = true;
    }

    if !has_entries {
        return Err(format!(
            "archive contains no entries: {}",
            archive_path.display()
        ));
    }

    bundle_root.ok_or_else(|| {
        format!(
            "could not determine bundle root from archive {}",
            archive_path.display()
        )
    })
}

fn extract_evidence_bundle_archive(archive_path: &Path, destination: &Path) -> Result<(), String> {
    let archive_file = fs::File::open(archive_path).map_err(|error| {
        format!(
            "could not open archive {}: {}",
            archive_path.display(),
            error
        )
    })?;
    let decoder = GzDecoder::new(archive_file);
    let mut archive = Archive::new(decoder);
    archive.unpack(destination).map_err(|error| {
        format!(
            "could not extract archive to temporary directory: {}",
            error
        )
    })
}

fn create_unique_temp_dir(prefix: &str) -> Result<PathBuf, String> {
    let temp_dir = std::env::temp_dir().join(format!(
        "{}-{}-{}",
        prefix,
        process::id(),
        current_unix_seconds()?
    ));
    fs::create_dir_all(&temp_dir)
        .map_err(|error| format!("could not create temporary directory: {}", error))?;
    Ok(temp_dir)
}

fn validate_archive_entry_path(path: &Path) -> Result<(), String> {
    for component in path.components() {
        match component {
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(format!(
                    "archive entry path is not safe: {}",
                    path.display()
                ));
            }
            _ => {}
        }
    }
    Ok(())
}

fn format_evidence_bundle_manifest_summary(report: &EvidenceBundleManifestReport) -> String {
    let metadata = &report.metadata;
    let mut lines = vec![
        "IgnisPrompt Local Evidence Bundle Manifest".to_string(),
        format!("Bundle dir: {}", report.bundle_dir.display()),
        format!(
            "Schema version: {}",
            metadata.bundle_schema_version.as_deref().unwrap_or("-")
        ),
        format!(
            "Bundle type: {}",
            metadata.bundle_type.as_deref().unwrap_or("-")
        ),
        format!(
            "Bundle mode: {}",
            metadata.bundle_mode.as_deref().unwrap_or("-")
        ),
        format!(
            "Local-only: {}",
            bool_label(metadata.local_only.unwrap_or(false))
        ),
        format!(
            "Non-certified: {}",
            bool_label(metadata.non_certified.unwrap_or(false))
        ),
        format!("Signed: {}", bool_label(metadata.signed.unwrap_or(true))),
        format!(
            "Production attestation: {}",
            bool_label(metadata.production_attestation.unwrap_or(true))
        ),
        format!(
            "Audit events included: {}",
            bool_label(metadata.include_audit_events.unwrap_or(false))
        ),
        "".to_string(),
        "Generated files:".to_string(),
    ];

    for file_name in &metadata.generated_file_names {
        lines.push(format!("- {}", file_name));
    }

    lines.push("".to_string());
    lines.push("Included endpoints:".to_string());
    if metadata.included_endpoints.is_empty() {
        lines.push("- none".to_string());
    } else {
        for endpoint in &metadata.included_endpoints {
            lines.push(format!("- {}", endpoint));
        }
    }

    lines.push("".to_string());
    lines.push("Notes:".to_string());
    for note in report
        .manifest_json
        .get("notes")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default()
    {
        if let Some(text) = note.as_str() {
            lines.push(format!("- {}", text));
        }
    }

    lines.join("\n")
}

fn format_evidence_bundle_manifest_json(report: &EvidenceBundleManifestReport) -> String {
    serde_json::to_string_pretty(&report.manifest_json).unwrap_or_default()
}

fn format_evidence_bundle_archive_summary(report: &EvidenceBundleArchiveReport) -> String {
    let metadata = &report.validation.metadata;
    let mut lines = vec![
        "IgnisPrompt Local Evidence Bundle Archive".to_string(),
        format!("Bundle dir: {}", report.bundle_dir.display()),
        format!("Archive path: {}", report.archive_path.display()),
        format!("Archive size (bytes): {}", report.archive_size_bytes),
        format!(
            "Local-only: {}",
            bool_label(metadata.local_only.unwrap_or(false))
        ),
        format!(
            "Non-certified: {}",
            bool_label(metadata.non_certified.unwrap_or(false))
        ),
        format!("Signed: {}", bool_label(metadata.signed.unwrap_or(true))),
        format!(
            "Production attestation: {}",
            bool_label(metadata.production_attestation.unwrap_or(true))
        ),
        format!(
            "Audit events included: {}",
            bool_label(metadata.include_audit_events.unwrap_or(false))
        ),
        "".to_string(),
        "Archived files:".to_string(),
    ];

    for file_name in &report.archived_file_names {
        lines.push(format!("- {}", file_name));
    }

    lines.join("\n")
}

fn format_evidence_bundle_archive_json(report: &EvidenceBundleArchiveReport) -> String {
    serde_json::to_string_pretty(&json!({
        "bundle_dir": report.bundle_dir.display().to_string(),
        "archive_path": report.archive_path.display().to_string(),
        "archive_size_bytes": report.archive_size_bytes,
        "bundle_boundary": evidence_bundle_bundle_boundary(),
        "metadata": {
            "bundle_schema_version": report.validation.metadata.bundle_schema_version,
            "bundle_type": report.validation.metadata.bundle_type,
            "bundle_mode": report.validation.metadata.bundle_mode,
            "local_only": report.validation.metadata.local_only,
            "non_certified": report.validation.metadata.non_certified,
            "signed": report.validation.metadata.signed,
            "production_attestation": report.validation.metadata.production_attestation,
            "include_audit_events": report.validation.metadata.include_audit_events,
            "generated_at_unix_seconds": report.validation.metadata.generated_at_unix_seconds,
            "generated_file_names": report.validation.metadata.generated_file_names,
            "included_endpoints": report.validation.metadata.included_endpoints,
        },
        "archived_file_names": report.archived_file_names,
    }))
    .unwrap_or_default()
}

fn format_evidence_bundle_archive_verification_summary(
    report: &EvidenceBundleArchiveVerificationReport,
) -> String {
    let metadata = &report.validation.metadata;
    let mut lines = vec![
        "IgnisPrompt Local Evidence Bundle Archive Verification".to_string(),
        format!("Archive path: {}", report.archive_path.display()),
        format!("Bundle root: {}", report.bundle_root),
        format!(
            "Result: {}",
            if report.validation.issues.is_empty() {
                "ok"
            } else {
                "failed"
            }
        ),
        "".to_string(),
        "Files:".to_string(),
    ];

    for file in &report.validation.snapshot.files {
        let mut status = if file.present { "present" } else { "missing" }.to_string();
        if let Some(error) = &file.read_error {
            status = format!("{} ({})", status, error);
        }
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            status,
            if file.required {
                " (required)"
            } else {
                " (optional)"
            }
        ));
    }

    lines.push("".to_string());
    lines.push("Metadata:".to_string());
    lines.push(format!(
        "- schema_version: {}",
        metadata.bundle_schema_version.as_deref().unwrap_or("-")
    ));
    lines.push(format!(
        "- bundle_type: {}",
        metadata.bundle_type.as_deref().unwrap_or("-")
    ));
    lines.push(format!(
        "- bundle_mode: {}",
        metadata.bundle_mode.as_deref().unwrap_or("-")
    ));
    lines.push(format!(
        "- local_only: {}",
        bool_label(metadata.local_only.unwrap_or(false))
    ));
    lines.push(format!(
        "- non_certified: {}",
        bool_label(metadata.non_certified.unwrap_or(false))
    ));
    lines.push(format!(
        "- signed: {}",
        bool_label(metadata.signed.unwrap_or(true))
    ));
    lines.push(format!(
        "- production_attestation: {}",
        bool_label(metadata.production_attestation.unwrap_or(true))
    ));
    lines.push(format!(
        "- audit_events_included: {}",
        bool_label(metadata.include_audit_events.unwrap_or(false))
    ));

    lines.push("".to_string());
    if report.validation.issues.is_empty() {
        lines.push("[ok] archive verification passed.".to_string());
    } else {
        lines.push("[failed] archive verification found issues.".to_string());
        lines.push("Issues:".to_string());
        for issue in &report.validation.issues {
            lines.push(format!("- {}", issue));
        }
    }

    lines.join("\n")
}

fn format_evidence_bundle_archive_verification_json(
    report: &EvidenceBundleArchiveVerificationReport,
) -> String {
    let files = report
        .validation
        .snapshot
        .files
        .iter()
        .map(|file| {
            json!({
                "file_name": file.file_name,
                "required": file.required,
                "present": file.present,
                "kind": file.kind,
                "endpoint_name": file.endpoint_name,
                "read_error": file.read_error,
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "archive_path": report.archive_path.display().to_string(),
        "bundle_root": report.bundle_root,
        "status": if report.validation.issues.is_empty() { "ok" } else { "failed" },
        "metadata": {
            "bundle_schema_version": report.validation.metadata.bundle_schema_version,
            "bundle_type": report.validation.metadata.bundle_type,
            "bundle_mode": report.validation.metadata.bundle_mode,
            "local_only": report.validation.metadata.local_only,
            "non_certified": report.validation.metadata.non_certified,
            "signed": report.validation.metadata.signed,
            "production_attestation": report.validation.metadata.production_attestation,
            "include_audit_events": report.validation.metadata.include_audit_events,
            "generated_at_unix_seconds": report.validation.metadata.generated_at_unix_seconds,
            "generated_file_names": report.validation.metadata.generated_file_names,
            "included_endpoints": report.validation.metadata.included_endpoints,
        },
        "files": files,
        "issues": report.validation.issues,
        "bundle_boundary": evidence_bundle_bundle_boundary(),
    }))
    .unwrap_or_default()
}

fn validate_evidence_bundle_output_dir(output: &str) -> Result<PathBuf, String> {
    let trimmed = output.trim();
    if trimmed.is_empty() {
        return Err(
            "output directory is required; use an ignored local-evidence/ path such as local-evidence/demo-bundle"
                .to_string(),
        );
    }

    let path = Path::new(trimmed);
    if path.is_absolute() {
        return Err(
            "output directory must be relative and under ignored local-evidence/; use local-evidence/demo-bundle"
                .to_string(),
        );
    }

    for component in path.components() {
        match component {
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(
                    "output directory must stay under ignored local-evidence/ without parent traversal"
                        .to_string(),
                );
            }
            _ => {}
        }
    }

    let mut components = path.components().peekable();
    while matches!(components.peek(), Some(&Component::CurDir)) {
        components.next();
    }

    match components.next() {
        Some(Component::Normal(name)) if name == "local-evidence" => {}
        _ => {
            return Err(
                "output directory must start with local-evidence/; use local-evidence/demo-bundle"
                    .to_string(),
            );
        }
    }

    if components.peek().is_none() {
        return Err(
            "output directory should point to a bundle subdirectory such as local-evidence/demo-bundle"
                .to_string(),
        );
    }

    if path.exists() {
        return Err(format!(
            "output directory already exists: {}",
            path.display()
        ));
    }

    Ok(path.to_path_buf())
}

fn build_evidence_bundle_validation_report(
    bundle_dir: &Path,
) -> Result<EvidenceBundleValidationReport, String> {
    let snapshot = read_evidence_bundle_snapshot(bundle_dir)?;
    let metadata = evidence_bundle_snapshot_metadata(&snapshot);
    let mut issues = evidence_bundle_validation_issues(&snapshot, &metadata);
    if let Some(summary_issue) = validate_summary_and_manifest_parity(&metadata) {
        issues.push(summary_issue);
    }

    Ok(EvidenceBundleValidationReport {
        snapshot,
        metadata,
        issues,
    })
}

fn read_evidence_bundle_snapshot(bundle_dir: &Path) -> Result<EvidenceBundleSnapshot, String> {
    if !bundle_dir.exists() {
        return Err(format!(
            "bundle directory does not exist: {}",
            bundle_dir.display()
        ));
    }

    if !bundle_dir.is_dir() {
        return Err(format!(
            "bundle path is not a directory: {}",
            bundle_dir.display()
        ));
    }

    let mut files = Vec::new();
    for spec in evidence_bundle_file_specs() {
        let path = bundle_dir.join(spec.file_name);
        if !path.exists() {
            files.push(EvidenceBundleFileState {
                file_name: spec.file_name,
                required: spec.required,
                kind: spec.kind,
                endpoint_name: spec.endpoint_name,
                present: false,
                read_error: None,
                json: None,
                text: None,
            });
            continue;
        }

        let text = match fs::read_to_string(&path) {
            Ok(text) => text,
            Err(error) => {
                files.push(EvidenceBundleFileState {
                    file_name: spec.file_name,
                    required: spec.required,
                    kind: spec.kind,
                    endpoint_name: spec.endpoint_name,
                    present: true,
                    read_error: Some(format!("could not read {}: {}", path.display(), error)),
                    json: None,
                    text: None,
                });
                continue;
            }
        };

        let json = if spec.json_expected {
            match serde_json::from_str(&text) {
                Ok(value) => Some(value),
                Err(error) => {
                    files.push(EvidenceBundleFileState {
                        file_name: spec.file_name,
                        required: spec.required,
                        kind: spec.kind,
                        endpoint_name: spec.endpoint_name,
                        present: true,
                        read_error: Some(format!("invalid JSON in {}: {}", path.display(), error)),
                        json: None,
                        text: Some(text),
                    });
                    continue;
                }
            }
        } else {
            None
        };

        files.push(EvidenceBundleFileState {
            file_name: spec.file_name,
            required: spec.required,
            kind: spec.kind,
            endpoint_name: spec.endpoint_name,
            present: true,
            read_error: None,
            json,
            text: Some(text),
        });
    }

    Ok(EvidenceBundleSnapshot {
        bundle_dir: bundle_dir.to_path_buf(),
        files,
    })
}

fn evidence_bundle_snapshot_metadata(snapshot: &EvidenceBundleSnapshot) -> EvidenceBundleMetadata {
    let mut metadata = EvidenceBundleMetadata::default();

    if let Some(summary) = snapshot
        .file_state("summary.json")
        .and_then(|file| file.json.as_ref())
    {
        metadata = evidence_bundle_metadata_from_value(summary);
    }

    if let Some(manifest) = snapshot
        .file_state("manifest.json")
        .and_then(|file| file.json.as_ref())
    {
        let manifest_metadata = evidence_bundle_metadata_from_value(manifest);
        if metadata.bundle_schema_version.is_none() {
            metadata.bundle_schema_version = manifest_metadata.bundle_schema_version;
        }
        if metadata.bundle_type.is_none() {
            metadata.bundle_type = manifest_metadata.bundle_type;
        }
        if metadata.bundle_mode.is_none() {
            metadata.bundle_mode = manifest_metadata.bundle_mode;
        }
        if metadata.local_only.is_none() {
            metadata.local_only = manifest_metadata.local_only;
        }
        if metadata.non_certified.is_none() {
            metadata.non_certified = manifest_metadata.non_certified;
        }
        if metadata.signed.is_none() {
            metadata.signed = manifest_metadata.signed;
        }
        if metadata.production_attestation.is_none() {
            metadata.production_attestation = manifest_metadata.production_attestation;
        }
        if metadata.include_audit_events.is_none() {
            metadata.include_audit_events = manifest_metadata.include_audit_events;
        }
        if metadata.generated_at_unix_seconds.is_none() {
            metadata.generated_at_unix_seconds = manifest_metadata.generated_at_unix_seconds;
        }
        if metadata.generated_file_names.is_empty() {
            metadata.generated_file_names = manifest_metadata.generated_file_names;
        }
        if metadata.included_endpoints.is_empty() {
            metadata.included_endpoints = manifest_metadata.included_endpoints;
        }
    }

    metadata
}

fn evidence_bundle_metadata_from_value(value: &Value) -> EvidenceBundleMetadata {
    EvidenceBundleMetadata {
        bundle_schema_version: value
            .get("bundle_schema_version")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        bundle_type: value
            .get("bundle_type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        bundle_mode: value
            .get("bundle_mode")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        local_only: value.get("local_only").and_then(|v| v.as_bool()),
        non_certified: value.get("non_certified").and_then(|v| v.as_bool()),
        signed: value.get("signed").and_then(|v| v.as_bool()),
        production_attestation: value
            .get("production_attestation")
            .and_then(|v| v.as_bool()),
        include_audit_events: value.get("include_audit_events").and_then(|v| v.as_bool()),
        generated_at_unix_seconds: value
            .get("generated_at_unix_seconds")
            .and_then(|v| v.as_u64()),
        generated_file_names: value
            .get("generated_file_names")
            .and_then(|v| v.as_array())
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default(),
        included_endpoints: value
            .get("included_endpoints")
            .and_then(|v| v.as_array())
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| item.as_str().map(|s| s.to_string()))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default(),
    }
}

fn evidence_bundle_validation_issues(
    snapshot: &EvidenceBundleSnapshot,
    metadata: &EvidenceBundleMetadata,
) -> Vec<String> {
    let mut issues = Vec::new();
    let expected_files = evidence_bundle_file_specs();

    for spec in expected_files {
        let file = snapshot.file_state(spec.file_name);
        if spec.required && file.map(|file| file.present).unwrap_or(false) == false {
            issues.push(format!("missing required file: {}", spec.file_name));
            continue;
        }
        if let Some(file) = file {
            if let Some(error) = &file.read_error {
                issues.push(error.clone());
            }
            if spec.json_expected {
                if file.json.is_none() {
                    if file.present {
                        issues.push(format!("invalid JSON in {}", spec.file_name));
                    }
                }
            }
        }
    }

    if metadata.bundle_schema_version.as_deref() != Some(EVIDENCE_BUNDLE_SCHEMA_VERSION) {
        issues.push(format!(
            "summary/manifest bundle_schema_version must be {}",
            EVIDENCE_BUNDLE_SCHEMA_VERSION
        ));
    }
    if metadata.bundle_type.as_deref() != Some(EVIDENCE_BUNDLE_BUNDLE_TYPE) {
        issues.push(format!(
            "summary/manifest bundle_type must be {}",
            EVIDENCE_BUNDLE_BUNDLE_TYPE
        ));
    }
    if metadata.bundle_mode.as_deref() != Some(EVIDENCE_BUNDLE_BUNDLE_MODE) {
        issues.push(format!(
            "summary/manifest bundle_mode must be {}",
            EVIDENCE_BUNDLE_BUNDLE_MODE
        ));
    }
    if metadata.local_only != Some(true) {
        issues.push("summary/manifest local_only must be true".to_string());
    }
    if metadata.non_certified != Some(true) {
        issues.push("summary/manifest non_certified must be true".to_string());
    }
    if metadata.signed != Some(false) {
        issues.push("summary/manifest signed must be false".to_string());
    }
    if metadata.production_attestation != Some(false) {
        issues.push("summary/manifest production_attestation must be false".to_string());
    }
    if metadata.include_audit_events.is_none() {
        issues.push("summary/manifest include_audit_events is missing".to_string());
    }
    if metadata.generated_at_unix_seconds.is_none() {
        issues.push("summary/manifest generated_at_unix_seconds is missing".to_string());
    }

    let expected_generated_file_names =
        evidence_bundle_generated_file_names(metadata.include_audit_events.unwrap_or(false));
    if metadata.generated_file_names != expected_generated_file_names {
        issues.push(
            "summary/manifest generated_file_names do not match the bundle files".to_string(),
        );
    }

    let expected_included_endpoints =
        evidence_bundle_included_endpoints(metadata.include_audit_events.unwrap_or(false));
    if metadata.included_endpoints != expected_included_endpoints {
        issues.push(
            "summary/manifest included_endpoints do not match the captured endpoints".to_string(),
        );
    }

    if let Some(summary) = snapshot
        .file_state("summary.json")
        .and_then(|file| file.json.as_ref())
    {
        if contains_placeholder_string(summary) {
            issues.push("summary contains placeholder-like literal \"string\" values".to_string());
        }
        if contains_forbidden_bundle_keys(summary) {
            issues.push("summary contains obvious prompt or sensitive keys".to_string());
        }
        for phrase in missing_bundle_boundary_phrases(summary) {
            issues.push(format!(
                "summary is missing required boundary phrase: {}",
                phrase
            ));
        }
    }
    if let Some(manifest) = snapshot
        .file_state("manifest.json")
        .and_then(|file| file.json.as_ref())
    {
        if contains_placeholder_string(manifest) {
            issues.push("manifest contains placeholder-like literal \"string\" values".to_string());
        }
        if contains_forbidden_bundle_keys(manifest) {
            issues.push("manifest contains obvious prompt or sensitive keys".to_string());
        }
        for phrase in missing_bundle_boundary_phrases(manifest) {
            issues.push(format!(
                "manifest is missing required boundary phrase: {}",
                phrase
            ));
        }
    }

    if let Some(readme) = snapshot.readme_text() {
        let readme_lower = readme.to_ascii_lowercase();
        for needle in [
            "local-preview",
            "local-only",
            "not signed",
            "not production attestation",
        ] {
            if !readme_lower.contains(needle) {
                issues.push(format!("README.md is missing required phrase: {}", needle));
            }
        }
        if !readme_lower.contains("non-certified") && !readme_lower.contains("not certified") {
            issues.push("README.md is missing required phrase: non-certified".to_string());
        }
    } else {
        issues.push("missing required file: README.md".to_string());
    }

    issues
}

fn missing_bundle_boundary_phrases(value: &Value) -> Vec<&'static str> {
    let notes = value
        .get("notes")
        .and_then(|value| value.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str().map(|text| text.to_ascii_lowercase()))
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    [
        "local-preview",
        "local-only",
        "non-certified",
        "not signed",
        "not production attestation",
    ]
    .iter()
    .copied()
    .filter(|phrase| !notes.iter().any(|note| note.contains(phrase)))
    .collect()
}

fn validate_summary_and_manifest_parity(metadata: &EvidenceBundleMetadata) -> Option<String> {
    if metadata.bundle_schema_version.as_deref() != Some(EVIDENCE_BUNDLE_SCHEMA_VERSION) {
        return Some("summary/manifest schema version mismatch".to_string());
    }
    None
}

fn format_evidence_bundle_list_summary(report: &EvidenceBundleValidationReport) -> String {
    let metadata = &report.metadata;
    let mut lines = vec![
        "IgnisPrompt Local Evidence Bundle Listing".to_string(),
        format!("Bundle dir: {}", report.snapshot.bundle_dir.display()),
        format!(
            "Schema version: {}",
            metadata.bundle_schema_version.as_deref().unwrap_or("-")
        ),
        format!(
            "Bundle type: {}",
            metadata.bundle_type.as_deref().unwrap_or("-")
        ),
        format!(
            "Bundle mode: {}",
            metadata.bundle_mode.as_deref().unwrap_or("-")
        ),
        format!(
            "Local-only: {}",
            bool_label(metadata.local_only.unwrap_or(false))
        ),
        format!(
            "Non-certified: {}",
            bool_label(metadata.non_certified.unwrap_or(false))
        ),
        format!("Signed: {}", bool_label(metadata.signed.unwrap_or(true))),
        format!(
            "Production attestation: {}",
            bool_label(metadata.production_attestation.unwrap_or(true))
        ),
        format!(
            "Audit events included: {}",
            bool_label(metadata.include_audit_events.unwrap_or(false))
        ),
        "".to_string(),
        "Files:".to_string(),
    ];

    for file in &report.snapshot.files {
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            if file.present { "present" } else { "missing" },
            if file.required {
                " (required)"
            } else {
                " (optional)"
            }
        ));
    }

    lines.push("".to_string());
    lines.push("Included endpoints:".to_string());
    if metadata.included_endpoints.is_empty() {
        lines.push("- none".to_string());
    } else {
        for endpoint in &metadata.included_endpoints {
            lines.push(format!("- {}", endpoint));
        }
    }

    lines
        .push("audit-events.json is optional and is shown only as present or missing.".to_string());

    lines.join("\n")
}

fn format_evidence_bundle_list_json(report: &EvidenceBundleValidationReport) -> String {
    let files = report
        .snapshot
        .files
        .iter()
        .map(|file| {
            json!({
                "file_name": file.file_name,
                "required": file.required,
                "present": file.present,
                "kind": file.kind,
                "endpoint_name": file.endpoint_name,
                "has_json": file.json.is_some(),
                "has_text": file.text.as_ref().map(|text| !text.is_empty()).unwrap_or(false),
                "read_error": file.read_error,
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "bundle_dir": report.snapshot.bundle_dir.display().to_string(),
        "metadata": {
            "bundle_schema_version": report.metadata.bundle_schema_version,
            "bundle_type": report.metadata.bundle_type,
            "bundle_mode": report.metadata.bundle_mode,
            "local_only": report.metadata.local_only,
            "non_certified": report.metadata.non_certified,
            "signed": report.metadata.signed,
            "production_attestation": report.metadata.production_attestation,
            "include_audit_events": report.metadata.include_audit_events,
            "generated_at_unix_seconds": report.metadata.generated_at_unix_seconds,
            "generated_file_names": report.metadata.generated_file_names,
            "included_endpoints": report.metadata.included_endpoints,
        },
        "files": files,
    }))
    .unwrap_or_default()
}

fn format_evidence_bundle_validation_summary(report: &EvidenceBundleValidationReport) -> String {
    let mut lines = vec![
        "IgnisPrompt Local Evidence Bundle Validation".to_string(),
        format!("Bundle dir: {}", report.snapshot.bundle_dir.display()),
        format!(
            "Result: {}",
            if report.issues.is_empty() {
                "ok"
            } else {
                "failed"
            }
        ),
        "".to_string(),
        "Files:".to_string(),
    ];

    for file in &report.snapshot.files {
        let mut status = if file.present { "present" } else { "missing" }.to_string();
        if let Some(error) = &file.read_error {
            status = format!("{} ({})", status, error);
        }
        lines.push(format!(
            "- {}: {}{}",
            file.file_name,
            status,
            if file.required {
                " (required)"
            } else {
                " (optional)"
            }
        ));
    }

    lines.push("".to_string());
    lines.push("Metadata:".to_string());
    lines.push(format!(
        "- schema_version: {}",
        report
            .metadata
            .bundle_schema_version
            .as_deref()
            .unwrap_or("-")
    ));
    lines.push(format!(
        "- bundle_type: {}",
        report.metadata.bundle_type.as_deref().unwrap_or("-")
    ));
    lines.push(format!(
        "- bundle_mode: {}",
        report.metadata.bundle_mode.as_deref().unwrap_or("-")
    ));
    lines.push(format!(
        "- local_only: {}",
        bool_label(report.metadata.local_only.unwrap_or(false))
    ));
    lines.push(format!(
        "- non_certified: {}",
        bool_label(report.metadata.non_certified.unwrap_or(false))
    ));
    lines.push(format!(
        "- signed: {}",
        bool_label(report.metadata.signed.unwrap_or(true))
    ));
    lines.push(format!(
        "- production_attestation: {}",
        bool_label(report.metadata.production_attestation.unwrap_or(true))
    ));
    lines.push(format!(
        "- audit_events_included: {}",
        bool_label(report.metadata.include_audit_events.unwrap_or(false))
    ));

    lines.push("".to_string());
    if report.issues.is_empty() {
        lines.push("[ok] bundle validation passed.".to_string());
    } else {
        lines.push("[failed] bundle validation found issues.".to_string());
        lines.push("Issues:".to_string());
        for issue in &report.issues {
            lines.push(format!("- {}", issue));
        }
    }

    lines.join("\n")
}

fn format_evidence_bundle_validation_json(report: &EvidenceBundleValidationReport) -> String {
    let files = report
        .snapshot
        .files
        .iter()
        .map(|file| {
            json!({
                "file_name": file.file_name,
                "required": file.required,
                "present": file.present,
                "kind": file.kind,
                "endpoint_name": file.endpoint_name,
                "read_error": file.read_error,
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string_pretty(&json!({
        "bundle_dir": report.snapshot.bundle_dir.display().to_string(),
        "status": if report.issues.is_empty() { "ok" } else { "failed" },
        "metadata": {
            "bundle_schema_version": report.metadata.bundle_schema_version,
            "bundle_type": report.metadata.bundle_type,
            "bundle_mode": report.metadata.bundle_mode,
            "local_only": report.metadata.local_only,
            "non_certified": report.metadata.non_certified,
            "signed": report.metadata.signed,
            "production_attestation": report.metadata.production_attestation,
            "include_audit_events": report.metadata.include_audit_events,
            "generated_at_unix_seconds": report.metadata.generated_at_unix_seconds,
            "generated_file_names": report.metadata.generated_file_names,
            "included_endpoints": report.metadata.included_endpoints,
        },
        "files": files,
        "issues": report.issues,
    }))
    .unwrap_or_default()
}

impl EvidenceBundleSnapshot {
    fn file_state(&self, file_name: &str) -> Option<&EvidenceBundleFileState> {
        self.files.iter().find(|file| file.file_name == file_name)
    }

    fn readme_text(&self) -> Option<&str> {
        self.file_state("README.md")
            .and_then(|file| file.text.as_deref())
    }
}

fn contains_forbidden_bundle_keys(value: &Value) -> bool {
    match value {
        Value::Object(map) => map.iter().any(|(key, nested)| {
            let lowered = key.to_ascii_lowercase();
            let banned = [
                "prompt",
                "content",
                "message",
                "secret",
                "token",
                "hostname",
                "username",
                "machine_id",
                "machine",
                "api_key",
                "request_text",
                "raw_model_output",
            ]
            .iter()
            .any(|needle| lowered.contains(needle));
            banned || contains_forbidden_bundle_keys(nested)
        }),
        Value::Array(values) => values.iter().any(contains_forbidden_bundle_keys),
        _ => false,
    }
}

fn validate_no_placeholder_string_values(label: &str, value: &Value) -> Result<(), String> {
    if contains_placeholder_string(value) {
        Err(format!(
            "{} contains placeholder-like literal \"string\" values",
            label
        ))
    } else {
        Ok(())
    }
}

fn contains_placeholder_string(value: &Value) -> bool {
    match value {
        Value::String(text) => text == "string",
        Value::Array(values) => values.iter().any(contains_placeholder_string),
        Value::Object(values) => values.values().any(contains_placeholder_string),
        _ => false,
    }
}

fn write_pretty_json_file(path: &Path, value: &Value) -> Result<(), String> {
    write_text_file(
        path,
        &serde_json::to_string_pretty(value).unwrap_or_default(),
    )
}

fn write_text_file(path: &Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("could not create {}: {}", parent.display(), error))?;
    }
    fs::write(path, contents)
        .map_err(|error| format!("could not write {}: {}", path.display(), error))
}

fn package_staging_dir(parent: &Path, prefix: &str, output_dir: &Path) -> PathBuf {
    let now_nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let output_name = output_dir
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("package")
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
                ch
            } else {
                '-'
            }
        })
        .collect::<String>();

    parent.join(format!(
        "{}-{}-{}-{}",
        prefix,
        now_nanos,
        process::id(),
        output_name
    ))
}

fn current_unix_seconds() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .map_err(|error| format!("system clock is before UNIX_EPOCH: {}", error))
}

fn format_evidence_bundle_unreachable_error(kind: &str, endpoint: &str, error: &str) -> String {
    [
        format!("error: local daemon not reachable for evidence bundle {}", kind),
        format!("details: {}", error),
        format!("endpoint: {}", endpoint),
        "next steps: start the daemon with ./scripts/start-dev.sh and rerun the local evidence bundle command.".to_string(),
    ]
    .join("\n")
}

fn format_evidence_bundle_invalid_response_error(
    kind: &str,
    endpoint: &str,
    detail: &str,
) -> String {
    [
        format!("error: invalid evidence bundle {} response shape from local daemon", kind),
        format!("endpoint: {}", endpoint),
        format!("details: {}", detail),
        "next steps: confirm the daemon is the current local-preview build and rerun the local evidence bundle command.".to_string(),
    ]
    .join("\n")
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

fn validate_bundle_audit_events(body: &Value) -> Result<String, String> {
    if !is_audit_event_list(body) {
        return Err("missing required audit event fields".to_string());
    }

    let events = body.as_array().map(|events| events.len()).unwrap_or(0);
    Ok(format!("{} audit events captured", events))
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
        audit_events_url, build_demo_package_report, build_demo_package_validation_report,
        build_evidence_bundle_archive_report, build_evidence_bundle_archive_verification_report,
        build_evidence_bundle_manifest_report, build_evidence_bundle_report,
        build_evidence_bundle_validation_report, build_operator_package_report,
        build_operator_package_validation_report, build_policy_package_report,
        build_policy_package_validation_report, build_readiness_package_report,
        build_readiness_package_validation_report, build_route_explain_body, current_unix_seconds,
        doctor_endpoint_url, format_audit_events_summary, format_capabilities_summary,
        format_demo_package_list_json, format_demo_package_list_summary,
        format_demo_package_summary, format_demo_package_summary_json,
        format_demo_package_validation_json, format_demo_package_validation_summary,
        format_demo_summary, format_demo_summary_json, format_demo_summary_report,
        format_doctor_json, format_doctor_summary, format_evidence_bundle_archive_json,
        format_evidence_bundle_archive_summary, format_evidence_bundle_archive_verification_json,
        format_evidence_bundle_archive_verification_summary, format_evidence_bundle_list_json,
        format_evidence_bundle_list_summary, format_evidence_bundle_manifest_json,
        format_evidence_bundle_manifest_summary, format_evidence_bundle_summary,
        format_evidence_bundle_unreachable_error, format_evidence_bundle_validation_json,
        format_evidence_bundle_validation_summary, format_http_error,
        format_invalid_response_error, format_model_inventory_summary, format_model_manifest_line,
        format_operator_package_list_json, format_operator_package_list_summary,
        format_operator_package_summary, format_operator_package_summary_json,
        format_operator_package_validation_json, format_operator_package_validation_summary,
        format_operator_summary, format_operator_summary_json, format_policy_package_list_json,
        format_policy_package_list_summary, format_policy_package_summary,
        format_policy_package_summary_json, format_policy_package_validation_json,
        format_policy_package_validation_summary, format_policy_scenarios_json,
        format_policy_scenarios_report, format_policy_scenarios_summary, format_readiness_json,
        format_readiness_markdown, format_readiness_package_list_json,
        format_readiness_package_list_summary, format_readiness_package_summary,
        format_readiness_package_summary_json, format_readiness_package_validation_json,
        format_readiness_package_validation_summary, format_readiness_summary,
        format_route_explain_summary, format_sustainability_summary, format_unreachable_error,
        is_audit_event_list, is_route_explain_response, is_sustainability_metrics_response,
        policy_scenario_groups_by_category, policy_scenario_groups_by_expected_tier,
        policy_scenarios_expected_fail_closed, policy_scenarios_expected_local_only,
        policy_scenarios_with_boundary_note, readiness_report_next_steps, route_explain_url,
        string_field, sustainability_url, validate_demo_package_output_dir,
        validate_doctor_capabilities, validate_doctor_health, validate_doctor_model_inventory,
        validate_doctor_model_status_hints, validate_doctor_models,
        validate_doctor_sustainability_metrics, validate_doctor_version_status,
        validate_evidence_bundle_archive_output_path, validate_evidence_bundle_output_dir,
        validate_no_placeholder_string_values, validate_operator_package_output_dir,
        validate_policy_package_output_dir, validate_readiness_package_output_dir,
        validate_sustainability_period, write_demo_package_report, write_evidence_bundle_report,
        write_operator_package_report, write_policy_package_report, write_readiness_package_report,
        DoctorCheckLevel, DoctorCheckResult, DoctorReport, EvidenceBundleCapture,
        DEMO_PACKAGE_REQUIRED_FILES, DOCTOR_CHECKS, OPERATOR_PACKAGE_REQUIRED_FILES,
        POLICY_PACKAGE_REQUIRED_FILES, POLICY_SCENARIOS, READINESS_PACKAGE_REQUIRED_FILES,
    };
    use serde_json::json;
    use std::path::Path;
    use std::sync::atomic::{AtomicU64, Ordering};

    static TEST_PATH_COUNTER: AtomicU64 = AtomicU64::new(0);

    fn unique_local_evidence_test_dir(root: &str, label: &str) -> std::path::PathBuf {
        let sequence = TEST_PATH_COUNTER.fetch_add(1, Ordering::Relaxed);
        let now_nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);

        // Keep parallel package tests isolated. Tests may remove only their own
        // unique leaf directory, never shared local-evidence roots.
        std::path::PathBuf::from(format!(
            "{}/{}-{}-{}-{}",
            root,
            label,
            std::process::id(),
            now_nanos,
            sequence
        ))
    }

    fn unique_readiness_package_test_dir(label: &str) -> std::path::PathBuf {
        unique_local_evidence_test_dir("local-evidence/readiness/test-packages", label)
    }

    fn unique_operator_package_test_dir(label: &str) -> std::path::PathBuf {
        unique_local_evidence_test_dir("local-evidence/operator/test-packages", label)
    }

    fn unique_policy_package_test_dir(label: &str) -> std::path::PathBuf {
        unique_local_evidence_test_dir("local-evidence/policy/test-packages", label)
    }

    fn unique_demo_package_test_dir(label: &str) -> std::path::PathBuf {
        unique_local_evidence_test_dir("local-evidence/demo-studio/test-packages", label)
    }

    fn unique_bundle_test_dir(label: &str) -> std::path::PathBuf {
        unique_local_evidence_test_dir("local-evidence/test-bundles", label)
    }

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
        assert!(endpoints.contains(&("/v1/models/inventory", DoctorCheckLevel::Informational)));
        assert!(endpoints.contains(&("/v1/capabilities", DoctorCheckLevel::Required)));
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
    fn model_inventory_url_format() {
        let url = format!("{}/v1/models/inventory", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/models/inventory");
    }

    #[test]
    fn status_version_url_format() {
        let url = format!("{}/v1/status/version", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/status/version");
    }

    #[test]
    fn capabilities_url_format() {
        let url = format!("{}/v1/capabilities", "http://127.0.0.1:8765");
        assert_eq!(url, "http://127.0.0.1:8765/v1/capabilities");
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
            validate_doctor_model_inventory(&json!({
                "schema_version": "ignisprompt-model-inventory-v0.1",
                "generated_at": "2026-06-19T00:00:00Z",
                "base_paths_scanned": ["configured-model-dir/models"],
                "inventory_source": "local_model_directories",
                "files": [{
                    "filename": "qwen2.5-0.5b-instruct-q4_k_m.gguf",
                    "relative_path": "configured-model-dir/models/qwen2.5-0.5b-instruct-q4_k_m.gguf",
                    "extension": "gguf",
                    "size_bytes": 734003200,
                    "size_mb": 700.0,
                    "model_family": "qwen",
                    "quantization": "q4_k_m",
                    "status": "present",
                    "boundary_note": "File metadata only; contents are not read."
                }],
                "summary": {
                    "total_files": 1,
                    "total_size_bytes": 734003200,
                    "gguf_files": 1,
                    "safetensors_files": 0,
                    "manifest_declared_count": 1,
                    "present_count": 1,
                    "unsupported_count": 0,
                    "largest_file_mb": 700.0,
                    "scanned_directory_count": 1,
                    "scan_limited": false,
                    "notes": ["Read-only model inventory metadata."]
                },
                "boundary_notes": [
                    "Inventory metadata is observational and does not execute models."
                ]
            }))
            .unwrap(),
            "1 files (1 GGUF, 0 safetensors)"
        );
        assert_eq!(
            validate_doctor_capabilities(&json!({
                "release_channel": "local-preview",
                "local_only": true,
                "cloud_enabled": false,
                "routing_order": ["tier_0", "tier_1", "tier_2", "tier_3", "tier_4", "tier_5"],
                "capabilities": [
                    {
                        "provider_id": "stub-legal-runner",
                        "display_name": "Stub Legal Runner",
                        "tier": "tier_3",
                        "connector_type": "domain_local_path",
                        "status": "available",
                        "available": true,
                        "configured": true,
                        "data_boundary": "local_process",
                        "reason": "default_local_preview_fallback",
                        "confidence": "local_default",
                        "warnings": ["Synthetic local-preview path."]
                    },
                    {
                        "provider_id": "cloud-disabled",
                        "display_name": "Cloud Providers",
                        "tier": "tier_5",
                        "connector_type": "cloud_provider_disabled",
                        "status": "disabled",
                        "available": false,
                        "configured": false,
                        "data_boundary": "cloud_with_consent",
                        "reason": "cloud_disabled_by_default",
                        "confidence": "policy",
                        "warnings": [
                            "Cloud is disabled by default.",
                            "No cloud calls are made by local-preview capability discovery."
                        ]
                    }
                ]
            }))
            .unwrap(),
            "available (2 capabilities; cloud disabled)"
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
        assert!(validate_doctor_model_inventory(&json!({
            "schema_version": "ignisprompt-model-inventory-v0.1",
            "generated_at": "2026-06-19T00:00:00Z",
            "base_paths_scanned": [],
            "inventory_source": "local_model_directories",
            "files": [],
            "boundary_notes": []
        }))
        .unwrap_err()
        .contains("summary"));
        assert!(validate_doctor_capabilities(&json!({
            "release_channel": "local-preview",
            "local_only": true,
            "cloud_enabled": true,
            "routing_order": ["tier_5"],
            "capabilities": []
        }))
        .unwrap_err()
        .contains("cloud_enabled"));
        assert!(validate_doctor_capabilities(&json!({
            "release_channel": "local-preview",
            "local_only": true,
            "cloud_enabled": false,
            "routing_order": ["tier_5"],
            "capabilities": [{
                "provider_id": "cloud-disabled",
                "display_name": "Cloud Providers",
                "tier": "tier_5",
                "connector_type": "cloud_provider_disabled",
                "status": "available",
                "available": true,
                "configured": false,
                "data_boundary": "cloud_with_consent",
                "reason": "cloud_disabled_by_default",
                "confidence": "policy",
                "warnings": ["Cloud is disabled by default."]
            }]
        }))
        .unwrap_err()
        .contains("cloud-disabled capability"));
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
        assert!(summary.contains("[ok] health: ok"));
        assert!(summary.contains("Informational checks:"));
        assert!(summary.contains("[ok] Local preview daemon appears ready."));
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
        assert!(summary.contains("[failed] health: daemon unreachable"));
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
    fn readiness_summary_aligns_with_aethra_language() {
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
                    id: "model_status_hints",
                    label: "model and runner status hints",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://127.0.0.1:8765/v1/status/models".to_string(),
                    ok: true,
                    summary: "available (1 hint; status hints only)".to_string(),
                    error: None,
                },
            ],
        };

        let summary = format_readiness_summary(&report);
        assert!(summary.contains("IgnisPrompt Local Readiness"));
        assert!(summary.contains("local preview readiness only"));
        assert!(summary.contains("status hints, not controls"));
        assert!(summary.contains("local helper checks, not certification"));
        assert!(summary.contains("manual live-local loading"));
        assert!(summary.contains("no telemetry or cloud calls"));
        assert!(summary.contains("make readiness-check"));
        assert!(summary.contains("[ok] Local preview readiness checks passed."));
        assert!(!summary.contains("production readiness"));
        assert!(!summary.contains("compliance certification"));
    }

    #[test]
    fn readiness_json_reports_scope_and_helper_checks() {
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

        let json_report: serde_json::Value =
            serde_json::from_str(&format_readiness_json(&report)).unwrap();
        assert_eq!(
            json_report["readiness_schema_version"],
            "ignisprompt-readiness-diagnostics-0.1"
        );
        assert_eq!(json_report["status"], "needs_attention");
        assert_eq!(json_report["overall_status"], "needs_attention");
        assert_eq!(json_report["scope"]["status_hints_not_controls"], true);
        assert_eq!(
            json_report["scope"]["local_helper_checks_not_certification"],
            true
        );
        assert_eq!(json_report["scope"]["manual_live_local_loading"], true);
        assert_eq!(json_report["scope"]["no_telemetry_added"], true);
        assert_eq!(json_report["scope"]["no_cloud_calls_added"], true);
        assert!(json_report["local_helper_checks"]
            .as_array()
            .unwrap()
            .iter()
            .any(|value| value == "make readiness-check"));
        assert_eq!(json_report["checks"][0]["id"], "health");
        assert_eq!(json_report["checks"][0]["name"], "health");
        assert_eq!(json_report["checks"][0]["category"], "daemon");
        assert_eq!(json_report["checks"][0]["severity"], "required");
        assert_eq!(json_report["checks"][0]["status"], "needs_attention");
        assert_eq!(json_report["checks"][0]["result"], "needs_attention");
        assert!(json_report["checks"][0]["local_next_step"]
            .as_str()
            .unwrap()
            .contains("./scripts/start-dev.sh"));
        assert_eq!(
            json_report["checks"][0]["boundary_note"],
            "local preview readiness only"
        );
        assert!(json_report.get("base_url").is_none());
        assert!(json_report["checks"][0].get("endpoint").is_none());
        assert!(json_report["checks"][0].get("error").is_none());
        assert!(!format_readiness_json(&report).contains("\"string\""));
    }

    #[test]
    fn readiness_json_diagnostics_are_copy_safe() {
        let report = DoctorReport {
            base_url: "http://127.0.0.1:8765".to_string(),
            checks: vec![DoctorCheckResult {
                id: "model_status_hints",
                label: "model controls and runner controls",
                level: DoctorCheckLevel::Required,
                endpoint: "http://localhost:8765/v1/status/models".to_string(),
                ok: false,
                summary: "prompt: raw audit text /Users/alice api_key sk-test production readiness"
                    .to_string(),
                error: Some("hostname devbox username alice ghp_secret".to_string()),
            }],
        };

        let json_text = format_readiness_json(&report);
        let lower_json = json_text.to_ascii_lowercase();
        let json_report: serde_json::Value = serde_json::from_str(&json_text).unwrap();

        assert_eq!(json_report["checks"][0]["category"], "runner hints");
        assert_eq!(
            json_report["checks"][0]["boundary_note"],
            "status hints, not controls"
        );
        assert!(!lower_json.contains("prompt:"));
        assert!(!lower_json.contains("raw audit"));
        assert!(!lower_json.contains("api_key"));
        assert!(!lower_json.contains("sk-test"));
        assert!(!lower_json.contains("ghp_"));
        assert!(!lower_json.contains("localhost"));
        assert!(!lower_json.contains("127.0.0.1"));
        assert!(!lower_json.contains("hostname"));
        assert!(!lower_json.contains("username"));
        assert!(!lower_json.contains("/users/"));
        assert!(!lower_json.contains("production readiness"));
        assert!(!lower_json.contains("compliance certification"));
        assert!(!lower_json.contains("signed attestation"));
        assert!(!lower_json.contains("tamper-evident"));
        assert!(!lower_json.contains("cryptographic verification"));
        assert!(!lower_json.contains("model controls"));
        assert!(!lower_json.contains("runner controls"));
    }

    #[test]
    fn readiness_next_steps_are_local_and_actionable() {
        let report = DoctorReport {
            base_url: "http://127.0.0.1:8765".to_string(),
            checks: vec![
                DoctorCheckResult {
                    id: "health",
                    label: "health",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://127.0.0.1:8765/health".to_string(),
                    ok: false,
                    summary: "daemon unreachable".to_string(),
                    error: Some("daemon unreachable".to_string()),
                },
                DoctorCheckResult {
                    id: "models",
                    label: "models",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://127.0.0.1:8765/v1/models".to_string(),
                    ok: false,
                    summary: "invalid response shape".to_string(),
                    error: Some("invalid response shape".to_string()),
                },
            ],
        };

        let steps = readiness_report_next_steps(&report);
        let joined_steps = steps.join(" ");
        assert!(joined_steps.contains("./scripts/start-dev.sh"));
        assert!(joined_steps.contains("model manifest"));
        assert!(!joined_steps.contains("http://"));
        assert!(!joined_steps.contains("production ready"));
        assert!(!joined_steps.contains("certified"));
        assert!(!joined_steps.contains("legal accuracy"));
    }

    #[test]
    fn readiness_markdown_report_is_copy_safe() {
        let report = DoctorReport {
            base_url: "http://127.0.0.1:8765".to_string(),
            checks: vec![
                DoctorCheckResult {
                    id: "health",
                    label: "health",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://localhost:8765/health".to_string(),
                    ok: false,
                    summary:
                        "daemon unreachable at /Users/alice/work with api_key sk-test prompt: raw audit text"
                            .to_string(),
                    error: Some(
                        "hostname devbox username alice token ghp_secret raw user text".to_string(),
                    ),
                },
                DoctorCheckResult {
                    id: "model_status_hints",
                    label: "model controls and runner controls",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://127.0.0.1:8765/v1/status/models".to_string(),
                    ok: true,
                    summary:
                        "production readiness compliance certification signed attestation tamper-evident storage cryptographic verification"
                            .to_string(),
                    error: None,
                },
            ],
        };

        let report_text = format_readiness_markdown(&report);
        let lower_report = report_text.to_ascii_lowercase();

        assert!(report_text.contains("# IgnisPrompt Local Readiness Report"));
        assert!(report_text.contains("copy-safe Markdown"));
        assert!(report_text.contains("status hints, not controls"));
        assert!(report_text.contains("local helper checks, not certification"));
        assert!(report_text.contains("cargo run -p ignispromptctl -- readiness --markdown"));
        assert!(!lower_report.contains("prompt:"));
        assert!(!lower_report.contains("raw user text"));
        assert!(!lower_report.contains("raw audit"));
        assert!(!lower_report.contains("secret"));
        assert!(!lower_report.contains("api_key"));
        assert!(!lower_report.contains("api key"));
        assert!(!lower_report.contains("sk-test"));
        assert!(!lower_report.contains("ghp_"));
        assert!(!lower_report.contains("localhost"));
        assert!(!lower_report.contains("127.0.0.1"));
        assert!(!lower_report.contains("hostname"));
        assert!(!lower_report.contains("username"));
        assert!(!lower_report.contains("machine identifier"));
        assert!(!lower_report.contains("/users/"));
        assert!(!lower_report.contains("/home/"));
        assert!(!lower_report.contains("production readiness"));
        assert!(!lower_report.contains("compliance certification"));
        assert!(!lower_report.contains("security certification"));
        assert!(!lower_report.contains("signed attestation"));
        assert!(!lower_report.contains("tamper-evident"));
        assert!(!lower_report.contains("cryptographic verification"));
        assert!(!lower_report.contains("model controls"));
        assert!(!lower_report.contains("runner controls"));
    }

    #[test]
    fn operator_summary_human_output_is_conservative() {
        let summary = format_operator_summary();
        let lower_summary = summary.to_ascii_lowercase();

        assert!(summary.contains("IgnisPrompt Local Operator Summary"));
        assert!(summary.contains("local preview operator workflow only"));
        assert!(summary.contains("status hints, not controls"));
        assert!(summary.contains("local helper checks, not certification"));
        assert!(summary.contains("package validation is structural/local only"));
        assert!(summary.contains("archives and packages are not signed"));
        assert!(summary.contains("manual live-local loading"));
        assert!(summary.contains("cargo run -p ignispromptctl -- readiness --json"));
        assert!(summary.contains("make evidence-check"));
        assert!(!lower_summary.contains("production readiness"));
        assert!(!lower_summary.contains("production deployment"));
        assert!(!lower_summary.contains("legal accuracy"));
        assert!(!lower_summary.contains("compliance certification"));
        assert!(!lower_summary.contains("security certification"));
        assert!(!lower_summary.contains("signed attestation"));
        assert!(!lower_summary.contains("tamper-evident"));
        assert!(!lower_summary.contains("cryptographic verification"));
        assert!(!lower_summary.contains("model controls"));
        assert!(!lower_summary.contains("runner controls"));
        assert!(!lower_summary.contains("prompt:"));
        assert!(!lower_summary.contains("raw user text"));
        assert!(!lower_summary.contains("api key"));
        assert!(!lower_summary.contains("api_key"));
        assert!(!lower_summary.contains("localhost"));
        assert!(!lower_summary.contains("127.0.0.1"));
        assert!(!lower_summary.contains("/users/"));
    }

    #[test]
    fn operator_summary_json_shape_is_safe() {
        let json_text = format_operator_summary_json();
        let lower_json = json_text.to_ascii_lowercase();
        let report: serde_json::Value = serde_json::from_str(&json_text).unwrap();

        assert_eq!(
            report["operator_summary_schema_version"],
            "ignisprompt-operator-summary-0.1"
        );
        assert_eq!(report["mode"], "local-preview");
        assert_eq!(report["status"], "operator_guidance");
        assert_eq!(
            report["scope"]["local_preview_operator_workflow_only"],
            true
        );
        assert_eq!(report["scope"]["status_hints_not_controls"], true);
        assert_eq!(
            report["scope"]["local_helper_checks_not_certification"],
            true
        );
        assert_eq!(
            report["scope"]["structural_local_package_validation_only"],
            true
        );
        assert!(report["sections"].as_array().unwrap().len() >= 5);
        assert!(report["commands"]
            .as_array()
            .unwrap()
            .iter()
            .any(|value| value["command"]
                == "cargo run -p ignispromptctl -- readiness --package-output local-evidence/readiness/demo"));
        assert!(report["commands"]
            .as_array()
            .unwrap()
            .iter()
            .all(|value| value["execution_mode"] == "copy_only"));
        assert!(!json_text.contains("\"string\""));
        assert!(!lower_json.contains("production readiness"));
        assert!(!lower_json.contains("production deployment"));
        assert!(!lower_json.contains("legal accuracy"));
        assert!(!lower_json.contains("compliance certification"));
        assert!(!lower_json.contains("signed attestation"));
        assert!(!lower_json.contains("tamper-evident"));
        assert!(!lower_json.contains("cryptographic verification"));
        assert!(!lower_json.contains("model controls"));
        assert!(!lower_json.contains("runner controls"));
        assert!(!lower_json.contains("prompt:"));
        assert!(!lower_json.contains("raw audit"));
        assert!(!lower_json.contains("secret"));
        assert!(!lower_json.contains("api_key"));
        assert!(!lower_json.contains("api key"));
        assert!(!lower_json.contains("localhost"));
        assert!(!lower_json.contains("127.0.0.1"));
        assert!(!lower_json.contains("hostname"));
        assert!(!lower_json.contains("username"));
        assert!(!lower_json.contains("/users/"));
    }

    #[test]
    fn operator_package_output_path_requires_ignored_operator_root() {
        assert!(
            validate_operator_package_output_dir("local-evidence/operator/demo-operator").is_ok()
        );
        assert!(validate_operator_package_output_dir("local-evidence/operator").is_err());
        assert!(validate_operator_package_output_dir("local-evidence/demo-operator").is_err());
        assert!(validate_operator_package_output_dir("/tmp/operator").is_err());
        assert!(validate_operator_package_output_dir("local-evidence/operator/../bad").is_err());
        assert!(build_operator_package_validation_report(Path::new("/tmp/operator")).is_err());
        assert!(build_operator_package_validation_report(Path::new(
            "local-evidence/readiness/demo"
        ))
        .is_err());
    }

    #[test]
    fn operator_package_writes_and_validates_safe_files() {
        let output_dir = unique_operator_package_test_dir("write-safe");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_operator_package_report(output_dir.clone()).unwrap();
        write_operator_package_report(&package).unwrap();

        for file_name in OPERATOR_PACKAGE_REQUIRED_FILES {
            assert!(output_dir.join(file_name).exists());
        }
        let validation = build_operator_package_validation_report(&output_dir).unwrap();
        assert!(validation.issues.is_empty());
        assert!(format_operator_package_validation_summary(&validation).contains("Status: ok"));
        assert!(format_operator_package_list_summary(&validation).contains("operator-report.md"));
        assert!(format_operator_package_validation_json(&validation).contains("\"status\": \"ok\""));
        assert!(format_operator_package_list_json(&validation).contains("operator-summary.json"));

        let summary = format_operator_package_summary(&package);
        let summary_json = format_operator_package_summary_json(&package);
        let lower_package_text = [
            summary.as_str(),
            summary_json.as_str(),
            package.report_markdown.as_str(),
            package.readme.as_str(),
        ]
        .join("\n")
        .to_ascii_lowercase();
        assert!(summary.contains("IgnisPrompt Local Operator Package"));
        assert!(summary_json.contains("\"local_only\": true"));
        assert!(summary_json.contains("\"operator_package_schema_version\""));
        assert!(lower_package_text.contains("local preview operator workflow only"));
        assert!(lower_package_text.contains("status hints, not controls"));
        assert!(lower_package_text.contains("local helper checks, not certification"));
        assert!(lower_package_text.contains("package validation is structural/local only"));
        assert!(lower_package_text.contains("not signed"));
        assert!(lower_package_text.contains("no cryptographic validation"));
        assert!(lower_package_text.contains("not tamper evident"));
        assert!(lower_package_text.contains("not production attestation"));
        assert!(!lower_package_text.contains("prompt:"));
        assert!(!lower_package_text.contains("raw user text"));
        assert!(!lower_package_text.contains("raw audit text"));
        assert!(!lower_package_text.contains("api_key"));
        assert!(!lower_package_text.contains("sk-"));
        assert!(!lower_package_text.contains("localhost"));
        assert!(!lower_package_text.contains("127.0.0.1"));
        assert!(!lower_package_text.contains("hostname"));
        assert!(!lower_package_text.contains("username"));
        assert!(!lower_package_text.contains("/users/"));
        assert!(!lower_package_text.contains("production readiness"));
        assert!(!lower_package_text.contains("production deployment"));
        assert!(!lower_package_text.contains("legal accuracy"));
        assert!(!lower_package_text.contains("esg certification"));
        assert!(!lower_package_text.contains("compliance certification"));
        assert!(!lower_package_text.contains("security certification"));
        assert!(!lower_package_text.contains("tamper-evident"));
        assert!(!lower_package_text.contains("cryptographic verification"));
        assert!(!lower_package_text.contains("signed attestation"));
        assert!(!lower_package_text.contains("model controls"));
        assert!(!lower_package_text.contains("runner controls"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn operator_package_validation_reports_unsafe_content() {
        let output_dir = unique_operator_package_test_dir("unsafe");
        let _ = std::fs::remove_dir_all(&output_dir);
        std::fs::create_dir_all(&output_dir).unwrap();
        for file_name in OPERATOR_PACKAGE_REQUIRED_FILES {
            let path = output_dir.join(file_name);
            if file_name.ends_with(".json") {
                std::fs::write(path, "{\"value\":\"string\"}\n").unwrap();
            } else {
                std::fs::write(
                    path,
                    "local preview operator workflow only\nstatus hints, not controls\nlocal helper checks, not certification\npackage validation is structural/local only\nnot signed\nnot production attestation\nno telemetry\nno cloud calls by default\nprompt: raw audit text /Users/alice api_key sk-test\n",
                )
                .unwrap();
            }
        }

        let validation = build_operator_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("placeholder"));
        assert!(issues.contains("unsafe content"));
        assert!(format_operator_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn policy_scenarios_human_json_and_report_are_conservative() {
        let summary = format_policy_scenarios_summary();
        let json_text = format_policy_scenarios_json();
        let report_text = format_policy_scenarios_report();
        let joined = [summary.as_str(), json_text.as_str(), report_text.as_str()]
            .join("\n")
            .to_ascii_lowercase();
        let report: serde_json::Value = serde_json::from_str(&json_text).unwrap();

        assert!(summary.contains("IgnisPrompt Local Policy Scenarios"));
        assert!(summary.contains("synthetic scenarios only"));
        assert!(summary.contains("route hints, not guarantees"));
        assert!(summary.contains("make policy-check"));
        assert_eq!(
            report["policy_scenario_schema_version"],
            "ignisprompt-policy-scenarios-0.1"
        );
        assert_eq!(report["status"], "policy_preview");
        assert_eq!(report["scope"]["policy_preview_only"], true);
        assert_eq!(report["scope"]["synthetic_scenarios_only"], true);
        assert_eq!(report["scenarios"].as_array().unwrap().len(), 10);
        assert_eq!(report["groups"]["local_only_expected_count"], 10);
        assert_eq!(report["groups"]["fail_closed_expected_count"], 2);
        assert!(report_text.contains("# IgnisPrompt Local Policy Scenario Report"));
        assert!(report_text.contains("policy package request"));
        assert!(report_text.contains("ambiguous request"));
        assert!(report_text.contains("unsupported/cloud-required request"));
        assert!(!json_text.contains("\"string\""));
        assert!(!joined.contains("production readiness"));
        assert!(!joined.contains("production deployment"));
        assert!(!joined.contains("legal accuracy"));
        assert!(!joined.contains("legal advice"));
        assert!(!joined.contains("compliance certification"));
        assert!(!joined.contains("security certification"));
        assert!(!joined.contains("signed attestation"));
        assert!(!joined.contains("tamper-evident"));
        assert!(!joined.contains("cryptographic verification"));
        assert!(!joined.contains("model controls"));
        assert!(!joined.contains("runner controls"));
        assert!(!joined.contains("prompt:"));
        assert!(!joined.contains("real prompt"));
        assert!(!joined.contains("raw user text"));
        assert!(!joined.contains("api key"));
        assert!(!joined.contains("api_key"));
        assert!(!joined.contains("127.0.0.1"));
        assert!(!joined.contains("localhost"));
        assert!(!joined.contains("hostname"));
        assert!(!joined.contains("username"));
        assert!(!joined.contains("/users/"));
    }

    #[test]
    fn policy_scenario_grouping_helpers_cover_route_expectations() {
        assert_eq!(POLICY_SCENARIOS.len(), 10);
        assert!(policy_scenario_groups_by_category()
            .iter()
            .any(|group| group.key == "local helper request" && group.count == 4));
        assert!(policy_scenario_groups_by_expected_tier()
            .iter()
            .any(|group| group.key == "helper" && group.count == 4));
        assert_eq!(
            policy_scenarios_expected_local_only().len(),
            POLICY_SCENARIOS.len()
        );
        assert_eq!(policy_scenarios_expected_fail_closed().len(), 2);
        assert_eq!(
            policy_scenarios_with_boundary_note("package validation is structural/local only")
                .iter()
                .map(|scenario| scenario.id)
                .collect::<Vec<_>>(),
            vec!["policy-package-request"]
        );
    }

    #[test]
    fn policy_package_output_path_requires_ignored_policy_root() {
        assert!(validate_policy_package_output_dir("local-evidence/policy/demo-policy").is_ok());
        assert!(validate_policy_package_output_dir("local-evidence/policy").is_err());
        assert!(validate_policy_package_output_dir("local-evidence/demo-policy").is_err());
        assert!(validate_policy_package_output_dir("/tmp/policy").is_err());
        assert!(validate_policy_package_output_dir("local-evidence/policy/../bad").is_err());
        assert!(build_policy_package_validation_report(Path::new("/tmp/policy")).is_err());
        assert!(
            build_policy_package_validation_report(Path::new("local-evidence/operator/demo"))
                .is_err()
        );
    }

    #[test]
    fn policy_package_writes_and_validates_safe_files() {
        let output_dir = unique_policy_package_test_dir("write-safe");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_policy_package_report(output_dir.clone()).unwrap();
        write_policy_package_report(&package).unwrap();

        for file_name in POLICY_PACKAGE_REQUIRED_FILES {
            assert!(output_dir.join(file_name).exists());
        }
        let validation = build_policy_package_validation_report(&output_dir).unwrap();
        assert!(validation.issues.is_empty());
        assert!(format_policy_package_validation_summary(&validation).contains("Status: ok"));
        assert!(format_policy_package_list_summary(&validation).contains("policy-report.md"));
        assert!(format_policy_package_validation_json(&validation).contains("\"status\": \"ok\""));
        assert!(format_policy_package_list_json(&validation).contains("policy-scenarios.json"));

        let summary = format_policy_package_summary(&package);
        let summary_json = format_policy_package_summary_json(&package);
        let lower_package_text = [
            summary.as_str(),
            summary_json.as_str(),
            package.report_markdown.as_str(),
            package.readme.as_str(),
        ]
        .join("\n")
        .to_ascii_lowercase();
        assert!(summary.contains("IgnisPrompt Local Policy Package"));
        assert!(summary_json.contains("\"local_only\": true"));
        assert!(summary_json.contains("\"policy_package_schema_version\""));
        assert!(lower_package_text.contains("policy preview only"));
        assert!(lower_package_text.contains("synthetic scenarios only"));
        assert!(lower_package_text.contains("route hints, not guarantees"));
        assert!(lower_package_text.contains("local helper checks, not certification"));
        assert!(lower_package_text.contains("package validation is structural/local only"));
        assert!(lower_package_text.contains("not signed"));
        assert!(lower_package_text.contains("no cryptographic validation"));
        assert!(lower_package_text.contains("not tamper evident"));
        assert!(lower_package_text.contains("not production attestation"));
        assert!(!lower_package_text.contains("prompt:"));
        assert!(!lower_package_text.contains("real prompt"));
        assert!(!lower_package_text.contains("raw user text"));
        assert!(!lower_package_text.contains("raw audit text"));
        assert!(!lower_package_text.contains("api_key"));
        assert!(!lower_package_text.contains("sk-"));
        assert!(!lower_package_text.contains("localhost"));
        assert!(!lower_package_text.contains("127.0.0.1"));
        assert!(!lower_package_text.contains("hostname"));
        assert!(!lower_package_text.contains("username"));
        assert!(!lower_package_text.contains("/users/"));
        assert!(!lower_package_text.contains("production readiness"));
        assert!(!lower_package_text.contains("production deployment"));
        assert!(!lower_package_text.contains("legal accuracy"));
        assert!(!lower_package_text.contains("esg certification"));
        assert!(!lower_package_text.contains("compliance certification"));
        assert!(!lower_package_text.contains("security certification"));
        assert!(!lower_package_text.contains("tamper-evident"));
        assert!(!lower_package_text.contains("cryptographic verification"));
        assert!(!lower_package_text.contains("signed attestation"));
        assert!(!lower_package_text.contains("model controls"));
        assert!(!lower_package_text.contains("runner controls"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn policy_package_validation_reports_unsafe_content() {
        let output_dir = unique_policy_package_test_dir("unsafe");
        let _ = std::fs::remove_dir_all(&output_dir);
        std::fs::create_dir_all(&output_dir).unwrap();
        for file_name in POLICY_PACKAGE_REQUIRED_FILES {
            let path = output_dir.join(file_name);
            if file_name.ends_with(".json") {
                std::fs::write(path, "{\"value\":\"string\"}\n").unwrap();
            } else {
                std::fs::write(
                    path,
                    "policy preview only\nsynthetic scenarios only\nroute hints, not guarantees\nlocal helper checks, not certification\npackage validation is structural/local only\nnot signed\nnot production attestation\nno formal legal guidance\nno formal legal correctness claim\nno telemetry\nno cloud calls by default\nprompt: raw audit text /Users/alice api_key sk-test\n",
                )
                .unwrap();
            }
        }

        let validation = build_policy_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("placeholder"));
        assert!(issues.contains("unsafe content"));
        assert!(format_policy_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn policy_package_validation_reports_schema_drift() {
        let output_dir = unique_policy_package_test_dir("schema-drift");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_policy_package_report(output_dir.clone()).unwrap();
        write_policy_package_report(&package).unwrap();
        let mut scenario_json = package.policy_scenarios_json.clone();
        scenario_json["policy_scenario_schema_version"] = json!("string");
        std::fs::write(
            output_dir.join("policy-scenarios.json"),
            serde_json::to_string_pretty(&scenario_json).unwrap(),
        )
        .unwrap();

        let validation = build_policy_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("placeholder"));
        assert!(issues.contains("unexpected policy_scenario_schema_version"));
        assert!(format_policy_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn demo_summary_human_json_and_report_are_conservative() {
        let summary = format_demo_summary();
        let json_text = format_demo_summary_json();
        let report_text = format_demo_summary_report();
        let joined = [summary.as_str(), json_text.as_str(), report_text.as_str()]
            .join("\n")
            .to_ascii_lowercase();
        let report: serde_json::Value = serde_json::from_str(&json_text).unwrap();

        assert!(summary.contains("IgnisPrompt Local Demo Summary"));
        assert!(summary.contains("local preview demo only"));
        assert!(summary.contains("route/status/package values are hints, not guarantees"));
        assert!(summary.contains("make demo-check"));
        assert_eq!(
            report["demo_summary_schema_version"],
            "ignisprompt-demo-summary-0.1"
        );
        assert_eq!(report["status"], "demo_guidance");
        assert_eq!(report["scope"]["local_preview_demo_only"], true);
        assert_eq!(report["scope"]["synthetic_story_steps_only"], true);
        assert_eq!(
            report["scope"]["route_status_package_values_are_hints_not_guarantees"],
            true
        );
        assert_eq!(
            report["scope"]["package_validation_structural_local_only"],
            true
        );
        assert_eq!(report["scope"]["not_signed"], true);
        assert_eq!(report["story_steps"].as_array().unwrap().len(), 6);
        assert!(report_text.contains("# IgnisPrompt Local Demo Summary Report"));
        assert!(report_text.contains("Local readiness"));
        assert!(report_text.contains("Policy scenarios"));
        assert!(!json_text.contains("\"string\""));
        assert!(!joined.contains("production readiness"));
        assert!(!joined.contains("production deployment"));
        assert!(!joined.contains("legal accuracy"));
        assert!(!joined.contains("legal advice"));
        assert!(!joined.contains("compliance certification"));
        assert!(!joined.contains("security certification"));
        assert!(!joined.contains("signed attestation"));
        assert!(!joined.contains("tamper-evident"));
        assert!(!joined.contains("cryptographic verification"));
        assert!(!joined.contains("model controls"));
        assert!(!joined.contains("runner controls"));
        assert!(!joined.contains("prompt:"));
        assert!(!joined.contains("real prompt"));
        assert!(!joined.contains("raw user text"));
        assert!(!joined.contains("api key"));
        assert!(!joined.contains("api_key"));
        assert!(!joined.contains("127.0.0.1"));
        assert!(!joined.contains("localhost"));
        assert!(!joined.contains("hostname"));
        assert!(!joined.contains("username"));
        assert!(!joined.contains("/users/"));
    }

    #[test]
    fn demo_package_output_path_requires_ignored_demo_studio_root() {
        assert!(validate_demo_package_output_dir("local-evidence/demo-studio/demo").is_ok());
        assert!(validate_demo_package_output_dir("local-evidence/demo-studio").is_err());
        assert!(validate_demo_package_output_dir("local-evidence/demo").is_err());
        assert!(validate_demo_package_output_dir("/tmp/demo").is_err());
        assert!(validate_demo_package_output_dir("local-evidence/demo-studio/../bad").is_err());
        assert!(build_demo_package_validation_report(Path::new("/tmp/demo")).is_err());
        assert!(
            build_demo_package_validation_report(Path::new("local-evidence/policy/demo")).is_err()
        );
    }

    #[test]
    fn demo_package_writes_and_validates_safe_files() {
        let output_dir = unique_demo_package_test_dir("write-safe");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_demo_package_report(output_dir.clone()).unwrap();
        write_demo_package_report(&package).unwrap();

        for file_name in DEMO_PACKAGE_REQUIRED_FILES {
            assert!(output_dir.join(file_name).exists());
        }
        let validation = build_demo_package_validation_report(&output_dir).unwrap();
        assert!(validation.issues.is_empty());
        assert!(format_demo_package_validation_summary(&validation).contains("Status: ok"));
        assert!(format_demo_package_list_summary(&validation).contains("demo-report.md"));
        assert!(format_demo_package_validation_json(&validation).contains("\"status\": \"ok\""));
        assert!(format_demo_package_list_json(&validation).contains("demo-summary.json"));

        let summary = format_demo_package_summary(&package);
        let summary_json = format_demo_package_summary_json(&package);
        let lower_package_text = [
            summary.as_str(),
            summary_json.as_str(),
            package.report_markdown.as_str(),
            package.readme.as_str(),
        ]
        .join("\n")
        .to_ascii_lowercase();
        assert!(summary.contains("IgnisPrompt Local Demo Package"));
        assert!(summary_json.contains("\"local_only\": true"));
        assert!(summary_json.contains("\"demo_package_schema_version\""));
        assert!(lower_package_text.contains("local preview demo only"));
        assert!(lower_package_text.contains("synthetic story steps only"));
        assert!(
            lower_package_text.contains("route/status/package values are hints, not guarantees")
        );
        assert!(lower_package_text.contains("local helper checks, not certification"));
        assert!(lower_package_text.contains("package validation is structural/local only"));
        assert!(lower_package_text.contains("not signed"));
        assert!(lower_package_text.contains("no cryptographic validation"));
        assert!(lower_package_text.contains("not tamper evident"));
        assert!(lower_package_text.contains("not production attestation"));
        assert!(!lower_package_text.contains("prompt:"));
        assert!(!lower_package_text.contains("real prompt"));
        assert!(!lower_package_text.contains("raw user text"));
        assert!(!lower_package_text.contains("raw audit text"));
        assert!(!lower_package_text.contains("api_key"));
        assert!(!lower_package_text.contains("sk-"));
        assert!(!lower_package_text.contains("localhost"));
        assert!(!lower_package_text.contains("127.0.0.1"));
        assert!(!lower_package_text.contains("hostname"));
        assert!(!lower_package_text.contains("username"));
        assert!(!lower_package_text.contains("/users/"));
        assert!(!lower_package_text.contains("production readiness"));
        assert!(!lower_package_text.contains("production deployment"));
        assert!(!lower_package_text.contains("legal accuracy"));
        assert!(!lower_package_text.contains("esg certification"));
        assert!(!lower_package_text.contains("compliance certification"));
        assert!(!lower_package_text.contains("security certification"));
        assert!(!lower_package_text.contains("tamper-evident"));
        assert!(!lower_package_text.contains("cryptographic verification"));
        assert!(!lower_package_text.contains("signed attestation"));
        assert!(!lower_package_text.contains("model controls"));
        assert!(!lower_package_text.contains("runner controls"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn demo_package_validation_reports_schema_drift_and_unsafe_content() {
        let output_dir = unique_demo_package_test_dir("schema-drift");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_demo_package_report(output_dir.clone()).unwrap();
        write_demo_package_report(&package).unwrap();
        let mut summary_json = package.demo_summary_json.clone();
        summary_json["demo_summary_schema_version"] = json!("string");
        std::fs::write(
            output_dir.join("demo-summary.json"),
            serde_json::to_string_pretty(&summary_json).unwrap(),
        )
        .unwrap();
        std::fs::write(
            output_dir.join("demo-report.md"),
            "local preview demo only\nsynthetic story steps only\nprompt: raw audit text /Users/alice api_key sk-test\n<script>alert(1)</script>\n",
        )
        .unwrap();
        std::fs::write(
            output_dir.join("README.md"),
            format!("{}\n\u{1b}[31mred\u{1b}[0m\n", package.readme),
        )
        .unwrap();

        let validation = build_demo_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("placeholder"));
        assert!(issues.contains("unexpected demo_summary_schema_version"));
        assert!(issues.contains("unsafe content"));
        assert!(issues.contains("control characters"));
        assert!(format_demo_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn demo_package_validation_reports_unexpected_files() {
        let output_dir = unique_demo_package_test_dir("unexpected-file");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_demo_package_report(output_dir.clone()).unwrap();
        write_demo_package_report(&package).unwrap();
        std::fs::write(output_dir.join("extra.json"), "{}\n").unwrap();

        let validation = build_demo_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("unexpected package file: extra.json"));
        assert!(format_demo_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[cfg(unix)]
    #[test]
    fn demo_package_validation_rejects_symlinked_required_files() {
        let output_dir = unique_demo_package_test_dir("symlink-file");
        let _ = std::fs::remove_dir_all(&output_dir);

        let package = build_demo_package_report(output_dir.clone()).unwrap();
        write_demo_package_report(&package).unwrap();
        std::fs::remove_file(output_dir.join("demo-report.md")).unwrap();
        std::os::unix::fs::symlink("README.md", output_dir.join("demo-report.md")).unwrap();

        let validation = build_demo_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("demo-report.md must not be a symlink"));
        assert!(format_demo_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn readiness_package_output_path_requires_ignored_readiness_root() {
        assert!(
            validate_readiness_package_output_dir("local-evidence/readiness/demo-readiness")
                .is_ok()
        );
        assert!(validate_readiness_package_output_dir("local-evidence/readiness").is_err());
        assert!(validate_readiness_package_output_dir("local-evidence/demo-readiness").is_err());
        assert!(validate_readiness_package_output_dir("/tmp/readiness").is_err());
        assert!(validate_readiness_package_output_dir("local-evidence/readiness/../bad").is_err());
        assert!(build_readiness_package_validation_report(Path::new("/tmp/readiness")).is_err());
        assert!(build_readiness_package_validation_report(Path::new(
            "local-evidence/operator/demo"
        ))
        .is_err());
    }

    #[test]
    fn readiness_package_writes_and_validates_safe_files() {
        let output_dir = unique_readiness_package_test_dir("write-safe");
        let _ = std::fs::remove_dir_all(&output_dir);
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
                    id: "model_status_hints",
                    label: "model and runner status hints",
                    level: DoctorCheckLevel::Required,
                    endpoint: "http://127.0.0.1:8765/v1/status/models".to_string(),
                    ok: true,
                    summary: "available (1 hint; status hints only)".to_string(),
                    error: None,
                },
            ],
        };

        let package = build_readiness_package_report(output_dir.clone(), &report).unwrap();
        write_readiness_package_report(&package).unwrap();

        for file_name in READINESS_PACKAGE_REQUIRED_FILES {
            assert!(output_dir.join(file_name).exists());
        }
        let validation = build_readiness_package_validation_report(&output_dir).unwrap();
        assert!(validation.issues.is_empty());
        assert!(format_readiness_package_validation_summary(&validation).contains("Status: ok"));
        assert!(format_readiness_package_list_summary(&validation).contains("readiness-report.md"));
        assert!(
            format_readiness_package_validation_json(&validation).contains("\"status\": \"ok\"")
        );
        assert!(format_readiness_package_list_json(&validation).contains("readiness-summary.json"));

        let summary = format_readiness_package_summary(&package);
        let summary_json = format_readiness_package_summary_json(&package);
        let lower_package_text = [
            summary.as_str(),
            summary_json.as_str(),
            package.report_markdown.as_str(),
            package.readme.as_str(),
        ]
        .join("\n")
        .to_ascii_lowercase();
        assert!(summary.contains("IgnisPrompt Local Readiness Package"));
        assert!(summary_json.contains("\"local_only\": true"));
        assert!(!lower_package_text.contains("prompt:"));
        assert!(!lower_package_text.contains("raw user text"));
        assert!(!lower_package_text.contains("raw audit text"));
        assert!(!lower_package_text.contains("api_key"));
        assert!(!lower_package_text.contains("sk-"));
        assert!(!lower_package_text.contains("localhost"));
        assert!(!lower_package_text.contains("127.0.0.1"));
        assert!(!lower_package_text.contains("hostname"));
        assert!(!lower_package_text.contains("username"));
        assert!(!lower_package_text.contains("/users/"));
        assert!(!lower_package_text.contains("production deployment"));
        assert!(!lower_package_text.contains("legal accuracy"));
        assert!(!lower_package_text.contains("esg certification"));
        assert!(!lower_package_text.contains("compliance certification"));
        assert!(!lower_package_text.contains("supply-chain certification"));
        assert!(!lower_package_text.contains("production-grade inference"));
        assert!(!lower_package_text.contains("production-grade security"));
        assert!(!lower_package_text.contains("tamper-evident"));
        assert!(!lower_package_text.contains("cryptographic verification"));
        assert!(!lower_package_text.contains("signed attestation"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn readiness_package_validation_reports_unsafe_content() {
        let output_dir = unique_readiness_package_test_dir("unsafe");
        let _ = std::fs::remove_dir_all(&output_dir);
        std::fs::create_dir_all(&output_dir).unwrap();
        for file_name in READINESS_PACKAGE_REQUIRED_FILES {
            let path = output_dir.join(file_name);
            if file_name.ends_with(".json") {
                std::fs::write(path, "{\"value\":\"string\"}\n").unwrap();
            } else {
                std::fs::write(
                    path,
                    "local preview readiness only\nstatus hints, not controls\nlocal helper checks, not certification\nno telemetry\nno cloud calls by default\nprompt: raw audit text /Users/alice api_key sk-test\n",
                )
                .unwrap();
            }
        }

        let validation = build_readiness_package_validation_report(&output_dir).unwrap();
        let issues = validation.issues.join("\n");
        assert!(issues.contains("placeholder"));
        assert!(issues.contains("unsafe content"));
        assert!(format_readiness_package_validation_summary(&validation).contains("Status: failed"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn readiness_package_validation_rejects_absolute_paths() {
        let output_dir = unique_readiness_package_test_dir("redact");
        let absolute_dir = std::env::current_dir().unwrap().join(&output_dir);
        let _ = std::fs::remove_dir_all(&output_dir);
        std::fs::create_dir_all(&output_dir).unwrap();

        for file_name in READINESS_PACKAGE_REQUIRED_FILES {
            let text = if file_name.ends_with(".json") {
                "{}"
            } else {
                "local preview readiness only\nstatus hints, not controls\nlocal helper checks, not certification\nno telemetry\nno cloud calls by default\n"
            };
            std::fs::write(output_dir.join(file_name), text).unwrap();
        }

        let error = build_readiness_package_validation_report(&absolute_dir).unwrap_err();
        assert!(error.contains("readiness package must be a relative path"));
        assert!(!error.contains("/Users/"));

        let _ = std::fs::remove_dir_all(&output_dir);
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
    fn capabilities_summary_is_status_metadata_only() {
        let response = json!({
            "release_channel": "local-preview",
            "local_only": true,
            "cloud_enabled": false,
            "routing_order": ["tier_0", "tier_1", "tier_2", "tier_3", "tier_4", "tier_5"],
            "capabilities": [
                {
                    "provider_id": "stub-legal-runner",
                    "display_name": "Stub Legal Runner",
                    "tier": "tier_3",
                    "connector_type": "domain_local_path",
                    "status": "available",
                    "available": true,
                    "configured": true,
                    "data_boundary": "local_process",
                    "reason": "default_local_preview_fallback",
                    "confidence": "local_default",
                    "warnings": ["Synthetic local-preview path."]
                },
                {
                    "provider_id": "cloud-disabled",
                    "display_name": "Cloud Providers",
                    "tier": "tier_5",
                    "connector_type": "cloud_provider_disabled",
                    "status": "disabled",
                    "available": false,
                    "configured": false,
                    "data_boundary": "cloud_with_consent",
                    "reason": "cloud_disabled_by_default",
                    "confidence": "policy",
                    "warnings": ["No cloud calls are made by local-preview capability discovery."]
                }
            ]
        });

        let summary = format_capabilities_summary(&response);
        assert!(summary.contains("IgnisPrompt Capabilities"));
        assert!(summary.contains("release_channel: local-preview"));
        assert!(summary.contains("cloud_enabled:   false"));
        assert!(summary.contains("tier_3 stub-legal-runner: available"));
        assert!(summary.contains("tier_5 cloud-disabled: disabled"));
        assert!(summary.contains("status metadata only"));
        assert!(summary.contains("no cloud calls"));
        assert!(summary.contains("no telemetry"));
        assert!(summary.contains("no runner execution"));
        assert!(summary.contains("no secrets returned"));
    }

    #[test]
    fn model_inventory_summary_is_read_only_and_path_safe() {
        let response = json!({
            "schema_version": "ignisprompt-model-inventory-v0.1",
            "generated_at": "2026-06-19T00:00:00Z",
            "base_paths_scanned": ["configured-model-dir/models"],
            "inventory_source": "local_model_directories",
            "files": [
                {
                    "filename": "qwen2.5-0.5b-instruct-q4_k_m.gguf",
                    "relative_path": "configured-model-dir/models/qwen2.5-0.5b-instruct-q4_k_m.gguf",
                    "extension": "gguf",
                    "size_bytes": 734003200,
                    "size_mb": 700.0,
                    "model_family": "qwen",
                    "quantization": "q4_k_m",
                    "status": "present",
                    "boundary_note": "File metadata only; contents are not read."
                },
                {
                    "filename": "notes.txt",
                    "relative_path": "configured-model-dir/models/notes.txt",
                    "extension": "txt",
                    "size_bytes": 32,
                    "size_mb": 0.0,
                    "status": "unsupported",
                    "boundary_note": "File metadata only; contents are not read."
                }
            ],
            "summary": {
                "total_files": 2,
                "total_size_bytes": 734003232,
                "gguf_files": 1,
                "safetensors_files": 0,
                "manifest_declared_count": 1,
                "present_count": 1,
                "unsupported_count": 1,
                "largest_file_mb": 700.0,
                "scanned_directory_count": 1,
                "scan_limited": false,
                "notes": ["Read-only model inventory metadata."]
            },
            "boundary_notes": [
                "Inventory metadata is observational and does not execute models."
            ]
        });

        let summary = format_model_inventory_summary(&response);
        assert!(summary.contains("IgnisPrompt Local Model Inventory"));
        assert!(summary.contains("schema_version:     ignisprompt-model-inventory-v0.1"));
        assert!(summary.contains("total_files:        2"));
        assert!(summary.contains("total_size:         700.00 MB"));
        assert!(summary.contains("qwen2.5-0.5b-instruct-q4_k_m.gguf"));
        assert!(summary.contains("notes.txt"));
        assert!(summary.contains("read-only inventory only"));
        assert!(summary.contains("no model execution"));
        assert!(summary.contains("no downloads"));
        assert!(summary.contains("no deletes"));
        assert!(summary.contains("no file contents or hashes returned"));
        assert!(!summary.contains("/Users/"));
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
        assert!(summary.contains("Estimated CO2e avoided: 0.000003 kgCO2e"));
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

    fn fake_evidence_bundle_capture(
        name: &'static str,
        file_name: &'static str,
        endpoint_path: &'static str,
        summary: &str,
        body: serde_json::Value,
    ) -> EvidenceBundleCapture {
        EvidenceBundleCapture {
            name,
            file_name,
            endpoint_path,
            summary: summary.to_string(),
            body,
        }
    }

    fn fake_evidence_bundle_captures(include_audit_events: bool) -> Vec<EvidenceBundleCapture> {
        let mut captures = vec![
            fake_evidence_bundle_capture(
                "health",
                "health.json",
                "/health",
                "ok",
                json!({
                    "status": "ok",
                    "service": "ignispromptd",
                    "version": "0.1.0",
                    "local_only": true
                }),
            ),
            fake_evidence_bundle_capture(
                "version_status",
                "version.json",
                "/v1/status/version",
                "local-preview / 0.1.0",
                json!({
                    "service": "ignispromptd",
                    "version": "0.1.0",
                    "release_channel": "local-preview",
                    "local_only": true,
                    "build_profile": "debug",
                    "git_commit": null,
                    "warnings": []
                }),
            ),
            fake_evidence_bundle_capture(
                "models",
                "models.json",
                "/v1/models",
                "1 model listed",
                json!({
                    "models": [
                        {
                            "modelId": "legal-qwen2.5-0.5b",
                            "displayName": "Qwen2.5 0.5B Instruct",
                            "tier": 3,
                            "domains": ["legal"],
                            "installed": true
                        }
                    ]
                }),
            ),
            fake_evidence_bundle_capture(
                "model_status_hints",
                "model-status.json",
                "/v1/status/models",
                "available (1 hint; status hints only)",
                json!({
                    "schemaVersion": "v0.1",
                    "generatedAt": "2026-05-23T00:00:00Z",
                    "source": "local-daemon",
                    "statusHints": [
                        {
                            "modelId": "legal-qwen2.5-0.5b",
                            "displayName": "Qwen2.5 0.5B Instruct",
                            "tier": 3,
                            "domains": ["legal"],
                            "configured": true,
                            "localPathDeclared": true,
                            "localPathExists": false,
                            "runnerConfigured": false,
                            "runnerKind": "stub-legal-runner",
                            "runnerExecutableExists": false,
                            "availability": "configured",
                            "lastCheckedAt": "2026-05-23T00:00:00Z",
                            "warnings": []
                        }
                    ]
                }),
            ),
            fake_evidence_bundle_capture(
                "sustainability_metrics",
                "sustainability-30d.json",
                "/v1/metrics/sustainability?period=30d",
                "methodology aethra-impact-0.1, confidence low",
                json!({
                    "period": "30d",
                    "requests_total": 1,
                    "local_request_rate": 1.0,
                    "tier_breakdown": { "TIER_3": 1 },
                    "estimated_cloud_cost_avoided_usd": 0.000001,
                    "estimated_carbon_avoided_kgco2e": 0.000001,
                    "estimated_data_kept_local_gb": 0.000001,
                    "methodology_version": "aethra-impact-0.1",
                    "confidence": "low",
                    "disclaimer": "Local-only counterfactual proxy estimates."
                }),
            ),
        ];

        if include_audit_events {
            captures.push(fake_evidence_bundle_capture(
                "audit_events",
                "audit-events.json",
                "/v1/audit/events",
                "1 audit events captured",
                json!([
                    {
                        "request_id": "req-1",
                        "timestamp": "2026-05-23T00:00:00Z",
                        "event_type": "route_explain",
                        "route_code": "DOMAIN_MODEL_SELECTED",
                        "tier": "TIER_3",
                        "domain": "legal",
                        "data_left_device": false,
                        "warnings": []
                    }
                ]),
            ));
        }

        captures
    }

    fn write_fake_evidence_bundle(output_dir: &std::path::Path, include_audit_events: bool) {
        static WRITE_LOCK: std::sync::OnceLock<std::sync::Mutex<()>> = std::sync::OnceLock::new();
        let _guard = WRITE_LOCK
            .get_or_init(|| std::sync::Mutex::new(()))
            .lock()
            .unwrap();
        let report = build_evidence_bundle_report(
            output_dir.to_path_buf(),
            include_audit_events,
            fake_evidence_bundle_captures(include_audit_events),
        )
        .unwrap();
        write_evidence_bundle_report(&report).unwrap();
    }

    #[test]
    fn evidence_bundle_output_path_validation_requires_ignored_local_evidence_paths() {
        assert!(validate_evidence_bundle_output_dir("local-evidence/demo-bundle").is_ok());
        assert!(validate_evidence_bundle_output_dir("./local-evidence/demo-bundle").is_ok());
        assert!(validate_evidence_bundle_output_dir("local-evidence").is_err());
        assert!(validate_evidence_bundle_output_dir("demo-bundle").is_err());
        assert!(validate_evidence_bundle_output_dir("/tmp/demo-bundle").is_err());
    }

    #[test]
    fn evidence_bundle_report_rejects_placeholder_string_summary_values() {
        let captures = vec![fake_evidence_bundle_capture(
            "health",
            "health.json",
            "/health",
            "string",
            json!({
                "status": "ok",
                "service": "ignispromptd",
                "version": "0.1.0",
                "local_only": true
            }),
        )];

        let error = build_evidence_bundle_report(
            std::path::PathBuf::from("local-evidence/test-bundle-placeholder"),
            false,
            captures,
        )
        .unwrap_err();

        assert!(error.contains("placeholder-like literal \"string\" values"));
    }

    #[test]
    fn evidence_bundle_report_summary_excludes_raw_prompt_like_content() {
        let captures = vec![
            fake_evidence_bundle_capture(
                "health",
                "health.json",
                "/health",
                "ok",
                json!({
                    "status": "ok",
                    "service": "ignispromptd",
                    "version": "0.1.0",
                    "local_only": true
                }),
            ),
            fake_evidence_bundle_capture(
                "audit_events",
                "audit-events.json",
                "/v1/audit/events",
                "1 audit events captured",
                json!([
                    {
                        "request_id": "req-1",
                        "timestamp": "2026-05-23T00:00:00Z",
                        "event_type": "route_explain",
                        "route_code": "DOMAIN_MODEL_SELECTED",
                        "tier": "TIER_3",
                        "domain": "legal",
                        "data_left_device": false,
                        "warnings": []
                    }
                ]),
            ),
            fake_evidence_bundle_capture(
                "sustainability_metrics",
                "sustainability-30d.json",
                "/v1/metrics/sustainability?period=30d",
                "methodology aethra-impact-0.1, confidence low",
                json!({
                    "period": "30d",
                    "requests_total": 1,
                    "local_request_rate": 1.0,
                    "tier_breakdown": { "TIER_3": 1 },
                    "estimated_cloud_cost_avoided_usd": 0.000001,
                    "estimated_carbon_avoided_kgco2e": 0.000001,
                    "estimated_data_kept_local_gb": 0.000001,
                    "methodology_version": "aethra-impact-0.1",
                    "confidence": "low",
                    "disclaimer": "Local-only counterfactual proxy estimates."
                }),
            ),
        ];

        let report = build_evidence_bundle_report(
            std::path::PathBuf::from("local-evidence/test-bundle-summary"),
            true,
            captures,
        )
        .unwrap();

        validate_no_placeholder_string_values("summary", &report.summary_json).unwrap();
        let summary = serde_json::to_string_pretty(&report.summary_json).unwrap();
        assert!(summary.contains("\"local_only\": true"));
        assert!(summary.contains("\"non_certified\": true"));
        assert!(summary.contains("\"signed\": false"));
        assert!(summary.contains("\"include_audit_events\": true"));
        assert!(!summary.contains("secret prompt"));
        assert!(!summary.contains("\"prompt\""));
        assert!(!summary.contains("\"content\""));
    }

    #[test]
    fn evidence_bundle_summary_mentions_local_only_and_audit_choice() {
        let report = build_evidence_bundle_report(
            std::path::PathBuf::from("local-evidence/test-bundle-summary-text"),
            false,
            vec![fake_evidence_bundle_capture(
                "health",
                "health.json",
                "/health",
                "ok",
                json!({
                    "status": "ok",
                    "service": "ignispromptd",
                    "version": "0.1.0",
                    "local_only": true
                }),
            )],
        )
        .unwrap();

        let summary = format_evidence_bundle_summary(&report);
        assert!(summary.contains("IgnisPrompt Local Evidence Bundle"));
        assert!(summary.contains("Local-only: true"));
        assert!(summary.contains("Signed: false"));
        assert!(summary.contains("Audit events included: false"));
    }

    #[test]
    fn evidence_bundle_unreachable_error_mentions_local_next_steps() {
        let error =
            format_evidence_bundle_unreachable_error("health", "/health", "connection refused");
        assert!(error.contains("local daemon not reachable for evidence bundle health"));
        assert!(error.contains("/health"));
        assert!(error.contains("./scripts/start-dev.sh"));
    }

    #[test]
    fn evidence_bundle_writes_files_for_fake_local_responses() {
        let output_dir = unique_bundle_test_dir("write");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        assert!(output_dir.exists());
        let summary: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(output_dir.join("summary.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(summary["bundle_type"], "ignisprompt-local-evidence-bundle");
        assert_eq!(
            summary["bundle_schema_version"],
            "ignisprompt-local-evidence-bundle-v1"
        );
        assert_eq!(summary["bundle_mode"], "local-preview");
        assert_eq!(summary["local_only"], true);
        assert_eq!(summary["non_certified"], true);
        assert_eq!(summary["signed"], false);
        assert_eq!(summary["production_attestation"], false);
        assert_eq!(summary["include_audit_events"], true);
        assert_eq!(summary["generated_file_names"].as_array().unwrap().len(), 9);
        assert_eq!(summary["included_endpoints"].as_array().unwrap().len(), 6);
        assert_eq!(summary["captured_endpoints"].as_array().unwrap().len(), 6);

        let manifest: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(output_dir.join("manifest.json")).unwrap(),
        )
        .unwrap();
        assert_eq!(manifest["files"].as_array().unwrap().len(), 9);
        assert_eq!(manifest["include_audit_events"], true);
        assert_eq!(
            manifest["generated_file_names"].as_array().unwrap().len(),
            9
        );
        assert_eq!(manifest["included_endpoints"].as_array().unwrap().len(), 6);

        let readme = std::fs::read_to_string(output_dir.join("README.md")).unwrap();
        assert!(readme.contains("local-preview diagnostic bundle"));
        assert!(
            readme.contains("Audit events are included because they were explicitly requested.")
        );

        let summary_text = serde_json::to_string_pretty(&summary).unwrap();
        assert!(!summary_text.contains("secret prompt"));
        assert!(!summary_text.contains("\"prompt\""));
        assert!(!summary_text.contains("\"content\""));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_validation_passes_for_valid_bundle() {
        let output_dir = unique_bundle_test_dir("validate-ok");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        assert!(report.issues.is_empty());
        assert_eq!(report.metadata.include_audit_events, Some(false));
        assert!(format_evidence_bundle_validation_summary(&report)
            .contains("[ok] bundle validation passed."));
        assert!(format_evidence_bundle_validation_json(&report).contains("\"status\": \"ok\""));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_validation_reports_missing_required_file() {
        let output_dir = unique_bundle_test_dir("validate-missing");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);
        std::fs::remove_file(output_dir.join("version.json")).unwrap();

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.contains("missing required file: version.json")));
        assert!(format_evidence_bundle_validation_summary(&report)
            .contains("[failed] bundle validation found issues."));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_validation_reports_invalid_json() {
        let output_dir = unique_bundle_test_dir("validate-invalid-json");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);
        std::fs::write(output_dir.join("manifest.json"), "{").unwrap();

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.contains("invalid JSON in")));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_validation_rejects_placeholder_string_values() {
        let output_dir = unique_bundle_test_dir("validate-placeholder");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);
        let mut summary: serde_json::Value = serde_json::from_str(
            &std::fs::read_to_string(output_dir.join("summary.json")).unwrap(),
        )
        .unwrap();
        summary["notes"][0] = json!("string");
        std::fs::write(
            output_dir.join("summary.json"),
            serde_json::to_string_pretty(&summary).unwrap(),
        )
        .unwrap();

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        assert!(report
            .issues
            .iter()
            .any(|issue| issue.contains("placeholder-like literal \"string\" values")));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_validation_accepts_optional_audit_events_file() {
        let output_dir = unique_bundle_test_dir("validate-audit");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        assert!(report.issues.is_empty());
        assert_eq!(report.metadata.include_audit_events, Some(true));
        assert!(
            report
                .snapshot
                .file_state("audit-events.json")
                .unwrap()
                .present
        );

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_list_human_output_shows_optional_audit_file_presence() {
        let output_dir = unique_bundle_test_dir("list-human");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        let summary = format_evidence_bundle_list_summary(&report);
        assert!(summary.contains("IgnisPrompt Local Evidence Bundle Listing"));
        assert!(summary.contains("audit-events.json: present (optional)"));
        assert!(summary.contains("Bundle mode: local-preview"));
        assert!(!summary.contains("req-1"));
        assert!(!summary.contains("route_explain"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_list_json_output_reports_file_presence() {
        let output_dir = unique_bundle_test_dir("list-json");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        let json_output = format_evidence_bundle_list_json(&report);
        let value: serde_json::Value = serde_json::from_str(&json_output).unwrap();
        assert_eq!(value["metadata"]["include_audit_events"], true);
        assert_eq!(value["files"].as_array().unwrap().len(), 9);
        assert_eq!(
            value["files"]
                .as_array()
                .unwrap()
                .iter()
                .find(|file| file["file_name"] == "audit-events.json")
                .unwrap()["present"],
            true
        );
        assert!(!json_output.contains("req-1"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_validation_json_output_reports_status() {
        let output_dir = unique_bundle_test_dir("validate-json");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);

        let report = build_evidence_bundle_validation_report(&output_dir).unwrap();
        let json_output = format_evidence_bundle_validation_json(&report);
        let value: serde_json::Value = serde_json::from_str(&json_output).unwrap();
        assert_eq!(value["status"], "ok");
        assert_eq!(value["metadata"]["bundle_mode"], "local-preview");
        assert!(value["issues"].as_array().unwrap().is_empty());

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_archive_succeeds_for_valid_bundle() {
        let output_dir = unique_bundle_test_dir("archive-ok");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        let report = build_evidence_bundle_archive_report(&output_dir, None).unwrap();
        assert!(report.archive_path.starts_with("local-evidence/archives"));
        assert!(report.archive_path.exists());
        assert!(report.validation.issues.is_empty());
        assert!(report
            .archived_file_names
            .iter()
            .any(|file_name| file_name == "audit-events.json"));

        let summary = format_evidence_bundle_archive_summary(&report);
        assert!(summary.contains("IgnisPrompt Local Evidence Bundle Archive"));
        assert!(summary.contains("Archive path:"));
        assert!(summary.contains("Audit events included: true"));

        let archive_json = serde_json::from_str::<serde_json::Value>(
            &format_evidence_bundle_archive_json(&report),
        )
        .unwrap();
        assert_eq!(
            archive_json["archive_path"],
            report.archive_path.display().to_string()
        );
        assert_eq!(archive_json["metadata"]["bundle_mode"], "local-preview");

        let _ = std::fs::remove_file(&report.archive_path);
        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_archive_rejects_invalid_bundle() {
        let output_dir = unique_bundle_test_dir("archive-invalid");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);
        std::fs::remove_file(output_dir.join("summary.json")).unwrap();

        let error = build_evidence_bundle_archive_report(&output_dir, None).unwrap_err();
        assert!(error.contains("bundle validation failed before archiving"));
        assert!(error.contains("missing required file: summary.json"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_archive_refuses_unsafe_output_paths() {
        let output_dir = unique_bundle_test_dir("archive-unsafe");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);

        let error =
            build_evidence_bundle_archive_report(&output_dir, Some("/tmp/bad.tar.gz")).unwrap_err();
        assert!(error.contains("must be relative and under ignored local-evidence/"));
        assert!(validate_evidence_bundle_archive_output_path("/tmp/bad.tar.gz").is_err());

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[cfg(unix)]
    #[test]
    fn evidence_bundle_archive_rejects_symlinked_files_outside_bundle_directory() {
        let output_dir = unique_bundle_test_dir("archive-symlink");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);

        let external_path = std::env::temp_dir().join(format!(
            "ignispromptctl-archive-external-{}-{}.json",
            std::process::id(),
            current_unix_seconds().unwrap()
        ));
        let summary_text = std::fs::read_to_string(output_dir.join("summary.json")).unwrap();
        std::fs::write(&external_path, summary_text).unwrap();
        std::fs::remove_file(output_dir.join("summary.json")).unwrap();
        std::os::unix::fs::symlink(&external_path, output_dir.join("summary.json")).unwrap();

        let error = build_evidence_bundle_archive_report(&output_dir, None).unwrap_err();
        assert!(error.contains("refusing to archive symlinked file"));

        let _ = std::fs::remove_file(&external_path);
        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_verify_archive_passes_for_valid_archive() {
        let output_dir = unique_bundle_test_dir("verify-ok");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        let archive_report = build_evidence_bundle_archive_report(&output_dir, None).unwrap();
        let report =
            build_evidence_bundle_archive_verification_report(&archive_report.archive_path)
                .unwrap();
        assert!(report.validation.issues.is_empty());
        assert_eq!(
            report.bundle_root,
            output_dir
                .file_name()
                .unwrap()
                .to_string_lossy()
                .to_string()
        );
        assert!(format_evidence_bundle_archive_verification_summary(&report)
            .contains("[ok] archive verification passed."));
        assert!(format_evidence_bundle_archive_verification_json(&report)
            .contains("\"status\": \"ok\""));

        let _ = std::fs::remove_file(&archive_report.archive_path);
        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_verify_archive_rejects_corrupt_archive() {
        let archive_path = unique_local_evidence_test_dir("local-evidence/archives", "corrupt")
            .with_extension("tar.gz");
        let _ = std::fs::remove_file(&archive_path);
        if let Some(parent) = archive_path.parent() {
            std::fs::create_dir_all(parent).unwrap();
        }
        std::fs::write(&archive_path, b"not-a-gzip").unwrap();

        let error = build_evidence_bundle_archive_verification_report(&archive_path).unwrap_err();
        assert!(error.contains("archive") || error.contains("gzip") || error.contains("tar"));

        let _ = std::fs::remove_file(&archive_path);
    }

    #[test]
    fn evidence_bundle_print_manifest_human_output_shows_boundary_notes() {
        let output_dir = unique_bundle_test_dir("manifest-human");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, true);

        let report = build_evidence_bundle_manifest_report(&output_dir).unwrap();
        let summary = format_evidence_bundle_manifest_summary(&report);
        assert!(summary.contains("IgnisPrompt Local Evidence Bundle Manifest"));
        assert!(summary.contains("Bundle mode: local-preview"));
        assert!(summary.contains("Audit events included: true"));
        assert!(summary.contains("Not production attestation."));
        assert!(!summary.contains("req-1"));

        let _ = std::fs::remove_dir_all(&output_dir);
    }

    #[test]
    fn evidence_bundle_print_manifest_json_output_reports_manifest_fields() {
        let output_dir = unique_bundle_test_dir("manifest-json");
        let _ = std::fs::remove_dir_all(&output_dir);
        write_fake_evidence_bundle(&output_dir, false);

        let report = build_evidence_bundle_manifest_report(&output_dir).unwrap();
        let value: serde_json::Value =
            serde_json::from_str(&format_evidence_bundle_manifest_json(&report)).unwrap();
        assert_eq!(value["bundle_mode"], "local-preview");
        assert_eq!(value["local_only"], true);
        assert!(value["notes"].as_array().unwrap().iter().any(|note| note
            .as_str()
            .unwrap()
            .to_ascii_lowercase()
            .contains("local-only")));
        assert!(!format_evidence_bundle_manifest_json(&report).contains("req-1"));

        let _ = std::fs::remove_dir_all(&output_dir);
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
