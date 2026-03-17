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

| Input                    | Description                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`               | Run folder identifier                                                                                                                                   |
| `iteration`              | Current iteration number (starts at 1). This is the iteration the agent will **write** to (`changes-[iteration].md`).                                   |
| Plan path                | Always provided — `.adlc/[run-uuid]/plan.md`                                                                                                            |
| Issues path              | `null` on iteration 1. On fix cycles: the path to the issues file — either `test-issues-*.md` (from test phase) or `ci-issues-*.md` (from CI failures). |
| Changes path             | `null` on iteration 1. On fix cycles: the explicit path to the **previous** iteration's changes file (e.g., `changes-1.md` when `iteration=2`).         |
| Architecture review path | `null` if the architect step crashed. Otherwise `.adlc/[run-uuid]/architecture-review.md`. Provided on every code invocation, not just iteration 1.     |
| Escalation context       | `null` unless the orchestrator rejected a previous escalation. If provided: path to the rejected escalation file from a prior iteration.                |

## Mode

This skill runs in one of two modes, determined by the inputs:

- **Plan mode** (`iteration=1`, issues path is `null`): Implement the feature from scratch based on the plan.
- **Fix mode** (`iteration>1`, issues path provided): Fix specific issues from the test phase or CI. The plan is still read for context, but the issues file drives the work.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`, `agent-docs/references/static-analysis.md`, `agent-docs/references/turborepo.md`, `agent-docs/references/typescript.md`.
2. Always load the `accessibility`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills. Load each of the following whose description matches the plan's affected packages or the issues file's affected files — do not skip a skill you are unsure about: `shadcn`, `workleap-web-configs`, `workleap-logging`, `pnpm`.
3. Read the plan file for architectural context. If an architecture review path is provided and the file exists, read it. Precedence between the two:
    - **Architect wins on explicit structure.** When the review names a specific interface, signature, component boundary, data flow location, or file, that specification is authoritative — implement it as written regardless of what the plan says about the same topic.
    - **Plan wins on everything else.** If the review does not address something, the plan governs. Silence in the review is not permission to deviate from the plan.
    - **Recommendations are advisory.** Anything under `## Recommendations` is informational. If a recommendation conflicts with the plan's File Changes, follow the plan and flag the conflict in Notes for Subagent B's escalation check.
      In **fix mode**, re-read the review to ensure fixes don't regress architectural contracts. If a test failure requires changing a signature that the architect review designates as authoritative, do not change the signature — note the conflict in `changes-[iteration].md` under Notes for B to evaluate.
4. **Fix mode only — assess before coding.** Read the issues file and previous changes file. If an escalation context path is provided, read it — the orchestrator rejected this escalation, meaning the plan's approach is considered viable. Do not re-escalate for the same structural concern; if the same problem surfaces again, work around it within the plan's constraints and document the workaround in Notes. Read every issue and attempt all fixes. For any fix where the plan's approach seems fundamentally mismatched — the plan assumed a component decomposition or data flow that doesn't work, a library choice is fighting the framework, or the fix requires cross-module access the plan didn't anticipate — explain the specific concern in `changes-[iteration].md` under **Notes** (what about the plan is wrong, not just "this is hard"). Fix the issue anyway to the best of your ability. This does not override the architect contract constraint in step 3 — if a fix requires changing an architect-authoritative signature, note the conflict rather than changing the signature. **Only Subagent B writes escalation files** — A never escalates directly.
5. **Plan mode only:** If the plan requires scaffolding a new module, load and use the `plantz-scaffold-domain-module` skill. If it requires a new Storybook, use `plantz-scaffold-domain-storybook`.
6. **Start the dev server or Storybook before implementing.** Run the appropriate root script for the affected package — `pnpm dev-host` for app routes, or the matching `pnpm dev-{domain}-storybook` for stories (e.g., `pnpm dev-today-storybook`). Use Chrome DevTools MCP tools to see what you're building as you go. If the dev server or Storybook fails to start within 60 seconds, stop implementation — do not produce `changes-[iteration].md`. The orchestrator will detect the missing file and follow failure handling. Implement in dependency order: shared packages (`@packages/*`) first since modules consume them, then complete each affected module end-to-end (data layer → components → integration) before moving to the next module. Verify each module works in the browser before starting the next. Follow all technology rules from the `agent-docs/references/` files read in step 1.
7. Write a summary of all changes to `.adlc/[run-uuid]/changes-[iteration].md`. **Plan mode only:** before writing, review your implementation for any choice where a reasonable reviewer might pick differently — state placement, component boundaries, data flow, patterns that look wrong but are intentional, alternatives you tried and rejected. Document these in the **Decisions & Trade-offs** section. Zero entries is fine if the implementation was straightforward; aim for 2-5 when there are genuine trade-offs. Fix iterations skip this section.

## Changes File Format

Organize changes by package, matching the plan's File Changes structure. List shared packages (`@packages/*`) before modules (`@modules/*`) before apps. Within each package, list files in dependency order. Prefix each entry with Created, Modified, or Deleted.

