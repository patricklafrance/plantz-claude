# Architecture

## What is plantz-claude

A plants watering application and proof-of-concept for Claude Code agent workflows. Built as a pnpm monorepo with Turborepo orchestration and Squide federated modules.

## Repository structure

```
plantz-claude/
  apps/
    host/                          # Squide host application (@apps/host)
    management/
      plants/                      # Management domain — plants module (@modules/management-plants)
      storybook/                   # Management domain Storybook (@apps/management-storybook)
    today/
      landing-page/                # Today domain — landing page module (@modules/today-landing-page)
      storybook/                   # Today domain Storybook (@apps/today-storybook)
    storybook/                     # Packages-layer Storybook (@apps/packages-storybook)
  packages/
    squide-core/                   # Shared Squide utilities (@packages/squide-core)
    storybook/                     # Shared Storybook config (@packages/storybook)
  tooling/                         # Build scripts (getAffectedStorybooks.ts)
  agent-docs/                      # Agent documentation (this folder)
  .agents/skills/                  # Agent skills (git-commit, etc.)
  .claude/skills/                  # Claude Code skills
  .github/workflows/               # CI, Chromatic, Claude, code-review
```

## Package naming conventions

| Workspace path | Package scope | Example |
|---|---|---|
| `apps/host` | `@apps/*` | `@apps/host` |
| `apps/<domain>/storybook` | `@apps/*` | `@apps/management-storybook` |
| `apps/<domain>/<feature>` | `@modules/*` | `@modules/management-plants` |
| `packages/*` | `@packages/*` | `@packages/squide-core` |

## Squide host/module topology

- **Host** (`apps/host/`): Thin shell that bootstraps Squide via `FireflyRuntime` and renders `AppRouter`. Contains no domain logic.
- **Modules**: Each feature area registers via `ModuleRegisterFunction`. Modules are isolated — they never import from each other.
- **Shared packages**: Cross-cutting utilities live in `packages/` and are consumed by both host and modules.

## Domain isolation

Two domain areas, each with independent Storybooks and Chromatic tokens:

- **management** — Plant management features (`apps/management/`)
- **today** — Daily watering view (`apps/today/`)

A third Storybook (`apps/storybook/`) covers shared packages.

## Technology stack

| Tool | Version | Purpose |
|---|---|---|
| Node.js | >= 24.0.0 | Runtime |
| pnpm | 10.30.1 | Package manager |
| TypeScript | 7.0.0-dev (tsgo, `@typescript/native-preview`) | Type checking |
| Squide | — | Federated module shell |
| Storybook | — | Component development |
| Chromatic | — | Visual regression testing |
| Turborepo | 2.8.12 | Task orchestration and caching |
| Vitest | — | Unit testing |
| Syncpack | 14.0.0 | Dependency version enforcement |

## MODULES env var

Set `MODULES` to load only specific modules during development:

```bash
cross-env MODULES=management/plants pnpm dev-host    # only management/plants
cross-env MODULES=today/landing-page pnpm dev-host   # only today/landing-page
```

Omit `MODULES` to load all modules. The value maps to the module's path under `apps/`.

## Maintaining this doc

- When a section exceeds ~40 lines, extract it to its own file in the appropriate `agent-docs/` subfolder.
- Cross-package contracts (e.g., "modules never import each other") belong here. Let the code (TypeScript types, barrel exports) document its own public API.

