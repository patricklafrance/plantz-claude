# ADR-0003: No Backend Server — MSW + TanStack DB as Data Layer with BFF-per-Module

## Status

accepted

## Decision

The app has no backend process. MSW intercepts browser `fetch()` calls and serves from an in-memory store. TanStack DB provides an embedded client-side database with reactive live queries (`useLiveQuery`) and built-in optimistic mutations (`createOptimisticAction`), synced via TanStack Query through `queryCollectionOptions`. Components use real REST patterns that would point at a real API in production — MSW is the only thing that would be swapped out.

A standalone local API server (e.g., json-server) was rejected because it adds process management complexity and complicates Storybook and CI environments.

### Per-module collections

Each module creates its own TanStack DB collection singleton during Squide registration using the `createPlantsCollection` factory from `@packages/plants-core/collection`. The host creates `QueryClient` first and passes it to module registration functions. Components access the collection via a module-level getter (e.g., `getManagementPlantsCollection()`). No React context or providers are needed for the collection — it operates as a plain module singleton.

### HMR cleanup

Collection singletons use `import.meta.hot.dispose` to reset on HMR, and init functions are idempotent (early-return if already initialized). This prevents duplicate collections or stale state during development.

### BFF-per-module constraint

Each Squide module owns its entire API surface — handlers, collection, and URL namespace — scoped under a domain URL namespace (`/api/<domain>/<entity>`). Modules never share handlers or collections. The only shared data dependency is the in-memory DB singleton in `@packages/plants-core/db`. Cross-module data visibility works through the shared DB, not through shared client-side state.

This mirrors a real BFF (backend-for-frontend) architecture: each frontend surface shapes its own API layer. It also reinforces the module isolation rule from [ADR-0001](0001-squide-local-modules.md) — modules stay independently deployable at the data layer, not just the UI layer.

## Consequences

- Data resets on page reload (intentional for POC).
- Adding a new module requires creating its own `plantsCollection.ts` and `mocks/` folder with module-scoped handlers and collection — even if the entity already exists in another module.
- URL namespaces must not collide between modules.
- TanStack DB is beta — pin exact versions and monitor for breaking changes.
- Domain modules need a `storybook.setup.ts` wiring `initializeFireflyForStorybook` and `withModuleDecorator` from `@packages/core-squide/storybook`.

See `msw-tanstack-query.md` in `.claude/skills/plantz-sdlc-*/references/` for all implementation patterns.
