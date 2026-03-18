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

| Input               | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `run-uuid`          | Run folder identifier                                                       |
| `mode`              | `draft` or `revision`                                                       |
| Feature description | What the user wants built                                                   |
| Existing plan path  | `null` in `draft` mode. In `revision` mode: path to the previous `plan.md`. |

## Mode

This skill runs in one of two modes, determined by the `mode` input:

- **Draft**: Create a plan from scratch based on the feature description.
- **Revision**: Revise the existing plan. The revision input (feature description) comes from one of two sources: (a) the user's `--revise` text (freeform natural language), or (b) an architect revision request file (structured with `## Problem`, `## Evidence`, `## Required changes` sections). When the input contains those structured sections, treat it as an architect revision — address the Required changes specifically. When it is freeform text, treat it as user feedback.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`.
2. Always load the `accessibility`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills. Load each of the following whose description matches the feature's affected packages — do not skip a skill you are unsure about: `shadcn`, `workleap-web-configs`, `workleap-logging`, `pnpm`.
3. **Draft mode:** Analyze the feature requirements and determine which packages/modules are affected.
   **Revision mode:** Read the existing plan (at the existing plan path input). Understand what was attempted and what the user wants changed. Focus the revision on the user's feedback — don't rewrite sections that aren't affected.
4. If a new module or storybook needs to be scaffolded, note it in the plan. Before proposing a new module, check `agent-docs/references/domains.md` for module granularity criteria — prefer adding to an existing module unless the criteria are clearly met. Do NOT scaffold during planning — that happens during the coding phase.
5. Draft, revise, or validate and improve the plan following the **plan output format** below.
6. Write the plan to `.adlc/[run-uuid]/plan.md`.

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

## Bundle size impact

[For each affected app: whether new dependencies, large new modules, or removed
code-splitting boundaries are expected to increase bundle size. If a budget
increase may be needed, note which app and the rough magnitude (e.g., "+5-10 KB
gzipped from new charting library"). See agent-docs/references/bundle-size-budget.md
for thresholds.]
[Or "No significant impact expected." if no new dependencies and changes are
within existing code-split boundaries]

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
3. UI/UX changes MUST have more [visual] and [interactive] criteria than [static] criteria.
4. [visual] and [interactive] criteria MUST be specific enough for an agent with Chrome DevTools to verify (e.g., "dialog has readable text on dark background" NOT "dark mode looks good").
5. When a feature adds, removes, or modifies columns/rows in a grid or table layout, include a [visual] criterion that explicitly compares header column positions to body column positions (e.g., "each header label's left edge is directly above the corresponding body value's left edge with no visible horizontal offset").
6. Every `[interactive]` criterion that triggers a mutation (create, update, delete, accept, dismiss) MUST have companion criteria for: (a) the trigger element's disabled or loading state while the async operation is in flight, and (b) every UI element outside the trigger that should visibly change as a consequence (list refreshes, counter updates, sibling section appears). Omitting these produces features where the action succeeds but the UI appears frozen or stale. Bad: a single criterion "Clicking Delete removes the plant." Good: three criteria — "Clicking Delete removes the plant from the list," "Delete button shows a loading state while the request is in flight," "Plant count in the header updates after deletion."

Tag definitions:

- [static] — verified by lint, typecheck, or module validation
- [visual] — verified by launching the app and visually inspecting a screenshot (color, presence, text content, layout structure)
- [interactive] — verified by clicking, typing, or navigating in the browser

Criteria:

- [static] Component accepts new prop without type errors
- [visual] List renders with the expected columns and no visual offset between header and body
- [interactive] Clicking a row opens the detail dialog
```

### Architect enrichments

File Changes entries may contain `**Contract**:` lines and `**ARCHITECT CONSTRAINT:**`
blocks added by the Architect skill during a previous run. These are regenerated
by the Architect after every plan revision — you may freely modify or remove
them during revision. They will be re-added by the Architect in the next
plan-iteration.

## Hard Constraints

- **Modules MUST NOT import from each other.** No direct imports, no subpath exports, no re-exports, no workarounds. This is absolute — no exceptions.
- When two modules need shared code: prefer duplication if the surface area is small; extract to a package under `packages/` when it's large enough to justify the indirection. Check `packages/` for an existing `@packages/<domain>-core` package before creating a new one.

## Subagent Pattern

In **draft mode**, Subagent A drafts the plan from scratch and writes `plan.md`. In **revision mode**, A reads the existing plan, then revises `plan.md` to address the user's feedback — keeping sections that aren't affected.

In **both modes**, Subagent B reviews A's output. B reads the plan, challenges it — checking for missing affected packages, unrealistic scope, incorrect patterns, missing stories, accessibility gaps, shallow decompositions (where a component's props would mirror its internal state instead of hiding complexity), and testability gaps (components or hooks that cannot be rendered in a Storybook story without an elaborate multi-provider setup) — and edits `plan.md` directly to improve it. B does not append concerns; it rewrites sections that need improvement.

In **revision mode**, B additionally validates that the revision input (user feedback or architect revision request) is genuinely addressed in A's revisions, and confirms the revised plan doesn't violate ADRs/ODRs or introduce new cross-module dependencies.

**B MUST validate acceptance criteria against the RULES in the plan output format.** If any rule is violated, B fixes the criteria directly. After editing, B must also verify that every acceptance criterion references a capability present in the plan's File Changes section — remove or revise orphaned criteria that reference files or features dropped during edits.
