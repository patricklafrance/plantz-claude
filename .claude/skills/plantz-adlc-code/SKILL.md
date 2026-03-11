---
name: plantz-sdlc-code
description: |
    Implement a feature plan or fix issues reported by the test phase. Writes code to the repo and outputs a changes summary file.
    Use when asked to "implement the plan", "code the feature", "fix test issues", or as part of the SDLC orchestrator's coding phase.
license: MIT
---

# SDLC Code

Implement the plan or fix issues reported by the test phase or CI.

## Inputs (provided by orchestrator)

| Input              | Description                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`         | Run folder identifier                                                                                                                                                                                                                         |
| `iteration`        | Current iteration number (starts at 1). This is the iteration the agent will **write** to (`changes-[iteration].md`).                                                                                                                         |
| Plan path          | Always provided — `./tmp/runs/[run-uuid]/plan.md`                                                                                                                                                                                             |
| Issues path        | `null` on iteration 1. On fix cycles: the path to the issues file — either `test-issues-*.md` (from test phase) or `ci-issues-*.md` (from CI failures).                                                                                       |
| Changes path       | `null` on iteration 1. On fix cycles: the explicit path to the **previous** iteration's changes file (e.g., `changes-1.md` when `iteration=2`).                                                                                               |
| Escalation context | `null` unless the orchestrator rejected a previous escalation. If provided: path to the escalation file from a prior iteration — read it to understand what was tried and why the orchestrator disagreed, then proceed with the fix normally. |

## Mode

This skill runs in one of two modes, determined by the inputs:

- **Plan mode** (`iteration=1`, issues path is `null`): Implement the feature from scratch based on the plan.
- **Fix mode** (`iteration>1`, issues path provided): Fix specific issues from the test phase or CI. The plan is still read for context, but the issues file drives the work.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the `accessibility`, `shadcn`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills for implementation guidance.
3. Read the plan file for architectural context. In **fix mode**, also read the issues file and previous changes file to understand what was done and what failed. If an escalation context path is provided, read it to understand what was tried and why the orchestrator disagreed.
4. **Fix mode only — triage before coding.** Classify each issue in the issues file:
    - **Mechanical**: Wrong import path, missing export, missing prop, missing aria-label, syntax error. Fix directly.
    - **Structural**: The fix requires a fundamentally different approach — not just more effort. Concrete signals: the plan assumed a component decomposition or data flow that doesn't work, a library or pattern choice is fighting the framework, or the fix requires cross-module imports the plan didn't anticipate. A single `as any` or a tricky generic is not structural — it's annoying but fixable.
    - If any issue looks structural, note it in `changes-[iteration].md` under **Notes** so Subagent B can evaluate it. Fix all mechanical issues normally. **Only Subagent B writes escalation files** — A never escalates directly.
5. **Plan mode only:** If the plan requires scaffolding a new module, load and use the `plantz-scaffold-domain-module` skill. If it requires a new Storybook, use `plantz-scaffold-domain-storybook`.
6. Implement the changes. Follow all technology rules from this skill's `references/` files. **Use the browser while coding** — start the dev server or Storybook and use Chrome DevTools MCP tools to see what you're building. Visual feedback leads to better code.
7. Write a summary of all changes to `./tmp/runs/[run-uuid]/changes-[iteration].md`.

## Changes File Format

```markdown
# Changes — Iteration [N]

## Files created

- `path/to/file.tsx` — [brief description]

## Files modified

- `path/to/file.tsx` — [what changed and why]

## Files deleted

- `path/to/file.tsx` — [why deleted]

## Dependencies added

- `package-name` in `workspace-package` — [why needed]

## Notes

[Anything the test or document phases should know about]
```

## Hard Constraints

- **Modules MUST NOT import from each other.** No direct imports, no subpath exports, no re-exports, no workarounds. This is absolute — no exceptions.
- If you discover that code needs to be shared between modules during implementation: prefer duplication if the surface area is small; extract to a package under `packages/` (e.g., `@packages/plants-core`) when it's large enough to justify the indirection. Never create an import from one `@modules/*` package to another.
- When fixing issues, if the fix would require a cross-module import, restructure to use a shared package instead.

## Subagent Pattern

**Subagent A** implements the full change set and writes `changes-[iteration].md`. A focuses entirely on writing correct code. If any issue looks structural, A notes it in `changes-[iteration].md` under **Notes** so B can evaluate it. **A never writes escalation files.**

**Subagent B** has two responsibilities, in order:

1. **Code review.** Read every changed file listed in `changes-[iteration].md`. Fix mechanical issues (semicolons, import paths, missing exports) and substantive issues (component structure, accessibility gaps, missing dark mode variants, incorrect patterns). Update `changes-[iteration].md` to reflect modifications. Do not defer fixable concerns — resolve them.

2. **Escalation check.** Watch for brute-force signals: type suppressions (`as any`, `@ts-ignore`), lint-disable comments, wrapper components that exist only to bridge a bad abstraction, or growing complexity relative to the problem being solved. If B identifies a structural issue that cannot be resolved by editing code — the plan's approach is fundamentally wrong, not just hard — B writes `./tmp/runs/[run-uuid]/escalation-[iteration].md` explaining what is wrong and proposing an alternative. **Only B can write escalation files.**
