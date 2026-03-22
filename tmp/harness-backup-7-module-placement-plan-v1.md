# Harness V2 — Module Placement Improvement Plan

## Problem

AI agents make poor module placement decisions because they rely on module names (which are often too narrow or UI-artifact-oriented) rather than understanding module intent and scope. This leads to proliferation of one-feature modules. The agent can't reason about extending, merging, or repurposing existing modules — it defaults to creating new ones.

## Research Context

- No existing tool or framework solves autonomous DDD module placement for AI agents
- Consensus: "The agent should not decide the architecture — it should follow it" (Codified Context paper, DICE, Addy Osmani)
- Rod Johnson's DICE: domain models should programmatically fill the agent's context — don't rely on the agent to infer domain structure
- Evans (Blue Book, Ch. 5): "Choose modules that tell the story of the system"
- Living Documentation (Cyrille Martraire): documentation evolves with the code, not separately from it

## Plan — 5 Changes Across 4 Files

### 1. `domains.md` — Module scope descriptions

Add a `Scope` column to the domains table. Each module gets a one-line description of its intended domain scope (not its current features).

Reference: Evans (Blue Book, Ch. 5) — modules should reflect domain concepts, not UI artifacts.

### 2. `domains.md` — Flip the module default

Add to Module Granularity: extending an existing module is the default. A new module requires explicit justification of why no existing module's scope encompasses the feature.

Reference: YAGNI — don't create organizational structures you don't need yet. CCP (already there) provides the test.

### 3. Planner skill — Read existing modules before deciding

In step 2 (Analyze requirements), before resolving the "Modules" decision, the planner must explore existing modules in the affected domain — read their components, routes, and pages. Decide based on what modules actually contain, not just their names.

Reference: Domain Discovery (DDD practice) — understand the existing model before proposing changes.

### 4. Planner skill — Generic durable decisions for domains/modules/packages

Replace prescriptive decisions ("Domain placement", "Module boundary", "Entity placement") with generic ones that let the agent determine the best course of action (create, extend, merge, rename, delete):

**Durable decisions table:**

| Decision            | What to decide                             |
| ------------------- | ------------------------------------------ |
| Domains             | Which domains are affected and how         |
| Modules             | Which modules are affected and how         |
| Shared packages     | Which `@packages/*` are affected and how   |
| API namespace       | `/api/<domain>/<entity>` per module        |
| Data model shape    | Entity definitions — field names and types |
| Collection strategy | TanStack DB collection vs fetch+useState   |
| Route structure     | Paths registered with Squide               |

**Plan-header template Decisions table:**

| Decision        | Choice |
| --------------- | ------ |
| Domains         | ...    |
| Modules         | ...    |
| Shared packages | ...    |
| API namespaces  | ...    |
| Routes          | ...    |
| Collections     | ...    |

### 5. Doc phase — Update module descriptions after each feature

After implementation, the doc phase updates module scope descriptions in `domains.md` to reflect what modules now encompass. This builds domain knowledge incrementally across features.

Reference: Living Documentation (Cyrille Martraire) — documentation evolves with the code, not separately from it.

## Not Changing

- **Architect skill** — already checks for "wrong module boundary." With richer module descriptions in `domains.md`, this check naturally becomes more effective.
- **No scaffold hook** — the plan-loop (planner + architect) is the right place to catch module placement issues, not implementation time.

## Key References

- Evans, Eric. _Domain-Driven Design_ (Blue Book), Ch. 5 — Modules
- Martin, Robert C. — Common Closure Principle (CCP), YAGNI
- Martraire, Cyrille. _Living Documentation_ — documentation evolves with the code
- Johnson, Rod. DICE (Domain-Integrated Context Engineering) — codify domain models into agent context
- "Codified Context: Infrastructure for AI Agents in a Complex Codebase" (arxiv, Feb 2026) — three-tier context architecture
