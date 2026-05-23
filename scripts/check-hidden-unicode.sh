#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

python3 - <<'PY'
import pathlib
import sys
import unicodedata

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
    ".gitignore",
    "AGENTS.md",
    "Cargo.lock",
    "Cargo.toml",
    "Makefile",
}
ALLOWED_CONTROL_CODEPOINTS = {
    0x09,  # tab
    0x0A,  # line feed
    0x0D,  # carriage return
}


def tracked_files() -> list[pathlib.Path]:
    import subprocess

    output = subprocess.check_output(["git", "ls-files", "-z"])
    return [
        pathlib.Path(item.decode("utf-8"))
        for item in output.split(b"\0")
        if item
    ]


def is_candidate(path: pathlib.Path) -> bool:
    return path.name in TEXT_NAMES or path.suffix in TEXT_SUFFIXES


def hidden_unicode_findings(path: pathlib.Path) -> list[str]:
    data = path.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return []

    findings = []
    line = 1
    column = 0
    for char in text:
        if char == "\n":
            line += 1
            column = 0
            continue
        column += 1

        category = unicodedata.category(char)
        if ord(char) in ALLOWED_CONTROL_CODEPOINTS:
            continue
        if category in {"Cf", "Cc"}:
            codepoint = f"U+{ord(char):04X}"
            name = unicodedata.name(char, "UNNAMED")
            findings.append(f"{path}:{line}:{column}: {codepoint} {name}")

    return findings


all_findings: list[str] = []
for path in tracked_files():
    if is_candidate(path):
        all_findings.extend(hidden_unicode_findings(path))

if all_findings:
    print("[hidden-unicode] hidden Unicode format/control characters found:")
    for finding in all_findings:
        print(f"  {finding}")
    sys.exit(1)

print("[hidden-unicode] ok")
PY
