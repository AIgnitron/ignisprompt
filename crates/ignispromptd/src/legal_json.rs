#![cfg_attr(not(feature = "gguf-runner-spike"), allow(dead_code))]

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

const REQUIRED_TOP_LEVEL_FIELDS: [&str; 6] = [
    "clause_type",
    "jurisdiction",
    "key_obligations",
    "risks",
    "missing_information",
    "confidence",
];
const REQUIRED_RISK_FIELDS: [&str; 5] = [
    "risk_type",
    "severity",
    "finding",
    "supporting_text",
    "recommended_review",
];
const ALLOWED_RISK_TYPES: [&str; 4] = ["legal", "business", "operational", "unclear"];
const ALLOWED_SEVERITIES: [&str; 3] = ["low", "medium", "high"];
const ALLOWED_CONFIDENCE: [&str; 3] = ["low", "medium", "high"];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct LegalJsonMetadata {
    pub(crate) status: String,
    pub(crate) source: String,
    pub(crate) schema_valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) error_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) error_message: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub(crate) missing_fields: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub(crate) invalid_fields: Vec<String>,
    pub(crate) raw_model_output: String,
}

pub(crate) struct LegalJsonNormalization {
    pub(crate) content: String,
    pub(crate) metadata: LegalJsonMetadata,
}

#[cfg(feature = "gguf-runner-spike")]
pub(crate) fn contract_review_response_schema_json() -> String {
    serde_json::to_string(&json!({
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "clause_type": {"type": "string"},
            "jurisdiction": {"type": "string"},
            "key_obligations": {
                "type": "array",
                "items": {"type": "string"}
            },
            "risks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "risk_type": {
                            "type": "string",
                            "enum": ["legal", "business", "operational", "unclear"]
                        },
                        "severity": {
                            "type": "string",
                            "enum": ["low", "medium", "high"]
                        },
                        "finding": {"type": "string"},
                        "supporting_text": {"type": "string"},
                        "recommended_review": {"type": "string"}
                    },
                    "required": [
                        "risk_type",
                        "severity",
                        "finding",
                        "supporting_text",
                        "recommended_review"
                    ]
                }
            },
            "missing_information": {
                "type": "array",
                "items": {"type": "string"}
            },
            "confidence": {
                "type": "string",
                "enum": ["low", "medium", "high"]
            }
        },
        "required": REQUIRED_TOP_LEVEL_FIELDS
    }))
    .expect("serializing legal response schema should not fail")
}

pub(crate) fn normalize_legal_json_output(raw_model_output: &str) -> LegalJsonNormalization {
    let trimmed = raw_model_output.trim();

    match extract_first_json_object(trimmed) {
        Some(extracted) => match validate_required_fields(&extracted.value) {
            Ok(()) => LegalJsonNormalization {
                content: serde_json::to_string_pretty(&extracted.value)
                    .expect("serializing validated legal JSON should not fail"),
                metadata: LegalJsonMetadata {
                    status: "ok".to_string(),
                    source: extracted.source.to_string(),
                    schema_valid: true,
                    error_code: None,
                    error_message: None,
                    missing_fields: vec![],
                    invalid_fields: vec![],
                    raw_model_output: raw_model_output.to_string(),
                },
            },
            Err(validation) => {
                let error_message = build_validation_message(&validation);
                let wrapper = json!({
                    "parse_status": "error",
                    "error_code": "LEGAL_JSON_VALIDATION_FAILED",
                    "error_message": error_message,
                    "source": extracted.source,
                    "missing_fields": validation.missing_fields,
                    "invalid_fields": validation.invalid_fields,
                    "raw_model_output": raw_model_output,
                });
                LegalJsonNormalization {
                    content: serde_json::to_string_pretty(&wrapper)
                        .expect("serializing legal JSON validation error should not fail"),
                    metadata: LegalJsonMetadata {
                        status: "error".to_string(),
                        source: extracted.source.to_string(),
                        schema_valid: false,
                        error_code: Some("LEGAL_JSON_VALIDATION_FAILED".to_string()),
                        error_message: Some(error_message),
                        missing_fields: validation.missing_fields,
                        invalid_fields: validation.invalid_fields,
                        raw_model_output: raw_model_output.to_string(),
                    },
                }
            }
        },
        None => {
            let error_message =
                "No valid JSON object could be extracted from the local model output.".to_string();
            let wrapper = json!({
                "parse_status": "error",
                "error_code": "LEGAL_JSON_EXTRACTION_FAILED",
                "error_message": error_message,
                "source": "none",
                "raw_model_output": raw_model_output,
            });
            LegalJsonNormalization {
                content: serde_json::to_string_pretty(&wrapper)
                    .expect("serializing legal JSON extraction error should not fail"),
                metadata: LegalJsonMetadata {
                    status: "error".to_string(),
                    source: "none".to_string(),
                    schema_valid: false,
                    error_code: Some("LEGAL_JSON_EXTRACTION_FAILED".to_string()),
                    error_message: Some(error_message),
                    missing_fields: vec![],
                    invalid_fields: vec![],
                    raw_model_output: raw_model_output.to_string(),
                },
            }
        }
    }
}

