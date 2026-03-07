# Management Domain

Federated modules for plant management features.

## Storybook

Domain storybook: `@apps/management-storybook` (`apps/management/storybook/`).

Story globs in `.storybook/main.ts` must include every module in this domain. When adding a module, add its glob: `../../{module}/src/**/*.stories.tsx`.

## Adding a Module

Use `/scaffold-domain-module` with `domain=management`. The skill handles host registration, storybook wiring, and affected-detection updates.
