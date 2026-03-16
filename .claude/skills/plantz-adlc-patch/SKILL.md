---
name: plantz-adlc-patch
description: |
    Lightweight patch iteration on an existing PR. Applies targeted code fixes, runs tests, and pushes.
    Triggered by the adlc-patch GitHub Actions workflow when a user comments `/patch <feedback>` on a PR.
    Use when running in CI as part of the patch workflow. Do NOT use for local development — use the ADLC orchestrator with `--revise` instead.
license: MIT
---

# ADLC Patch

Apply targeted fixes to an existing PR based on user feedback.

## Step 1 — Understand

1. Read the feedback carefully.
2. Read `.adlc/*/plan.md` if one exists for architectural context.
3. Read the PR diff for context on existing changes.
4. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`, `agent-docs/references/static-analysis.md`, `agent-docs/references/turborepo.md`, `agent-docs/references/typescript.md`.

## Step 2 — Apply Changes

1. Load skills as needed for the specific changes (`accessibility`, `shadcn`, `frontend-design`, `workleap-react-best-practices`, `workleap-squide`, `workleap-web-configs`, `pnpm`).
2. Implement the requested changes.

## Step 3 — Test

Run full workspace checks (no browser verification in patch mode):

1. `pnpm lint` (typecheck + syncpack + oxlint)
2. `pnpm test` (workspace tests including Storybook a11y)
3. `pnpm sizecheck` (bundle budgets)

If any check fails, fix the issues and re-run. If after one fix attempt checks still fail:
- Do NOT retry further.
- Post a failure comment and STOP (do not push):

    ```markdown
    ## Patch Iteration — Failed

    **Your request:** "[user feedback verbatim]"

    Changes were applied but tests failed. The commit was NOT pushed.

    ### Failures
    - [error details]

    You can:
    - Comment `/patch <refined feedback>` to try again
    - Run revise mode locally for complex fixes
    ```

## Step 4 — Commit and Push

Stage, commit, and push. Use commit message `fix: [description based on feedback]` with the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

## Step 5 — Report

Post a success comment:

```markdown
## Patch Iteration

**Your request:** "[user feedback verbatim]"

### Changes
- `path/to/file.tsx` — [what changed]

CI will validate the push.
```

## Hard Constraints

- **Bot comments must never contain the literal string `/patch` unescaped.** Use backtick-escaped references when mentioning the command.
- **This skill runs raw commands (`pnpm lint`, `pnpm test`, `pnpm sizecheck`), NOT the `plantz-adlc-test` skill.**
- **Always include the user's original request text in comments.**