#[derive(Clone)]
struct ExtractedJson {
    source: &'static str,
    value: Value,
}

#[derive(Default)]
struct ValidationFailure {
    missing_fields: Vec<String>,
    invalid_fields: Vec<String>,
}

fn extract_first_json_object(text: &str) -> Option<ExtractedJson> {
    let trimmed = text.trim();
    let mut candidates = Vec::new();

    if let Some(value) = parse_object_prefix(trimmed) {
        append_candidate(&mut candidates, "raw_json", value);
    }

    for value in extract_from_fences(trimmed) {
        append_candidate(&mut candidates, "fenced_json", value);
    }

    for value in extract_from_brace_scan(trimmed) {
        append_candidate(&mut candidates, "noisy_preamble", value);
    }

    choose_schema_candidate(candidates)
}

fn append_candidate(candidates: &mut Vec<ExtractedJson>, source: &'static str, value: Value) {
    candidates.push(ExtractedJson {
        source,
        value: value.clone(),
    });
    append_wrapper_candidates(candidates, &value);
}

fn choose_schema_candidate(candidates: Vec<ExtractedJson>) -> Option<ExtractedJson> {
    let mut first_candidate = None;

    for candidate in candidates {
        if first_candidate.is_none() {
            first_candidate = Some(candidate.clone());
        }

        if validate_required_fields(&candidate.value).is_ok() {
            return Some(candidate);
        }
    }

    first_candidate
}

fn append_wrapper_candidates(candidates: &mut Vec<ExtractedJson>, value: &Value) {
    let Some(object) = value.as_object() else {
        return;
    };

    for field in ["response", "content", "output", "result", "json"] {
        if let Some(nested) = object.get(field) {
            append_wrapper_candidate_value(candidates, nested);
        }
    }

    if let Some(content) = object
        .get("message")
        .and_then(Value::as_object)
        .and_then(|message| message.get("content"))
    {
        append_wrapper_candidate_value(candidates, content);
    }
}

fn append_wrapper_candidate_value(candidates: &mut Vec<ExtractedJson>, value: &Value) {
    match value {
        Value::Object(_) => {
            candidates.push(ExtractedJson {
                source: "wrapper_json",
                value: value.clone(),
            });
        }
        Value::String(text) => {
            let trimmed = text.trim();
            if let Some(value) = parse_object_prefix(trimmed) {
                candidates.push(ExtractedJson {
                    source: "wrapper_json",
                    value,
                });
            }

            for value in extract_from_fences(trimmed) {
                candidates.push(ExtractedJson {
                    source: "wrapper_json",
                    value,
                });
            }

            for value in extract_from_brace_scan(trimmed) {
                candidates.push(ExtractedJson {
                    source: "wrapper_json",
                    value,
                });
            }
        }
        _ => {}
    }
}

