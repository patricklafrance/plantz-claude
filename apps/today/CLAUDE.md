# Today Domain

Local modules for the daily plant care view.

## Stories

Never write stories without first loading the `plantz-sdlc-code` skill for storybook conventions that apply to all domains.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Domain-Specific

- Title prefix: `Today/` (e.g., `Today/LandingPage/Pages/LandingPage`).
- Reference: `apps/today/landing-page/src/LandingPage.stories.tsx`.
- Storybook dev command: `pnpm dev-today-storybook`.

## Storybook Wiring

Domain storybook: `@apps/today-storybook` (`apps/today/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx` (where `{module}` is the directory name under `apps/today/`, e.g., `landing-page`).

## Adding a Module

Use `/scaffold-domain-module` with `domain=today`. The skill handles host registration, storybook wiring, and affected-detection updates.
