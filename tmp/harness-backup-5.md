# Harness V2 — Session 5: Skill Trimming & Restructuring

## What happened this session

All 3 original skills were rewritten to be leaner, 2 skills were renamed, 1 new skill skeleton was added, and both loop skills were simplified. The key theme was removing duplication (content already covered in referenced docs) and adopting consistent patterns across all skills.

## Changes Made

### 1. harness-planner (renamed from harness-plan) — 232 to ~140 lines

- Removed duplicated templates (were already in plan-format.md)
- Removed duplicated acceptance criteria rules (were already in acceptance-criteria.md)
- Removed "Loose Coupling Principles" section (already in ARCHITECTURE.md + hooks)
- Removed "Checklist Before Writing Output" (redundant with architect gate)
- Removed Storybook story prescriptions (coder's job)
- Simplified verbose phrases throughout
- Added inline output format templates directly in skill

### 2. harness-coordinator — trimmed, restructured

- Removed `completed/` folder structure
- Verification results now use fixed path `.harness/verification-results.md`
- Resume detection checks for `verification-results.md` instead of `completed/` subdirectories
- Failures printed by the failing skill, not tracked via files
- References updated for all renames

### 3. harness-architect — trimmed

- Now reports ALL problems at once (was one-at-a-time)
- Removed acceptance-criteria.md from inputs (not needed)
- Added `effort: high` frontmatter

### 4. harness-reviewer (renamed from harness-verifier)

- Takes `slice-path` as input
- Reads `agent-docs/references/agent-browser.md` (not browser-verification.md)
- Writes to fixed path `.harness/verification-results.md`
- Kills processes on ports 8080 and 6006 before exiting
- Added `effort: high` frontmatter

### 5. harness-coder (NEW skeleton)

- Takes `slice-path`, `mode` (draft/revision), `verification-results`
- Reads `.harness/plan-header.md` on its own
- Kills processes on ports 8080 and 6006 before exiting
- Added `effort: high` frontmatter

### 6. harness-plan-loop — simplified

- Process is a flat numbered list (6 steps)
- Max 5 iterations (was 3)
- All agents spawn fresh (no resume)
- Step 6 loops back to step 3 (was step 2, now renumbered after removing verify step)

### 7. harness-slice-loop — simplified

- Process is a flat numbered list (6 steps)
- Max 5 fix attempts (was 3)
- Always spawns reviewer after coder (no conditional)
- Coder gets `mode: draft` initially, `mode: revision` with `verification-results` on fix attempts
- On pass: renames `verification-results.md` to `verification-{slice-filename}.md`
- On fail: reads and saves content, deletes file, then resumes coder
- Port cleanup moved to coder and reviewer skills

### 8. plan-format.md — minor updates

- Removed Storybook mention from scope template
- Slimmed slice format rules (point to acceptance-criteria.md)

### 9. CLAUDE.md (harness-v2)

- Updated `.harness/` working directory description (no `completed/`, uses `verification-results.md`)
- `header.md` renamed to `plan-header.md`

## Key Design Decisions

- **Report all problems** — architect reports everything at once, planner fixes in one pass
- **Fixed verification path** — `.harness/verification-results.md` is predictable for SubagentStop hooks
- **Failures print and stop** — failing skill reports its own failure, no failure files
- **Leaf skills clean up** — coder and reviewer kill their own processes (ports 8080/6006)
- **Consistent loop pattern** — both plan-loop and slice-loop use flat numbered lists with explicit loop-back
- **Mode/results pattern** — both planner and coder follow same pattern: `mode: draft` initially, `mode: revision` with rejection/failure content on retry
- **5 iteration cap** — both loops allow 5 attempts

## Files Modified

- `harness-v2/claude/skills/harness-planner/SKILL.md` (renamed from harness-plan)
- `harness-v2/claude/skills/harness-coordinator/SKILL.md`
- `harness-v2/claude/skills/harness-architect/SKILL.md`
- `harness-v2/claude/skills/harness-reviewer/SKILL.md` (renamed from harness-verifier)
- `harness-v2/claude/skills/harness-coder/SKILL.md` (NEW)
- `harness-v2/claude/skills/harness-plan-loop/SKILL.md`
- `harness-v2/claude/skills/harness-slice-loop/SKILL.md`
- `harness-v2/agent-docs/references/plan-format.md`
- `harness-v2/CLAUDE.md`
