# Today Domain

Federated modules for the daily plant care view.

## Stories

Every page and component in this domain must have a co-located `.stories.tsx` file (e.g., `LandingPage.tsx` → `LandingPage.stories.tsx`). A feature without stories is not complete — visual regression testing via Chromatic only works when stories exist.

### Requirements

- Use CSF3 format with types from `storybook-react-rsbuild`.
- Title convention: `Today/{ModulePascalCase}/Pages/{PageName}` (e.g., `Today/LandingPage/Pages/LandingPage`).
- Reference: `apps/today/landing-page/src/LandingPage.stories.tsx`.

### Verification

Start the domain storybook (`pnpm dev-today-storybook`), open it in a browser, and confirm every new story renders without errors. Never report a task as complete based on `typecheck` alone — type-checking does not catch runtime rendering failures or broken imports that only surface in the browser.

## Storybook Wiring

Domain storybook: `@apps/today-storybook` (`apps/today/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx`.

## Adding a Module

Use `/scaffold-domain-module` with `domain=today`. The skill handles host registration, storybook wiring, and affected-detection updates.
