---
name: plantz-adlc-document
description: |
    Audit agent documentation for drift after implementation and fix any issues found. Updates agent-docs, ADRs, ODRs, and CLAUDE.md files.
    Use when asked to "update docs after implementation", "audit agent-docs", "fix doc drift", or as part of the ADLC orchestrator's documentation phase.
license: MIT
---

# ADLC Document

Audit agent documentation for drift after implementation and fix any issues found.

## Inputs (provided by orchestrator)

| Input       | Description                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| `run-uuid`  | Run folder identifier                                                                   |
| `iteration` | The final code-test iteration number (used to know how many `changes-*.md` files exist) |

## Procedure

1. Read all `.adlc/[run-uuid]/changes-*.md` files to understand the full scope of changes.
2. Read the plan file's `## Decisions` section for ADR/ODR evaluation. The architect's enrichments appear inline in `## File changes` (`**Contract**:` and `**ARCHITECT CONSTRAINT**:` blocks), in `## Hard Constraints` (cross-cutting architectural constraints), and in `## Implementation notes` (patterns and gotchas). Use these to inform whether new ADRs or ODRs are needed.
3. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and any `agent-docs/references/` files whose topics overlap with the changes.
4. Load the `plantz-audit-agent-docs` skill and run the audit. This detects drift between agent-docs and the actual codebase.
5. If changes affect architectural patterns, check `agent-docs/adr/index.md` and `agent-docs/adr/README.md`. Create a new ADR if a new architectural decision was made (cross-reference with the plan's `## Decisions` section). Update the index.
6. If changes affect operational tooling, check `agent-docs/odr/index.md` and `agent-docs/odr/README.md`. Create a new ODR if a new operational decision was made (cross-reference with the plan's `## Decisions` section). Keep Consequences focused on impacts — procedural guidance ("when X, do Y") belongs in reference docs, not ODRs. Update the index.
7. If changes affect any `agent-docs/references/` file, update the affected files. If a new reference topic was introduced, create a new reference file and add an index entry in the root `CLAUDE.md`.
8. Verify the root `CLAUDE.md` index is consistent with all `agent-docs/` files.

## Subagent Pattern

Subagent A performs the audit and applies fixes to agent-docs, ADRs, ODRs, and CLAUDE.md files.

Subagent B reviews A's changes with three responsibilities, in order:

1. **Index consistency.** Verify every entry in root `CLAUDE.md` and `agent-docs/adr/index.md` / `agent-docs/odr/index.md` points to a file that exists. Verify every file in `agent-docs/` has an index entry. Fix mismatches directly.

2. **Cross-reference validation.** For each ADR/ODR/reference file A created or modified, verify that internal cross-references (links to other docs, file paths, package names) resolve correctly. Fix broken references directly.

3. **Content accuracy.** Spot-check A's prose against the actual codebase state — verify that documented patterns, file paths, and conventions match reality. Remove stale content. Do not invent new documentation beyond what the changes require.
