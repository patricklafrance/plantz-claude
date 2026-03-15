#!/usr/bin/env bash
set -uo pipefail

# PreToolUse/Bash: run gitleaks on staged files before git commit.
# Catches secrets (API keys, tokens, passwords) before they enter git history.
# Requires gitleaks to be installed (https://github.com/gitleaks/gitleaks).

INPUT=$(cat)

if ! echo "$INPUT" | grep -q 'git commit'; then
    exit 0
fi

# Skip if gitleaks is not installed — CI is the hard gate.
if ! command -v gitleaks &>/dev/null; then
    echo "Warning: gitleaks not installed. Skipping local secret scan (CI will catch secrets)." >&2
    exit 0
fi

echo "--- gitleaks protect --staged ---"
if ! gitleaks protect --staged --no-banner --exit-code 1; then
    echo "Blocked: gitleaks detected secrets in staged files." >&2
    echo "Remove the secrets before committing." >&2
    exit 2
fi

echo "Secret scan passed."