fn extract_from_fences(text: &str) -> Vec<Value> {
    let mut cursor = 0;
    let mut values = Vec::new();

    while let Some(open_rel) = text[cursor..].find("```") {
        let fence_start = cursor + open_rel + 3;
        let remainder = &text[fence_start..];
        let Some(newline_rel) = remainder.find('\n') else {
            break;
        };
        let fence_info = remainder[..newline_rel].trim();
        let body_start = fence_start + newline_rel + 1;
        let Some(close_rel) = text[body_start..].find("```") else {
            break;
        };
        let body = text[body_start..body_start + close_rel].trim();

        if fence_info.is_empty() || fence_info.eq_ignore_ascii_case("json") {
            if let Some(value) = parse_object_prefix(body) {
                values.push(value);
            }
        }

        cursor = body_start + close_rel + 3;
    }

    values
}

fn extract_from_brace_scan(text: &str) -> Vec<Value> {
    let mut values = Vec::new();

    for (idx, ch) in text.char_indices() {
        if ch != '{' {
            continue;
        }

        if let Some(value) = parse_object_prefix(&text[idx..]) {
            values.push(value);
        }
    }

    values
}

fn parse_object_prefix(text: &str) -> Option<Value> {
    let mut deserializer = serde_json::Deserializer::from_str(text);
    let value = Value::deserialize(&mut deserializer).ok()?;
    value.is_object().then_some(value)
}

fn validate_required_fields(value: &Value) -> Result<(), ValidationFailure> {
    let Some(object) = value.as_object() else {
        return Err(ValidationFailure {
            invalid_fields: vec!["<root>".to_string()],
            ..ValidationFailure::default()
        });
    };

    let mut failure = ValidationFailure::default();
    validate_allowed_fields(object, &REQUIRED_TOP_LEVEL_FIELDS, "", &mut failure);

    for field in REQUIRED_TOP_LEVEL_FIELDS {
        let Some(field_value) = object.get(field) else {
            failure.missing_fields.push(field.to_string());
            continue;
        };

        match field {
            "clause_type" | "jurisdiction" => {
                validate_string_field(field_value, field, &mut failure);
            }
            "confidence" => {
                validate_enum_field(field_value, field, &ALLOWED_CONFIDENCE, &mut failure);
            }
            "key_obligations" | "missing_information" => {
                validate_string_array(field_value, field, &mut failure);
            }
            "risks" => {
                validate_risks(field_value, &mut failure);
            }
            _ => {}
        }
    }

    if failure.missing_fields.is_empty() && failure.invalid_fields.is_empty() {
        Ok(())
    } else {
        Err(failure)
    }
}

fn validate_allowed_fields(
    object: &Map<String, Value>,
    allowed_fields: &[&str],
    path_prefix: &str,
    failure: &mut ValidationFailure,
) {
    for field in object.keys() {
        if !allowed_fields
            .iter()
            .any(|allowed_field| *allowed_field == field.as_str())
        {
            failure.invalid_fields.push(field_path(path_prefix, field));
        }
    }
}

fn validate_string_field(value: &Value, field: &str, failure: &mut ValidationFailure) {
    if !value.is_string() {
        failure.invalid_fields.push(field.to_string());
    }
}

fn validate_enum_field(
    value: &Value,
    field: &str,
    allowed_values: &[&str],
    failure: &mut ValidationFailure,
) {
    let Some(text) = value.as_str() else {
        failure.invalid_fields.push(field.to_string());
        return;
    };

    if !allowed_values.iter().any(|allowed| *allowed == text) {
        failure.invalid_fields.push(field.to_string());
    }
}

