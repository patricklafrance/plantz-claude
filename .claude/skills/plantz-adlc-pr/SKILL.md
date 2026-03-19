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

| Input         | Description                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `run-uuid`    | Run folder identifier                                                                                             |
| `branch-name` | The branch created in the orchestrator step 2                                                                     |
| `commit-type` | Conventional commit prefix: `feat`, `fix`, `chore`, `docs`, or `refactor`                                         |
| `iteration`   | The final code-test iteration number. Read `verification-results-[iteration].md` for acceptance criteria results. |

## Step 1 — Commit

If the working tree is clean, skip to Step 2.

Stage and commit all changes. The `.gitignore` excludes the `.adlc/` directory. Use the commit type provided by the orchestrator. The commit message should be a concise summary derived from aggregating all `.adlc/[run-uuid]/changes-*.md` files. Include the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

Investigate unexpected files before staging.

## Step 2 — Push and open PR

Push the branch to origin. If push fails, return failure.

If a PR already exists for this branch, skip creation.

### PR body template

**Override the default PR body template entirely with the following format.**

**Section 1 — `## Summary`:** One bullet per logical change. Derive bullets by aggregating all `changes-*.md` files (iterations 1 through final). Deduplicate across iterations — if iteration 2 fixed something iteration 1 introduced, use the final state.

**Section 2 — `## Quality checks`:** Copy these checkboxes. To determine pass/fail: read `.adlc/[run-uuid]/test-issues-[iteration].md`. If the file doesn't exist, all checks passed — mark all `[x]`. If it exists, check each section: mark `[x]` only for sections that say "Pass".

```
- [ ] Lint (includes typecheck + syncpack)
- [ ] Bundle size
- [ ] Module validation
- [ ] Dead code (Knip)
- [ ] Accessibility (code-level)
- [ ] Browser verification
- [ ] Storybook a11y
```

**Section 3 — `## Verified acceptance criteria`:** Read `.adlc/[run-uuid]/verification-results-[iteration].md`. Copy all criteria (static, visual, and interactive) with their pass/fail results directly from that file. If the plan has no acceptance criteria or the file doesn't exist, write "No acceptance criteria defined."

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

End with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

### Create the PR

Create the PR with title `{prefix}: {description}`. The body must match this example — no other sections:

````markdown
## Summary

- Added watering schedule editor with weekly/biweekly/monthly options
- Fixed timezone handling in next-watering-date calculation

## Quality checks

- [x] Lint (includes typecheck + syncpack)
- [x] Bundle size
- [x] Module validation
- [x] Dead code (Knip)
- [x] Accessibility (code-level)
- [ ] Browser verification
- [x] Storybook a11y

## Verified acceptance criteria

- ✅ `[visual]` Schedule editor renders correctly at 375px and 1280px
- ✅ `[interactive]` Selecting "weekly" updates the next watering date
- ❌ `[visual]` Calendar icon aligns with date text — icon is 2px too high

---

> **Need changes?** Comment on this PR:
>
> ```
> @claude /fix <your feedback>
> ```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

If PR creation fails, return failure.

## Hard Constraints

- **The PR body MUST have three mandatory sections: `## Summary`, `## Quality checks`, `## Verified acceptance criteria`.** The only allowed additional sections are `## Budget increase` (conditional — only when a budget was increased) and `## Exceptions` (conditional — only when policy suppressions exist).

## Subagent Pattern

This skill runs as a **single subagent**.
