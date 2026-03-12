---
name: plantz-adlc-plan
description: |
    Draft a technical plan for a feature. Analyzes requirements, identifies affected packages, and outputs a structured plan file.
    Use when asked to "plan a feature", "draft a technical plan", "design the approach", or as part of the ADLC orchestrator's planning phase.
license: MIT
---

# ADLC Plan

Draft the technical approach for a feature and output it to a plan file.

## Inputs (provided by orchestrator)

| Input               | Description                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `run-uuid`          | Run folder identifier                                                                                              |
| `mode`              | `draft`, `review`, or `revision`                                                                                   |
| Feature description | What the user wants built                                                                                          |
| Escalation path     | `null` except in `revision` mode: path to `escalation-[iteration].md` — explains what the previous plan got wrong. |
| Existing plan path  | `null` in `draft` mode. In `review` and `revision` modes: path to the current `plan.md`.                           |

## Mode

This skill runs in one of three modes, determined by the `mode` input:

- **Draft**: Create a plan from scratch based on the feature description.
- **Review**: The orchestrator already wrote the user's plan to `plan.md`. Only Subagent B runs — validate format, challenge gaps, and improve. See Subagent Pattern below.
- **Revision**: Revise the existing plan to address the structural issue described in the escalation file.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the `accessibility`, `shadcn`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills for design guidance.
3. **Draft mode:** Analyze the feature requirements and determine which packages/modules are affected.
   **Review mode:** Read the existing plan at the plan path. This plan was written by the user — treat it as the starting point. Proceed directly to step 5 (validate and improve).
   **Revision mode:** Read the existing plan (at the existing plan path input) and the escalation file (at the escalation path input). Understand what was attempted, what failed structurally, and the proposed alternative. Focus the revision on the structural issue — don't rewrite sections that aren't affected.
4. If a new module or storybook needs to be scaffolded, note it in the plan. Do NOT scaffold during planning — that happens during the coding phase.
5. Draft, revise, or validate and improve the plan following the **plan output format** below.
6. Write the plan to `./tmp/runs/[run-uuid]/plan.md`.

## Plan Output Format

The plan file must contain these sections:

```markdown
# Plan: [Feature Name]

## Objective

[1-2 sentences describing what the feature does]

## Affected packages

[List of packages/modules that will be created or modified, with their paths]

## Scaffolding required

[Whether new modules or storybooks need to be scaffolded — list domain + module names]
[Or "None" if no scaffolding needed]

## File changes

[For each affected package, list files to create/modify/delete with a brief description
of the change. For story files, include the title convention and variant list inline.
When a new file should follow an existing file's pattern, include a "reference:" pointer.]

## New dependencies

[Any new npm packages to install, in which workspace package, or "None"]

## Decisions

[Key choices where alternatives existed. Each entry: what was decided, what was
rejected, and why. These feed the document phase's ADR/ODR check.]
[Or "None" if no non-obvious choices were made]

## Implementation notes

[Patterns to follow (reference existing files by path when applicable)
and gotchas to watch for]

## Acceptance criteria

RULES (apply to every criterion below):

1. Every criterion MUST have exactly one tag: [static], [visual], or [interactive].
2. There MUST be at least one criterion per planned file change.
3. UI/UX changes MUST have mostly [visual] and [interactive] criteria.
4. [visual] and [interactive] criteria MUST be specific enough for an agent with Chrome DevTools to verify (e.g., "dialog has readable text on dark background" NOT "dark mode looks good").

Tag definitions:

- [static] — verified by lint, typecheck, or module validation
- [visual] — verified by launching the app and visually inspecting the UI
- [interactive] — verified by clicking, typing, or navigating in the browser

Criteria:

- [static] PlantListItem accepts optional `onDelete` prop without type errors
- [visual] Today's list renders without delete buttons
- [interactive] Clicking a plant row in Today opens the detail dialog
```

## Hard Constraints

- **Every plan MUST include acceptance criteria with tagged items.** A plan with an empty or missing acceptance criteria section is invalid. Every criterion MUST have exactly one tag: `[static]`, `[visual]`, or `[interactive]`.

- **Modules MUST NOT import from each other.** No direct imports, no subpath exports, no re-exports, no workarounds. This is absolute — no exceptions.
- When two modules need shared code: prefer duplication if the surface area is small; extract to a package under `packages/` when it's large enough to justify the indirection. For plant domain code, use `@packages/plants-core`. For new domains, create a new `@packages/<domain>-core` package.
- If a feature request implies cross-module imports, redesign the approach to use a shared package instead. Never plan a module-to-module dependency.

## Subagent Pattern

In **draft mode**, Subagent A drafts the plan from scratch and writes `plan.md`. In **revision mode**, A reads the existing plan and the escalation file, then revises `plan.md` to address the structural issue — keeping sections that aren't affected. In **review mode**, Subagent A is skipped entirely — only B runs.

Subagent B reads the plan, challenges it — checking for missing affected packages, unrealistic scope, incorrect patterns, missing stories, or accessibility gaps — and edits `plan.md` directly to improve it. B does not append concerns; it rewrites sections that need improvement. In **review mode**, B also ensures the plan follows the expected output format. If sections are missing, B adds them.

**B MUST validate acceptance criteria before finishing.** Check:

1. The `## Acceptance criteria` section exists and is not empty.
2. Every criterion has exactly one tag: `[static]`, `[visual]`, or `[interactive]`.
3. There is at least one criterion per file in the `## File changes` section.
4. UI/UX file changes have at least one `[visual]` or `[interactive]` criterion.
   If any check fails, B fixes the acceptance criteria directly — adding missing criteria, adding missing tags, or rewriting vague criteria to be Chrome DevTools-verifiable.
