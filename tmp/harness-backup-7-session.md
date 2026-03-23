# Harness V2 — Session 7: Domain Mapper, Module Placement, Coder/Planner Refinements

## What happened this session

Cleaned up the coder and planner skill Load context steps, removed visual separators across all skills, explored the domain/module naming and placement problem in depth, conducted extensive external research on DDD + AI agents, and designed a new `harness-domain-mapper` skill that runs before the plan loop.

## Changes Made

### 1. harness-coder — Load context cleanup

- Reformatted Load context as a bullet list (was dense prose)
- Explicit always-read references: `domains.md`, `msw-tanstack-query.md`, `storybook.md`, `tailwind-postcss.md`, `agent-browser.md`
- Conditional references replaced with: "Scan `agent-docs/references/` for any additional docs relevant to the slice"
- Conditional shadcn/color-mode references now have concrete triggers: "When the slice uses shadcn components", "When it involves dark mode"
- Conditional skills reworded: "Load if relevant to the slice: `shadcn`, `workleap-web-configs`, `workleap-logging`"
- Browser reference updated: "Use the dev servers defined in `agent-docs/references/agent-browser.md`"

### 2. harness-planner — Load context cleanup

- Reformatted as bullet list
- Replaced vague "Read additional reference docs when the feature touches their domain" with "Scan `agent-docs/references/` for any additional docs relevant to the feature"

### 3. All harness skills — Removed `---` separators

- Removed non-frontmatter `---` horizontal rules from: harness-coder, harness-planner (2 instances), harness-architect
- The `##` headings provide sufficient separation

## Design Discussions

### Domain/Module naming and placement problem

**Problem identified:** AI agents make poor module placement decisions because:

1. Module names are too narrow (UI artifacts like "landing-page" instead of domain concepts)
2. The agent reads the name and derives scope from it — narrow name → narrow interpretation → new module for everything
3. Even with good names, the agent can't reason about extending/repurposing because it lacks module intent context
4. This applies broadly, not just to new domains — it affects every feature planning decision

**Key insight from user:** This harness is a POC for enterprise-scale applications, not just the plant app. The DDD techniques need to scale.

### External research conducted

Spawned 8 subagents searching for DDD + AI agent resources. Key findings:

- **No existing tool solves autonomous DDD module placement** for AI coding agents
- **Consensus:** "The agent should not decide the architecture — it should follow it"
- **Rod Johnson's DICE** (Domain-Integrated Context Engineering): domain models should programmatically fill agent context
- **Nick Tune's Bounded Context Design Heuristics**: practical decision framework
- **DDD Crew's Bounded Context Canvas**: structured approach to documenting bounded contexts
- **Codified Context paper** (arxiv, Feb 2026): three-tier architecture (hot memory / domain agents / cold knowledge)
- **ETH Zurich caution**: over-documentation can hurt agent performance
- **Existing DDD skills**: NeoLabHQ/context-engineering-kit, CodeMachine0121/Claude-Code-Skill-DDD — all generic, none solve module placement for specific codebases
- **Context Mapper**: machine-readable bounded context DSL (CML), closest to "machine-readable DDD"

### New skill design: harness-domain-mapper

**Coordinator flow changes:** `domain mapper → plan loop (planner ↔ architect) → slice loop`

**Frontend-adapted DDD analysis steps:**

1. **Scan existing domains, modules, shared packages** — read actual code, not just names
2. **Language Analysis** (Evans, Ubiquitous Language) — map feature entities against existing module language
3. **UI State Cohesion** (frontend adaptation of Vernon's Aggregate Design) — shared mutation workflows, forms, optimistic updates, loading/error boundaries → same module
4. **Route & Navigation Analysis** — extends existing route tree or new navigation paradigm?
5. **Strategic Classification** (Evans, Core/Supporting/Generic) — Core UX → domain module, Supporting → extend if possible, Generic → @packages/\*
6. **Decision Heuristics** (Nick Tune, CCP) — default: extend existing module, new module requires justification

**Output:** Two files in `.harness/`:

- `domain-mapping.md` — for planner and architect (includes Feature-to-Module Mapping table)
- `domain-mapping.json` — for guardrail hooks

**Feature-to-Module Mapping** (required section connecting PRD concerns to modules):

```markdown
| PRD Concern             | Target             | Rationale                            |
| ----------------------- | ------------------ | ------------------------------------ |
| Plant sharing CRUD      | management/plants  | Same entity, same mutation workflows |
| Shared plants dashboard | today/landing-page | Extends existing daily care view     |
```

### Planner durable decisions — made generic

Replaced prescriptive decisions with generic ones to support create/extend/merge/rename/delete:

**Before:**
| Domain placement | Existing domain or new domain |
| Entity placement | Shared package vs module-local |
| Module boundary | New module vs extend existing |

**After:**
| Domains | Which domains are affected and how |
| Modules | Which modules are affected and how |
| Shared packages | Which `@packages/*` are affected and how |

**Plan-header template:** "New domains" → "Domains", "New modules" → "Modules", "New shared packages" → "Shared packages"

### domains.md planned improvements (not yet implemented)

1. Add module scope descriptions (Evans, Blue Book Ch. 5 — "modules tell the story of the system")
2. Flip module default: extending is the default, new module requires justification (YAGNI + CCP)
3. Doc phase updates scope descriptions after each feature (Living Documentation, Martraire)

## Key References Identified

- Evans, Eric. _Domain-Driven Design_ (Blue Book), Ch. 5 — Modules
- Vernon, Vaughn. _Implementing Domain-Driven Design_ (Red Book), Ch. 10 — Aggregates (adapted as UI State Cohesion for frontend)
- Martin, Robert C. — Common Closure Principle (CCP), YAGNI
- Martraire, Cyrille. _Living Documentation_
- Tune, Nick. Bounded Context Design Heuristics
- DDD Crew. Bounded Context Canvas
- Johnson, Rod. DICE (Domain-Integrated Context Engineering)
- "Codified Context: Infrastructure for AI Agents in a Complex Codebase" (arxiv, Feb 2026)

## Files Modified

- `harness-v2/claude/skills/harness-coder/SKILL.md`
- `harness-v2/claude/skills/harness-planner/SKILL.md`
- `harness-v2/claude/skills/harness-architect/SKILL.md`

## Files Created

- `tmp/harness-backup-7-module-placement-plan.md` — initial module placement improvement plan
- `tmp/harness-backup-7-session.md` — this file

## Open Items

- harness-domain-mapper skill needs to be written
- domains.md needs module scope descriptions added
- domains.md needs "extend by default" framing added
- Planner durable decisions table needs updating (generic Domains/Modules/Shared packages)
- Plan-header template needs updating
- Coordinator flow needs updating (domain mapper before plan loop)
- Doc phase needs updating (maintain module scope descriptions)
- domain-mapping.json schema needs finalizing for hook consumption
- Architect duplicate step numbering (two "### 2.") still unfixed from session 6
