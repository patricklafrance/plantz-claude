#!/usr/bin/env bash
set -uo pipefail

# PreToolUse/Bash: run lint before git commit.
# Filters for "git commit" in the stdin JSON; skips all other Bash calls.

INPUT=$(cat)

if ! echo "$INPUT" | grep -q 'git commit'; then
    exit 0
fi

echo "--- pnpm lint ---"
if ! pnpm lint; then
    echo "Lint failed. Fix errors before committing." >&2
    # Exit 2 = block the tool call. Exit 1 is treated as a hook error and fails open.
    exit 2
fi

echo "Pre-commit checks passed."
