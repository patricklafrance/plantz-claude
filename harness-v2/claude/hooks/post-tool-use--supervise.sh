#!/usr/bin/env bash
set -uo pipefail

# PostToolUse (Edit|Write|Bash): record tool calls and detect doom loops.
# Warning text (if any) is appended to the tool result Claude sees.
# Never blocks — the tool already ran. PreToolUse handles blocking.

node .claude/hooks/lib/supervision-engine.mjs track || true

exit 0
