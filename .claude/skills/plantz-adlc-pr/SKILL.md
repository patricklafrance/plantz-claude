---
name: plantz-adlc-pr
description: |
    Commit, push, open a PR, and monitor CI. Handles CI failures by returning control to the orchestrator.
    Use when asked to "commit and push", "open a PR", or as part of the ADLC orchestrator's PR phase.
license: MIT
---

# ADLC PR

Commit, push, open a PR, and monitor CI.

## Inputs (provided by orchestrator)

| Input        | Description                                                                                                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`   | Run folder identifier                                                                                                                                                                                                                                                                                |
| Branch name  | The branch created in the orchestrator step 2                                                                                                                                                                                                                                                        |
| Commit type  | Conventional commit prefix: `feat`, `fix`, `chore`, `docs`, or `refactor`                                                                                                                                                                                                                            |
| Plan path    | `.adlc/[run-uuid]/plan.md` — needed for acceptance criteria                                                                                                                                                                                                                                          |
| Iteration    | The final iteration number. To find `## Verification results`, scan backwards from `changes-[iteration].md` through earlier `changes-*.md` files until one contains the section. During CI fix cycles the latest changes file may lack verification results because only the test skill writes them. |
| CI iteration | Current CI fix iteration number (0-3), provided by orchestrator. Used to name `ci-issues-[iteration].md`. Defaults to `0` on first PR creation.                                                                                                                                                      |
| `--revision` | Optional. When set, the PR already exists — edit the body instead of creating a new PR. Append a `## Revision [N]` section and update the footer with the new run UUID.                                                                                                                              |

## Step 1 — Commit

If the working tree is clean, skip to Step 2.

Stage and commit all changes. The `.gitignore` selectively tracks `.adlc/` — only `plan.md` is committed; all other `.adlc/` artifacts are excluded. Use the commit type provided by the orchestrator. The commit message should be a concise summary derived from aggregating all `.adlc/[run-uuid]/changes-*.md` files. Include the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

Investigate unexpected files before staging.

## Step 2 — Push and open PR

Push the branch to origin. If push fails, **stop and write `ci-issues-[iteration].md`** with the error.

If a PR already exists for this branch and `--revision` is NOT set, skip creation and proceed to Step 3.

**When `--revision` is set:** The PR already exists. Do not create a new one. Instead, read the current PR body, count existing `## Revision` sections to determine the revision number N, and append:

```markdown
## Revision [N]

### Summary

- [bullets derived from changes-*.md files for this run]

### Quality checks

[same checkbox format as the original]

### Verified acceptance criteria

[same format, updated for this revision's results]
```

Also update the footer's revise command to use the new run UUID.

Update the PR body and proceed to Step 3.

### PR body template

**Override the default PR body template entirely with the following format.**

**Section 1 — `## Summary`:** One bullet per logical change. Derive bullets from `changes-*.md` files.

**Section 2 — `## Quality checks`:** Copy these checkboxes. To determine pass/fail: read `.adlc/[run-uuid]/test-issues-[iteration].md`. If the file doesn't exist, all checks passed — mark all `[x]`. If it exists, check each section: mark `[x]` only for sections that say "Pass".

```
- [ ] Lint
- [ ] Module validation
- [ ] Accessibility
- [ ] Visual/interactive verification
- [ ] Storybook a11y
```

**Section 3 — `## Verified acceptance criteria`:** Read `plan.md` for acceptance criteria and the latest `changes-*.md` for the `## Verification results` section.

- For `[visual]` and `[interactive]` criteria: copy the pass/fail result from `## Verification results`.
- For `[static]` criteria: mark as ✅ if the final test phase had no static failures.
- If the plan has no acceptance criteria or no verification results, write "No acceptance criteria defined."

Format each criterion as:

```
- ✅ `[tag]` criterion text
- ❌ `[tag]` criterion text — what was observed
```

