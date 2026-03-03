# Build Tooling Reference

## Turborepo

Configuration in `turbo.json`. UI mode: `tui`.

### Task definitions

| Task | dependsOn | Inputs | Outputs | Notes |
|---|---|---|---|---|
| `transit` | `^transit` | — | — | Dependency graph propagation |
| `dev` | `^dev` | — | — | Persistent, no cache |
| `build` | `^build` | `$TURBO_DEFAULT$`, `!README.md` | `dist/**` | env: `MODULES` |
| `build-storybook` | — | — | — | No cache |
| `serve-build` | `build` | — | — | Persistent, no cache |
| `serve-storybook` | `build-storybook` | — | — | Persistent, no cache |
| `lint` | `typecheck`, `//#typecheck`, `//#syncpack` | — | — | Orchestrator task |
| `//#typecheck` | — | `src/**/*.ts(x)`, `tsconfig.json` | `node_modules/.cache/tsbuildinfo.json` | Root-level |
| `typecheck` | `transit` | `src/**/*.ts(x)`, `tsconfig.json`, `tsconfig.build.json` | `node_modules/.cache/tsbuildinfo.json` | Per-package |
| `//#syncpack` | — | `.syncpackrc.js`, `**/package.json` | — | Root-level |
| `test` | `transit` | — | `node_modules/.cache/vitest/**` | Per-package |

### Conventions

- `$TURBO_DEFAULT$` — Turborepo's default input heuristic (all tracked files minus outputs).
- Root-level tasks use `//#taskname` syntax.
- `MODULES` is declared as task-level `env` on the `build` task (not `globalEnv`). sg-next-architecture uses `globalEnv` instead — plantz-claude's approach scopes cache invalidation to build only.
- `transit` is a plantz-claude addition for dependency graph propagation before typecheck/test. sg-next-architecture does not have this task.
- ESLint/Stylelint tasks are commented out. sg-next-architecture uses ESLint + Stylelint actively; plantz-claude plans to adopt OXlint/OXfmt instead.

## Syncpack

Configuration in `.syncpackrc.js`.

### Semver groups

| Packages | Dependency types | Range | Policy |
|---|---|---|---|
| `@modules/*`, `@packages/*` | prod, peer | `^` | Caret for flexibility |
| `@modules/*`, `@packages/*` | dev | (pinned) | Pin devDependencies |
| `@apps/*` | prod, dev | (pinned) | Pin everything |
| `workspace-root` | dev | (pinned) | Pin devDependencies |

### Version groups

All packages must converge on a single version per dependency (`highestSemver` strategy).

## TypeScript

Root `tsconfig.json` extends `@workleap/typescript-configs/monorepo-workspace.json` with incremental builds enabled (`tsBuildInfoFile` in `node_modules/.cache/`).

Type checking runs via `tsgo` (native TypeScript compiler).

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
