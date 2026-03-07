#!/bin/bash

# Why this exists
# We enforce pnpm via a Claude Code PreToolUse hook so the wrong package manager command never runs.
# This is better than adding a reminder to AGENTS.md because docs are always in context even when irrelevant,
# they still are not guaranteed to be followed, and they rely on the agent remembering. Hooks are scoped to
# Bash tool calls and deterministically block and redirect the command, without spending instruction budget.
# Taken from https://www.aihero.dev/how-to-use-claude-code-hooks-to-enforce-the-right-cli

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
