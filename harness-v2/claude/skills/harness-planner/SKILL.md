---
name: harness-planner
description: |
    Draft a multi-slice technical plan for a feature. Resolves durable architectural decisions, slices work into vertical increments, and writes per-slice acceptance criteria.
    Use when asked to "plan a feature", "draft a plan", or as part of the harness plan-loop's planning phase.
effort: high
license: MIT
---

# Harness Planner

Resolve architecture upfront, slice the work, define success through acceptance criteria.

## Inputs

| Input                 | Description                                       |
| --------------------- | ------------------------------------------------- |
| `feature-description` | What the user wants built                         |
| `mode`                | `draft` or `revision`                             |
| `revision-note`       | Architect's rejection note (`null` in draft mode) |

## Process

### 1. Load context

- Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, and `agent-docs/references/domains.md`.
- Scan `agent-docs/references/` for any additional docs relevant to the feature.

### 2. Analyze requirements

**Draft:** Determine which domains, modules, and packages the feature affects.

**Revision:** Read the existing plan in `.harness/`. The rejection note is in the `revision-note` input. Revise only what was flagged.

If the feature is too vague to resolve durable decisions, print what's missing and stop.

### 3. Resolve durable decisions

Resolve all 7 before slicing.

| Decision            | What to decide                                 |
| ------------------- | ---------------------------------------------- |
| Domain placement    | Existing domain or new domain                  |
| Entity placement    | Shared package (`@packages/*`) vs module-local |
| API namespace       | `/api/<domain>/<entity>` per module            |
| Module boundary     | New module vs extend existing                  |
| Data model shape    | Entity definitions — field names and types     |
| Collection strategy | TanStack DB collection vs fetch+useState       |
| Route structure     | Paths registered with Squide                   |

Follow the module granularity criteria and package boundaries defined in `agent-docs/references/domains.md`.

### 4. Slice into vertical tracer bullets

Each slice is a narrow but complete path through all layers — not a horizontal slice of one layer. Every slice produces a user-visible outcome.

- No purely internal slices — pair data work with its first UI consumer.
- Order by dependency. Each slice is independently verifiable.
- Scaffolding goes in the first slice that needs the new module.

### 5. Write the plan

Scope describes what at the module/component level — no file paths, function names, or prop interfaces.

## Output Format

All files written to `.harness/`.

### plan-header.md (under 40 lines)

```markdown
# Plan: {Feature Name}

## Objective

{1-2 sentences}

## Decisions

| Decision            | Choice |
| ------------------- | ------ |
| New domains         | ...    |
| New modules         | ...    |
| New shared packages | ...    |
| API namespaces      | ...    |
| Routes              | ...    |
| Collections         | ...    |

## Data Model

{One line per entity, field names and types}
{Modified entities: `EntityName += { newField? }`}
```

### slices/NN-{title}.md (40-80 lines each)

```markdown
# Slice {N}: {Title}

> **Depends on:** Slice {X} ({what it provides}), or None

## Goal

One sentence: what the user can see or do after this slice ships.

## Scope

- {Logical unit of work at the module/component level}

## Modules Affected

{Which modules and packages this slice touches}

## Acceptance Criteria

Be specific. Two tags only:

- `[visual]` — UI renders correctly. e.g. "Shows a 3-column grid with name, status, and last update"
- `[interactive]` — User action produces the expected result. e.g. "Clicking 'Submit' opens a confirmation dialog." Every mutation needs a companion loading state criterion and a UI consequence criterion.

### Visual [visual]

- [ ] {Page or story}: {specific, verifiable description}

### Interactive [interactive]

- [ ] {User action} -> {expected outcome}
- [ ] {Mutation action} -> {loading state on trigger element}
- [ ] {After mutation} -> {UI consequence}
```
