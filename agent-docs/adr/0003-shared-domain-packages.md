# ADR-0003: Shared Domain Packages (No Cross-Module Imports)

## Status

superseded — the original subpath-export approach was rejected. **Modules MUST NOT import from each other under any mechanism** (no direct imports, no subpath exports, no re-exports). Shared code goes in a `packages/` package.

## Context

The today module (`@modules/today-landing-page`) needs to display plants due for watering using the same list item component, filter bar, delete dialog, data collection, and utility functions that already exist in the management-plants module. ADR-0001 established that modules never import from each other.

The original decision (Option 1 below) used subpath exports on the owning module. This violated the "modules never import from each other" rule in practice — `@modules/today-landing-page` depended on `@modules/management-plants` — and created confusing Storybook/Chromatic dependency chains.

## Options Considered

1. **Subpath export on the owning module** — ~~Add a `./plants` subpath export to `@modules/management-plants`.~~ Rejected: still couples modules.

2. **Extract to a shared `@packages/plants-core` package** — Move `plantsCollection`, `plantSchema`, `plantUtils`, constants, `PlantListItem`, `DeleteConfirmDialog`, `FilterBar`, and `usePlantFilters` into a new package. Both modules depend on it. Clean separation with no module-to-module imports.

3. **Duplicate the code in the today module** — Copy-paste shared components and utilities. Zero coupling, but doubles the maintenance surface for identical logic.

## Decision

Use a shared package (Option 2). `@packages/plants-core` contains all plant domain types, utilities, and shared components. Both `@modules/management-plants` and `@modules/today-landing-page` depend on this package. Modules never import from each other.

## Consequences

- `@packages/plants-core` is a JIT package under `packages/plants-core/` with an `exports` field pointing to `./src/index.ts`.
- Both modules declare `@packages/plants-core` as a workspace dependency.
- `@modules/management-plants` no longer uses an exports map — its `exports` field is the bare string `"./src/index.ts"`.
- `tooling/getAffectedStorybooks.ts` lists `@packages/plants-core` as a dependency of both domain storybooks and the packages storybook.
- `PlantListItem` stories live in `packages/plants-core/src/` and are included in the packages-storybook.
- ARCHITECTURE.md documents that shared domain code goes in packages, not subpath exports.
