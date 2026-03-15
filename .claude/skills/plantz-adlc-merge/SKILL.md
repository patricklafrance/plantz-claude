---
name: plantz-adlc-merge
description: |
    Commit, push, open a PR, and monitor CI. Handles CI failures by returning control to the orchestrator.
    Use when asked to "commit and push", "open a PR", "merge the feature", or as part of the ADLC orchestrator's merge phase.
license: MIT
---

# ADLC Merge

Handle committing, pushing, opening a PR, and monitoring CI. Uses a **single subagent** — concurrent git operations would conflict.

## Inputs (provided by orchestrator)

| Input        | Description                                                                                                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`   | Run folder identifier                                                                                                                                                                                                                                                                                |
| Branch name  | The branch created in the orchestrator step 2                                                                                                                                                                                                                                                        |
| Commit type  | Conventional commit prefix: `feat`, `fix`, `chore`, `docs`, or `refactor`                                                                                                                                                                                                                            |
| Plan path    | `./tmp/runs/[run-uuid]/plan.md` — needed for acceptance criteria                                                                                                                                                                                                                                     |
| Iteration    | The final iteration number. To find `## Verification results`, scan backwards from `changes-[iteration].md` through earlier `changes-*.md` files until one contains the section. During CI fix cycles the latest changes file may lack verification results because only the test skill writes them. |
| CI iteration | Current CI fix iteration number (0-3), provided by orchestrator. Used to name `ci-issues-[iteration].md`. Defaults to `0` on first merge.                                                                                                                                                            |

## Step 1 — Commit

If the working tree is clean (`git status --short` produces no output), skip Step 1 and proceed to Step 2.

Stage all changes with `git add -A` (`.gitignore` excludes `tmp/`, `.env`, etc.) and commit. Use the commit type provided by the orchestrator. The description should be a concise summary derived from aggregating all `./tmp/runs/[run-uuid]/changes-*.md` files. Include the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

If `git status --short` shows unexpected files, investigate before staging.

## Step 2 — Push and open PR

Push the branch to origin. If `git push` fails (non-zero exit, "rejected", or network error), **stop and write `ci-issues-[iteration].md`** with the push error. Do not proceed to PR creation — the orchestrator will handle the failure.

Check if a PR already exists for this branch. If so, skip creation and proceed to Step 3.

### PR body template

**This format overrides the default PR body template from the system prompt.** The PR body must use exactly this three-section structure:

**Section 1 — `## Summary`:** One bullet per logical change. Derive bullets from `changes-*.md` files.

**Section 2 — `## Quality checks`:** Copy these checkboxes. To determine pass/fail: read `./tmp/runs/[run-uuid]/test-issues-[iteration].md`. If the file doesn't exist, all checks passed — mark all `[x]`. If it exists, check each section: mark `[x]` only for sections that say "Pass".

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

End with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

### Create the PR

Create the PR with `gh pr create --title "{prefix}: {description}"`. The body must match this example — no other sections:

