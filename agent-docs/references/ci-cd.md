# CI/CD Reference

Seven GitHub Actions workflows in `.github/workflows/`:

| File                   | Purpose                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `ci.yml`               | Secret scan, build, size-limit, oxlint, typecheck, syncpack, test on PRs and main pushes |
| `lighthouse.yml`       | Lighthouse CI — performance gate (error below 0.5, 3 runs, median)                       |
| `chromatic.yml`        | Visual regression via Chromatic                                                          |
| `claude.yml`           | Claude Code agent for issue/PR comments and `/fix` iteration                             |
| `code-review.yml`      | Automated PR code review via Claude                                                      |
| `audit-agent-docs.yml` | Weekly agent-docs freshness audit                                                        |
| `smoke-tests.yml`      | Smoke-test the host app on PRs via Claude                                                |

Read the YAML files directly for triggers, steps, and concurrency rules.

## Claude workflow

`claude.yml` is the unified entry point for all `@claude` interactions. It handles two modes, routed by `.github/prompts/claude.md`:

- **General mode** — triggered by `@claude` mentions on issues, PR comments, and reviews. Responds to questions, suggestions, and code changes.
- **Fix mode** — triggered by `@claude /fix <feedback>` on PR comments. Applies targeted fixes, runs tests, commits, and posts a structured report.

**Trigger:** `issue_comment`, `pull_request_review_comment`, `pull_request_review`, `issues` (opened/assigned) — all require `@claude` in the comment body.

**Auth gating:** All triggers require OWNER/MEMBER/COLLABORATOR association. Bot comments are excluded to prevent re-trigger loops.

**Concurrency:** `claude-${{ comment.id || review.id || issue.number || run_id }}` with `cancel-in-progress: true`. Keyed by comment ID (not issue number) so that unrelated comments on the same PR don't cancel in-progress Claude runs.

**Beyond fix scope:** If the required changes exceed what `/fix` can handle, the agent posts a comment explaining the scope and suggests the user address it manually or re-run the full orchestrator.

## Chromatic label gate

PRs require the `run chromatic` label to trigger `chromatic.yml`. Without it, the workflow exits early. The label is automatically removed after Chromatic completes.

## Affected Storybook detection

`scripts/getAffectedStorybooks.ts` determines which Storybooks need Chromatic runs:

1. Runs `pnpm turbo ls --filter=...[<baseSha>] --output=json` to find affected packages.
2. Checks each Storybook's dependency list (hardcoded in `StorybookDependencies`) against the affected set.
3. Outputs `<storybook-package>=true|false` to `GITHUB_OUTPUT` for use in subsequent Chromatic steps.
4. On error, falls back to marking all Storybooks as affected.

**Maintenance**: When adding a new Storybook or changing domain package names, update the `StorybookDependencies` map in `getAffectedStorybooks.ts`. Domain storybook entries must only list module package names (`@modules/*`) — never shared packages (`@packages/*`). Turborepo's `--filter=...[baseSha]` already detects transitive dependency changes, so shared package changes automatically mark their dependent modules as affected.

## Code review tool restrictions

`code-review.yml` restricts the Claude agent to read-only tools (`Read`, `Glob`, `Grep`, `Skill`, `Task`, `Bash(gh:*)`, `mcp__github_inline_comment__*`). This is intentional — the review agent must not modify code. The review prompt is in `.github/prompts/code-review.md`.

## Audit agent-docs behavioral flow

`audit-agent-docs.yml` runs weekly (Sunday midnight UTC) and can be triggered manually. The behavior is split between the workflow YAML and `.github/prompts/audit-agent-docs.md`:

- **Critical/High findings**: fixes them in-place and creates a PR against `main`.
- **No Critical/High findings**: creates and immediately closes a GitHub issue with the report.
- **Workflow failure**: creates a GitHub issue linking to the failed run.

## Smoke tests

`smoke-tests.yml` runs on PRs to `main`. It uses `claude-code-action` to load the `plantz-smoke-tests` skill, which starts the host app's dev server, verifies it in a headless browser via `agent-browser`, then stops with port cleanup. Results are posted as a PR comment. 15-minute timeout with concurrency group (`cancel-in-progress`).

**Workflow validation caveat:** `claude-code-action` requires the workflow file on the PR branch to match the version on `main`. If the workflow is new or modified in the PR, the action silently no-ops and the job reports success without running the skill. The skill only executes once the workflow file is merged to `main`.

**Tool scoping:** The agent's Bash access is restricted to specific CLIs (`pnpm`, `node`, `mkdir`, `rm`, `lsof`, `kill`, `pkill`, `agent-browser`). On failure, screenshots are uploaded as GitHub Actions artifacts for diagnosis.

## Netlify preview deploys

Netlify automatically deploys a preview for every pull request:

- **Host app** — a full build of `apps/host/` accessible at a unique Netlify preview URL.
- **Unified Storybook** — a full build of `apps/storybook/` accessible at a separate Netlify preview URL.

Preview URLs are posted as PR status checks by the Netlify GitHub integration.

When a PR is merged into `main`, Netlify automatically deploys the Host app to production.

These deploys are independent of the GitHub Actions workflows listed above — Netlify manages its own build pipeline triggered by git push events.

## Turbo cache strategy

Five workflows (ci, lighthouse, chromatic, claude, smoke-tests) share a Turbo cache pattern with restore-key prefixes (`${{ runner.os }}-turbo-`) that allow cross-workflow cache hits. `code-review.yml` and `audit-agent-docs.yml` do not use Turbo cache.

When adding a new workflow that runs Turbo tasks, follow the existing pattern: restore before tasks, save on cache miss (`cache-hit != 'true'`), use prefix fallback keys.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
