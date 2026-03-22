# Harness V2 — Domain Mapper & Module Placement Plan

## Problem

AI agents make poor module placement decisions because they rely on module names (which are often too narrow or UI-artifact-oriented) rather than understanding module intent and scope. This leads to proliferation of one-feature modules. The agent can't reason about extending, merging, or repurposing existing modules — it defaults to creating new ones. This problem scales with codebase complexity and is critical for enterprise applications.

## Research Context

- No existing tool or framework solves autonomous DDD module placement for AI agents
- Consensus: "The agent should not decide the architecture — it should follow it" (Codified Context paper, DICE, Addy Osmani)
- Rod Johnson's DICE: domain models should programmatically fill the agent's context — don't rely on the agent to infer domain structure
- Evans (Blue Book, Ch. 5): "Choose modules that tell the story of the system"
- Living Documentation (Cyrille Martraire): documentation evolves with the code, not separately from it

## Plan

### 1. New skill: `harness-domain-mapper`

Runs **before** the plan loop. Analyzes the feature's domain implications and produces a domain mapping that the planner consumes.

**Coordinator flow:** `domain mapper → plan loop (planner ↔ architect) → slice loop`

**Process (frontend-adapted DDD analysis):**

1. **Load context** — Read feature description, `domains.md`, `ARCHITECTURE.md`. Scan existing domains: read each module's actual code (components, routes, pages, API calls).

2. **Language Analysis** (Evans, Ubiquitous Language) — Map the feature's entities and actions against existing module language. Same terms with same meaning → signals module fit. Same term with different meaning → signals bounded context boundary.

3. **UI State Cohesion Analysis** (frontend adaptation of Vernon's Aggregate Design, Red Book Ch. 10) — Does the feature share mutation workflows, forms, optimistic update coordination, or loading/error boundaries with existing modules? High cohesion → extend, don't create.

4. **Route & Navigation Analysis** — Does the feature extend an existing route tree or introduce a new navigation paradigm?

5. **Strategic Classification** (Evans, Core/Supporting/Generic subdomains) — Core UX → domain module. Supporting → extend existing if possible. Generic patterns → `@packages/*`.

6. **Apply Decision Heuristics** (Nick Tune's Bounded Context Design Heuristics, CCP) — Default: extend existing module. New module requires explicit justification.

**Output — two files in `.harness/`:**

**`domain-mapping.md`** — for the planner and architect:

```markdown
# Domain Mapping: {Feature Name}

## Analysis Summary

{Key findings from language, cohesion, and route analysis}

## Feature-to-Module Mapping

| PRD Concern              | Target                | Rationale                            |
| ------------------------ | --------------------- | ------------------------------------ |
| Plant sharing CRUD       | management/plants     | Same entity, same mutation workflows |
| Shared plants dashboard  | today/landing-page    | Extends existing daily care view     |
| Household member invites | management/household  | Same entity, same bounded context    |
| Plant type definitions   | @packages/core-plants | Shared across domains                |

## Decisions

| Concern         | Decision          | Justification |
| --------------- | ----------------- | ------------- |
| Domains         | extend management | ...           |
| Modules         | extend plants     | ...           |
| Shared packages | no changes        | ...           |

## Module Scope Updates

{Updated scope descriptions for affected modules — feeds into domains.md during doc phase}
```

**`domain-mapping.json`** — for guardrail hooks:

```json
{
    "feature": "...",
    "featureMapping": [
        {
            "concern": "Plant sharing CRUD",
            "target": "management/plants",
            "rationale": "Same entity, same mutation workflows"
        }
    ],
    "domains": {
        "management": {
            "action": "extend",
            "modules": {
                "plants": {
                    "action": "extend",
                    "scope": "...",
                    "routes": ["/management/plants/*"],
                    "entities": ["Plant", "CareSchedule"]
                }
            }
        }
    },
    "sharedPackages": {}
}
```

### 2. `domains.md` — Module scope descriptions

Add a `Scope` column to the domains table. Each module gets a one-line description of its intended domain scope (not its current features).

Reference: Evans (Blue Book, Ch. 5) — modules should reflect domain concepts, not UI artifacts.

### 3. `domains.md` — Flip the module default

Add to Module Granularity: extending an existing module is the default. A new module requires explicit justification of why no existing module's scope encompasses the feature.

Reference: YAGNI — don't create organizational structures you don't need yet. CCP (already there) provides the test.

### 4. Planner skill — Generic durable decisions

Replace prescriptive decisions ("Domain placement", "Module boundary", "Entity placement") with generic ones that support create/extend/merge/rename/delete:

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

Note: Domains/Modules/Shared packages decisions come from the domain mapping — the planner carries them forward, not re-derives them.

### 5. Planner skill — Reads domain mapping

Planner's Load context step reads `.harness/domain-mapping.md`. The Feature-to-Module Mapping table tells the planner which PRD concerns go to which modules, enabling correct slicing.

### 6. Architect skill — Reviews against domain mapping

Architect reads the domain mapping alongside the plan. Can catch cases where the planner's slicing contradicts the domain mapper's decisions.

### 7. Doc phase — Update module descriptions after each feature

After implementation, the doc phase updates module scope descriptions in `domains.md` to reflect what modules now encompass. This builds domain knowledge incrementally across features.

Reference: Living Documentation (Cyrille Martraire) — documentation evolves with the code, not separately from it.

## Constraints

- This harness is for **frontend monorepos** that consume an external RPC API (API definition is out of scope)
- Vernon's Aggregate Design is adapted as **UI State Cohesion** (shared mutation workflows, forms, optimistic updates, loading/error boundaries)
- No database transactions — the "transactional integrity" concept is reframed around UI state consistency

## Key References

- Evans, Eric. _Domain-Driven Design_ (Blue Book), Ch. 5 — Modules, Ch. 15 — Core/Supporting/Generic subdomains
- Vernon, Vaughn. _Implementing Domain-Driven Design_ (Red Book), Ch. 10 — Aggregates (adapted as UI State Cohesion)
- Martin, Robert C. — Common Closure Principle (CCP), YAGNI
- Martraire, Cyrille. _Living Documentation_ — documentation evolves with the code
- Tune, Nick. Bounded Context Design Heuristics
- DDD Crew. Bounded Context Canvas
- Johnson, Rod. DICE (Domain-Integrated Context Engineering) — codify domain models into agent context
- "Codified Context: Infrastructure for AI Agents in a Complex Codebase" (arxiv, Feb 2026) — three-tier context architecture
