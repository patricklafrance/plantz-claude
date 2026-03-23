# Harness V2 — Session 11: Skill Polish & Reviewer Build-Out

## What happened this session

Continued from session 10 (restored via `tmp/harness-backup-10-session.md`). This session focused on polishing all harness-v2 skills for consistency and building out the harness-reviewer skill.

### Changes made

1. **Architect skill — structural soundness criteria updated**
    - Removed "API namespace collision" — redundant now that namespaces follow from placement conventions
    - Fixed stale example: `Update header "Shared pkg changes."` → `Update Data Model in plan-header to reflect shared package placement.`
    - Load context reformatted as list (harness artifacts + architecture docs)
    - Pass/fail gate simplified: "would require changes to 2+ slices or header decisions" → "would cascade across slices"
    - Report section and guardrail lines converted to lists

2. **Coordinator skill — formatting and context**
    - Sections 2–7 converted to lists
    - Added context line: "Orchestrate end-to-end feature development from domain mapping through documentation."

3. **All harness skill descriptions trimmed**
    - Removed "Use when asked to..." trigger phrases from all 9 harness skills (coordinator, domain-mapper, planner, architect, plan-loop, coder, reviewer, slice-loop, documenter)
    - Each description is now a single sentence — these skills are spawned explicitly via `subagent_type`, never discovered

4. **Coder skill — scaffold nudge**
    - Added: "When the slice scope requires a new module, domain, or storybook, use the corresponding `scaffold-*` skill."
    - Removed redundant intro line "Every React component gets matching Storybook stories." (already in step 2)

5. **Coder skill — implementation notes**
    - Added step 3: append to `.harness/implementation-notes.md` (create if doesn't exist)
    - One section per slice — module/package-level changes for the documenter

6. **Coder skill — sanity issue handling**
    - Revision mode explanation updated: report may include "Sanity Issues" section — host app integration problems found outside Storybook stories

7. **Reviewer skill — full build-out** (was skeleton)
    - **Process:** Load context → Verify acceptance criteria via Storybook → Sanity check host app → Write results
    - Acceptance criteria verified through Storybook stories (coder creates one per criterion)
    - Sanity check on host app — navigate affected pages, look for obvious breakage
    - Output template: three sections — Passed, Failed, Sanity Issues
    - Every criterion must appear in exactly one section (Passed or Failed)
    - Dev servers started per-phase (not a dedicated step), each referencing `agent-docs/references/agent-browser.md`
    - Removed clean up section (redundant with agent-browser skill and harness hooks)
    - Removed redundant explanations ("slice-loop consumes...", "slice-loop relies on completeness...")

8. **Slice-loop skill — polish**
    - Replaced verbose intro with: "Orchestrate the code → verify cycle for a single slice."
    - Pass condition updated: "All criteria pass and no sanity issues"

9. **Plan-loop skill — polish**
    - Replaced verbose intro with: "Orchestrate the plan → architect review cycle."

10. **Domain-mapper skill — user edited**
    - User simplified intro line to: "Decide where a feature belongs before planning begins."
    - Removed "Ground placement decisions in codebase evidence, not module names."

## Current state of harness-v2 skills

| Skill                 | Status                                                     |
| --------------------- | ---------------------------------------------------------- |
| harness-coordinator   | Polished — lists, context line, trimmed description        |
| harness-domain-mapper | User-edited intro, trimmed description                     |
| harness-planner       | Trimmed description (was already simplified in session 10) |
| harness-architect     | Criteria updated, lists, simplified gate, trimmed desc     |
| harness-plan-loop     | Polished intro, trimmed description                        |
| harness-coder         | Scaffold nudge, impl notes, sanity handling, trimmed desc  |
| harness-reviewer      | Full build-out from skeleton                               |
| harness-slice-loop    | Polished intro, sanity condition, trimmed description      |
| harness-documenter    | Trimmed description                                        |

## Pending / Deferred

- **Documenter skill stale reference** — step 1 still says `Read .harness/domain-mapping.md — specifically the "Module Scope Updates" section`. That section was removed from domain-mapper template in session 10. Should derive scope updates from the Mapping table + implementation-notes.md.
- **Documenter should consume implementation-notes.md** — new artifact from coder, not yet referenced in documenter skill
- **Test the harness** — run against real PRDs to validate
- **Harness-v2 CLAUDE.md** — may need updating for new artifacts (implementation-notes.md, verification-results template sections)

## Key decisions made

- Harness skills don't need trigger phrases in descriptions — they're spawned explicitly, never discovered
- Reviewer verifies acceptance criteria via Storybook stories, not directly in the host app
- Host app verification is a sanity check — catches integration breakage outside of stories
- Sanity issues get their own section in verification-results.md (separate from criteria pass/fail)
- Dev servers started per-phase, not in a dedicated step
- Orchestrator skills (coordinator, plan-loop, slice-loop) get a one-line context before the "never edit" guardrail
- Clean up (killing dev servers) handled by agent-browser skill and hooks, not duplicated in reviewer
- API namespace collision removed from architect criteria (redundant with placement checks)
