#!/usr/bin/env bash
set -uo pipefail

# PostToolUse hook: lint files after Edit/Write.
# Registered in .claude/settings.json with matcher "Edit|Write".
# Runs oxlint on the written file so lint issues surface immediately
# without waiting for the pre-commit lint pass.

INPUT=$(cat)

# Extract file_path from JSON without jq (not available on all systems).
FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' | head -1)

# Skip if no file path.
if [[ -z "${FILE_PATH:-}" ]]; then
    exit 0
fi

# Only lint JS/TS files.
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.mts|*.mjs|*.cts|*.cjs) ;;
    *) exit 0 ;;
esac

# Only lint if the file exists (Write might have been blocked).
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

# Lint the file. Use the binary directly to avoid pnpm exec startup overhead.
# Report only — do not auto-fix. The agent decides how to address issues.
# Never block — linting is informational, the pre-commit hook is the gate.
./node_modules/.bin/oxlint "$FILE_PATH" 2>/dev/null || true

exit 0
