# Harness V2 — Skill Rewrite Session (Post-Compaction #4)

## What happened this session

Read `tmp/harness-backup-3.md` for the review/fix session context. This session **rewrote all three skills** to shift from prescriptive implementation specs to high-level architectural guidance + acceptance criteria contracts.

## Philosophy shift

The core insight: the plan was doing the coder's job. It specified file paths, prop interfaces, JSX structure, and reference pointers — all implementation details that the coder should derive from ARCHITECTURE.md and the codebase. The plan should focus on:

1. **Durable architectural decisions** (module boundaries, entity placement, data model)
2. **Slice boundaries** (vertical tracer bullets with dependency ordering)
3. **Acceptance criteria** (the verification contract — what SUCCESS looks like)
4. **Loose coupling** (module independence, shared packages, handler ownership)

The harness hooks handle static quality (format, lint, typecheck, import guard, supervision). The plan doesn't need to prescribe or check these.

## Changes made

### harness-plan/SKILL.md (232 lines, down from 302)

Major changes:

- **Removed "File Changes" section** from slice template — replaced with "Scope" section that describes WHAT at module/component level
- **Added explicit prohibition** against file paths, function names, prop interfaces in scope (with Bad/Good example)
- **Removed "File Change Description Rules"** section entirely (was about coder-level specifics like prop interfaces)
- **Removed "Module Import Guard Awareness"** as standalone section (covered by Phase 3 constraints + Loose Coupling)
- **Removed prescriptive reference file loading** (Phase 1 no longer lists 10 specific files — reads ARCHITECTURE.md + domain-relevant docs)
- **Added "Modules Affected"** section to slice template
- **Strengthened Phase 1** with prohibition framing and consequence
- **Fixed off-by-one**: "more than 8" → "more than 7" to match 3-7 range
- **Fixed checklist contradiction**: removed "except pure data slices" exception (Phase 4 already prohibits pure internal slices)
- **Kept and strengthened**: acceptance criteria section (specificity, mutation companions, Storybook, dark mode, table alignment)

### harness-coordinator/SKILL.md (73 lines, down from 131)

Major changes:

- **Removed explicit static checks** (Step 4b `pnpm typecheck && pnpm lint`) — hooks handle this
- **Clarified "resume coders, re-spawn planners"** in Hard Constraints (was ambiguous)
- **Refined resume heuristic** in Step 1: checks for `completed/` subdirectories to distinguish "plan exists but unapproved" from "implementation in progress"
- **Added cleanup instruction** on "start fresh"
- **Added prompt structure guidance** for subagent spawns (mode, revision-note parameters)
- **Added explicit success transition** in Step 4 ("the slice is complete — proceed to next")
- **Added re-verification** after planner revision re-spawn
- **Clarified "Never edit source files"** → "Never edit application or library source files" (`.harness/` writes are OK)
- **Port cleanup** clarified as "safety net"

### harness-architect/SKILL.md (99 lines, down from 101)

Changes:

- **Added `acceptance-criteria.md`** to inputs list (item 7) — needed to evaluate criteria quality
- **Clarified "Weak acceptance criteria"** threshold: "systemic across 2+ slices" aligns with the 2-slice structural threshold
- **Prohibition framing** on "Evaluating proposed changes": "Never reject solely because it doesn't exist on disk"

### agent-docs/references/plan-format.md (128 lines, down from 142)

Rewritten to match the new Scope-based slice format:

- Slice template now uses `## Scope` instead of `## File Changes`
- Added `## Modules Affected` section
- Removed per-file instructions, reference pointers, prop interface examples
- Removed "Supervision-safe granularity" section (coder-level concern)
- Updated size budgets to line counts (40 lines header, 40-80 lines per slice)
- Added slice format rule: "no file paths, prop interfaces, or function names"

## Files modified this session

4 files modified:

1. `harness-v2/claude/skills/harness-plan/SKILL.md` — full rewrite
2. `harness-v2/claude/skills/harness-coordinator/SKILL.md` — full rewrite
3. `harness-v2/claude/skills/harness-architect/SKILL.md` — 3 targeted edits
4. `harness-v2/agent-docs/references/plan-format.md` — rewritten to match new format

## Review process

4 parallel review subagents were spawned:

1. Plan skill reviewer — found: duplication with reference docs, missing prohibition for implementation details, checklist contradiction, off-by-one
2. Coordinator reviewer — found: missing coder/verifier skills, ambiguous re-spawn vs resume, resume heuristic gaps, missing cleanup
3. Architect reviewer — found: missing acceptance-criteria.md input, weak-criteria threshold ambiguity, advisory framing
4. Cross-skill consistency checker — found: plan-format.md contradiction, re-spawn vs resume ambiguity, missing prompt structure for subagent spawns

All high/critical issues were addressed. Known remaining items:

- `harness-coder` and `harness-verifier` skills don't exist yet (user said coder is "phase 2")
- Loose Coupling section in plan skill partially overlaps Phase 3 constraints (kept for emphasis since it's a different audience — the checklist reader vs the decision maker)

## Known remaining gaps (cumulative from backup-2 and backup-3)

1. **Missing skills**: `harness-coder` and `harness-verifier` SKILL.md files (user acknowledged as phase 2)
2. **Regression across slices**: Cross-slice visual/interactive regressions still only caught at final verification
3. **Feature size threshold**: No "too small to plan" guidance
4. **Documentation phase**: V1 had doc skill, V2 drops it
5. **Missing skills from v1**: simplify, document, CI monitor, scaffold (these are separate from harness)
6. **No example complete plan**: A real header.md + 2-3 slices as reference would calibrate the planner

## Design documents

- `tmp/harness-design.md` — Original v2 design (299 lines)
- `tmp/harness-backup-2.md` — Full creation context (51 files)
- `tmp/harness-backup-3.md` — Review & fix session (20 fixes)
- `tmp/harness-backup-4.md` — This file (philosophy shift + skill rewrite)
