---
name: plantz-adlc-test
description: |
    Validate code quality and verify visual/interactive acceptance criteria. The single validation gate for static checks (lint, module structure, accessibility) and browser-based verification.
    Use when asked to "test the feature", "validate code quality", "run checks", or as part of the ADLC orchestrator's test phase.
license: MIT
---

# ADLC Test

The single validation gate for all code quality. Runs static checks (lint, modules, accessibility) and browser verification (`[visual]`/`[interactive]` acceptance criteria). Does NOT fix issues — only reports them.

## Inputs (provided by orchestrator)

| Input                | Description                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`           | Run folder identifier                                                                                                                       |
| `iteration`          | Current iteration number                                                                                                                    |
| Plan path            | `.adlc/[run-uuid]/plan.md` — needed for acceptance criteria                                                                                 |
| Previous issues path | `null` on iteration 1. On iteration > 1: path to `test-issues-[iteration-1].md`. May not exist if the previous iteration passed all checks. |

## Procedure

1. Read all `.adlc/[run-uuid]/changes-*.md` files (1 through current iteration) to build the cumulative set of affected files. This ensures accessibility checks cover the full feature scope, not just the latest fix.
2. Read these reference files for technology rules and quality standards: `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`.
3. Run `pnpm lint` from the workspace root. This includes typecheck and syncpack. Record any errors.
4. Run `pnpm sizecheck` to check bundle budgets. If it fails, record the full size-limit output in the issues file under `## Bundle size`. Do not attempt to fix or increase budgets — that is the code skill's responsibility.
5. Load the `plantz-validate-modules` skill and validate all modules. Record any failures.
6. **Accessibility review** (static): Load the `accessibility` skill. Review every changed file for WCAG AA violations — focus on semantic HTML, interactive element labelling, form error associations, color-only indicators, and live regions. For each failure, include the file path and element reference so the code skill can act on it.
7. **Browser verification**: Read `plan.md` and extract all `[visual]` and `[interactive]` acceptance criteria. If any exist, follow the browser verification procedure (below) to verify them. Record pass/fail for each criterion.
8. **Workspace tests**: Run `pnpm test` from the workspace root. This runs all workspace test tasks (including Storybook a11y). See the workspace tests procedure (below). This step runs **unconditionally** — it is not gated by `[visual]`/`[interactive]` criteria.
9. **Regression check** (iteration > 1 only): If a previous issues path was provided and that file exists, compare the current iteration's issues with the previous iteration's issues. Any issue in the current run that was NOT present in the previous iteration is a regression introduced by the fix cycle. Prefix these with `⚠️ REGRESSION:` in the issues file so the code skill knows to revert the offending change rather than pile on more fixes. If the previous issues file doesn't exist (previous iteration passed), treat all current issues as regressions.
10. **Always** write the final `## Verification results` section into the latest `changes-[iteration].md` file (add it after `## Notes`), regardless of whether checks passed or failed. The PR skill needs this section to populate the PR. End the section with the completion marker `<!-- test-complete -->` as the very last line — this is how the orchestrator distinguishes "all checks passed" from "subagent crashed." Use this format:

    ```markdown
    ## Verification results

    - ✅ `[static]` criterion text
    - ✅ `[visual]` criterion text
    - ❌ `[visual]` criterion text — what was observed
    - ✅ `[interactive]` criterion text
    - ❌ `[interactive]` criterion text — what was observed

    <!-- test-complete -->
    ```

### Browser verification procedure

**Scope:**

- **Iteration 1:** Verify ALL `[visual]` and `[interactive]` criteria from the plan.
- **Iteration > 1:** Verify only criteria related to files changed in this iteration. Carry forward passing results from the previous iteration's `changes-*.md` for criteria you did not re-verify — copy them with a note "(carried from iteration N)".
- **Indirect regressions:** If this iteration changed shared styles/layouts/utilities, re-verify all criteria that render those elements.

**Phase 0 — Server startup and viewport:**

Start the appropriate dev server (Storybook for story criteria, host app for route criteria). Wait for it to be ready (up to 60 seconds). If it fails to start, skip browser verification and note the failure in `## Verification results`. Set a consistent desktop viewport size before verifying — screenshots vary between runs without one.

