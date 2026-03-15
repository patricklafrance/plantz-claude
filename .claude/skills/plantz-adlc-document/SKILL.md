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

| Input       | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `run-uuid`  | Run folder identifier                                                          |
| `iteration` | The latest iteration number (used to know how many `changes-*.md` files exist) |
| Plan path   | `./tmp/runs/[run-uuid]/plan.md` — needed for the `## Decisions` section        |

## Procedure

1. Read all `./tmp/runs/[run-uuid]/changes-*.md` files to understand the full scope of changes.
2. Read the plan file's `## Decisions` section. Each entry describes a choice where alternatives existed — use these to determine whether new ADRs or ODRs are needed.
3. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and any `agent-docs/references/` files whose topics overlap with the changes (e.g., `msw-tanstack-query.md` if data layer changed, `storybook.md` if story conventions changed, `tailwind-postcss.md` if styling changed, `bundle-size-budget.md` if budgets changed, `ci-cd.md` if workflows changed, `color-mode.md` if theming changed, `shadcn.md` if components changed, `domains.md` if module boundaries changed).
4. Load the `plantz-audit-agent-docs` skill and run the audit. This detects drift between agent-docs and the actual codebase.
5. If changes affect architectural patterns, check `agent-docs/adr/index.md` and `agent-docs/adr/README.md`. Create a new ADR if a new architectural decision was made (cross-reference with the plan's `## Decisions` section). Update the index.
6. If changes affect operational tooling, check `agent-docs/odr/index.md` and `agent-docs/odr/README.md`. Create a new ODR if a new operational decision was made (cross-reference with the plan's `## Decisions` section). Update the index.
7. If changes affect any `agent-docs/references/` file, update the affected files. If a new reference topic was introduced, create a new reference file and add an index entry in the root `CLAUDE.md`.
8. Verify the root `CLAUDE.md` index is consistent with all `agent-docs/` files.

## Subagent Pattern

Subagent A performs the audit and applies fixes to agent-docs, ADRs, ODRs, and CLAUDE.md files. Subagent B reviews the changes — verifying index entries match actual files, cross-references are valid, and no stale content remains — and edits files directly to fix any issues it finds.
