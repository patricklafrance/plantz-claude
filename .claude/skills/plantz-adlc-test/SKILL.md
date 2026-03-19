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

| Input       | Description                        |
| ----------- | ---------------------------------- |
| `run-uuid`  | Run folder identifier              |
| `iteration` | Current code-test iteration number |

## Procedure

1. Read all `.adlc/[run-uuid]/changes-*.md` files (1 through current iteration) to build the cumulative set of affected files. When a file appears in multiple iterations, use its latest state — if created then deleted, exclude it from the set. This ensures accessibility checks cover the full feature scope, not just the latest fix. If `iteration > 1`, also read the previous iteration's issues file (`.adlc/[run-uuid]/test-issues-[iteration-1].md`) to enable regression classification in the output (see Output section).
2. Read `agent-docs/references/color-mode.md` (needed for dark mode screenshot assessment).
3. Run `pnpm lint` from the workspace root. This includes typecheck, syncpack, oxlint, and Knip. Record any errors (including Knip dead-code findings that overlap with files in the cumulative affected set from step 1 — ignore pre-existing dead code).
4. Run `pnpm sizecheck` to check bundle budgets. If it fails, record the full size-limit output in the issues file under `## Bundle size`. Do not attempt to fix or increase budgets — that is the code skill's responsibility.
5. Load the `plantz-validate-modules` skill and validate all modules. Record any failures.
6. **Accessibility review** (static): Load the `accessibility` and `agent-browser` skills. Review every changed file for WCAG AA violations that are verifiable by reading source code — focus on semantic HTML, interactive element labelling, form error associations, color-only indicators, and live regions. Do NOT attempt to verify rendering-dependent properties (color contrast, font sizes, focus ring visibility) by reading code — those are covered by Storybook a11y tests via axe-core in step 9. For each failure, include the file path and element reference so the code skill can act on it.
7. **Static criteria evaluation**: Read all `[static]` acceptance criteria from the plan. For each, determine whether it passed based on the results of steps 3-6 (lint, sizecheck, module validation, accessibility review). Map each criterion to the check that verifies it and record pass/fail. Include results in the verification results file.
8. **Browser verification**: Read `plan.md` and extract all `[visual]` and `[interactive]` acceptance criteria. If any exist, follow the browser verification procedure (below) to verify them. Record pass/fail for each criterion.
9. **Workspace tests**: Run `pnpm test` from the workspace root. This runs all workspace test tasks (including Storybook a11y). See the workspace tests procedure (below). This step runs **unconditionally** — it is not gated by `[visual]`/`[interactive]` criteria.
10. **Always** write `.adlc/[run-uuid]/verification-results-[iteration].md`, regardless of whether checks passed or failed. The PR skill reads this file to populate the PR body. Use this format:

    ```markdown
    # Verification Results — Iteration [N]

    - ✅ `[static]` criterion text
    - ✅ `[visual]` criterion text
    - ❌ `[visual]` criterion text — what was observed
    - ✅ `[interactive]` criterion text
    - ❌ `[interactive]` criterion text — what was observed
    ```

### Browser verification procedure

**Scope:** Verify ALL `[visual]` and `[interactive]` criteria from the plan on every iteration.

**Phase 0 — Server startup and viewport:**

Run `pnpm dev-host` for route criteria, or `pnpm dev-storybook` for story criteria. Wait for it to be ready (up to 90 seconds). If it fails to start, stop — the orchestrator will detect the missing output and follow failure handling. Set a consistent desktop viewport size before verifying — screenshots vary between runs without one.

**Dark mode verification:**
For dark mode criteria, toggle the `dark` class on the document element via agent-browser, wait 200ms for CSS transitions to settle, then verify the criterion and toggle back.

**Retry on failure:** If any visual or interactive criterion fails on first verification, wait 5 seconds for pending renders or animations to complete, then re-verify once (re-screenshot and re-assess). Record the second result as the final pass/fail. This single retry handles transient timing issues (slow renders, animation delays, React batching) without masking real failures.

**Phase 1 — `[visual]` criteria:**

Navigate to each relevant page, screenshot, and assess pass/fail. For alignment or spacing criteria, zoom into the relevant area — don't rely on a full-page screenshot alone. Record results only — do NOT fix code.

**Phase 2 — `[interactive]` criteria:**

For each `[interactive]` criterion, verify the full action-to-outcome chain — not just that the action can be triggered:

1. Navigate to the relevant page and screenshot the **before** state.
2. Perform the interaction (click, submit, etc.).
3. Wait for the UI to settle — target the expected DOM change (element appearing, disappearing, or value updating) with a reasonable timeout.
4. Screenshot the **after** state.
5. Assess pass/fail by comparing before and after: the specific outcome described in the criterion must be visible in the after screenshot. If the criterion says "removes the suggestion from view," the suggestion must be gone. If it says "dialog reflects the updated frequency," the new value must be visible. If it says "without closing the dialog," the dialog must still be open.

