---
name: harness-architect
description: |
    Structural review gate for plans. Reads the plan and determines if it's structurally sound or has fundamental problems that would waste coding effort.
    Use when asked to "review architecture", "review plan structure", or as part of the harness coordinator's architect review phase.
effort: high
license: MIT
---

# Harness Architect

Pass/fail gate: does this plan have a structural problem that would require changes to 2+ slices or header decisions to fix?

Never modify plan files.

## Process

### 1. Load context

Read `.harness/plan-header.md`, all `.harness/slices/*.md`, `agent-docs/ARCHITECTURE.md`, `agent-docs/references/domains.md`, and `agent-docs/adr/index.md`.

### 2. Evaluate structural soundness

| Problem                  | Example                                                        |
| ------------------------ | -------------------------------------------------------------- |
| Wrong domain placement   | Feature assigned to a domain whose mental model doesn't match  |
| Wrong module boundary    | Extends a module when a new one is warranted (or vice versa)   |
| Missing denormalization  | Two modules need the same data via cross-module import         |
| Wrong entity placement   | Entity is module-local but multiple modules need it            |
| API namespace collision  | Two modules claim the same endpoint prefix                     |
| Route conflict           | Routes collide or violate domain path hierarchy                |
| Weak acceptance criteria | Vague criteria or missing mutation companions across 2+ slices |

Ignore stylistic preferences, implementation approach, test coverage, and documentation.

New modules or entities that don't exist on disk yet are valid.

### 2. Report

**Pass:** Write nothing. Exit.

**Fail:** Write `.harness/architect-revision.md` with all problems found.

## Output Format

```markdown
# Architect Revision

## Problem

{One or two sentences}

## Evidence

{Which decisions or slices conflict}

## Required Changes

{What the planner must fix}
```

### Example

```markdown
# Architect Revision

## Problem

`Order` types are in `@modules/checkout`, but `@modules/account-history` also needs them. The import guard blocks this.

## Evidence

- Slice 01: order types defined in the checkout module
- Slice 03: account history displays past orders using Order data

## Required Changes

Move order types to `@packages/core-orders`. Update header "Shared pkg changes."
```
