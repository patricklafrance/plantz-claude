---
name: plantz-sdlc-test
description: |
    Validate code quality and verify visual/interactive acceptance criteria. The single validation gate for static checks (lint, module structure, accessibility) and browser-based verification.
    Use when asked to "test the feature", "validate code quality", "run checks", or as part of the SDLC orchestrator's test phase.
license: MIT
---

# SDLC Test

The single validation gate for all code quality. Runs static checks (lint, modules, accessibility) and browser verification (`[visual]`/`[interactive]` acceptance criteria). Does NOT fix issues — only reports them.

## Inputs (provided by orchestrator)

| Input       | Description              |
| ----------- | ------------------------ |
| `run-uuid`  | Run folder identifier    |
| `iteration` | Current iteration number |

## Procedure

1. Read all `./tmp/runs/[run-uuid]/changes-*.md` files (1 through current iteration) to build the cumulative set of affected files. This ensures accessibility checks cover the full feature scope, not just the latest fix.
2. Read all files in this skill's `references/` directory for technology rules and quality standards.
3. Run `pnpm lint` from the workspace root. This includes typecheck and syncpack. Record any errors.
4. Load the `plantz-validate-modules` skill and validate all modules. Record any failures.
5. **Accessibility review** (static): Load the `accessibility` skill. Review every changed file for WCAG AA violations — focus on semantic HTML, interactive element labelling, form error associations, color-only indicators, and live regions. For each failure, include the file path and element reference so the code skill can act on it.
6. **Browser verification**: Read `plan.md` and extract all `[visual]` and `[interactive]` acceptance criteria. If any exist, follow the browser verification procedure (below) to verify them. Record pass/fail for each criterion.
7. **Always** write the final `## Verification results` section into the latest `changes-[iteration].md` file (add it after `## Notes`), regardless of whether checks passed or failed. The merge skill needs this section to populate the PR.

### Browser verification procedure

**Scope:**

- **Iteration 1:** Verify ALL `[visual]` and `[interactive]` criteria from the plan.
- **Iteration > 1:** Verify only criteria related to files changed in this iteration. Carry forward passing results from the previous iteration's `changes-*.md` for criteria you did not re-verify — copy them with a note "(carried from iteration N)".
- **Indirect regressions:** If this iteration changed shared styles, layouts, or utility components, re-verify all criteria that render those shared elements — not just criteria directly tied to the changed files.

**Server startup:**

1. Decide which server to start: if criteria reference a Storybook story, start the domain Storybook (`pnpm --filter {storybook-package} dev`). If criteria reference an app route, start the host app (`pnpm dev`).
2. Run the server command in the background.
3. Poll the server URL (e.g., `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080`) every 5 seconds, with a 60-second timeout.
4. If the server fails to start within 60 seconds, skip browser verification, note the failure in `## Verification results` ("Server failed to start — verification skipped"), and proceed.

**Dark mode verification:**
For criteria that reference dark mode, use Chrome DevTools MCP `evaluate_script` to toggle the class:

```js
document.documentElement.classList.toggle("dark");
```

Take a screenshot in each mode as needed. Toggle back when done.

**For each criterion:**

1. Navigate to the relevant page using `navigate_page`.
2. For `[interactive]` criteria: perform the interaction (click, type, resize) using the appropriate MCP tool.
3. Take a screenshot using `take_screenshot`.
4. Assess pass/fail based on what is visible.
5. Record the result — do NOT fix code. This skill only reports issues.

**Cleanup:** Stop the dev server when all verifications are complete. Kill the process to avoid orphan servers.

## Output

- If **all checks pass** (static and browser): do NOT create an output file (absence of the file signals success to the orchestrator).
- If **any check fails**: write the issues to `./tmp/runs/[run-uuid]/test-issues-[iteration].md` with this format:

```markdown
# Test Issues — Iteration [N]

## Lint (includes typecheck + syncpack)

- [error details, or "Pass"]

## Module validation

- [failures, or "Pass"]

## Accessibility (code-level)

- `path/to/file.tsx` — @elementRef: [what's wrong and how to fix it], or "Pass"

## Browser verification

- `[visual]` {criterion text} — ❌ fail — {what was observed}
- `[interactive]` {criterion text} — ❌ fail — {what was observed}
- [Or "Pass" if all visual/interactive criteria passed]
- [Or "No visual/interactive criteria in plan." if none exist]
```

## Subagent Pattern

**Subagent A** runs static checks (steps 1-5) and writes the test issues file with static results. A does NOT run browser verification.

**Subagent B** has two responsibilities, in order:

1. **Static report review.** Spot-check a sample of A's findings against actual file contents — remove false positives, add missed issues, and correct inaccurate descriptions. Edit the test issues file directly.

2. **Browser verification.** If the plan has `[visual]` or `[interactive]` criteria, follow the browser verification procedure (above). Record results in the test issues file and write the final `## Verification results` section into `changes-[iteration].md`. B owns browser verification — every `[visual]` and `[interactive]` criterion must have a pass/fail result when B is done.
