export function sanitizeEvidenceBundleText(value: string): string {
  if (containsSensitiveEvidenceBundleText(value)) {
    return "[redacted local-only report field]";
  }

  return value
    .replace(/https?:\/\/[^\s]+/g, "[redacted url]")
    .replace(
      /\b(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/[^\s]*)?/g,
      "[redacted local host]",
    )
    .replace(/\/(?:Users|home|private)\/[^\s]+/g, "[redacted local path]")
    .replace(/[A-Za-z]:\\[^\s]+/g, "[redacted local path]")
    .replace(/\b(?:sk-[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_-]+)\b/g, "[redacted secret]");
}

export function sanitizeEvidenceBundleTextList(values: string[]): string[] {
  return values.map((value) => sanitizeEvidenceBundleText(value));
}

function containsSensitiveEvidenceBundleText(value: string): boolean {
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:sk|api|token|secret|key)[-_]?[A-Za-z0-9]{12,}\b/i,
    /(?:^|\s)(?:\/Users|\/home|\/private|\/var|\/tmp|[A-Za-z]:\\)[^\s]*/i,
    /\b(?:localhost|[A-Za-z0-9-]+\.(?:local|lan|internal|corp))\b/i,
    /\b(?:host(?:name)?|machine|username|user)\s*[:=]\s*[A-Za-z0-9._-]+/i,
    /\b(?:prompt|request text|raw text|user text)\b/i,
  ].some((pattern) => pattern.test(value));
}
