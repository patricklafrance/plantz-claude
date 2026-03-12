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

| Input       | Description                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `run-uuid`  | Run folder identifier                                                                                                                 |
| Branch name | The branch created in the orchestrator step 2                                                                                         |
| Commit type | `feat`, `fix`, `chore`, `docs`, or `refactor`                                                                                         |
| Plan path   | `./tmp/runs/[run-uuid]/plan.md` — needed for acceptance criteria                                                                      |
| CI attempt  | Current CI fix attempt number (1-3), provided by orchestrator. Used to name `ci-issues-[attempt].md`. Defaults to `1` on first merge. |

## Step 1 — Commit

```bash
git status --short
```

If the working tree is clean (no output), skip Step 1 entirely and proceed to Step 2. This happens on re-entry after a CI fix that required no code changes.

```bash
# Stage all changes (rely on .gitignore to exclude tmp/, .env, etc.)
git add -A
git commit -m "$(cat <<'EOF'
{type}: {description}

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Use the conventional commit type provided by the orchestrator. The description should be a concise summary derived from aggregating all `./tmp/runs/[run-uuid]/changes-*.md` files.

Prefer `git add -A` to stage all changes — `.gitignore` already excludes `tmp/`, `.env`, `node_modules`, and build output. If `git status` shows unexpected files before committing, investigate rather than blindly staging.

## Step 2 — Push and open PR

```bash
git push -u origin {branch-name}

# Check if a PR already exists for this branch
gh pr list --head {branch-name} --json number --jq '.[0].number'
# If a PR exists, skip creation and proceed to Step 3.
```

### PR body template

Before running `gh pr create`, write the PR body to `./tmp/runs/[run-uuid]/pr-body.md` using exactly this three-section structure. No other sections are permitted.

**Section 1 — `## Summary`:** One bullet per logical change. Derive bullets from `changes-*.md` files.

**Section 2 — `## Quality checks`:** Copy these checkboxes. Mark `[x]` only for checks that actually passed during the test phase.

```
- [ ] Lint
- [ ] Module validation
- [ ] Accessibility
- [ ] Visual/interactive verification
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

End the file with:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Create the PR

```bash
gh pr create --title "{type}: {description}" --body-file ./tmp/runs/[run-uuid]/pr-body.md
```

### Post-creation validation

After `gh pr create` succeeds, validate the PR body:

1. Run `gh pr view --json body -q .body` and read the output.
2. Verify the body contains EXACTLY three `##` sections: `Summary`, `Quality checks`, `Verified acceptance criteria`.
3. Verify no extra sections exist (e.g., no `## Test plan`, no `## Changes`).
4. If validation fails, fix `pr-body.md` and run `gh pr edit --body-file ./tmp/runs/[run-uuid]/pr-body.md`. **Do NOT proceed to Step 3 until the body is valid.**

## Step 3 — Monitor PR

### Workflow reference

Not all CI workflows report results the same way. Some report via check run status (the workflow itself fails), while others always exit successfully and post results as **PR comments**.

| Workflow                        | Reports via            | How to check                                                  |
| ------------------------------- | ---------------------- | ------------------------------------------------------------- |
| `CI` (ci.yml)                   | Check run status       | `gh run list` — look for completion + success                 |
| `Code Review` (code-review.yml) | Inline review comments | Handled by orchestrator — **ignore** in CI monitoring         |
| `Smoke Tests` (smoke-tests.yml) | PR comment             | `gh pr view --json comments` — scan for failure indicators    |
| `Chromatic` (chromatic.yml)     | Check run status       | Label-gated — only runs after `run chromatic` label added     |
| `Claude` (claude.yml)           | —                      | Triggered by `@claude` mentions — **ignore** in CI monitoring |

### Polling loop

Poll every 60 seconds, with a maximum wait of 30 minutes per CI cycle. Each poll iteration checks two independent channels:

**Channel 1 — Workflow run status:**

```bash
gh run list --branch {branch} --json name,status,conclusion
```

Filter out `Chromatic`, `Claude`, and `Code review` runs by name. Wait until all remaining workflows (currently: `CI`, `Smoke Tests`) reach `status: "completed"`. If any has `conclusion: "failure"`, that workflow has failed.

**Channel 2 — Bot PR comments:**

```bash
gh pr view {number} --json comments --jq '.comments[] | select(.author.login == "claude[bot]" or .author.login == "github-actions[bot]") | .body'
```

Scan comments **only from known bot authors** (`claude[bot]`, `github-actions[bot]`) for failure indicators: lines containing "❌", or lines where "failed", "FAIL", or "error:" appear in a context indicating an actual failure (not a zero-count like "0 failed"). When in doubt, read the full comment body. **Ignore user comments** — those are code review feedback, not CI results.

**Stabilization check:** After all monitored workflows complete, run **one additional poll cycle** (60 seconds) before declaring "all green." This mitigates the race condition where a workflow completes successfully but its bot comment reporting failures hasn't posted yet (e.g., Smoke Tests always exits 0 but posts failure details as a PR comment).

### Decision flow

1. **CI failure (workflow or bot comment):** If any monitored workflow has `conclusion: "failure"` **or** any bot PR comment reports failures, read the failure logs. Write the errors to `./tmp/runs/[run-uuid]/ci-issues-[attempt].md` using this format, then **stop — do not attempt further actions**. The orchestrator handles the fix cycle.

    ```markdown
    # CI Issues — Attempt [N]

    ## {workflow-name} / {step-name}

    - [error output]

    ## {workflow-name} / {step-name}

    - [error output]
    ```

2. **All green — add Chromatic label:** When all monitored workflows have completed successfully **and** no bot PR comments report failures **and** the stabilization check has passed, add the `run chromatic` label:

    ```bash
    gh pr edit {number} --add-label "run chromatic"
    ```

    Chromatic is label-gated — adding this label triggers the Chromatic workflow.

3. **Monitor Chromatic:** After adding the label, continue polling until the Chromatic workflow completes. If Chromatic succeeds, report success to the orchestrator and **stop**. If Chromatic fails, tag the repository maintainers in the PR asking them to review the visual regressions, report the Chromatic failure to the orchestrator, and **stop**. Chromatic failures are visual regressions that require human review — do not write a `ci-issues` file or attempt automated fixes.

## Hard Constraints

- **The PR body MUST contain exactly three sections: `## Summary`, `## Quality checks`, and `## Verified acceptance criteria`.** No sections may be added, removed, or renamed. The post-creation validation step MUST run and MUST correct the body if it does not conform.

## Subagent Pattern

This skill runs as a **single subagent**. Do not spawn two — git push/commit conflicts are not recoverable. This subagent cannot spawn further subagents. When CI failures require code changes, the merge subagent writes the issues to a file and stops. The orchestrator handles subagent spawning for fixes.
