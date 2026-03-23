#!/usr/bin/env bash
set -uo pipefail

# PreToolUse (Edit|Write|Bash): block tool calls when doom loop is confirmed.
# Outputs {"decision": "block", "reason": "..."} when blocking.
# Falls back to allow if the engine errors — supervision must never break the workflow.

RESULT=$(node .claude/hooks/lib/supervision-engine.mjs check) || exit 0
[ -n "$RESULT" ] && echo "$RESULT"

exit 0
