#!/usr/bin/env bash
set -uo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# Stop hook: final verification pass before allowing Claude to stop.
#
# Problem: Stop fires on EVERY response, not just task completion.
# Solution: Three gates filter out mid-conversation responses.
#
#   Gate 1  stop_hook_active is false       (prevents infinite re-triggering)
#   Gate 2  Working tree has file changes   (no diff = chatting, not coding)
#   Gate 3  Last message signals completion (not a mid-conversation reply)
#
# Verification checks (only when all gates pass):
#   1. pnpm lint (typecheck, syncpack, oxlint, Knip)
#   2. Structural-file doc audit (CLAUDE.md Rule 3)
#   3. Debug artifact scan (console.log, debugger)
#   4. Structural drift (compare against session-start snapshot)
# ═══════════════════════════════════════════════════════════════════════════════

INPUT=$(cat)

# ─── Helpers ──────────────────────────────────────────────────────────────────
# Use node for JSON parsing — jq is not guaranteed on Windows/Git Bash.
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
# When stop_hook_active is true, Claude is already continuing after a previous
# block. One verification pass is enough — let it stop.
STOP_ACTIVE=$(json_field stop_hook_active)
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

# ─── Gate 2: Were files actually modified? ───────────────────────────────────
# Clean working tree = Claude was answering questions, not coding. Skip.
if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  exit 0
fi

# ─── Gate 3: Does the message signal task completion? ────────────────────────
# Two-pass heuristic:
#   1. Positive signals: phrases Claude uses when declaring work done
#   2. Negative signals: phrases that indicate Claude is still mid-flow
# Task completion = positive present AND negative absent.
LAST_MSG=$(json_field last_assistant_message)

IS_COMPLETION=$(node -e "
  const msg = process.argv[1].toLowerCase();

  // Positive: 'I finished the work' language.
  const done = [
    /\bi'?ve (completed|finished|implemented|applied|updated|fixed|resolved|added|created|refactored|wired)\b/,
    /\bi (completed|finished|implemented|applied|updated|fixed|resolved|added|created|refactored)\b/,
    /\bthat'?s (done|it|everything|all)\b/,
    /\ball (set|done|good|checks pass)\b/,
    /\b(changes?|updates?|fix(?:es)?|implementation) (?:are|is) (ready|done|complete|in place|applied)\b/,
    /\bready for (review|testing|your review)\b/,
    /\bhere'?s (?:a |the )?(?:summary|overview|what (?:i|was) (?:changed|did|updated))\b/,
    /\bwrapped up\b/,
    /\beverything (?:is |should be )(?:set|ready|working|in place)\b/,
  ];

  // Negative: Claude is still working or asking what to do next.
  const ongoing = [
    /\bwould you like\b/,
    /\bshall i\b/,
    /\bshould i\b/,
    /\bdo you want\b/,
    /\bi'?(?:ll| will) (?:now|next|proceed|start|continue|go ahead)\b/,
    /\bworking on\b/,
    /\bin progress\b/,
    /\bstill need to\b/,
    /\blet me (?:continue|start|check|look|investigate|try)\b/,
  ];

  const hasDone = done.some(p => p.test(msg));
  const hasOngoing = ongoing.some(p => p.test(msg));

  // 'let me know if' is a polite closer, not a continuation signal.
  const isCloser = /let me know if/.test(msg);
  const isContinuing = hasOngoing && !isCloser;

  process.stdout.write(String(hasDone && !isContinuing));
" "$LAST_MSG")

if [ "$IS_COMPLETION" != "true" ]; then
  exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
# All gates passed — run verification
# ═══════════════════════════════════════════════════════════════════════════════
echo "" >&2
echo "======================================================" >&2
echo "  Stop hook: task completion detected" >&2
echo "  Running final verification pass..." >&2
echo "======================================================" >&2
echo "" >&2

ISSUES=""
ISSUE_COUNT=0

# Collect changed files once (unstaged + staged, deduplicated).
CHANGED_FILES=$(
  { git diff --name-only HEAD 2>/dev/null; git diff --cached --name-only 2>/dev/null; } \
  | sort -u
)

# -- Check 1: Lint ---------------------------------------------------------
echo "  [1/3] Running lint..." >&2
LINT_OUTPUT=$(pnpm lint 2>&1) || {
  ISSUE_COUNT=$((ISSUE_COUNT + 1))
  # Trim to last 20 lines to keep the block reason readable.
  LINT_TAIL=$(echo "$LINT_OUTPUT" | tail -20)
  ISSUES="${ISSUES}${ISSUE_COUNT}. Lint errors — run \`pnpm lint\` and fix them.\n${LINT_TAIL}\n\n"
}

# -- Check 2: Structural files need doc update (CLAUDE.md Rule 3) ----------
echo "  [2/3] Checking structural files..." >&2
STRUCTURAL=$(echo "$CHANGED_FILES" \
  | grep -E '(CLAUDE\.md|package\.json|tsconfig|\.github/|turbo\.json|agent-docs/)' \
  | head -20 || true)

if [ -n "$STRUCTURAL" ]; then
  ISSUE_COUNT=$((ISSUE_COUNT + 1))
  FORMATTED=$(echo "$STRUCTURAL" | sed 's/^/     - /')
  ISSUES="${ISSUES}${ISSUE_COUNT}. Structural files modified — verify agent-docs match reality (CLAUDE.md Rule 3):\n${FORMATTED}\n\n"
fi

# -- Check 3: Debug artifacts in changed JS/TS files -----------------------
echo "  [3/3] Scanning for debug artifacts..." >&2
DEBUG_HITS=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$f" ] && continue
  case "$f" in
    *.ts|*.tsx|*.js|*.jsx|*.mts|*.mjs) ;;
    *) continue ;;
  esac
  HIT=$(grep -nE '^\s*(console\.(log|debug|info)|debugger)\b' "$f" 2>/dev/null | head -3 || true)
  if [ -n "$HIT" ]; then
    DEBUG_HITS="${DEBUG_HITS}     ${f}:\n$(echo "$HIT" | sed 's/^/       /')\n"
  fi
