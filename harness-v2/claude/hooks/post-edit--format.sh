#!/usr/bin/env bash
set -uo pipefail

# PostToolUse/Edit|Write: format files after edits.
# Runs oxfmt so formatting is always consistent without waiting for commit.

INPUT=$(cat)

# Extract file_path from JSON without jq (not available on all systems).
FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' | head -1)

# Skip if no file path.
if [[ -z "${FILE_PATH:-}" ]]; then
    exit 0
fi

# Only format JS/TS/JSON/MD files.
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.mts|*.mjs|*.cts|*.cjs|*.json|*.md) ;;
    *) exit 0 ;;
esac

# Only format if the file exists (Write might have been blocked).
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

# Format the file in-place. Use the binary directly to avoid pnpm exec startup overhead.
# Never block — formatting is cosmetic.
./node_modules/.bin/oxfmt "$FILE_PATH" 2>/dev/null || true

exit 0
