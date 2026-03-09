# Management Domain

Federated modules for plant management features.

## Stories

Never write stories without first reading [storybook.md](../../agent-docs/references/storybook.md) — it contains the story conventions that apply to all domains.

Every page and component must have a co-located `.stories.tsx` file. A feature without stories is not complete.

### Domain-Specific

- Title prefix: `Management/` (e.g., `Management/Plants/Pages/PlantsPage`, `Management/Plants/Components/PlantListItem`).
- Reference: `apps/management/plants/src/PlantListItem.stories.tsx` (component with full variants), `apps/management/plants/src/PlantsPage.stories.tsx` (page).
- Storybook dev command: `pnpm dev-management-storybook`.

## Storybook Wiring

Domain storybook: `@apps/management-storybook` (`apps/management/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx` (where `{module}` is the directory name under `apps/management/`, e.g., `plants`).

## Adding a Module

Use `/scaffold-domain-module` with `domain=management`. The skill handles host registration, storybook wiring, and affected-detection updates.
