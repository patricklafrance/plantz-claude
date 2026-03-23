# Domain Organization

How to decide where new features belong. Read ARCHITECTURE.md first for repo structure and technical details.

## Decision Tree: "Where does feature X go?"

1. **Is it auth, session, layout, or app shell?** → `@packages/core-module/shell`. The shell owns login/logout, session bootstrap, `RootLayout`, `UserMenu`, the 404 page, and auth MSW handlers (`/api/auth/*`). The host is just a thin bootstrap layer. Never put domain logic in shell or host.
2. **Is it about managing or configuring an entity?** → Management domain (`apps/management/`). The user is setting things up — CRUD, admin, profile.
3. **Is it about what the user should do today?** → Today domain (`apps/today/`). The user is executing daily tasks, not configuring.
4. **Is it cross-module infrastructure (auth, session, module utilities)?** → `@packages/core-module`. Not domain-specific — any Squide module may need it.
5. **Is it shared plant types, DB schema, collection factories, or plant-specific utilities?** → `@packages/core-plants`. Domain-specific — only used by domain modules, never by `@packages/components`.
6. **Is it a reusable UI component with no domain logic?** → `@packages/components`.
7. **Is it a generic utility needed by `@packages/components`?** → A new `core` package (doesn't exist yet). Not `core-module` or `core-plants`.

If the feature doesn't fit an existing domain, that's a signal to discuss a new domain — but don't create one without an ADR.

## Domains

| Domain         | Mental model                                          | Existing modules                                                                                                                   |
| -------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **management** | Admin and configuration — set things up               | `management/plants` (plant CRUD), `management/user` (profile editing), `management/household` (household setup, member management) |
| **today**      | Daily care dashboard — what needs attention right now | `today/landing-page` (daily watering overview), `today/vacation-planner` (vacation care planning)                                  |

The **host** (`apps/host/`) is not a domain. It is a thin bootstrap layer that wires `registerShell` (from `@packages/core-module/shell`) with domain modules. Shell components and auth handlers live in core-module, not the host.

## Module Granularity

A **module** = a Squide registration function that owns routes, an optional collection + MSW handlers, and optionally a nav item.

**Create a new module when the feature:**

- Introduces a distinct route or route cluster (e.g., `/management/schedules`)
- Needs its own data collection and API namespace (`/api/<domain>/<entity>`)
- Is independently loadable — the `MODULES` env var should be able to include/exclude it

**Keep it in an existing module when:**

- It's a new component or sub-view within an existing route (e.g., adding a filter to the plants list)
- It shares the same collection and API surface
- Splitting it would create a module with no route of its own

Not every module needs a collection or data layer. `management/user` has no TanStack DB collection — it owns a simple MSW handler for `PUT /api/management/user/profile` and refreshes the session query after updates. `management/household` also has no TanStack DB collection — it uses direct fetch + `useState` for its single-page CRUD UI.

When in doubt, prefer adding to an existing module. Too many small modules fragment the codebase and make navigation harder. Only split when the criteria above are clearly met.

## MSW Handler Ownership

Every module must register its own MSW handlers for the API endpoints it uses. A module must never rely on the host or another module for its MSW handlers — even if the handler logic duplicates code elsewhere. Handlers live in the module's `src/mocks/` folder. The host only owns handlers for cross-cutting auth endpoints (`/api/auth/login`, `/api/auth/logout`, `/api/auth/session`). Module endpoints follow the `/api/<domain>/<entity>` pattern (e.g., `/api/management/plants`, `/api/today/plants`, `/api/management/user/profile`).

Handlers share state through DB singletons imported from shared packages (`usersDb` and `householdDb` from `@packages/core-module/db`, `plantsDb` from `@packages/core-plants/db`). Duplication applies to the handler registration, not the underlying data store.

This is a hard rule. Without it, modules are not independently loadable via the `MODULES` env var and Storybook stories cannot work in isolation.

## Module Isolation Rule

Modules never import from each other. If two modules need the same code:

- **Small surface** (a type, a constant): prefer duplication.
- **Non-trivial shared logic**: extract to `@packages/core-module` (cross-module infrastructure), `@packages/core-plants` (plant domain logic), or `@packages/components` (UI).

This is a hard rule, not a guideline. Violating it creates implicit coupling between independently-loadable modules.

## Package Promotion

Code starts in a module. Move it to a shared package when:

- Two or more modules need the same type, utility, or component
- The shared surface is non-trivial (more than a single type alias)
- Cross-module infrastructure (auth, session) goes to `@packages/core-module`
- Plant domain logic goes to `@packages/core-plants`; domain-agnostic UI goes to `@packages/components`
- Generic utilities needed by `@packages/components` go to a new `core` package, not `core-module` or `core-plants`

## Adding to a Domain

Each domain has its own `CLAUDE.md` with storybook, data-layer, and scaffolding instructions:

- Management: `apps/management/CLAUDE.md`
- Today: `apps/today/CLAUDE.md`

To scaffold a new module, use `/scaffold-domain-module` with the appropriate `domain` parameter.
