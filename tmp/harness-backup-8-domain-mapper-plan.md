# Harness V2 — Domain Mapper Implementation Plan

## Problem

AI agents make poor module placement decisions because they rely on module names rather than understanding module intent and scope. This leads to proliferation of one-feature modules. The agent can't reason about extending, merging, or repurposing existing modules — it defaults to creating new ones.

## Decision

Use the **heuristics-based approach** (not the DDD-adapted approach). Five ranked heuristics using frontend vocabulary, backed by DDD principles in "Why it works" footnotes. Selected after evaluation by 5 independent reviewers across DX, DDD correctness, AI agent reliability, enterprise scale, and devil's advocate lenses.

## Exercise Findings (from 4 PRDs, 28 subagents)

Tested the heuristics against 4 real PRDs (User Account, Plant Care History, Vacation Planner, Smart Watering Adjustment). All 28 agents converged on the correct placement every time, but exposed three generic refinements:

1. **Apply the decision tree before heuristics.** `domains.md` has a decision tree that catches cross-cutting concerns (auth, layout, infrastructure) before domain heuristics even run. Without this guard, language alignment on words like "user" or "session" misleads toward the wrong domain module.

2. **Heuristics must operate on code, not just PRD text.** An agent that reads only the feature description will propose changes to code that already exists, try to promote already-promoted packages, and misplace features based on surface vocabulary. Reading actual module code in step 1 is load-bearing.

3. **When language is ambiguous, check the feature's purpose against the domain's mental model.** Verb forms like "create/save/configure" can mislead — a feature that configures something ephemeral to influence daily execution belongs in the execution domain, not the configuration domain. The domain mapper should check which domain's mental model (from `domains.md`) best matches the feature's _purpose_, not just its vocabulary.

These are generic principles. Repository-specific knowledge (decision trees, domain mental models, data layer patterns, package promotion rules) stays in `domains.md` and `ARCHITECTURE.md` — the skill reads those files, it doesn't duplicate them.

## Changes

### 1. New skill: `harness-domain-mapper`

Runs **before** the plan loop. Analyzes the feature's domain implications and produces a domain mapping that the planner consumes. The skill is generic — repository-specific domain knowledge lives in `domains.md` and `ARCHITECTURE.md`, not in the skill itself.

**Updated coordinator flow:** `domain mapper → plan loop (planner ↔ architect) → slice loop → doc phase`

**Analysis process:**

1. **Load context** — Read feature description, `domains.md` (including module scope descriptions and the decision tree), `ARCHITECTURE.md`. Scan existing domains: read each module's actual code (components, routes, pages, API calls). This step is critical — heuristics applied to PRD text alone produce wrong answers.

2. **Apply the decision tree** — `domains.md` contains a decision tree for "Where does feature X go?" Apply it first. If the decision tree resolves a concern definitively (e.g., cross-cutting infrastructure), record the placement and skip the heuristics for that concern.

3. **Extract feature terms and actions** — Pull entities, actions, and views from the feature description.

4. **Run heuristics against existing modules** — For each concern not resolved by the decision tree, apply heuristics 1-3. Use heuristic 4 as tiebreaker if needed. Use heuristic 5 only for the module vs `@packages/*` decision. When language is ambiguous, check the feature's purpose against the domain mental models in `domains.md`.

    | #   | Heuristic                                         | Test                                                                                                                                 |
    | --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
    | 1   | Language alignment                                | Same terms + same meaning → same module. Same term + different meaning → bounded context boundary. New terms → potential new module. |
    | 2   | Change coupling (CCP)                             | Feature change forces changes in module X → same module. Feature changes independently → potential new module.                       |
    | 3   | Route proximity                                   | Extends existing route tree → extend that module. New top-level navigation → likely new domain/module.                               |
    | 4   | Lifecycle cohesion (tiebreaker)                   | Shared forms, mutation workflows, optimistic updates, loading/error boundaries → same module.                                        |
    | 5   | Stability boundary (module vs `@packages/*` only) | Stable + shared across domains → `@packages/*`. Volatile + domain-specific → stays in module.                                        |

5. **Converge** — Fill in the convergence table. Unanimous signals → proceed. Divergent signals → flag for planner with conflicting evidence.

    | Concern   | Language   | CCP        | Routes     | Decision            |
    | --------- | ---------- | ---------- | ---------- | ------------------- |
    | {concern} | → {module} | → {module} | → {module} | **Extend {module}** |

**Default:** Extending is always preferred over creating. A new module requires explicit justification per the module granularity criteria in `domains.md`.

**Output — `domain-mapping.md` in `.harness/`:**

```markdown
# Domain Mapping: {Feature Name}

## Analysis Summary

{Key findings from heuristic analysis}

## Feature-to-Module Mapping

| PRD Concern | Target              | Rationale                            |
| ----------- | ------------------- | ------------------------------------ |
| {concern}   | {module or package} | {which heuristics converged and why} |

## Decisions

| Concern         | Decision                           | Justification |
| --------------- | ---------------------------------- | ------------- |
| Domains         | {extend X / create Y}              | ...           |
| Modules         | {extend X / create Y}              | ...           |
| Shared packages | {extend X / create Y / no changes} | ...           |

## Module Scope Updates

{Updated intent-based scope descriptions for affected modules — feeds into domains.md during doc phase}
```

No `domain-mapping.json` — guardrail hooks are out of scope for now.

### 2. `domains.md` — Module scope descriptions

Add a `Scope` column to the domains table. Each module gets a one-line description of its **intended domain scope** (not its current features).

