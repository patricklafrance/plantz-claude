# Turborepo

Configuration in `turbo.json`. UI mode: `tui`.

## Conventions

- `$TURBO_DEFAULT$` — Turborepo's default input heuristic (all tracked files minus outputs).
- Root-level tasks use `//#taskname` syntax.
- `lint` is an orchestrator task — it has no logic of its own, only `dependsOn` that fan out to the real checks.
- `transit` is a dependency graph propagation task that runs before `typecheck`.
- `dev` has no `^dev` dependency because packages are JIT — consumers compile package source directly, so no dependency build step is needed before starting a dev server. See [ODR-0004](../odr/0004-jit-packages.md).
- `oxlint` and `oxfmt` are root-only — both tools traverse the full repo from the root, so per-package tasks are unnecessary. Neither has `dependsOn` since they read source directly, unlike `typecheck` which needs built declarations via `transit`.
- `MODULES` is declared as task-level `env` on the `build` task (not `globalEnv`), scoping cache invalidation to build only.
- `test` depends on the root-only `//#install-playwright` task so the Chromium binary exists before any Storybook suite runs. See [testing.md](testing.md).
- Every task that could see documentation files excludes them from `inputs`: the root-only tasks (`//#oxlint`, `//#oxfmt`, `//#knip`, `//#typecheck`) exclude `agent-docs`, and `build`, `test`, `//#oxlint`, `//#oxfmt`, and `//#knip` exclude `**/README.md` and `**/CLAUDE.md`. Documentation edits must not invalidate build, lint, or test caches — never drop these exclusions when adding inputs.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
