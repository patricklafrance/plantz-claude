#!/usr/bin/env bash
set -uo pipefail

# PreToolUse/Bash: reject file-level oxlint-disable block comments on git commit.
# Only line-level "oxlint-disable-next-line" / "oxlint-disable-line" are allowed.

INPUT=$(cat)

if ! echo "$INPUT" | grep -q 'git commit'; then
    exit 0
fi

OFFENDING=$(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.tsx' '*.js' '*.jsx' \
    | xargs grep -Pln '^\s*/\*\s*(oxlint|eslint)-disable\b' 2>/dev/null)

if [[ -n "$OFFENDING" ]]; then
    echo "File-level oxlint-disable comments are not allowed. Use // oxlint-disable-next-line instead:" >&2
    echo "$OFFENDING" >&2
    exit 2
fi

exit 0
