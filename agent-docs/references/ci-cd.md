# CI/CD Reference

Six GitHub Actions workflows in `.github/workflows/`:

| File                   | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `ci.yml`               | Lint, typecheck, build, test on PRs and main pushes |
| `chromatic.yml`        | Visual regression via Chromatic                     |
| `claude.yml`           | Claude Code agent for issue/PR comments             |
| `code-review.yml`      | Automated PR code review via Claude                 |
| `audit-agent-docs.yml` | Weekly agent-docs freshness audit                   |
| `smoke-tests.yml`      | Smoke-test all apps on PRs via Claude               |

Read the YAML files directly for triggers, steps, and concurrency rules.

## Chromatic label gate

PRs require the `run chromatic` label to trigger `chromatic.yml`. Without it, the workflow exits early. The label is automatically removed after Chromatic completes.

## Affected Storybook detection

`tooling/getAffectedStorybooks.ts` determines which Storybooks need Chromatic runs:

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

`smoke-tests.yml` runs on PRs to `main`. It uses `claude-code-action` to load the `plantz-smoke-tests` skill, which starts each app's dev server, verifies it in a headless browser via `agent-browser`, then stops with port cleanup. Results are posted as a PR comment. 30-minute timeout with concurrency group (`cancel-in-progress`).

**Workflow validation caveat:** `claude-code-action` requires the workflow file on the PR branch to match the version on `main`. If the workflow is new or modified in the PR, the action silently no-ops and the job reports success without running the skill. The skill only executes once the workflow file is merged to `main`.

**Tool scoping:** The agent's Bash access is restricted to specific CLIs (`pnpm`, `node`, `mkdir`, `rm`, `lsof`, `kill`, `agent-browser`). On failure, screenshots are uploaded as GitHub Actions artifacts for diagnosis.

## Turbo cache strategy

Four workflows (ci, chromatic, claude, smoke-tests) share a Turbo cache pattern with restore-key prefixes (`${{ runner.os }}-turbo-`) that allow cross-workflow cache hits. `code-review.yml` and `audit-agent-docs.yml` do not use Turbo cache.

When adding a new workflow that runs Turbo tasks, follow the existing pattern: restore before tasks, save on cache miss (`cache-hit != 'true'`), use prefix fallback keys.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