done <<< "$CHANGED_FILES"

if [ -n "$DEBUG_HITS" ]; then
  ISSUE_COUNT=$((ISSUE_COUNT + 1))
  ISSUES="${ISSUES}${ISSUE_COUNT}. Debug artifacts in changed files — remove before finishing:\n${DEBUG_HITS}\n"
fi

# -- Check 4: Structural drift against session-start snapshot ---------------
SNAPSHOT_FILE=".claude/snapshots/repo-snapshot.json"
if [ -f "$SNAPSHOT_FILE" ]; then
  echo "  [4/4] Checking structural drift against snapshot..." >&2

  DRIFT=$(node -e "
    const fs = require('fs');
    const path = require('path');
    const snapshot = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const issues = [];

    // Check 4a: Package count drift — new or removed packages.
    const snapshotNames = new Set(snapshot.workspace.packages.map(p => p.name));
    const snapshotCount = snapshot.workspace.packageCount;

    // Find current package.json files (same logic as generator).
    function findPkgFiles(dir, depth = 0) {
      if (depth >= 5) return [];
      const results = [];
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (['node_modules', '.git', 'dist', '.harness'].includes(entry.name)) continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) results.push(...findPkgFiles(full, depth + 1));
          else if (entry.name === 'package.json') results.push(full);
        }
      } catch {}
      return results;
    }

    const currentPkgs = findPkgFiles(process.cwd())
      .map(p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')).name; } catch { return null; } })
      .filter(n => n && n !== 'workspace-root');

    const currentNames = new Set(currentPkgs);
    const added = currentPkgs.filter(n => !snapshotNames.has(n));
    const removed = [...snapshotNames].filter(n => !currentNames.has(n));

    if (added.length > 0) {
      issues.push('New packages added since session start: ' + added.join(', ') + '. Verify ARCHITECTURE.md and CLAUDE.md index are updated.');
    }
    if (removed.length > 0) {
      issues.push('Packages removed since session start: ' + removed.join(', ') + '. Verify ARCHITECTURE.md and CLAUDE.md index are updated.');
    }

    // Check 4b: CI workflow count drift.
    const wfDir = path.join(process.cwd(), '.github/workflows');
    try {
      const currentWfs = fs.readdirSync(wfDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      const snapshotWfs = new Set(snapshot.infrastructure.workflows);
      const newWfs = currentWfs.filter(f => !snapshotWfs.has(f));
      const removedWfs = [...snapshotWfs].filter(f => !currentWfs.includes(f));
      if (newWfs.length > 0) {
        issues.push('New CI workflows: ' + newWfs.join(', ') + '. Update agent-docs/references/ci-cd.md.');
      }
      if (removedWfs.length > 0) {
        issues.push('Removed CI workflows: ' + removedWfs.join(', ') + '. Update agent-docs/references/ci-cd.md.');
      }
    } catch {}

    // Check 4c: Hook count drift.
    const hooksDir = path.join(process.cwd(), '.claude/hooks');
    try {
      const currentHooks = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
      const snapshotHookFiles = new Set(snapshot.infrastructure.hookFiles);
      const newHooks = currentHooks.filter(f => !snapshotHookFiles.has(f));
      if (newHooks.length > 0) {
        issues.push('New hooks added: ' + newHooks.join(', ') + '. Verify settings.json is updated.');
      }
    } catch {}

    if (issues.length > 0) {
      process.stdout.write(issues.join('\\n'));
    }
  " "$SNAPSHOT_FILE" 2>/dev/null)

  if [ -n "$DRIFT" ]; then
    ISSUE_COUNT=$((ISSUE_COUNT + 1))
    FORMATTED=$(echo "$DRIFT" | sed 's/^/     - /')
    ISSUES="${ISSUES}${ISSUE_COUNT}. Structural drift detected (vs session-start snapshot):\n${FORMATTED}\n\n"
  fi
else
  echo "  [4/4] No snapshot found — skipping drift check." >&2
fi

# ─── Report ───────────────────────────────────────────────────────────────────
echo "" >&2

if [ "$ISSUE_COUNT" -gt 0 ]; then
  echo "  FAILED: $ISSUE_COUNT issue(s) found. Blocking stop." >&2
  echo "" >&2
  echo -e "$ISSUES" >&2
  echo "======================================================" >&2

  REASON=$(printf "Final verification failed (%d issue(s)):\n%b" "$ISSUE_COUNT" "$ISSUES")
  block_with "$REASON"
fi

echo "  PASSED: All checks passed." >&2
echo "======================================================" >&2
exit 0
