---
name: plantz-sdlc-merge
description: |
    Commit, push, open a PR, and monitor CI. Handles CI failures and PR comments by returning control to the orchestrator.
    Use when asked to "commit and push", "open a PR", "merge the feature", or as part of the SDLC orchestrator's merge phase.
license: MIT
---

# SDLC Merge

Handle committing, pushing, opening a PR, and monitoring CI. Uses a **single subagent** — concurrent git operations would conflict.

## Inputs (provided by orchestrator)

| Input       | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| `run-uuid`  | Run folder identifier                                            |
| Branch name | The branch created in the orchestrator step 2                    |
| Commit type | `feat`, `fix`, `chore`, `docs`, or `refactor`                    |
| Plan path   | `./tmp/runs/[run-uuid]/plan.md` — needed for acceptance criteria |

## Step 1 — Commit

```bash
git status --short
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
# If no PR exists, create one:
gh pr create --title "{type}: {description}" --body "$(cat <<'EOF'
## Summary
[One bullet per logical change, derived from changes-*.md files]

## Quality checks
- [x] Lint
- [x] Module validation
- [x] Accessibility
- [x] Visual/interactive verification

## Verified acceptance criteria
[Read plan.md and the latest changes-*.md. For each acceptance criterion in the plan,
copy the criterion with its tag and the pass/fail result from the verification results section.
Example:]
- ✅ `[visual]` Today's list renders without delete buttons
- ✅ `[interactive]` Clicking a plant row opens the detail dialog
- ✅ `[static]` PlantListItem accepts optional onDelete prop

[If the plan has no acceptance criteria or no verification results, write "No acceptance criteria defined."]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**IMPORTANT: Use EXACTLY this template structure.** Do not add, remove, or rename sections. The section headers must be `## Summary`, `## Quality checks`, and `## Verified acceptance criteria` — no other sections are permitted. Do not invent a "Test plan" section or any other section. The quality check boxes should reflect actual test results — mark as `[x]` only checks that passed during the test phase.

**How to populate acceptance criteria:**

- `[visual]` and `[interactive]` criteria: copy the pass/fail result from the `## Verification results` section in the latest `changes-*.md` file.
- `[static]` criteria: mark as ✅ if the test phase passed (no `test-issues-*.md` exists for the final iteration, or it was empty). The test phase validates static criteria via lint, typecheck, and module validation — individual static criteria don't have per-item results.
- If the plan has no acceptance criteria, write "No acceptance criteria defined."

### Post-creation validation

After `gh pr create`, read back the PR body with `gh pr view --json body`. Verify:

1. The body contains exactly three `##` sections: Summary, Quality checks, Verified acceptance criteria.
2. No extra sections were added.
   If the body doesn't match, edit it with `gh pr edit --body` to conform.

## Step 3 — Monitor PR

Poll every 60 seconds, with a maximum wait of 30 minutes per CI cycle.

1. **CI failures:** If any GitHub Actions workflow fails, read the failure logs. Write the errors to `./tmp/runs/[run-uuid]/ci-issues-[attempt].md` using this format, then **return control to the orchestrator** by reporting the CI failure and the path to the issues file. The merge subagent does NOT fix CI issues itself — subagents cannot spawn further subagents.

    ```markdown
    # CI Issues — Attempt [N]

    ## {workflow-name} / {step-name}

    - [error output]

    ## {workflow-name} / {step-name}

    - [error output]
    ```

2. **PR comments:** Monitor for 10 minutes after CI goes green. If comments are added during that window, evaluate their legitimacy. For legitimate comments, write them to `./tmp/runs/[run-uuid]/pr-comments-[attempt].md` and **return control to the orchestrator**. After the 10-minute window with no comments, report success to the orchestrator.
3. **Chromatic:** When all workflows except Chromatic are green and all PR comments are resolved, add the `run chromatic` label to the pull request. Chromatic is label-gated — adding this label triggers the Chromatic workflows.
4. **Chromatic failure:** If Chromatic workflows fail, tag the repository maintainers in the PR and ask them to review. Do not attempt to fix Chromatic issues autonomously.

## Subagent Pattern

This skill runs as a **single subagent**. Do not spawn two — git push/commit conflicts are not recoverable. This subagent cannot spawn further subagents. When CI failures or PR comments require code changes, the merge subagent writes the issues to a file and returns control to the orchestrator, which handles subagent spawning.
