---
name: plantz-adlc-code
description: |
    Implement a feature plan or fix issues reported by the test phase. Writes code to the repo and outputs a changes summary file.
    Use when asked to "implement the plan", "code the feature", "fix test issues", or as part of the ADLC orchestrator's coding phase.
license: MIT
---

# ADLC Code

Implement the plan or fix issues reported by the test phase or CI.

## Inputs (provided by orchestrator)

| Input              | Description                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`         | Run folder identifier                                                                                                                                   |
| `iteration`        | Current iteration number (starts at 1). This is the iteration the agent will **write** to (`changes-[iteration].md`).                                   |
| Plan path          | Always provided — `./tmp/runs/[run-uuid]/plan.md`                                                                                                       |
| Issues path        | `null` on iteration 1. On fix cycles: the path to the issues file — either `test-issues-*.md` (from test phase) or `ci-issues-*.md` (from CI failures). |
| Changes path       | `null` on iteration 1. On fix cycles: the explicit path to the **previous** iteration's changes file (e.g., `changes-1.md` when `iteration=2`).         |
| Escalation context | `null` unless the orchestrator rejected a previous escalation. If provided: path to the rejected escalation file from a prior iteration.                |

## Mode

This skill runs in one of two modes, determined by the inputs:

- **Plan mode** (`iteration=1`, issues path is `null`): Implement the feature from scratch based on the plan.
- **Fix mode** (`iteration>1`, issues path provided): Fix specific issues from the test phase or CI. The plan is still read for context, but the issues file drives the work.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the `accessibility`, `shadcn`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills for implementation guidance.
3. Read the plan file for architectural context. In **fix mode**, also read the issues file and previous changes file to understand what was done and what failed. If an escalation context path is provided, read it to understand what was tried and why the orchestrator disagreed.
4. **Fix mode only — assess before coding.** Read every issue in the issues file and attempt all fixes. For any fix where the plan's approach seems fundamentally mismatched — the plan assumed a component decomposition or data flow that doesn't work, a library choice is fighting the framework, or the fix requires cross-module access the plan didn't anticipate — explain the specific concern in `changes-[iteration].md` under **Notes** (what about the plan is wrong, not just "this is hard"). Fix the issue anyway to the best of your ability. **Only Subagent B writes escalation files** — A never escalates directly.
5. **Plan mode only:** If the plan requires scaffolding a new module, load and use the `plantz-scaffold-domain-module` skill. If it requires a new Storybook, use `plantz-scaffold-domain-storybook`.
6. **Start the dev server or Storybook before implementing.** Run the appropriate root script for the affected package — `pnpm dev-host` for app routes, or the matching `pnpm dev-{domain}-storybook` for stories (e.g., `pnpm dev-today-storybook`). Use Chrome DevTools MCP tools to see what you're building as you go. Implement the changes with the browser open — navigate to relevant pages, take screenshots to check your work, and course-correct as you code. Follow all technology rules from this skill's `references/` files.
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

- **Subagent A MUST have the dev server or Storybook running during implementation** (see Procedure step 6). Stop the server when implementation is complete to avoid orphan processes.
- **Modules MUST NOT import from each other.** No direct imports, no subpath exports, no re-exports, no workarounds. This is absolute — no exceptions.
- If you discover that code needs to be shared between modules during implementation: prefer duplication if the surface area is small; extract to a package under `packages/` (e.g., `@packages/plants-core`) when it's large enough to justify the indirection. Never create an import from one `@modules/*` package to another.

## Subagent Pattern

**Subagent A** implements the full change set and writes `changes-[iteration].md`. If A encounters plan-level concerns in fix mode, it flags them in the **Notes** section for B to evaluate.

**Subagent B** has three responsibilities, in order:

1. **Code review.** Read every changed file listed in `changes-[iteration].md`. Fix mechanical issues (semicolons, import paths, missing exports) and substantive issues (component structure, accessibility gaps, missing dark mode variants, incorrect patterns). Update `changes-[iteration].md` to reflect modifications. Do not defer fixable concerns — resolve them.

2. **Accessibility verification (Storybook a11y).** Run the Storybook Vitest a11y tests for each affected domain Storybook:

    ```bash
    pnpm vitest run --project {domain}-storybook
    ```

    Replace `{domain}` with the affected domain (e.g., `management`, `today`, `packages`). Run the full project — vitest is fast and domain Storybooks are already scoped. If multiple domains are affected, run each separately.

    For each a11y violation reported:

    a. **Fix first.** Attempt to fix the violation in the source code — adjust colors, add ARIA attributes, fix contrast ratios, improve semantic HTML, etc.
    b. **Re-run.** Run the a11y tests again on the affected stories.
    c. **Suppress only if the fix didn't work.** If the **same violation** (same rule ID on the same element) persists after one fix attempt, add a per-story rule suppression with a justification comment:

    ```tsx
    export const SomeStory: Story = {
        parameters: {
            a11y: {
                config: {
                    rules: [
                        // a11y-suppressed: color-contrast — third-party DatePicker internal element, cannot override
                        { id: "color-contrast", enabled: false },
                    ],
                },
            },
        },
    };
    ```

    d. **Never** suppress rules globally in `preview.tsx`. **Never** suppress without a justification comment. **Never** suppress on the first encounter — always attempt a fix first.
    e. Update `changes-[iteration].md` to reflect any a11y fixes or suppressions added.

    If the Storybook Vitest a11y project is not configured for the affected domain, skip this step and note it in `changes-[iteration].md` under **Notes**.

3. **Escalation check.** Read the **Notes** section of `changes-[iteration].md` for any plan-level concerns A flagged, then investigate the code for brute-force signals: type suppressions (`as any`, `@ts-ignore`), lint-disable comments, wrapper components that exist only to bridge a bad abstraction, or growing complexity relative to the problem being solved. These are indicators to investigate for underlying plan problems, not automatic escalation triggers — a pragmatic `as any` bridging an external library's type gap is not a plan problem.

    **Escalation threshold:** Escalate only when the plan's approach is fundamentally wrong and no amount of code editing can fix it. Examples: the plan decomposed components in a way that makes the required data flow impossible; the plan chose a library that conflicts with the framework; the plan assumed module boundaries that force a cross-module import. Do NOT escalate for: difficulty, missing details the code agent can infer, suboptimal but workable approaches, or issues that the test phase will catch.

    If B identifies a structural issue meeting this threshold, B writes `./tmp/runs/[run-uuid]/escalation-[iteration].md` using this format:

    ```markdown
    # Escalation — Iteration [N]

    ## Problem

    [What about the plan's approach is fundamentally wrong — be specific]

    ## Evidence

    [Code locations, failed patterns, or data flow conflicts that demonstrate the problem]

    ## Proposed alternative

    [How the plan should be revised to fix the structural issue]
    ```

    **Only B can write escalation files.**