fn validate_string_array(value: &Value, field: &str, failure: &mut ValidationFailure) {
    let Some(items) = value.as_array() else {
        failure.invalid_fields.push(field.to_string());
        return;
    };

    for (idx, item) in items.iter().enumerate() {
        if !item.is_string() {
            failure.invalid_fields.push(format!("{field}[{idx}]"));
        }
    }
}

fn validate_risks(value: &Value, failure: &mut ValidationFailure) {
    let Some(risks) = value.as_array() else {
        failure.invalid_fields.push("risks".to_string());
        return;
    };

    for (idx, risk) in risks.iter().enumerate() {
        let risk_path = format!("risks[{idx}]");
        let Some(object) = risk.as_object() else {
            failure.invalid_fields.push(risk_path);
            continue;
        };

        validate_allowed_fields(object, &REQUIRED_RISK_FIELDS, &risk_path, failure);

        for field in REQUIRED_RISK_FIELDS {
            let field_name = field_path(&risk_path, field);
            let Some(field_value) = object.get(field) else {
                failure.missing_fields.push(field_name);
                continue;
            };

            match field {
                "risk_type" => {
                    validate_enum_field(field_value, &field_name, &ALLOWED_RISK_TYPES, failure);
                }
                "severity" => {
                    validate_enum_field(field_value, &field_name, &ALLOWED_SEVERITIES, failure);
                }
                "finding" | "supporting_text" | "recommended_review" => {
                    validate_string_field(field_value, &field_name, failure);
                }
                _ => {}
            }
        }
    }
}

fn field_path(path_prefix: &str, field: &str) -> String {
    if path_prefix.is_empty() {
        field.to_string()
    } else {
        format!("{path_prefix}.{field}")
    }
}

