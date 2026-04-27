#![cfg_attr(not(feature = "gguf-runner-spike"), allow(dead_code))]

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

const REQUIRED_TOP_LEVEL_FIELDS: [&str; 6] = [
    "clause_type",
    "jurisdiction",
    "key_obligations",
    "risks",
    "missing_information",
    "confidence",
];

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

    if let Some(value) = parse_object_prefix(trimmed) {
        return Some(ExtractedJson {
            source: "raw_json",
            value,
        });
    }

    if let Some(value) = extract_from_fences(trimmed) {
        return Some(ExtractedJson {
            source: "fenced_json",
            value,
        });
    }

    extract_from_brace_scan(trimmed).map(|value| ExtractedJson {
        source: "noisy_preamble",
        value,
    })
}

fn extract_from_fences(text: &str) -> Option<Value> {
    let mut cursor = 0;

    while let Some(open_rel) = text[cursor..].find("```") {
        let fence_start = cursor + open_rel + 3;
        let remainder = &text[fence_start..];
        let newline_rel = remainder.find('\n')?;
        let fence_info = remainder[..newline_rel].trim();
        let body_start = fence_start + newline_rel + 1;
        let close_rel = text[body_start..].find("```")?;
        let body = text[body_start..body_start + close_rel].trim();

        if fence_info.is_empty() || fence_info.eq_ignore_ascii_case("json") {
            if let Some(value) = parse_object_prefix(body) {
                return Some(value);
            }
        }

        cursor = body_start + close_rel + 3;
    }

    None
}

fn extract_from_brace_scan(text: &str) -> Option<Value> {
    for (idx, ch) in text.char_indices() {
        if ch != '{' {
            continue;
        }

        if let Some(value) = parse_object_prefix(&text[idx..]) {
            return Some(value);
        }
    }

    None
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

    for field in REQUIRED_TOP_LEVEL_FIELDS {
        let Some(field_value) = object.get(field) else {
            failure.missing_fields.push(field.to_string());
            continue;
        };

        let valid = match field {
            "clause_type" | "jurisdiction" | "confidence" => field_value.is_string(),
            "key_obligations" | "missing_information" => is_string_array(field_value),
            "risks" => field_value.is_array(),
            _ => true,
        };

        if !valid {
            failure.invalid_fields.push(field.to_string());
        }
    }

    if failure.missing_fields.is_empty() && failure.invalid_fields.is_empty() {
        Ok(())
    } else {
        Err(failure)
    }
}

fn is_string_array(value: &Value) -> bool {
    value
        .as_array()
        .map(|items| items.iter().all(Value::is_string))
        .unwrap_or(false)
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
            "invalid field types: {}",
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
}
