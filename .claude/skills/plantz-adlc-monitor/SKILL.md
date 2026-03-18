---
name: plantz-adlc-monitor
description: |
    Monitor a PR's CI workflows and fix failures. Adds the "run chromatic" label, polls CI status, and applies automated fixes when workflows fail.
    Use when asked to "monitor the PR", "watch CI", or as part of the ADLC orchestrator's monitor phase.
license: MIT
---

# ADLC Monitor

Monitor CI workflows on a PR, fix failures, and report final status.

## Inputs (provided by orchestrator)

| Input       | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| `run-uuid`  | Run folder identifier                                        |
| PR number   | The PR created by the PR skill                               |
| Branch name | The feature branch                                           |
| Plan path   | `.adlc/[run-uuid]/plan.md` — read only when a failure occurs |

## Procedure

The monitoring loop has a single **30-minute timeout** shared across Phase 1 and Phase 2. Poll every 60 seconds.

1. **Phase 1 — Monitor core workflows.** Monitor: `CI`, `Code Review`, `Smoke Tests`, `Lighthouse CI`. Check both workflow run status and bot PR comments for failure indicators (see Polling channels below).
2. If Phase 1 passes → update the CI Validation comment showing Phase 1 green and Chromatic pending. Add the `run chromatic` label to the PR. Proceed to Phase 2 (the clock keeps running).
3. **Phase 2 — Monitor Chromatic.** Monitor the `Chromatic` workflow. Same polling pattern, same shared timeout.
4. If Phase 2 passes → post the CI Validation comment showing all green. Return success.
5. **On failure (Phase 1 or Phase 2)** → follow the Fix procedure (below). After pushing the fix, re-monitor the current phase (the clock keeps running).
6. **On timeout** (30 minutes elapsed across both phases) → post the CI Validation comment showing which workflows are still running. Return failure.

## Fix procedure

Triggered when any monitored workflow fails. The monitor has a budget of **5 fix attempts** shared across Phase 1 and Phase 2. If the budget is exhausted, post the CI Validation comment showing what failed and return failure.

1. **Load context.** Read the plan file. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`, `agent-docs/references/static-analysis.md`, `agent-docs/references/turborepo.md`, `agent-docs/references/typescript.md`. Always load the `accessibility`, `frontend-design`, `workleap-react-best-practices`, and `workleap-squide` skills. Load each of the following whose description matches the failure context — do not skip a skill you are unsure about: `shadcn`, `workleap-web-configs`, `workleap-logging`, `pnpm`. Context loading only happens once — skip this step on subsequent fix attempts within the same invocation.
2. **Read failure logs.** Download the failed workflow's logs via `gh` CLI. Identify the root cause.
3. **Fix the code.** Edit the source files to address the failure. Stage only the files you modified.
4. **Validate locally.** Run `pnpm lint` and `pnpm test` from the workspace root. If either fails, fix the issue (this does not consume an additional fix attempt — it is part of the current attempt).
5. **Commit and push.** Use the commit message format: `fix(ci): {brief description}`. Include the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.
6. **Post CI Fix Progress comment** (see below) with a summary of what was fixed.
7. Return to the monitoring loop for the current phase.

## Workflow reference

| Workflow                         | Reports via      | Notes                                                 |
| -------------------------------- | ---------------- | ----------------------------------------------------- |
| `CI` (ci.yml)                    | Check run status | Phase 1                                               |
| `Code Review` (code-review.yml)  | Check run status | Phase 1                                               |
| `Smoke Tests` (smoke-tests.yml)  | PR comment       | Phase 1 — scan bot comments for failure indicators    |
| `Lighthouse CI` (lighthouse.yml) | Check run status | Phase 1                                               |
| `Chromatic` (chromatic.yml)      | Check run status | Phase 2 — label-gated, monitored after label is added |
| `Claude` (claude.yml)            | —                | Excluded — triggered by `@claude` mentions, not CI    |

## Polling channels

Each poll iteration checks two independent channels:

**Channel 1 — Workflow run status:**

Query workflow runs for the branch. In Phase 1, filter out `Chromatic` and `Claude` runs by name. Wait until all phase workflows reach `status: "completed"`. If any has `conclusion: "failure"`, that workflow has failed. Track each workflow's status (completed+success, completed+failure, or still running) for the CI Validation comment.

**Channel 2 — Bot PR comments:**

Scan PR comments **only from known bot authors** (`claude[bot]`, `github-actions[bot]`) for failure indicators: lines containing "❌", or lines where "failed", "FAIL", or "error:" appear in a context indicating an actual failure (not a zero-count like "0 failed"). When in doubt, read the full comment body. **Ignore user comments** — those are code review feedback, not CI results.

**Stabilization check:** After all workflows in the current phase complete, run **one additional poll cycle** (60 seconds) before declaring that phase "all green."

## CI Fix Progress comment

When a CI failure is detected and the monitor begins fixing, post a **new** PR comment:

```markdown
## CI Fix — Attempt [N]

Workflow failures detected. Applying automated fixes...
```

After pushing the fix, **edit the same comment** to append a summary of what was fixed:

```markdown
## CI Fix — Attempt [N]

Workflow failures detected. Applying automated fixes...

✅ Fix pushed:

- Fixed type error in `DetailPanel.tsx` — missing `optional` modifier on `onClose` prop
- Fixed oxfmt formatting in `dataHandlers.ts`
```

## CI Validation comment

Post or update a sticky `## CI Validation` PR comment at phase transitions and on exit. Formats:

```markdown
## CI Validation

All workflows completed successfully.

- [x] CI
- [x] Code Review
- [x] Smoke Tests
- [x] Lighthouse CI
- [x] Chromatic
```

```markdown
## CI Validation

- [x] CI
- [ ] Smoke Tests — failed
- [x] Code Review
- [x] Lighthouse CI
- [ ] Chromatic — not started (blocked by Phase 1 failure)
```

```markdown
## CI Validation

- [x] CI
- [x] Code Review
- [x] Smoke Tests
- [x] Lighthouse CI
- [ ] Chromatic — still running
```

```markdown
## CI Validation

⚠️ Not completed — some workflows did not finish within the monitoring window.

- [x] CI
- [ ] Smoke Tests — still running
- [x] Code Review
- [ ] Lighthouse CI — still running
- [ ] Chromatic — not started
```

## Subagent Pattern

This skill runs as a **single subagent**. No A/B protocol — CI fixes are mechanical and do not require a challenger review.
