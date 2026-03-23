# Harness V2 — Session 10: Trimming & Alignment Pass

## What happened this session

Continued from session 9 (restored via `tmp/harness-backup-9-session.md`). This session was an iterative trimming and alignment pass across harness-v2 reference docs and skills.

### Changes made

1. **Trimmed `harness-v2/agent-docs/references/msw-tanstack-query.md`** (102→74 lines)
    - Removed: Per-Module Collections (inventory), Shared DB Subpath Exports (inventory), Module-Specific Handlers list (inventory, kept the rule), Seed Data (runtime detail)
    - Kept: Data Flow, Collection Factory, Optimistic Mutations, Host App, Module Registration, Module-Specific Handlers rule, Storybook Setup

2. **Deleted `harness-v2/agent-docs/references/browser-verification.md`** — redundant with `agent-browser.md` (facts) and `harness-reviewer/SKILL.md` (protocol)
    - Moved viewport (1280px) and dark mode toggle to reviewer skill
    - Removed index entry from `harness-v2/CLAUDE.md`

3. **Added coder data layer nudge** to `harness-v2/claude/skills/harness-coder/SKILL.md`
    - One line: "Every module owns its complete data layer — no partial data layers. Follow `agent-docs/references/msw-tanstack-query.md`."
    - Implement section reformatted as a list

4. **Trimmed `harness-v2/agent-docs/references/ci-cd.md`** (85→43 lines)
    - Removed: Affected Storybook detection, Code review tool restrictions, Smoke tests detail, Turbo cache strategy
    - Trimmed Claude workflow to two-mode summary
    - Kept: Workflow table, Claude two modes, Chromatic label gate, Audit agent-docs flow, Netlify deploys

5. **Aligned ARCHITECTURE.md with domains.md mental models**
    - "Management features" → "Admin and configuration"
    - "Daily watering view" → "Daily care dashboard"
    - "Domain isolation" section renamed to "Domain Storybooks" (reflects actual content)
    - "Two domain areas" → "Two domains"

6. **Fixed stale reference in ADR-0003** — pointed to v1 ADLC skill path, updated to `agent-docs/references/msw-tanstack-query.md`

7. **Simplified domain-mapper output template** (4 sections → 2)
    - Removed: Decisions table (derivable from mapping), Module Scope Updates (docs-writer's concern)
    - Kept: Analysis Summary, Mapping table
    - Renamed "Feature-to-Module Mapping" → "Mapping", column "PRD Concern" → "Feature"
    - Added generic example (billing/analytics export scenario)

8. **Simplified planner durable decisions**
    - Recognized that Domains/Modules/Shared packages come from domain mapping, API namespaces and routes are conventions derived from placement
    - Planner's own decisions reduced to: Data model shape, Collection strategy (as a list, not a table)
    - Removed Placement section from plan-header template (redundant with domain-mapping.md)
    - Plan header now: Objective, Data Model, Collection Strategy
    - Removed "Modules Affected" from slice template (redundant — scope items now name target module)
    - Updated scope template: `{Target module or package}: {logical unit of work}`

9. **Updated planner references**
    - "Feature-to-Module Mapping" → "Mapping table"
    - "module granularity criteria and package boundaries" → removed (already in domain mapping)
    - Domain mapper Load context reformatted as list

10. **Renamed harness-docs-writer → harness-documenter**
    - Renamed directory, frontmatter name, and coordinator spawn reference

## Current state of harness-v2 skills

| Skill                 | Status                                                          |
| --------------------- | --------------------------------------------------------------- |
| harness-coordinator   | Updated (documenter reference)                                  |
| harness-domain-mapper | Simplified template, added example                              |
| harness-planner       | Simplified decisions, updated templates                         |
| harness-architect     | No changes this session (was already aligned)                   |
| harness-coder         | Added data layer nudge, list formatting                         |
| harness-reviewer      | Added viewport + dark mode from deleted browser-verification.md |
| harness-documenter    | Renamed from harness-docs-writer                                |
| harness-slice-loop    | Not modified                                                    |

## Current state of harness-v2 reference docs

| Doc                     | Changes                                 |
| ----------------------- | --------------------------------------- |
| msw-tanstack-query.md   | Trimmed inventories                     |
| ci-cd.md                | Trimmed implementation details          |
| browser-verification.md | DELETED                                 |
| domains.md              | No changes this session                 |
| storybook.md            | No changes this session (already clean) |
| ARCHITECTURE.md         | Mental models aligned, section renamed  |
| ADR-0003                | Fixed stale reference                   |

## Pending / Deferred

- **Documenter skill** — still references "Module Scope Updates" section that was removed from domain-mapper template. The documenter's process step 1 says: `Read .harness/domain-mapping.md — specifically the "Module Scope Updates" section`. This is now stale — the mapping no longer has that section. The documenter should derive scope updates from the Mapping table + implementation reality.
- **Test the harness** — Run against real PRDs to validate
- **Harness-v2 CLAUDE.md** — May need updating for removed browser-verification.md reference (done) and new skill names

## Key decisions made

- Reference docs should contain rules and patterns, not inventories of existing instances (those drift)
- Domain-mapping output simplified to Analysis Summary + Mapping table — consumers derive what they need
- Placement decisions live in domain-mapping.md only — no duplication in plan-header
- Planner resolves only data model and collection strategy — everything else comes from mapper or conventions
- Slice scope items name their target module/package explicitly
- Browser verification protocol belongs in the reviewer skill, not a reference doc
- ARCHITECTURE.md mental models must match domains.md exactly
