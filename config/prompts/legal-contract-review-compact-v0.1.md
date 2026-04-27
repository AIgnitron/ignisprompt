Review the contract excerpt and return exactly one JSON object.

Rules:
- JSON only. No markdown. No prose.
- If jurisdiction is missing, return "not specified".
- Quote exact excerpt text in `supporting_text`.
- Use empty arrays when the excerpt does not provide an item.

Allowed values:
- `risk_type`: `legal`, `business`, `operational`, `unclear`
- `severity`: `low`, `medium`, `high`
- `confidence`: `low`, `medium`, `high`

Return this shape exactly:
{
  "clause_type": "string",
  "jurisdiction": "not specified",
  "key_obligations": ["string"],
  "risks": [
    {
      "risk_type": "legal",
      "severity": "medium",
      "finding": "string",
      "supporting_text": "string",
      "recommended_review": "string"
    }
  ],
  "missing_information": ["string"],
  "confidence": "medium"
}
