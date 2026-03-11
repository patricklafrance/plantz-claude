# Today Domain

Local modules for the daily plant care view.

## Stories

Never write stories without first loading the `plantz-sdlc-code` skill for storybook conventions that apply to all domains.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Domain-Specific

- Title prefix: `Today/` (e.g., `Today/LandingPage/Pages/LandingPage`).
- Reference: `apps/today/landing-page/src/LandingPage.stories.tsx`.
- Storybook dev command: `pnpm dev-today-storybook`.

## Storybook Setup

Each module has a `storybook.setup.ts` that imports `initializeFireflyForStorybook` and `withModuleDecorator` from `@packages/core-squide/storybook`. Story files import `moduleDecorator` from `./storybook.setup.ts` and add it to `decorators`. Presentational component stories don't need the decorator.

## Storybook Wiring

Domain storybook: `@apps/today-storybook` (`apps/today/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx` (where `{module}` is the directory name under `apps/today/`, e.g., `landing-page`).

## Data Layer

Modules in this domain own their API surface under `/api/today/`. Each module has:

- `src/plantsCollection.ts` — TanStack DB collection singleton (init during registration) + optimistic actions via `createOptimisticAction`
- `src/mocks/` — MSW handlers scoped to `/api/today/<entity>`

Components read with `useLiveQuery` and write with actions from `createTodayPlantActions`. No `api/` folder — the collection handles data fetching internally via `queryCollectionOptions`.

See `msw-tanstack-query.md` in `.claude/skills/plantz-sdlc-*/references/` for implementation patterns.

## Adding a Module

Use `/scaffold-domain-module` with `domain=today`. The skill handles host registration, storybook wiring, and affected-detection updates.
