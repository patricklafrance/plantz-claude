#!/usr/bin/env bash
set -uo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# SubagentStop hook: verify harness subagents produced their expected deliverable.
#
# Unlike the Stop hook (which must distinguish "done" from "chatting"), every
# SubagentStop IS a task completion — subagents don't have multi-turn
# conversations. The problem here is different: "did this subagent deliver?"
#
# Gate structure:
#   Gate 1  stop_hook_active is false           (prevents infinite loops)
#   Gate 2  agent_type matches harness-*        (skip non-harness agents)
#
# Deliverable check (based on agent_type):
#   harness-plan       →  .harness/header.md exists AND .harness/slices/ has ≥1 .md file
#   harness-architect  →  .harness/header.md exists (architect reads and approves/rejects)
#   harness-coordinator→  pass-through (coordinator manages flow, no single deliverable)
#   Others             →  pass-through (generic agents spawned by coordinator)
# ═══════════════════════════════════════════════════════════════════════════════

INPUT=$(cat)

# ─── Helpers ──────────────────────────────────────────────────────────────────
json_field() {
  node -e "
    const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const v = d[process.argv[1]];
    process.stdout.write(String(v ?? ''));
  " "$1" <<< "$INPUT"
}

block_with() {
  node -e "
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: process.argv[1]
    }));
  " "$1"
  exit 0
}

# ─── Gate 1: Prevent infinite loops ──────────────────────────────────────────
STOP_ACTIVE=$(json_field stop_hook_active)
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

# ─── Gate 2: Only verify harness subagents ────────────────────────────────────
# Non-harness agents (Explore, Plan, simplify, general-purpose) don't produce
# file deliverables — skip them entirely.
AGENT_TYPE=$(json_field agent_type)

case "$AGENT_TYPE" in
  harness-plan|harness-architect)
    ;; # Continue to deliverable check
  harness-coordinator)
    # Coordinator manages the flow — no single deliverable to check.
    exit 0
    ;;
  harness-*)
    # Other harness agents (generic coders spawned by coordinator).
    # Verification results go to .harness/completed/ but are managed by coordinator.
    exit 0
    ;;
  *)
    # Not a harness agent at all.
    exit 0
    ;;
esac

# ─── Deliverable check ───────────────────────────────────────────────────────
# Each harness phase has specific output files in .harness/ (flat, no UUID
# subdirectories). If the subagent stops without producing them, block and
# tell it to finish the job.

HARNESS_DIR=".harness"

case "$AGENT_TYPE" in
  harness-plan)
    # Plan must produce header.md AND at least one slice in slices/.
    if [ ! -f "$HARNESS_DIR/header.md" ]; then
      echo "" >&2
      echo "======================================================" >&2
      echo "  SubagentStop [harness-plan]: deliverable missing" >&2
      echo "  Expected: $HARNESS_DIR/header.md" >&2
      echo "======================================================" >&2
      echo "" >&2

      block_with "You stopped without producing your deliverable. Expected: the plan header file ($HARNESS_DIR/header.md). Review the skill instructions and produce the output file before stopping."
    fi

    # Check that slices/ directory exists and has at least one .md file.
    SLICE_COUNT=0
    if [ -d "$HARNESS_DIR/slices" ]; then
      SLICE_COUNT=$(find "$HARNESS_DIR/slices" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
    fi

    if [ "$SLICE_COUNT" -eq 0 ]; then
      echo "" >&2
      echo "======================================================" >&2
      echo "  SubagentStop [harness-plan]: deliverable missing" >&2
      echo "  Expected: at least one .md file in $HARNESS_DIR/slices/" >&2
      echo "======================================================" >&2
      echo "" >&2

      block_with "You stopped without producing your deliverable. Expected: at least one slice file in $HARNESS_DIR/slices/. Review the skill instructions and produce the slice files before stopping."
    fi
    ;;

  harness-architect)
    # Architect reads and approves/rejects the plan. header.md must exist
    # (written by the plan phase; architect enriches or annotates it).
    if [ ! -f "$HARNESS_DIR/header.md" ]; then
      echo "" >&2
      echo "======================================================" >&2
      echo "  SubagentStop [harness-architect]: deliverable missing" >&2
      echo "  Expected: $HARNESS_DIR/header.md" >&2
      echo "======================================================" >&2
      echo "" >&2

      block_with "You stopped without producing your deliverable. Expected: the plan header file ($HARNESS_DIR/header.md) should exist from the plan phase. Review the skill instructions and verify the plan before stopping."
    fi
    ;;
esac

# ─── Passed ───────────────────────────────────────────────────────────────────
echo "" >&2
echo "  SubagentStop [$AGENT_TYPE]: deliverable verified." >&2
exit 0
