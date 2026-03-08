# Management Domain

Federated modules for plant management features.

## Stories

Every page and component in this domain must have a co-located `.stories.tsx` file (e.g., `PlantsPage.tsx` → `PlantsPage.stories.tsx`). A feature without stories is not complete — visual regression testing via Chromatic only works when stories exist.

### Requirements

- Use CSF3 format with types from `storybook-react-rsbuild`.
- Title convention: `Management/{ModulePascalCase}/Pages/{PageName}` (e.g., `Management/Plants/Pages/PlantsPage`).
- Reference: `apps/management/plants/src/PlantsPage.stories.tsx`.

### Verification

Start the domain storybook (`pnpm dev-management-storybook`), open it in a browser, and confirm every new story renders without errors. Never report a task as complete based on `typecheck` alone — type-checking does not catch runtime rendering failures or broken imports that only surface in the browser.

## Storybook Wiring

Domain storybook: `@apps/management-storybook` (`apps/management/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx`.

## Adding a Module

Use `/scaffold-domain-module` with `domain=management`. The skill handles host registration, storybook wiring, and affected-detection updates.
