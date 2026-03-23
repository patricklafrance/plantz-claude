# Harness V2 — Session 9: Domain Mapper Implementation + Refinements

## What happened this session

1. **Executed the domain mapper implementation plan** from session 8 — created/modified 6 files.

2. **Fixed wrong file target** — initially modified `agent-docs/references/domains.md` (root) instead of `harness-v2/agent-docs/references/domains.md`. Reverted root file, applied changes to correct harness-v2 file.

3. **Renamed documenter skill** twice: `harness-documenter` → `harness-documentation-writer` → `harness-docs-writer`. Updated directory, frontmatter, and coordinator spawn call.

4. **Trimmed domains.md** iteratively:
    - Removed Domain Granularity section (redundant with domain mapper's bounded context handling)
    - Removed Module Granularity section (CCP, extend-by-default now in mapper)
    - Removed Adding to a Domain section (convenience pointer, not load-bearing)
    - Moved MSW Handler Ownership to `msw-tanstack-query.md` (data layer concern, not domain organization)
    - `domains.md` is now: Decision Tree + Domains table (with Scope column) + Module Isolation

5. **Made XML template tags consistent** across all skills:
    - domain-mapper: `<heuristics>`, `<domain-mapping-template>`
    - planner: `<plan-header-template>`, `<slice-template>`
    - architect: `<revision-template>`, `<revision-example>`

6. **Trimmed domain-mapper skill** to match Matt Pocock reference style:
    - Removed meta commentary ("The skill is generic...")
    - Removed justification paragraphs (let concepts speak for themselves)
    - Removed References section (inline citations in heuristics table suffice)
    - Tightened from ~100 lines to ~80

7. **Moved scaffold section** from coder skill process step to conditional loads in Load context

8. **Discussed but deferred**: adding data layer completeness nudge to coder skill ("Every module owns its complete data layer — MSW handlers, collections, queries")

## Current state of files

### Created

- `harness-v2/claude/skills/harness-domain-mapper/SKILL.md` — Domain mapper with 5 ranked heuristics
- `harness-v2/claude/skills/harness-docs-writer/SKILL.md` — Doc phase skeleton

### Modified

- `harness-v2/agent-docs/references/domains.md` — Added Scope column, trimmed to Decision Tree + Domains table + Module Isolation
- `harness-v2/agent-docs/references/msw-tanstack-query.md` — Added MSW Handler Ownership rule (moved from domains.md)
- `harness-v2/claude/skills/harness-planner/SKILL.md` — Generic decisions, reads domain-mapping.md, XML template tags
- `harness-v2/claude/skills/harness-architect/SKILL.md` — Reads domain-mapping.md, domain mapping contradiction check, fixed step numbering, XML template tags
- `harness-v2/claude/skills/harness-coordinator/SKILL.md` — Added domain mapping step (2) and doc phase step (6), 7-step flow
- `harness-v2/claude/skills/harness-coder/SKILL.md` — Scaffold skills moved to conditional loads

### Not modified (root repo)

- `agent-docs/references/domains.md` — reverted to original (was modified by mistake)

## Pending / Deferred

- **Coder data layer nudge** — User wants to add a framing principle to coder skill about module-scoped data layers (MSW handlers + collections + queries). Deferred for now.
- **Harness-v2 CLAUDE.md** — May need updating to reflect new skills and flow changes.
- **Test the harness** — Run the domain mapper against real PRDs to validate the trimmed skill works correctly.

## Key decisions made

- Skills should use well-known concepts/references (Evans, Martin, Vernon, YAGNI, CCP) rather than custom instructions
- XML template tags should be consistent and semantically named across all skills
- Domain organization docs should only contain domain organization concerns — data layer rules belong in data layer docs
- Matt Pocock's prd-to-plan SKILL.md is the style reference for harness skills
