# ADR-0003: No Backend Server — MSW as API Layer with BFF-per-Module

## Status

accepted

## Decision

The app has no backend process. MSW intercepts browser `fetch()` calls and serves from an in-memory store, while TanStack Query provides standard data-fetching hooks. Components use real REST patterns that would point at a real API in production — MSW is the only thing that would be swapped out.

A standalone local API server (e.g., json-server) was rejected because it adds process management complexity and complicates Storybook and CI environments.

### BFF-per-module constraint

Each Squide module owns its entire API surface — handlers, API client functions, query hooks, and query keys — scoped under a domain URL namespace (`/api/<domain>/<entity>`). Modules never share handlers or hooks. The only shared data dependency is the in-memory DB singleton in `@packages/plants-core/db`.

This mirrors a real BFF (backend-for-frontend) architecture: each frontend surface shapes its own API layer. It also reinforces the module isolation rule from [ADR-0001](0001-squide-local-modules.md) — modules stay independently deployable at the data layer, not just the UI layer.

## Consequences

- Data resets on page reload (intentional for POC).
- Adding a new module requires creating its own `api/` and `mocks/` folders with module-scoped handlers and hooks — even if the entity already exists in another module.
- URL namespaces must not collide between modules.

See `msw-tanstack-query.md` in `.claude/skills/plantz-sdlc-*/references/` for all implementation patterns.
