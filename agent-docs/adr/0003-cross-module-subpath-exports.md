# ADR-0003: Cross-Module Sharing via Subpath Exports

## Status

accepted

## Context

The today module (`@modules/today-landing-page`) needs to display plants due for watering using the same list item component, filter bar, delete dialog, data collection, and utility functions that already exist in the management-plants module. ADR-0001 established that modules never import from each other, but extracting all shared code into a new `@packages/plants-core` package would require moving 10+ files out of management-plants for only two consumers — massive churn with no architectural benefit.

## Options Considered

1. **Subpath export on the owning module** — Add a `./plants` subpath export to `@modules/management-plants` that re-exports shared types, utilities, and components. The root export (`.`) remains reserved for the module's `registerManagementPlants` function consumed by the host. Consumers import from `@modules/management-plants/plants`, never from the root.

2. **Extract to a shared `@packages/plants-core` package** — Move `plantsCollection`, `plantSchema`, `plantUtils`, constants, `PlantListItem`, `DeleteConfirmDialog`, `FilterBar`, and `usePlantFilters` into a new package. Both modules depend on it. Clean separation, but significant churn for a two-consumer scenario.

3. **Duplicate the code in the today module** — Copy-paste shared components and utilities. Zero coupling, but doubles the maintenance surface for identical logic.

## Decision

Use subpath exports (Option 1). The `./plants` subpath on `@modules/management-plants` creates a controlled sharing surface that is separate from the module registration entry point. This avoids the churn of Option 2 while keeping shared code in a single location (unlike Option 3).

This relaxes ADR-0001's "modules never import from each other" rule with a specific constraint: cross-module imports must go through a named subpath export, never through the root export. The root export remains reserved for host registration.

**Escalation rule:** If a third module needs plant data, extract to a shared package at that point. Subpath exports are acceptable for two-consumer sharing; beyond that, a dedicated package is warranted.

## Consequences

- `@modules/management-plants/package.json` uses an exports map: `{ ".": "./src/index.ts", "./plants": "./src/plantExports.ts" }`.
- `@modules/today-landing-page` declares `@modules/management-plants` as a workspace dependency and imports from the `./plants` subpath only.
- `tooling/getAffectedStorybooks.ts` lists `@modules/management-plants` as a dependency of `@apps/today-storybook` so Chromatic detects cross-module visual changes.
- ARCHITECTURE.md documents the exception to module isolation with the subpath export constraint.