| Domain     | Mental model            | Existing modules       | Scope                                                                                                      |
| ---------- | ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| management | Admin and configuration | management/plants      | Plant inventory ownership — CRUD, metadata, per-user plant collections                                     |
| management |                         | management/user        | User identity and preferences — profile editing, display settings                                          |
| management |                         | management/household   | Household membership — setup, invitations, member roles, shared access                                     |
| today      | Daily care dashboard    | today/landing-page     | Daily care execution — what needs attention now, watering actions, care event recording, schedule insights |
| today      |                         | today/vacation-planner | Absence-aware care planning — trip dates, plant forecasts, delegation                                      |

Reference: Evans (Blue Book, Ch. 5) — modules should reflect domain concepts, not UI artifacts.

### 3. `domains.md` — Flip the module default

Add to Module Granularity section:

> **Default: extend, don't create.** Extending an existing module is always the default. A new module requires explicit justification that no existing module's scope encompasses the feature. Check the Scope column above — if the feature fits an existing module's intended scope, extend it.

Reference: YAGNI + CCP.

### 4. `harness-planner` — Generic durable decisions

Replace the current prescriptive decisions with generic ones that support create/extend/merge/rename/delete:

**Durable decisions table (step 3):**

| Decision            | What to decide                             |
| ------------------- | ------------------------------------------ |
| Domains             | Which domains are affected and how         |
| Modules             | Which modules are affected and how         |
| Shared packages     | Which `@packages/*` are affected and how   |
| API namespace       | `/api/<domain>/<entity>` per module        |
| Data model shape    | Entity definitions — field names and types |
| Collection strategy | TanStack DB collection vs fetch+useState   |
| Route structure     | Paths registered with Squide               |

Note: Domains/Modules/Shared packages decisions come from the domain mapping — the planner carries them forward, not re-derives them.

**Plan-header template Decisions table:**

| Decision        | Choice |
| --------------- | ------ |
| Domains         | ...    |
| Modules         | ...    |
| Shared packages | ...    |
| API namespaces  | ...    |
| Routes          | ...    |
| Collections     | ...    |

### 5. `harness-planner` — Reads domain mapping

Planner's Load context step adds: "Read `.harness/domain-mapping.md`. The Feature-to-Module Mapping table tells you which PRD concerns go to which modules — carry these decisions forward, don't re-derive them."

### 6. `harness-architect` — Reviews against domain mapping + fix duplicate step

- Add `.harness/domain-mapping.md` to the Load context step
- Add a check: "Plan contradicts domain mapping — planner's slicing assigns a concern to a different module than the domain mapper decided"
- Fix duplicate step numbering (two "### 2." → "### 2." and "### 3.")

### 7. `harness-coordinator` — Add domain mapper and doc phase

Update the process:

1. Prepare (unchanged)
2. **Domain mapping** (NEW) — Spawn `subagent_type: "harness-domain-mapper"` with the feature description
3. Plan loop (unchanged)
4. Branch (unchanged)
5. Slice loop (unchanged)
6. **Doc phase** (NEW) — Spawn `subagent_type: "harness-documenter"`
7. Wrap up (unchanged)

### 8. New skill skeleton: `harness-documenter`

Doc phase skill that runs after all slices are complete. Updates `domains.md` module scope descriptions to reflect what modules now encompass.

**Process:**

1. Read `.harness/domain-mapping.md` (specifically the "Module Scope Updates" section)
2. Read current `agent-docs/references/domains.md`
3. Update the Scope column for affected modules with **intent-based descriptions** (what the module should own, not just what code is currently there)
4. If a new module was created, add it to the domains table with its scope

Reference: Living Documentation (Cyrille Martraire) — documentation evolves with the code.

**Doc-phase circuit:** mapper output → planner reads it → architect validates → doc phase writes intent-based scope updates back to `domains.md`. This creates institutional memory that improves the next domain mapping.

## Files to create/modify

| File                                                      | Action                                                  |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `harness-v2/claude/skills/harness-domain-mapper/SKILL.md` | **Create**                                              |
| `harness-v2/claude/skills/harness-documenter/SKILL.md`    | **Create** (skeleton)                                   |
| `agent-docs/references/domains.md`                        | **Modify** — add Scope column, flip module default      |
| `harness-v2/claude/skills/harness-planner/SKILL.md`       | **Modify** — generic decisions, read domain mapping     |
| `harness-v2/claude/skills/harness-architect/SKILL.md`     | **Modify** — read domain mapping, fix step numbering    |
| `harness-v2/claude/skills/harness-coordinator/SKILL.md`   | **Modify** — add domain mapper step, add doc phase step |

## Not changing

- **harness-coder** — unaffected by domain mapping
- **harness-reviewer** — unaffected by domain mapping
- **harness-slice-loop** — unaffected by domain mapping
- **harness-plan-loop** — unaffected (domain mapper runs before it, not inside it)

## Key References

- Evans, Eric. _Domain-Driven Design_ (Blue Book), Ch. 5 — Modules (justifies language alignment)
- Vernon, Vaughn. _Implementing Domain-Driven Design_ (Red Book), Ch. 10 — Aggregates (justifies lifecycle cohesion)
- Martin, Robert C. — Common Closure Principle, YAGNI (justifies change coupling, extend-by-default)
- Martraire, Cyrille. _Living Documentation_ (justifies doc phase updates)
- Tune, Nick. Bounded Context Design Heuristics (justifies the heuristic-based approach itself)
