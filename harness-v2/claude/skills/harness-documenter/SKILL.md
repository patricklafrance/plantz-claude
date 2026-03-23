---
name: harness-documenter
description: |
    Update domain documentation after implementation. Reads the domain mapping and updates module scope descriptions so that future domain analysis benefits from what was learned.
    Use when asked to "update domain docs", "run doc phase", or as part of the harness coordinator's doc phase.
license: MIT
---

# Harness Documenter

Keep domain documentation in sync with what the code actually does. After all slices are implemented, this skill updates module scope descriptions to reflect the new reality — building institutional memory that improves the next domain mapping.

This is the write-back step in the doc-phase circuit: domain mapper produces a mapping, planner and architect consume it, coder implements it, and the documenter writes updated scope descriptions back into the domain reference doc.

> Living documentation evolves with the code, not separately from it. — Martraire, _Living Documentation_

## Inputs

| Input              | Description                                |
| ------------------ | ------------------------------------------ |
| `domain-mapping`   | Path to `.harness/domain-mapping.md`       |
| `domain-reference` | Path to the project's domain reference doc |

## Process

### 1. Load context

Read `.harness/domain-mapping.md` — specifically the "Module Scope Updates" section, which contains the domain mapper's recommended scope descriptions for affected modules.

Read the current domain reference doc (e.g. `domains.md`).

### 2. Update module scope descriptions

For each affected module, update its scope description in the domain reference doc with an **intent-based description** — what the module should own, not just what code is currently there.

- If a module's scope expanded, update the description to encompass the new responsibility.
- If a new module was created, add it to the domains table with its scope.
- Keep descriptions to one line — they serve as quick-reference signals for the domain mapper, not exhaustive inventories.

### 3. Verify consistency

Check that the updated domain reference doc is internally consistent:

- No two modules claim overlapping scope
- The decision tree still routes correctly given the new scopes
- Module granularity criteria are still met

## Output

Modified domain reference doc with updated scope descriptions. No other files are changed.