```markdown
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

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

If `gh pr create` fails, retry once. If it fails again, **stop and write `ci-issues-[iteration].md`** with the error. Do not proceed to CI monitoring without a PR.

## Step 3 — Monitor PR

### Workflow reference

Not all CI workflows report results the same way. Some report via check run status (the workflow itself fails), while others always exit successfully and post results as **PR comments**.

| Workflow                         | Reports via      | Notes                                                |
| -------------------------------- | ---------------- | ---------------------------------------------------- |
| `CI` (ci.yml)                    | Check run status | Monitored                                            |
| `Code Review` (code-review.yml)  | Check run status | Monitored                                            |
| `Smoke Tests` (smoke-tests.yml)  | PR comment       | Monitored — scan bot comments for failure indicators |
| `Lighthouse CI` (lighthouse.yml) | Check run status | Monitored                                            |
| `Chromatic` (chromatic.yml)      | Check run status | Excluded — label-gated, runs after merge skill exits |
| `Claude` (claude.yml)            | —                | Excluded — triggered by `@claude` mentions, not CI   |

**Monitored workflows:** `CI`, `Code Review`, `Smoke Tests`, `Lighthouse CI`. These are tracked in the CI Validation comment.

**Excluded workflows:** `Chromatic` (label-gated, runs after merge skill exits), `Claude` (triggered by mentions, not CI).

### Polling loop

Poll every 60 seconds, with a maximum wait of 30 minutes per CI cycle. Each poll iteration checks two independent channels:

**Channel 1 — Workflow run status:**

Query workflow runs for the branch. Filter out `Chromatic` and `Claude` runs by name. Wait until all monitored workflows (`CI`, `Code Review`, `Smoke Tests`, `Lighthouse CI`) reach `status: "completed"`. If any has `conclusion: "failure"`, that workflow has failed. Track each workflow's status (completed+success, completed+failure, or still running) for the CI Validation comment.

**Channel 2 — Bot PR comments:**

Scan PR comments **only from known bot authors** (`claude[bot]`, `github-actions[bot]`) for failure indicators: lines containing "❌", or lines where "failed", "FAIL", or "error:" appear in a context indicating an actual failure (not a zero-count like "0 failed"). When in doubt, read the full comment body. **Ignore user comments** — those are code review feedback, not CI results.

**Stabilization check:** After all monitored workflows complete, run **one additional poll cycle** (60 seconds) before declaring "all green." This mitigates the race condition where a workflow completes successfully but its bot comment reporting failures hasn't posted yet (e.g., Smoke Tests always exits 0 but posts failure details as a PR comment).

### Decision flow

1. **CI failure (workflow or bot comment):** If any monitored workflow has `conclusion: "failure"` **or** any bot PR comment reports failures, read the failure logs. Write the errors to `./tmp/runs/[run-uuid]/ci-issues-[iteration].md` using this format, then **stop — do not attempt further actions**. The orchestrator handles the fix cycle.

    ```markdown
    # CI Issues — Iteration [N]

    ## {workflow-name} / {step-name}

    - [error output]

    ## {workflow-name} / {step-name}

    - [error output]
    ```

2. **All green — add Chromatic label and report success:** When all monitored workflows have completed successfully **and** no bot PR comments report failures **and** the stabilization check has passed, add the `run chromatic` label and **stop**. Do **not** wait for Chromatic to complete — visual regressions require human review. Report success after adding the label.

3. **Not completed:** If the polling loop reaches 30 minutes and some monitored workflows have not completed, post the CI Validation comment showing which workflows are still running, then **stop**. Do not write `ci-issues-[iteration].md`. Do not add the `run chromatic` label. The remaining workflows will resolve on their own via GitHub's checks.

### CI Validation comment

**Always** post a sticky PR comment before exiting, regardless of outcome. This is a snapshot of what the agent observed at the time it stopped monitoring.

**Sticky behavior:** Before posting, search for an existing comment starting with `## CI Validation` on the PR. If found, update it in place. If not found, create a new one. This avoids clutter across CI iterations.

**Comment format — all workflows completed successfully:**

```markdown
## CI Validation

All monitored workflows completed successfully.

- [x] CI
- [x] Code Review
- [x] Smoke Tests
- [x] Lighthouse CI
```

**Comment format — one or more workflows failed:**

```markdown
## CI Validation

- [x] CI
- [ ] Smoke Tests — failed
- [x] Code Review
- [x] Lighthouse CI
```

**Comment format — agent timed out before all workflows finished:**

```markdown
## CI Validation

⚠️ Not completed — some workflows did not finish within the monitoring window.

- [x] CI
- [ ] Smoke Tests — still running
- [x] Code Review
- [ ] Lighthouse CI — still running
```

**Checklist entries:** One line per monitored workflow (`CI`, `Code Review`, `Smoke Tests`, `Lighthouse CI`). Use `- [x]` for completed+success, `- [ ] Name — failed` for completed+failure, `- [ ] Name — still running` for workflows that did not complete.

**Post the comment before executing the terminal action** (adding the `run chromatic` label on success, or writing `ci-issues-[iteration].md` on failure/timeout).

## Hard Constraints

- **The PR body MUST have exactly three sections: `## Summary`, `## Quality checks`, `## Verified acceptance criteria`.** The only allowed additional section is `## Budget increase` (conditional — only when a budget was increased).

## Subagent Pattern

This skill runs as a **single subagent**. Do not spawn two — git push/commit conflicts are not recoverable. This subagent cannot spawn further subagents. When CI failures require code changes, the merge subagent writes the issues to a file and stops. The orchestrator handles subagent spawning for fixes.
