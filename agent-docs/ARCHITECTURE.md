# Architecture

## What is plantz-claude

A plants watering application and proof-of-concept for Claude Code agent workflows. Built as a modular monolith using pnpm, Turborepo, and Squide local modules.

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
    storybook/                     # Unified Storybook — all stories in the repo (@apps/storybook)
  packages/
    components/                    # Shared UI components — shadcn/ui + Tailwind v4 (@packages/components)
    plants-core/                   # Shared plant domain types, utilities, and components (@packages/plants-core)
    storybook/                     # Packages-layer Storybook + shared Storybook config (@packages/storybook)
  tooling/                         # Build scripts (getAffectedStorybooks.ts)
  agent-docs/                      # Agent documentation (this folder)
  .agents/skills/                  # Shared agent skills (git-commit, etc.)
  .claude/skills/                  # Claude Code discovery layer — symlinks to .agents/skills/ plus project-specific skills
  .github/workflows/               # CI, Chromatic, Claude, code-review
```

## Package naming conventions

| Workspace path            | Package scope | Example                      |
| ------------------------- | ------------- | ---------------------------- |
| `apps/host`               | `@apps/*`     | `@apps/host`                 |
| `apps/<domain>/storybook` | `@apps/*`     | `@apps/management-storybook` |
| `apps/<domain>/<feature>` | `@modules/*`  | `@modules/management-plants` |
| `packages/*`              | `@packages/*` | `@packages/plants-core`      |

## Squide host/module topology

- **Host** (`apps/host/`): Thin shell that bootstraps Squide via `FireflyRuntime` and renders `AppRouter`. Contains no domain logic.
- **Modules**: Each feature area registers via `ModuleRegisterFunction`. Modules are isolated — they never import from each other. When two modules need to share domain code: prefer duplication if the surface area is small; extract to a shared package under `packages/` (e.g., `@packages/plants-core`) when it's large enough to justify the indirection.
- **Module registry**: `apps/host/src/getActiveModules.tsx` maps module path keys to their register functions. The host loads only modules present in this map.
- **Shared packages**: Cross-cutting utilities live in `packages/` and are consumed by both host and modules.
- **JIT packages**: Packages under `packages/` expose source directly via `exports` fields (e.g., `"./": "./src/index.ts"`). Consumers compile them at build time through their own bundler — no pre-build step is required. This means the Turborepo `dev` task has no `^dev` dependency; persistent watch builds in packages run in parallel, not as prerequisites. See [ODR-0004](odr/0004-jit-packages.md) for rationale.

See [ADR-0001](adr/0001-squide-local-modules.md) for rationale.

## Domain isolation

Two domain areas, each with independent Storybooks and Chromatic tokens:

- **management** — Plant management features (`apps/management/`)
- **today** — Daily watering view (`apps/today/`)

A packages-layer Storybook (`packages/storybook/`) covers shared packages. A unified Storybook (`apps/storybook/`) aggregates all stories across the entire repo.

See [ADR-0002](adr/0002-domain-scoped-storybooks.md) for rationale.

## Data layer — BFF-per-module

There is no backend server. MSW intercepts browser `fetch()` calls and serves from a shared in-memory database. TanStack Query provides data-fetching hooks. In production, MSW would be swapped for real API endpoints — the rest stays the same.

Each module owns its full API surface (a "BFF-per-module" model):

- **Handlers** — MSW request handlers live in the module's `mocks/` folder, scoped to `/api/<domain>/<entity>` URLs (e.g., `/api/management/plants`, `/api/today/plants`).
- **API client & hooks** — `fetch()` wrappers and TanStack Query hooks live in the module's `api/` folder. Query keys are module-scoped (e.g., `["management", "plants", "list"]`).
- **Shared DB** — All modules read/write the same in-memory store, exposed via `@packages/plants-core/db`. This is the only shared data dependency.

Modules never share handlers or hooks. If two modules need the same entity, each defines its own handlers, hooks, and URL namespace. This mirrors how real BFFs work: each frontend surface has its own backend-for-frontend that shapes data for its needs.

See [ADR-0003](adr/0003-msw-tanstack-query-data-layer.md) for rationale. See `msw-tanstack-query.md` in `.claude/skills/plantz-sdlc-*/references/` for implementation details.

## Technology stack

For exact versions, read the root `package.json` (`engines`, `packageManager`, `devDependencies`).

| Tool                | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| Node.js             | Runtime                                                                  |
| pnpm                | Package manager                                                          |
| TypeScript          | Type checking (`@typescript/native-preview` — tsgo)                      |
| Squide              | Modular monolith shell (local modules)                                   |
| Storybook           | Component development                                                    |
| Chromatic           | Visual regression testing                                                |
| Tailwind CSS        | Utility-first CSS framework (via `@tailwindcss/postcss`)                 |
| shadcn/ui (Base UI) | UI component library, base-nova preset (lives in `@packages/components`) |
| Turborepo           | Task orchestration and caching                                           |
| oxlint              | Fast JS/TS linter (zero config)                                          |
| oxfmt               | Fast code formatter (Prettier-compatible, import sorting, Tailwind sort) |
| Syncpack            | Dependency version enforcement                                           |
| MSW                 | Mock Service Worker for API mocking in browser and Storybook             |
| TanStack Query      | Server state management and data fetching (`@tanstack/react-query`)      |
| TanStack Virtual    | List virtualization (`@tanstack/react-virtual`)                          |
| Zod                 | Schema validation                                                        |

## Script conventions

Scripts in root `package.json` follow a prefix convention: `dev-*` (local dev servers), `build-*` / `serve-*` (production), `lint` / `typecheck` / `syncpack` (quality), `clean` / `reset` (maintenance). Read root `package.json` for the full list — never duplicate it in docs.

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
