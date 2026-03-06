# Turborepo

Configuration in `turbo.json`. UI mode: `tui`.

## Task definitions

| Task | dependsOn | Inputs | Outputs | Notes |
|---|---|---|---|---|
| `transit` | `^transit` | — | — | Dependency graph propagation |
| `dev` | — | — | — | Persistent, no cache |
| `build` | `^build` | `$TURBO_DEFAULT$`, `!README.md` | `dist/**` | env: `MODULES` |
| `build-storybook` | — | — | — | No cache |
| `serve-build` | `build` | — | — | Persistent, no cache |
| `serve-storybook` | `build-storybook` | — | — | Persistent, no cache |
| `lint` | `oxlint`, `//#oxlint`, `typecheck`, `//#typecheck`, `//#syncpack` | — | — | Orchestrator task |
| `//#oxlint` | — | `$TURBO_DEFAULT$`, `!apps`, `!packages`, `!agent-docs`, `!README.md` | — | Root-level |
| `oxlint` | — | `$TURBO_DEFAULT$`, `!README.md` | — | Per-package |
| `//#typecheck` | — | `src/**/*.ts(x)`, `test/**/*.ts(x)`, `tsconfig.json`, `!apps`, `!packages`, `!agent-docs` | `node_modules/.cache/tsbuildinfo.json` | Root-level |
| `typecheck` | `transit` | `src/**/*.ts(x)`, `test/**/*.ts(x)`, `tsconfig.json`, `tsconfig.build.json` | `node_modules/.cache/tsbuildinfo.json` | Per-package |
| `//#syncpack` | — | `.syncpackrc.js`, `**/package.json` | — | Root-level |
| `test` | `transit` | — | `node_modules/.cache/vitest/**` | Per-package |

## Conventions

- `$TURBO_DEFAULT$` — Turborepo's default input heuristic (all tracked files minus outputs).
- Root-level tasks use `//#taskname` syntax.
- `MODULES` is declared as task-level `env` on the `build` task (not `globalEnv`), scoping cache invalidation to build only.
- `transit` is a dependency graph propagation task that runs before typecheck/test.
- `dev` has no `^dev` dependency because packages are JIT — consumers compile package source directly, so no dependency build step is needed before starting a dev server. See [ODR-0004](../odr/0004-jit-packages.md).
- `oxlint` has no `dependsOn` — it reads source directly, unlike `typecheck` which needs built declarations via `transit`.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
