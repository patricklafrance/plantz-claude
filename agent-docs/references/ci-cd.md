# CI/CD Reference

Five GitHub Actions workflows in `.github/workflows/`.

## ci.yml — Continuous Integration

**Triggers**: push to `main`, PRs targeting `main`
**Concurrency**: `ci-${{ github.ref }}`, cancel in-progress

Steps:
1. Checkout (full history)
2. Install pnpm + Node.js + dependencies
3. Restore Turborepo cache (`${{ runner.os }}-turbo-ci-${{ github.sha }}`, prefix fallbacks)
4. **Build host** — on PRs, filtered to packages diverging from PR base SHA
5. **Typecheck** — on PRs, filtered to affected packages with `--continue`
6. **Syncpack** — always runs full `pnpm turbo run syncpack`
7. **Test packages** — on PRs, filtered to affected packages with `--continue`
8. Save Turborepo cache

ESLint and Stylelint steps are commented out (planned via OXlint/OXfmt).

## chromatic.yml — Visual Regression Testing

**Triggers**: push to `main`, PRs targeting `main` (on `opened` and `labeled`)
**Concurrency**: `chromatic-${{ github.ref }}`, cancel in-progress
**Gate**: PRs require the `run chromatic` label — exits early without it

Steps:
1. Label gate check
2. Checkout (full history, PR head ref)
3. Install pnpm + Node.js + dependencies
4. Restore Turborepo cache
5. Compute base SHA (PR base for PRs, push `before` for main)
6. **Detect affected Storybooks** via `pnpm tsx tooling/getAffectedStorybooks.ts` (see [Affected Storybook detection](#affected-storybook-detection) below)
7. **Chromatic — Management** (token: `MANAGEMENT_CHROMATIC_PROJECT_TOKEN`, skip if unaffected)
8. **Chromatic — Today** (token: `TODAY_CHROMATIC_PROJECT_TOKEN`, skip if unaffected)
9. **Chromatic — Packages** (token: `PACKAGES_CHROMATIC_PROJECT_TOKEN`, skip if unaffected)
10. Remove `run chromatic` label after completion
11. Save Turborepo cache

All Chromatic steps use `onlyChanged: true` and `autoAcceptChanges: main`.

## claude.yml — Claude Code Agent

**Triggers**: issue/PR comments containing `@claude`, issues with `@claude` in title/body
**Timeout**: 60 minutes
**Permissions**: contents write, pull-requests write, issues write, id-token write, actions read

Steps:
1. Checkout
2. Install pnpm + Node.js + dependencies
3. Restore Turborepo cache
4. Run `anthropics/claude-code-action@v1`
5. Save Turborepo cache

## code-review.yml — Automated Code Review

**Triggers**: PRs targeting `main` (opened, synchronize, ready_for_review, reopened)
**Concurrency**: `code-review-${{ github.ref }}`, cancel in-progress
**Skip**: draft PRs

Steps:
1. Checkout (full history)
2. Run `anthropics/claude-code-action@v1` with:
   - Restricted tools (passed via `claude_args` to the action): `Read`, `Glob`, `Grep`, `Skill`, `Task`, `Bash(gh:*)`, `mcp__github_inline_comment__*`
   - Prompt reads `.github/prompts/code-review.md`

## audit-agent-docs.yml — Weekly Documentation Audit

**Triggers**: weekly cron (Sunday midnight UTC), manual `workflow_dispatch`
**Concurrency**: `audit-agent-docs-${{ github.ref }}`, cancel in-progress
**Timeout**: 60 minutes

Steps:
1. Checkout
2. Get current date (used in branch names, PR titles, and issue titles)
3. Run `anthropics/claude-code-action@v1` with:
   - Prompt reads `.github/prompts/audit-agent-docs.md`
   - Allowed tools: `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Skill`, `Bash(git:*)`, `Bash(gh:*)`, `Bash(date:*)`
   - Loads the `audit-agent-docs` skill and runs the 3-pass audit procedure
4. If Critical/High findings: fixes them, creates a PR against `main`
5. If no Critical/High findings: creates and closes a GitHub issue with the report
6. On failure: creates a GitHub issue with a link to the failed workflow run

## Affected Storybook detection

`tooling/getAffectedStorybooks.ts` determines which Storybooks need Chromatic runs:

1. Runs `pnpm turbo ls --filter=...[<baseSha>] --output=json` to find affected packages.
2. Checks each Storybook's dependency list (hardcoded in `StorybookDependencies`) against the affected set.
3. Outputs `<storybook-package>=true|false` to `GITHUB_OUTPUT` for use in subsequent Chromatic steps.
4. On error, falls back to marking all Storybooks as affected.

**Maintenance**: When adding a new Storybook or changing domain package names, update the `StorybookDependencies` map in `getAffectedStorybooks.ts`.

## CI coverage gaps

What CI does **not** catch currently:
- Linting — OXlint/OXfmt is planned but not yet configured (ESLint/Stylelint steps are commented out)
- Smoke tests — not yet configured

## Turbo cache strategy

Three of the five workflows (ci, chromatic, claude) share the same pattern. `code-review.yml` and `audit-agent-docs.yml` do not use Turbo cache.
- **Key**: `${{ runner.os }}-turbo-<workflow>-${{ github.sha }}`
- **Restore keys**: `${{ runner.os }}-turbo-<workflow>-`, `${{ runner.os }}-turbo-`
- **Path**: `.turbo`
- Save only on cache miss (`cache-hit != 'true'`)

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