```markdown
# Changes — Iteration [N]

## `@packages/core-plants`

- Created `src/careEventTypes.ts` — type definitions for care events
- Created `src/careEventSchema.ts` — zod schema with date coercion
- Created `src/CareEventBadge.tsx` — badge component for care event type
- Created `src/CareEventBadge.stories.tsx` — stories with all event types

## `@modules/today-landing-page`

- Created `src/mocks/careEventHandlers.ts` — MSW handlers for care history endpoint
- Modified `src/plantsCollection.ts` — added care events to plant detail query
- Created `src/PlantCareSection.tsx` — care history section for plant detail dialog
- Created `src/PlantCareSection.stories.tsx` — stories with empty/populated states
- Modified `src/PlantDetailDialog.tsx` — integrated PlantCareSection

## Dependencies added

- `package-name` in `workspace-package` — [why needed]

## Decisions & Trade-offs

[Choices where a reasonable reviewer might pick a different approach. For each: what you chose, the alternative considered, and why. Omit in fix iterations.]

## Notes

[Anything the test or document phases should know about]

## Exceptions

[List every policy suppression or override introduced in this iteration. For each: the suppression type, file and location, and justification. If none, write "None."]

- `oxlint-disable-next-line {rule}` in `path/file.tsx:{line}` — {justification}
- `a11y-suppress {rule}` in `path/file.stories.tsx:{story}` — {justification}
- `as any` in `path/file.ts:{line}` — {justification}
```

## Hard Constraints

- **Subagent A MUST have the dev server or Storybook running during implementation** (see Procedure step 6). Stop the server when implementation is complete to avoid orphan processes.
- **Modules MUST NOT import from each other.** No direct imports, no subpath exports, no re-exports, no workarounds. This is absolute — no exceptions.
- If you discover that code needs to be shared between modules during implementation: prefer duplication if the surface area is small; extract to a package under `packages/` (e.g., `@packages/core-plants`) when it's large enough to justify the indirection. Never create an import from one `@modules/*` package to another.

## Subagent Pattern

**Subagent A** implements the full change set and writes `changes-[iteration].md`. If A encounters plan-level concerns in fix mode, it flags them in the **Notes** section for B to evaluate.

**Subagent B** reviews and improves A's work.

Start by reading the **plan file** to form independent expectations of what the code should look like — A's decisions are context, not justification.

**Fix threshold.** Fix code that violates the plan, an ADR/ODR, or a loaded skill's rules. Do not rewrite working code that follows a valid alternative pattern — note disagreements in Notes if they matter for future iterations.

**Decisions preservation.** When editing `changes-[iteration].md`, amend A's Decisions entries rather than deleting them. Annotate with `**B:**` — confirm, qualify, or override with an explanation.

B has five responsibilities, in order:

1. **Code review.** In plan mode, cross-check the plan's File Changes section against A's changes file — flag missing files, unexpected files, or decomposition that diverges from the plan. Then read every changed file. Fix mechanical issues and substantive issues (plan deviations, component structure, accessibility gaps, missing dark mode variants, incorrect patterns). If an architecture review exists, verify that each component, hook, or utility listed in its Interface Contracts section matches the implemented signature. Fix mismatches directly and note fixes in `changes-[iteration].md`. Update `changes-[iteration].md` to reflect modifications. Do not defer fixable concerns — resolve them. While reviewing, collect every policy suppression or override (`oxlint-disable`, `a11y-suppress` / a11y rule disabled in story parameters, `as any`, `@ts-ignore`) into the `## Exceptions` section of `changes-[iteration].md`. Include the suppression type, file path with line or story name, and justification from the inline comment. If no exceptions exist, write "None."

2. **Loading performance review.** For every changed file that adds or modifies data fetching, route definitions, or component imports: verify compliance with the `workleap-react-best-practices` skill's **async-rules** and **bundle-rules**, and flag unnecessary loading states. Fix violations directly and note fixes in `changes-[iteration].md` under **Notes**.

3. **Dependency review.** If A added new dependencies (check `changes-[iteration].md` `## Dependencies added` and `package.json` diffs): verify each dependency is necessary, use the `pnpm` skill to check if the workspace already provides the capability, and evaluate whether a lighter or tree-shakeable alternative exists. Remove unjustified dependencies. Never approve a new dependency without verifying it is not duplicating an existing one. When fixing bundle budget failures, follow `agent-docs/references/bundle-size-budget.md` — never increase a budget without optimizing first.

4. **Run workspace tests.** Run all workspace tests from the workspace root:

    ```bash
    pnpm test
    ```

    This runs `turbo run test`, which executes every package's test task. Turborepo caching ensures unchanged packages are skipped. Each domain Storybook has its own `vitest.config.ts` with the `storybookTest` plugin that runs axe-core a11y checks.

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

5. **Escalation check.** Read the **Notes** section of `changes-[iteration].md` for any plan-level concerns A flagged, then investigate the code for brute-force signals: type suppressions (`as any`, `@ts-ignore`), lint-disable comments, wrapper components that exist only to bridge a bad abstraction, or growing complexity relative to the problem being solved. These are indicators to investigate for underlying plan problems, not automatic escalation triggers — a pragmatic `as any` bridging an external library's type gap is not a plan problem.

    **Escalation threshold:** Escalate only when the plan's approach is fundamentally wrong and no amount of code editing can fix it. Examples: the plan decomposed components in a way that makes the required data flow impossible; the plan chose a library that conflicts with the framework; the plan assumed module boundaries that force a cross-module import. Do NOT escalate for: difficulty, missing details the code agent can infer, suboptimal but workable approaches, or issues that the test phase will catch.

    Gray-zone verdicts:
    - The plan works but requires creating multiple wrapper components that exist only to bridge an abstraction mismatch → **escalate** (the abstraction is wrong, not just verbose).
    - The plan works but the resulting code is significantly longer than an alternative approach → do **NOT** escalate (suboptimal but functional).
    - A test fix requires changing an interface the architect review designated as authoritative → do **NOT** escalate (note the conflict for B, per step 3).

    If B identifies a structural issue meeting this threshold, B writes `.adlc/[run-uuid]/escalation-[iteration].md` using this format:

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