A single post-action screenshot cannot prove the action caused the change — the before/after pair is the minimum evidence. Never mark a criterion as passing because the action triggered without error; the described outcome must be confirmed in the after screenshot. An action that fires but produces no visible UI change is a failure.

Record results only — do NOT fix code.

**Phase 3 — Cleanup:**

Stop the dev server and kill the process to avoid orphan servers. **Phase 3 runs regardless of verification outcomes** — if any criterion failed, still execute cleanup before proceeding to step 10.

### Workspace tests procedure

Run all workspace tests as a gate check. This includes Storybook a11y tests (axe-core via `@storybook/addon-vitest`) and any other test tasks in the workspace. The code skill already attempted a11y fixes during implementation, so remaining violations are either intentionally suppressed (with justification) or regressions the code skill missed.

1. Run all workspace tests from the workspace root:

    ```bash
    pnpm test
    ```

    This runs `turbo run test`, which executes every package's test task. Turborepo caching ensures unchanged packages are skipped. Each domain Storybook has its own `vitest.config.ts` with the `storybookTest` plugin that runs axe-core a11y checks.

2. If violations are reported, add them to the test issues file under `## Storybook a11y`. For each violation include: story name, rule ID, element selector, and the violation description.
3. If no violations, record "Pass" in the `## Storybook a11y` section.

## Output

- If **all checks pass** (static, browser, and workspace tests): do NOT create an issues file.
- If **any check fails**: write the issues to `.adlc/[run-uuid]/test-issues-[iteration].md` with this format.

**Regression classification** (iteration > 1 only): When writing the issues file, compare each failing issue against the previous iteration's issues file. Tag each issue with exactly one label:

- `[persistent]` — same issue appeared in the previous iteration (fix didn't work). Match by specific error message and file location, not by file or section alone — a different error in the same file is `[new]`, not `[persistent]`.
- `[regressed]` — this check passed in the previous iteration but fails now (fix broke it)
- `[new]` — issue was not present in the previous iteration and is not a regression of a previously passing check (e.g., a new check that now applies, or a newly introduced code path)

On iteration 1, omit tags — all issues are implicitly new.

```markdown
# Test Issues — Iteration [N]

## Lint (includes typecheck, syncpack, oxlint, Knip)

- [error details, or "Pass"] [persistent|regressed|new]

## Bundle size

- [size-limit output if budget exceeded, or "Pass"] [persistent|regressed|new]

## Module validation

- [failures, or "Pass"] [persistent|regressed|new]

## Accessibility (code-level)

- `path/to/file.tsx` — @elementRef: [what's wrong and how to fix it] [persistent|regressed|new], or "Pass"

## Browser verification

- `[visual]` {criterion text} — ❌ fail — {what was observed} [persistent|regressed|new]
- `[interactive]` {criterion text} — ❌ fail — {what was observed} [persistent|regressed|new]
- [Or "Pass" if all visual/interactive criteria passed]
- [Or "No visual/interactive criteria in plan." if none exist]

## Storybook a11y

- `StoryName` — {rule-id}: {element selector} — {violation description} [persistent|regressed|new]
- [Or "Pass" if no violations]
- [Or "Skipped — Storybook a11y not configured for {domain}." if not configured]
```

## Subagent Pattern

**Subagent A** runs static checks and static criteria evaluation (steps 1-7) and writes the test issues file with static results. A does NOT run browser verification or workspace tests.

**Subagent B** has four responsibilities, in order:

1. **Static report review.** Spot-check a sample of A's findings against actual file contents — remove false positives, add missed issues, and correct inaccurate descriptions. Edit the test issues file directly.
2. **Browser verification.** If the plan has `[visual]` or `[interactive]` criteria, follow the browser verification procedure (above) — executing Phase 0 through Phase 3 in order. Record results in the test issues file. B owns browser verification — every `[visual]` and `[interactive]` criterion must have a pass/fail result when B is done.
3. **Workspace tests.** Follow the workspace tests procedure (above) to run `pnpm test`. This runs unconditionally — not gated by `[visual]`/`[interactive]` criteria. Record results in the test issues file under `## Storybook a11y` (for a11y violations) or under a new `## Workspace tests (other)` section for non-a11y test failures. B owns this step.
4. **Write the verification results.** B **always** writes `.adlc/[run-uuid]/verification-results-[iteration].md` — even if there were no `[visual]`/`[interactive]` criteria to verify.