**Dark mode verification:**
For dark mode criteria, toggle the `dark` class on the document element via Chrome DevTools MCP, verify the criterion, then toggle back.

**Phase 1 — `[visual]` criteria:**

Navigate to each relevant page, screenshot, and assess pass/fail. For alignment or spacing criteria, zoom into the relevant area — don't rely on a full-page screenshot alone. Record results only — do NOT fix code.

**Phase 2 — `[interactive]` criteria:**

Navigate to each relevant page, perform the interaction, screenshot the result, and assess pass/fail. Record results only — do NOT fix code.

**Phase 3 — Cleanup:**

Stop the dev server when all verifications are complete. Kill the process to avoid orphan servers.

### Workspace tests procedure

Run all workspace tests as a gate check. This includes Storybook a11y tests (axe-core via `@storybook/addon-vitest`) and any other test tasks in the workspace. The code skill already attempted a11y fixes during implementation, so remaining violations are either intentionally suppressed (with justification) or regressions the code skill missed.

1. Run all workspace tests from the workspace root:

    ```bash
    pnpm test
    ```

    This runs `turbo run test`, which executes every package's test task. Turborepo caching ensures unchanged packages are skipped. Each domain Storybook has its own `vitest.config.ts` with the `storybookTest` plugin that runs axe-core a11y checks.

2. If violations are reported, add them to the test issues file under `## Storybook a11y`. For each violation include: story name, rule ID, element selector, and the violation description.
3. If a violation was already reported in the previous iteration's test issues and the code skill attempted a fix: prefix with `⚠️ PERSISTENT:` to signal the code skill to suppress rather than retry.
4. If no violations, record "Pass" in the `## Storybook a11y` section.

## Output

- If **all checks pass** (static, browser, and workspace tests): do NOT create an issues file. The orchestrator uses the `<!-- test-complete -->` marker in `changes-[iteration].md` (written in step 10) to confirm the test ran to completion.
- If **any check fails**: write the issues to `.adlc/[run-uuid]/test-issues-[iteration].md` with this format:

```markdown
# Test Issues — Iteration [N]

## Lint (includes typecheck + syncpack)

- [error details, or "Pass"]

## Bundle size

- [size-limit output if budget exceeded, or "Pass"]

## Module validation

- [failures, or "Pass"]

## Accessibility (code-level)

- `path/to/file.tsx` — @elementRef: [what's wrong and how to fix it], or "Pass"

## Browser verification

- `[visual]` {criterion text} — ❌ fail — {what was observed}
- `[interactive]` {criterion text} — ❌ fail — {what was observed}
- [Or "Pass" if all visual/interactive criteria passed]
- [Or "No visual/interactive criteria in plan." if none exist]

## Storybook a11y

- `StoryName` — {rule-id}: {element selector} — {violation description}
- [Or "Pass" if no violations]
- [Or "Skipped — Storybook a11y not configured for {domain}." if not configured]
```

## Subagent Pattern

**Subagent A** runs static checks (steps 1-6) and writes the test issues file with static results. A does NOT run browser verification or workspace tests.

**Subagent B** has four responsibilities, in order:

1. **Static report review.** Spot-check a sample of A's findings against actual file contents — remove false positives, add missed issues, and correct inaccurate descriptions. Edit the test issues file directly.

2. **Browser verification.** If the plan has `[visual]` or `[interactive]` criteria, follow the browser verification procedure (above) — executing Phase 0 through Phase 3 in order. Record results in the test issues file. B owns browser verification — every `[visual]` and `[interactive]` criterion must have a pass/fail result when B is done.

3. **Workspace tests.** Follow the workspace tests procedure (above) to run `pnpm test`. This runs unconditionally — not gated by `[visual]`/`[interactive]` criteria. Record results in the test issues file under `## Storybook a11y` (for a11y violations) or the appropriate section for other test failures. B owns this step.

4. **Write the completion marker.** B **always** writes the final `## Verification results` section (including the `<!-- test-complete -->` marker) into `changes-[iteration].md` — even if there were no `[visual]`/`[interactive]` criteria to verify. This is how the orchestrator confirms B completed normally.
