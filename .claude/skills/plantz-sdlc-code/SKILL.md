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

| Input        | Description                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`   | Run folder identifier                                                                                                                                   |
| `iteration`  | Current iteration number (starts at 1). This is the iteration the agent will **write** to (`changes-[iteration].md`).                                   |
| Plan path    | Always provided — `./tmp/runs/[run-uuid]/plan.md`                                                                                                       |
| Issues path  | `null` on iteration 1. On fix cycles: the path to the issues file — either `test-issues-*.md` (from test phase) or `ci-issues-*.md` (from CI failures). |
| Changes path | `null` on iteration 1. On fix cycles: the explicit path to the **previous** iteration's changes file (e.g., `changes-1.md` when `iteration=2`).         |

## Mode

This skill runs in one of two modes, determined by the inputs:

- **Plan mode** (`iteration=1`, issues path is `null`): Implement the feature from scratch based on the plan.
- **Fix mode** (`iteration>1`, issues path provided): Fix specific issues from the test phase or CI. The plan is still read for context, but the issues file drives the work.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the `accessibility`, `shadcn`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills for implementation guidance.
3. Read the plan file for architectural context. In **fix mode**, also read the issues file and previous changes file to understand what was done and what failed.
4. **Fix mode only — triage before coding.** Classify each issue in the issues file:
    - **Mechanical**: Wrong import path, missing export, missing prop, missing aria-label, syntax error. Fix directly.
    - **Structural**: The fix would require cross-module imports the plan didn't anticipate, reverting the majority of the previous iteration's work, adding type suppressions (`as any`, `@ts-ignore`, `@ts-expect-error`), introducing wrapper/adapter layers solely to bridge an impedance mismatch, or adding lint-disable comments to suppress legitimate errors.
    - If any issue is structural: fix all mechanical issues, then write `./tmp/runs/[run-uuid]/escalation-[iteration].md` explaining which issues are structural, what the plan assumed that turned out wrong, and a proposed alternative approach. Produce `changes-[iteration].md` covering the mechanical fixes only.
5. **Plan mode only:** If the plan requires scaffolding a new module, load and use the `plantz-scaffold-domain-module` skill. If it requires a new Storybook, use `plantz-scaffold-domain-storybook`.
6. Implement the changes. Follow all technology rules from this skill's `references/` files. You have access to browser tools (chrome-devtools MCP) — use them to verify your work visually when it would help, the same way you would in any coding session.
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

Subagent A implements the full change set and writes `changes-[iteration].md`. Subagent B receives the same inputs as A (plan path, tech-stack references, issues file if any), reads every changed file listed in `changes-[iteration].md`, and improves the code directly — fixing mechanical issues (semicolons, import paths, missing exports) and substantive issues (component structure, accessibility gaps, missing dark mode variants, incorrect patterns). B updates `changes-[iteration].md` to reflect any additional modifications it made. B does not defer concerns — it resolves them.

B should also watch for brute-force signals: type suppressions (`as any`, `@ts-ignore`), lint-disable comments, wrapper components that exist only to bridge a bad abstraction, or growing complexity relative to the problem being solved. If B identifies a structural issue it cannot resolve by editing code, it writes `./tmp/runs/[run-uuid]/escalation-[iteration].md` explaining what is wrong and what should change.