fn build_validation_message(validation: &ValidationFailure) -> String {
    let mut problems = Vec::new();

    if !validation.missing_fields.is_empty() {
        problems.push(format!(
            "missing required fields: {}",
            validation.missing_fields.join(", ")
        ));
    }

    if !validation.invalid_fields.is_empty() {
        problems.push(format!(
            "invalid field values or types: {}",
            validation.invalid_fields.join(", ")
        ));
    }

    format!(
        "Extracted local legal JSON did not satisfy the required top-level schema: {}.",
        problems.join("; ")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_legal_json() -> &'static str {
        r#"{
  "clause_type": "indemnification",
  "jurisdiction": "not specified",
  "key_obligations": ["Vendor must defend the customer against third-party claims."],
  "risks": [
    {
      "risk_type": "legal",
      "severity": "medium",
      "finding": "The indemnity is capped to direct damages only.",
      "supporting_text": "Vendor shall indemnify Customer for third-party IP claims.",
      "recommended_review": "Confirm whether indirect damages should be excluded."
    }
  ],
  "missing_information": ["No governing law clause was provided."],
  "confidence": "medium"
}"#
    }

    #[test]
    fn normalizes_clean_json() {
        let normalized = normalize_legal_json_output(valid_legal_json());

        assert_eq!(normalized.metadata.status, "ok");
        assert_eq!(normalized.metadata.source, "raw_json");
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["clause_type"], "indemnification");
    }

    #[test]
    fn normalizes_fenced_json() {
        let raw = format!("```json\n{}\n```", valid_legal_json());
        let normalized = normalize_legal_json_output(&raw);

        assert_eq!(normalized.metadata.status, "ok");
        assert_eq!(normalized.metadata.source, "fenced_json");
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["jurisdiction"], "not specified");
    }

    #[test]
    fn normalizes_noisy_preamble_before_json() {
        let raw = format!("Here is the JSON:\n{}\n", valid_legal_json());
        let normalized = normalize_legal_json_output(&raw);

        assert_eq!(normalized.metadata.status, "ok");
        assert_eq!(normalized.metadata.source, "noisy_preamble");
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["confidence"], "medium");
    }

    #[test]
    fn normalizes_json_after_parseable_noise_object() {
        let raw = format!(
            "Draft metadata: {{\"format\":\"json\",\"status\":\"draft\"}}\nFinal answer:\n{}",
            valid_legal_json()
        );
        let normalized = normalize_legal_json_output(&raw);

        assert_eq!(normalized.metadata.status, "ok");
        assert_eq!(normalized.metadata.source, "noisy_preamble");
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["clause_type"], "indemnification");
    }

    #[test]
    fn normalizes_common_json_string_wrapper() {
        let raw = json!({
            "response": valid_legal_json(),
            "done": true
        })
        .to_string();
        let normalized = normalize_legal_json_output(&raw);

        assert_eq!(normalized.metadata.status, "ok");
        assert_eq!(normalized.metadata.source, "wrapper_json");
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["jurisdiction"], "not specified");
    }

    #[test]
    fn returns_structured_error_for_invalid_json() {
        let raw = "Here is the JSON:\n{\"clause_type\":\"nda\"";
        let normalized = normalize_legal_json_output(raw);

        assert_eq!(normalized.metadata.status, "error");
        assert_eq!(
            normalized.metadata.error_code.as_deref(),
            Some("LEGAL_JSON_EXTRACTION_FAILED")
        );
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["parse_status"], "error");
        assert_eq!(parsed["error_code"], "LEGAL_JSON_EXTRACTION_FAILED");
    }

    #[test]
    fn returns_structured_error_for_missing_required_fields() {
        let raw = r#"{"clause_type":"nda","jurisdiction":"not specified"}"#;
        let normalized = normalize_legal_json_output(raw);

        assert_eq!(normalized.metadata.status, "error");
        assert_eq!(
            normalized.metadata.error_code.as_deref(),
            Some("LEGAL_JSON_VALIDATION_FAILED")
        );
        assert!(normalized
            .metadata
            .missing_fields
            .contains(&"key_obligations".to_string()));
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["parse_status"], "error");
        assert_eq!(parsed["error_code"], "LEGAL_JSON_VALIDATION_FAILED");
    }

    #[test]
    fn returns_structured_error_for_invalid_nested_risk_schema() {
        let raw = r#"{
  "clause_type": "indemnification",
  "jurisdiction": "not specified",
  "key_obligations": [],
  "risks": [
    {
      "risk_type": "contract",
      "severity": "urgent",
      "finding": 7
    }
  ],
  "missing_information": [],
  "confidence": "certain"
}"#;
        let normalized = normalize_legal_json_output(raw);

        assert_eq!(normalized.metadata.status, "error");
        assert_eq!(
            normalized.metadata.error_code.as_deref(),
            Some("LEGAL_JSON_VALIDATION_FAILED")
        );
        assert!(normalized
            .metadata
            .missing_fields
            .contains(&"risks[0].supporting_text".to_string()));
        assert!(normalized
            .metadata
            .invalid_fields
            .contains(&"risks[0].risk_type".to_string()));
        assert!(normalized
            .metadata
            .invalid_fields
            .contains(&"confidence".to_string()));
        let parsed: Value = serde_json::from_str(&normalized.content).unwrap();
        assert_eq!(parsed["parse_status"], "error");
        assert_eq!(parsed["schema_valid"], Value::Null);
    }

    #[test]
    fn returns_structured_error_for_additional_fields() {
        let raw = r#"{
  "clause_type": "indemnification",
  "jurisdiction": "not specified",
  "key_obligations": [],
  "risks": [],
  "missing_information": [],
  "confidence": "medium",
  "legal_advice": "This clause is enforceable."
}"#;
        let normalized = normalize_legal_json_output(raw);

        assert_eq!(normalized.metadata.status, "error");
        assert_eq!(
            normalized.metadata.error_code.as_deref(),
            Some("LEGAL_JSON_VALIDATION_FAILED")
        );
        assert!(normalized
            .metadata
            .invalid_fields
            .contains(&"legal_advice".to_string()));
    }
}
