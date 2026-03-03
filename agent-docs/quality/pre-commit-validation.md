# Pre-Commit Validation

Checks to run before committing changes.

## Required checks

| Check | Command | Notes |
|---|---|---|
| Type checking | `pnpm typecheck` | Runs tsgo at root |
| Syncpack | `pnpm syncpack` | Verifies dependency version consistency |
| Tests | `pnpm turbo run test --filter=<affected>` | Run if the package has tests |

## Conventional commits

Commit messages must follow the Conventional Commits format. Use the git-commit agent skill (`.agents/skills/git-commit/`) which enforces this convention.

## What CI catches

- Build (host app, filtered on PRs)
- Typecheck (filtered on PRs)
- Syncpack (always full)

## What CI does not catch currently

- Individual package tests — `test` task exists in `turbo.json` but is not run in `ci.yml`
- Linting — OXlint/OXfmt is planned but not yet configured (ESLint/Stylelint steps are commented out)
- Smoke tests — not yet configured

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
