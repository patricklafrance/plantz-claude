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
    components/                    # Shared UI components — shadcn/ui + Tailwind v4 (@packages/components)
    squide-core/                   # Shared Squide utilities (@packages/squide-core)
    storybook/                     # Shared Storybook config (@packages/storybook)
  tooling/                         # Build scripts (getAffectedStorybooks.ts)
  agent-docs/                      # Agent documentation (this folder)
  agent-skills/                    # Project-specific skills (scaffold-domain-module, etc.)
  .agents/skills/                  # Shared agent skills (git-commit, etc.)
  .claude/skills/                  # Claude Code discovery layer (symlinks)
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
- **Module registry**: `apps/host/src/getActiveModules.tsx` maps module path keys to their register functions. The host loads only modules present in this map.
- **Shared packages**: Cross-cutting utilities live in `packages/` and are consumed by both host and modules.
- **JIT packages**: Packages under `packages/` expose source directly via `exports` fields (e.g., `"./": "./src/index.ts"`). Consumers compile them at build time through their own bundler — no pre-build step is required. This means the Turborepo `dev` task has no `^dev` dependency; persistent watch builds in packages run in parallel, not as prerequisites. See [ODR-0004](odr/0004-jit-packages.md) for rationale.

See [ADR-0001](adr/0001-squide-federated-modules.md) for rationale.

## Domain isolation

Two domain areas, each with independent Storybooks and Chromatic tokens:

- **management** — Plant management features (`apps/management/`)
- **today** — Daily watering view (`apps/today/`)

A third Storybook (`apps/storybook/`) covers shared packages.

See [ADR-0002](adr/0002-domain-scoped-storybooks.md) for rationale.

## Technology stack

| Tool | Version | Purpose |
|---|---|---|
| Node.js | >= 24.0.0 | Runtime |
| pnpm | 10.30.1 | Package manager |
| TypeScript | 7.0.0-dev (tsgo, `@typescript/native-preview`) | Type checking |
| Squide | — | Federated module shell |
| Storybook | — | Component development |
| Chromatic | — | Visual regression testing |
| Tailwind CSS | 4.x | Utility-first CSS framework (via `@tailwindcss/postcss`) |
| shadcn/ui (Base UI) | — | UI component library, base-nova preset (lives in `@packages/components`) |
| Turborepo | 2.8.12 | Task orchestration and caching |
| oxlint | 1.51.0 | Fast JS/TS linter (zero config) |
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

