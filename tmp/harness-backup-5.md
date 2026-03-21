# Harness V2 — Trim & Simplify Session (Post-Compaction #5)

## What happened this session

Read `tmp/harness-backup-4.md` for the skill rewrite session context. This session **aggressively trimmed all three skills** and eliminated two reference files, following the style of [mattpocock's prd-to-plan skill](https://raw.githubusercontent.com/mattpocock/skills/refs/heads/main/prd-to-plan/SKILL.md) as inspiration.

## Philosophy shift

The core insight from the user: the skills were still too verbose, repeated content from reference files, included unnecessary justifications, and prescribed things that are either the coder's job or already handled by the harness hooks. The model is capable — trust it.

Key principles applied:

- Remove justification text ("Leave implementation to the coder" — the agent won't start implementing)
- Remove rules already in reference docs the skill reads (domains.md, ARCHITECTURE.md)
- Remove prescriptive details that are the coder's job (Storybook stories, dark mode criteria, grid alignment)
- Remove hard numeric constraints (3-7 slices) — the model knows how to slice
- Split content by audience — planner needs writing rules, verifier needs checking rules
- Use generic examples, not domain-specific ones
- Skills should be self-contained — no external format files

## Changes made

### harness-plan/SKILL.md (135 lines, down from 232)

- **Deleted `plan-format.md`** — folded templates directly into the skill
- Removed: "Leave implementation to the coder", "they cross-cut every slice", Storybook story prescriptions, dark mode prescriptions, loose coupling section, checklist, verbose Phase 1 commentary, "the CLAUDE.md index describes each file"
- Removed: 3 redundant constraints (already in domains.md)
- Replaced with single line: "Follow the module granularity criteria and package boundaries defined in `agent-docs/references/domains.md`."
- Restored "vertical tracer bullets" and "not a horizontal slice of one layer" — these are precise terminology, not filler
- Removed "3-7 slices" hard constraint
- Moved acceptance criteria definitions into the slice template (Output Format section)
- Acceptance criteria: two tags defined with generic examples, mutation companion rule inline

### harness-coordinator/SKILL.md (59 lines, down from 72)

- Removed: "all code changes go through spawned agents", "(preserves context)", "(stateless)"
- Kept the behavioral instructions without the justifications

### harness-architect/SKILL.md (77 lines, down from 100)

- Removed: "Absence of `.harness/architect-revision.md` means approval" (coordinator already knows this)
- Removed: "evaluate against ARCHITECTURE.md and domains.md, not the file tree" (justification)
- Removed: acceptance-criteria.md from inputs (model can evaluate criteria quality without a reference doc)
- Replaced domain-specific example (HouseholdMember) with generic example (Order/checkout/account-history)

### harness-verifier/SKILL.md (NEW — 23 lines skeleton)

- Created skeleton with verification protocol split from acceptance-criteria.md
- `[visual]` — navigate, screenshot, assess
- `[interactive]` — screenshot before, perform action, screenshot after, assess
- Output to `.harness/completed/{NN}/verification.md`

### Deleted files

1. `agent-docs/references/plan-format.md` — content folded into plan skill
2. `agent-docs/references/acceptance-criteria.md` — split between plan skill (writing rules) and verifier skill (checking protocol)

### Updated references

- `harness-v2/CLAUDE.md` — removed plan-format.md and acceptance-criteria.md from index

## Files modified/created this session

1. `harness-v2/claude/skills/harness-plan/SKILL.md` — trimmed + self-contained
2. `harness-v2/claude/skills/harness-coordinator/SKILL.md` — trimmed
3. `harness-v2/claude/skills/harness-architect/SKILL.md` — trimmed + generic examples
4. `harness-v2/claude/skills/harness-verifier/SKILL.md` — NEW skeleton
5. `harness-v2/CLAUDE.md` — removed dead references
6. `harness-v2/agent-docs/references/plan-format.md` — DELETED
7. `harness-v2/agent-docs/references/acceptance-criteria.md` — DELETED

## Line counts

| File                         | Start of session | End of session |
| ---------------------------- | ---------------- | -------------- |
| harness-plan/SKILL.md        | 232              | 135            |
| harness-coordinator/SKILL.md | 72               | 59             |
| harness-architect/SKILL.md   | 100              | 77             |
| harness-verifier/SKILL.md    | —                | 23             |
| plan-format.md               | 128              | deleted        |
| acceptance-criteria.md       | 51               | deleted        |

## User feedback patterns

- "Why is it necessary to specify X?" → If the agent wouldn't do the wrong thing without the instruction, remove it
- "Aren't these instructions already in domains.md?" → Don't repeat rules from docs the skill already reads
- "Would it define Storybook stories? It's the coder job" → Plan focuses on what, not how
- "Is this really necessary?" → If the harness/hooks/coordinator already handles it, remove it
- "Use generic examples" → Don't tie skills to this repo's domain
- "plan-format.md should not exist, all this should be directly in the plan skill" → Skills should be self-contained
- Disagreed on one point: architect catching wrong entity placement IS valuable even though hooks block the import — catching at plan time saves coder iterations

## Design documents

- `tmp/harness-design.md` — Original v2 design (299 lines)
- `tmp/harness-backup-2.md` — Full creation context (51 files)
- `tmp/harness-backup-3.md` — Review & fix session (20 fixes)
- `tmp/harness-backup-4.md` — Philosophy shift + skill rewrite
- `tmp/harness-backup-5.md` — This file (trim & simplify session)
