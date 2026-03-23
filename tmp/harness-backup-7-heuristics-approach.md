# Harness V2 — Heuristics-Based Domain Analysis Approach

## Context

Alternative to the DDD-adapted analysis in `harness-backup-7-module-placement-plan.md`. Designed specifically for frontend monorepos consuming an external RPC API over HTTP.

## Core Idea

Instead of adapting backend DDD concepts (Ubiquitous Language, Aggregate Design, Bounded Contexts, Core/Supporting/Generic subdomains) and translating them for frontend, use heuristics that speak frontend directly. The DDD references justify _why_ these heuristics work, but the analysis itself uses frontend vocabulary.

## Heuristics (ranked by relevance)

### 1. Language alignment

**Test:** Does the feature use the same terms (entities, actions, nouns) as an existing module, with the same meaning?

- Same term + same meaning → strong signal for same module
- Same term + different meaning → bounded context boundary, different module/domain
- New terms with no overlap → potential new module

**Why it works:** Evans' Ubiquitous Language principle — a module's language defines its scope. If "Plant" means the same thing in the feature and in `management/plants`, they belong together.

### 2. Change coupling (CCP)

**Test:** When a requirement changes for this feature, which existing modules would also need to change?

- Feature change forces changes in module X → same module
- Feature changes independently of all existing modules → potential new module

**Why it works:** Martin's Common Closure Principle — things that change together belong together. In a frontend monorepo, this is the strongest predictor of where maintenance pain shows up.

### 3. Route proximity

**Test:** Does the feature extend an existing route tree, or does it introduce a new navigation paradigm?

- Extends existing routes (e.g., `/management/plants/shared`) → extend that module
- New top-level navigation area → likely new domain/module

**Why it works:** In a Squide monorepo, routes are the primary organizational boundary. They define what the user perceives as "one area" of the product. Route structure reflects domain structure.

### 4. Lifecycle cohesion (tiebreaker)

**Test:** Does the feature share forms, mutation workflows, optimistic update coordination, or loading/error boundaries with an existing module?

- Shared mutation patterns → same module
- Independent mutation patterns → weaker signal, check other heuristics

**Why it works:** Frontend adaptation of Vernon's Aggregate Design — in the absence of database transactions, UI state consistency (shared forms, coordinated optimistic updates, shared error boundaries) is what defines a cohesive unit.

**Role:** Use as a tiebreaker when heuristics 1-3 don't converge. Often redundant with CCP — things that share mutation workflows almost always change together.

### 5. Stability boundary (module vs `@packages/*` only)

**Test:** Is this concern stable and shared across domains, or volatile and domain-specific?

- Stable, shared across domains → `@packages/*`
- Volatile, domain-specific → stays in the module

**Why it works:** Evans' Core/Supporting/Generic classification. In a frontend monorepo, most modules change at roughly the same rate (driven by product sprints). The one place change rate matters is the module ↔ shared package boundary.

## Analysis Structure

For each feature, the domain mapper would:

### Step 1 — Extract feature terms and actions

Pull entities, actions, and views from the feature description.

### Step 2 — Run heuristics against existing modules

For each concern in the feature, apply heuristics 1-3. Use heuristic 4 as tiebreaker if needed. Use heuristic 5 only for the module vs `@packages/*` decision.

### Step 3 — Converge

| Concern   | Language   | CCP        | Routes     | Decision            |
| --------- | ---------- | ---------- | ---------- | ------------------- |
| {concern} | → {module} | → {module} | → {module} | **Extend {module}** |

When multiple heuristics point the same direction: strong signal, proceed.
When they diverge: flag as a decision the planner must make explicitly, with the conflicting evidence.

## Comparison to DDD-Adapted Approach

| DDD-adapted step (from plan v2)                       | Heuristic equivalent  |
| ----------------------------------------------------- | --------------------- |
| Language Analysis (Evans, Ubiquitous Language)        | Language alignment    |
| UI State Cohesion (Vernon's Aggregate Design adapted) | Lifecycle cohesion    |
| Route & Navigation Analysis                           | Route proximity       |
| Strategic Classification (Core/Supporting/Generic)    | Stability boundary    |
| Decision Heuristics (Nick Tune, CCP)                  | Change coupling (CCP) |

The DDD approach takes backend concepts, adapts them, and the adaptations end up being the heuristics with extra ceremony. The heuristics approach uses the same underlying principles but speaks frontend directly.

## What stays the same (from plan v2)

- **Output format:** `domain-mapping.md` + `domain-mapping.json`
- **Feature-to-Module Mapping table:** connects PRD concerns to target modules
- **Coordinator flow:** `domain mapper → plan loop (planner ↔ architect) → slice loop`
- **Default:** extending is always preferred over creating; new module requires justification
- **Doc phase:** updates module scope descriptions after each feature

## Key References

- Evans, Eric. _Domain-Driven Design_ (Blue Book), Ch. 5 — Modules (justifies language alignment)
- Vernon, Vaughn. _Implementing Domain-Driven Design_ (Red Book), Ch. 10 — Aggregates (justifies lifecycle cohesion)
- Martin, Robert C. — Common Closure Principle, YAGNI (justifies change coupling, extend-by-default)
- Martraire, Cyrille. _Living Documentation_ (justifies doc phase updates)
- Tune, Nick. Bounded Context Design Heuristics (justifies the heuristic-based approach itself)