**Section 4 (conditional) — `## Budget increase`:** Only include this section if any `changes-*.md` file mentions a size-limit budget increase in its Notes section. List: which app, how much (KB gzipped), and why. See `agent-docs/references/bundle-size-budget.md` for the full policy.

**Section 5 (conditional) — `## Exceptions`:** Only include this section if the latest `changes-[iteration].md` has an `## Exceptions` section that is not "None." Copy the entries directly:

```
- **oxlint-disable** `{rule}` in `path/file.tsx:{line}` — {justification}
- **a11y-suppress** `{rule}` in `path/file.stories.tsx:{story}` — {justification}
- **as any** in `path/file.ts:{line}` — {justification}
```

If there are no exceptions, omit this section entirely.

After all sections, add the footer with a visible revise command containing the run UUID.

End with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

### Create the PR

Create the PR with title `{prefix}: {description}`. The body must match this example — no other sections:

````markdown
## Summary

- Added watering schedule editor with weekly/biweekly/monthly options
- Fixed timezone handling in next-watering-date calculation

## Quality checks

- [x] Lint
- [x] Module validation
- [x] Accessibility
- [ ] Visual/interactive verification
- [x] Storybook a11y

## Verified acceptance criteria

- ✅ `[visual]` Schedule editor renders correctly at 375px and 1280px
- ✅ `[interactive]` Selecting "weekly" updates the next watering date
- ❌ `[visual]` Calendar icon aligns with date text — icon is 2px too high

---

> **Need changes?** Two options depending on scope:
>
> **Quick fix** — for small, targeted fixes (typo, style, minor bug). Comment on this PR:
>
> ```
> @claude /fix <your feedback>
> ```
>
> Runs in CI with static checks only (lint, tests, size). No browser verification.
>
> **Full revise** — for broader changes (architecture, multi-file restructuring, new requirements). Run locally:
>
> ```
> /plantz-adlc-orchestrator --revise "your feedback" --previous-run-uuid [run-uuid]
> ```
>
> Re-runs the full pipeline including browser verification. Multiple fix iterations. Appends a "Revision [N]" section to this PR.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

If PR creation fails, retry once. If it fails again, **stop and write `ci-issues-[iteration].md`** with the error. Do not proceed to CI monitoring without a PR.

## Step 3 — Monitor PR

### Workflow reference

Not all CI workflows report results the same way. Some report via check run status (the workflow itself fails), while others always exit successfully and post results as **PR comments**.

| Workflow                         | Reports via      | Notes                                                 |
| -------------------------------- | ---------------- | ----------------------------------------------------- |
| `CI` (ci.yml)                    | Check run status | Monitored                                             |
| `Code Review` (code-review.yml)  | Check run status | Monitored                                             |
| `Smoke Tests` (smoke-tests.yml)  | PR comment       | Monitored — scan bot comments for failure indicators  |
| `Lighthouse CI` (lighthouse.yml) | Check run status | Monitored                                             |
| `Chromatic` (chromatic.yml)      | Check run status | Phase 2 — label-gated, monitored after label is added |
| `Claude` (claude.yml)            | —                | Excluded — triggered by `@claude` mentions, not CI    |

**Phase 1 workflows:** `CI`, `Code Review`, `Smoke Tests`, `Lighthouse CI`. Monitored immediately.

**Phase 2 workflows:** `Chromatic`. Monitored only after the `run chromatic` label is added (see Decision flow).

**Excluded workflows:** `Claude` (triggered by mentions, not CI).

### Polling loop

Poll every 60 seconds, with a maximum wait of 30 minutes per CI cycle. Each poll iteration checks two independent channels:

**Channel 1 — Workflow run status:**

Query workflow runs for the branch. In Phase 1, filter out `Chromatic` and `Claude` runs by name. Wait until all Phase 1 workflows (`CI`, `Code Review`, `Smoke Tests`, `Lighthouse CI`) reach `status: "completed"`. If any has `conclusion: "failure"`, that workflow has failed. Track each workflow's status (completed+success, completed+failure, or still running) for the CI Validation comment.

