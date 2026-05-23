#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

python3 - <<'PY'
import pathlib
import re
import subprocess
import sys

TEXT_SUFFIXES = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".lock",
    ".md",
    ".mjs",
    ".rs",
    ".sh",
    ".toml",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
}
TEXT_NAMES = {
    ".env",
    ".gitignore",
    "AGENTS.md",
    "Cargo.lock",
    "Cargo.toml",
    "Makefile",
}

SECRET_PATTERNS = [
    ("private-key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    ("aws-access-key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("github-token", re.compile(r"\bgh[opusr]_[A-Za-z0-9_]{36,}\b")),
    ("openai-style-token", re.compile(r"\bsk-[A-Za-z0-9_-]{32,}\b")),
    (
        "assigned-secret",
        re.compile(
            r"(?i)\b(?:api[_-]?key|secret|token|password|credential)\b"
            r"\s*[:=]\s*['\"]?[A-Za-z0-9_./+=-]{24,}['\"]?"
        ),
    ),
]


def tracked_files() -> list[pathlib.Path]:
    output = subprocess.check_output(["git", "ls-files", "-z"])
    return [
        pathlib.Path(item.decode("utf-8"))
        for item in output.split(b"\0")
        if item
    ]


def is_candidate(path: pathlib.Path) -> bool:
    if path.name.startswith(".env"):
        return True
    return path.name in TEXT_NAMES or path.suffix in TEXT_SUFFIXES


def is_tracked_env_file(path: pathlib.Path) -> bool:
    return path.name == ".env" or path.name.startswith(".env.")


findings: list[str] = []
for path in tracked_files():
    if not is_candidate(path):
        continue

    if is_tracked_env_file(path) and not path.name.endswith(".example"):
        findings.append(f"{path}: tracked environment file")

    data = path.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        continue

    for line_number, line in enumerate(text.splitlines(), start=1):
        if "PLACEHOLDER" in line or "example" in line.lower():
            continue
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(line):
                findings.append(f"{path}:{line_number}: {label}")

if findings:
    print("[secret-scan] possible local secret material found:")
    for finding in findings:
        print(f"  {finding}")
    sys.exit(1)

print("[secret-scan] ok")
PY
