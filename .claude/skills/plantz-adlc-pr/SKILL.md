---
name: plantz-adlc-pr
description: |
    Commit, push, and open a PR. Returns the PR number for the monitor skill.
    Use when asked to "commit and push", "open a PR", or as part of the ADLC orchestrator's PR phase.
license: MIT
---

# ADLC PR

Commit, push, and open a PR.

## Inputs (provided by orchestrator)

| Input       | Description                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`  | Run folder identifier                                                                                                                                                   |
| Branch name | The branch created in the orchestrator step 2                                                                                                                           |
| Commit type | Conventional commit prefix: `feat`, `fix`, `chore`, `docs`, or `refactor`                                                                                               |
| Plan path   | `.adlc/[run-uuid]/plan.md` — needed for acceptance criteria                                                                                                             |
| Iteration   | The final iteration number. Read `changes-[Iteration].md` for the `## Verification results` section.                                                                    |
| `--revise`  | Optional. When set, the PR already exists — edit the body instead of creating a new PR. Append a `## Revision [N]` section and update the footer with the new run UUID. |

## Step 1 — Commit

If the working tree is clean, skip to Step 2.

Stage and commit all changes. The `.gitignore` selectively tracks `.adlc/` — only `plan.md` is committed; all other `.adlc/` artifacts are excluded. Use the commit type provided by the orchestrator. The commit message should be a concise summary derived from aggregating all `.adlc/[run-uuid]/changes-*.md` files. Include the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

Investigate unexpected files before staging.

## Step 2 — Push and open PR

Push the branch to origin. If push fails, return failure.

If a PR already exists for this branch and `--revise` is NOT set, skip creation.

**When `--revise` is set:** The PR already exists. Do not create a new one. Instead, read the current PR body, count existing `## Revision` sections to determine the revision number N, and append:

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

Update the PR body.

### PR body template

**Override the default PR body template entirely with the following format.**

**Section 1 — `## Summary`:** One bullet per logical change. Derive bullets from `changes-*.md` files.

**Section 2 — `## Quality checks`:** Copy these checkboxes. To determine pass/fail: read `.adlc/[run-uuid]/test-issues-[Iteration].md`. If the file doesn't exist, all checks passed — mark all `[x]`. If it exists, check each section: mark `[x]` only for sections that say "Pass".

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

**Section 5 (conditional) — `## Exceptions`:** Only include this section if the latest `changes-[Iteration].md` has an `## Exceptions` section that is not "None." Copy the entries directly:

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

If PR creation fails, return failure.

## Hard Constraints

- **The PR body MUST have three mandatory sections: `## Summary`, `## Quality checks`, `## Verified acceptance criteria`.** The only allowed additional sections are `## Budget increase` (conditional — only when a budget was increased), `## Exceptions` (conditional — only when policy suppressions or escalation rejections exist), and `## Revision [N]` (added by revise runs via `--revise`).

## Subagent Pattern

This skill runs as a **single subagent**.