**Channel 2 — Bot PR comments:**

Scan PR comments **only from known bot authors** (`claude[bot]`, `github-actions[bot]`) for failure indicators: lines containing "❌", or lines where "failed", "FAIL", or "error:" appear in a context indicating an actual failure (not a zero-count like "0 failed"). When in doubt, read the full comment body. **Ignore user comments** — those are code review feedback, not CI results.

**Stabilization check:** After all workflows in the current phase complete, run **one additional poll cycle** (60 seconds) before declaring that phase "all green."

### Decision flow

#### Phase 1 — Core workflows

1. **CI failure (workflow or bot comment):** If any Phase 1 workflow has `conclusion: "failure"` **or** any bot PR comment reports failures, read the failure logs. Write the errors to `.adlc/[run-uuid]/ci-issues-[iteration].md` using this format. Then post a **CI Fix Progress comment** (see below) and **stop**.

    ```markdown
    # CI Issues — Iteration [N]

    ## {workflow-name} / {step-name}

    - [error output]

    ## {workflow-name} / {step-name}

    - [error output]
    ```

2. **All green — proceed to Phase 2:** When all Phase 1 workflows have completed successfully **and** no bot PR comments report failures **and** the stabilization check has passed, add the `run chromatic` label and continue to Phase 2. If a CI Fix Progress comment from a previous iteration exists, **edit it** to append: `✅ CI fixes pushed.`

3. **Not completed:** If the polling loop reaches 30 minutes and some Phase 1 workflows have not completed, post the CI Validation comment showing which workflows are still running, then **stop**. Do not write `ci-issues-[iteration].md`. Do not add the `run chromatic` label.

#### Phase 2 — Chromatic

After adding the `run chromatic` label, resume the polling loop (same 60-second interval, fresh 30-minute timeout) to monitor the `Chromatic` workflow.

1. **Chromatic failure:** If the `Chromatic` workflow completes with `conclusion: "failure"`, read the failure logs. Write the errors to `.adlc/[run-uuid]/ci-issues-[iteration].md`. Then post a **CI Fix Progress comment** (see below) and **stop**.

2. **Chromatic success:** When the `Chromatic` workflow completes successfully and the stabilization check passes, if a CI Fix Progress comment from a previous iteration exists, **edit it** to append: `✅ CI fixes pushed.` Then **stop** — all CI is green.

3. **Not completed:** If 30 minutes elapse and `Chromatic` has not completed, post the CI Validation comment showing Chromatic as still running, then **stop**. Do not write `ci-issues-[iteration].md`.

### CI Fix Progress comment

When a CI failure is detected (Phase 1 or Phase 2), post a **new** PR comment to notify the reviewer that automated fixes are underway:

```markdown
## CI Fix — Iteration [CI iteration + 1]

Workflow failures detected. Applying automated fixes...
```

On the **next** PR skill invocation (after the orchestrator fixes and pushes), look for the most recent `## CI Fix` comment. If one exists, **edit it** to append: `✅ CI fixes pushed.`

This gives reviewers a clear signal that the fix cycle completed and new code is being validated.

### CI Validation comment

Post or update a sticky `## CI Validation` PR comment before exiting. Update it at each phase transition and on exit. Formats:

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

## Hard Constraints

- **The PR body MUST have three mandatory sections: `## Summary`, `## Quality checks`, `## Verified acceptance criteria`.** The only allowed additional sections are `## Budget increase` (conditional — only when a budget was increased), `## Exceptions` (conditional — only when policy suppressions or escalation rejections exist), and `## Revision [N]` (added by revise runs via `--revision`).

## Subagent Pattern

This skill runs as a **single subagent**. When CI failures require code changes, write the issues to a file and stop.
