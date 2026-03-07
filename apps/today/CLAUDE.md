# Today Domain

Federated modules for the daily plant care view.

## Storybook

Domain storybook: `@apps/today-storybook` (`apps/today/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx`.

## Adding a Module

Use `/scaffold-domain-module` with `domain=today`. The skill handles host registration, storybook wiring, and affected-detection updates.
