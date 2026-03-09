#!/bin/bash

# PreToolUse/Bash: block npm/npx and redirect to pnpm/pnpx.
# Deterministically enforces pnpm without relying on doc instructions.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -oP '"command"\s*:\s*"\K[^"]+' | head -1)

## Prefer pnpm over npm to ensure consistent package management across the monorepo
if echo "$COMMAND" | grep -qE "^npm( |$)"; then
  echo "Blocked: use pnpm instead of npm" >&2
  exit 2
fi

## Prefer pnpx over npx to ensure the correct version of packages is used from the monorepo
if echo "$COMMAND" | grep -qE "^npx( |$)"; then
  echo "Blocked: use pnpx instead of npx" >&2
  exit 2
fi

exit 0
