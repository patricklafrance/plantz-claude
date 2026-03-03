# CI/CD Reference

Four GitHub Actions workflows in `.github/workflows/`.

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
7. Save Turborepo cache

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
   - Restricted tools: `Read`, `Glob`, `Grep`, `Skill`, `Task`, `Bash(gh:*)`, `mcp__github_inline_comment__*`
   - Prompt reads `.github/prompts/code-review.md`

## Affected Storybook detection

`tooling/getAffectedStorybooks.ts` determines which Storybooks need Chromatic runs:

1. Runs `pnpm turbo ls --filter=...[<baseSha>] --output=json` to find affected packages.
2. Checks each Storybook's dependency list (hardcoded in `StorybookDependencies`) against the affected set.
3. Outputs `<storybook-package>=true|false` to `GITHUB_OUTPUT` for use in subsequent Chromatic steps.
4. On error, falls back to marking all Storybooks as affected.

**Maintenance**: When adding a new Storybook or changing domain package names, update the `StorybookDependencies` map in `getAffectedStorybooks.ts`.

**Known issue**: `@packages/components` is referenced in `StorybookDependencies` but does not exist in plantz-claude (carried over from sg-next-architecture).

## Turbo cache strategy

All workflows share the same pattern:
- **Key**: `${{ runner.os }}-turbo-<workflow>-${{ github.sha }}`
- **Restore keys**: `${{ runner.os }}-turbo-<workflow>-`, `${{ runner.os }}-turbo-`
- **Path**: `.turbo`
- Save only on cache miss (`cache-hit != 'true'`)

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
