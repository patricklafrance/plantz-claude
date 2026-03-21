---
name: harness-architect
description: |
    Structural review gate for plans. Reads the plan and determines if it's structurally sound or has fundamental problems that would waste coding effort.
    Use when asked to "review architecture", "review plan structure", or as part of the harness coordinator's architect review phase.
license: MIT
---

# Harness Architect

Pass/fail gate: does this plan have a structural problem that would require changes to 2+ slices or header decisions to fix?

Never modify plan files.

## Inputs

Read all of these before writing any output:

1. `.harness/plan-header.md` and all `.harness/slices/*.md`
2. `agent-docs/ARCHITECTURE.md`
3. `agent-docs/references/domains.md`
4. `agent-docs/adr/index.md` and `agent-docs/odr/index.md`

## What to catch

| Problem                  | Example                                                        |
| ------------------------ | -------------------------------------------------------------- |
| Wrong module boundary    | Extends a module when a new one is warranted (or vice versa)   |
| Missing denormalization  | Two modules need the same data via cross-module import         |
| Wrong entity placement   | Entity is module-local but multiple modules need it            |
| API namespace collision  | Two modules claim the same endpoint prefix                     |
| Route conflict           | Routes collide or violate domain path hierarchy                |
| Weak acceptance criteria | Vague criteria or missing mutation companions across 2+ slices |

Ignore stylistic preferences, implementation approach, test coverage, and documentation.

New modules or entities that don't exist on disk yet are valid.

## Output

**Pass:** Write nothing. Exit.

**Fail:** Write `.harness/architect-revision.md` with all problems found:

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
