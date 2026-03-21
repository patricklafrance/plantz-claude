# Domain Organization

## Decision Tree: "Where does feature X go?"

1. **Auth, session, layout, or app shell?** → `@packages/core-module/shell`
2. **Managing or configuring an entity?** → Management domain (`apps/management/`)
3. **What the user should do today?** → Today domain (`apps/today/`)
4. **Cross-module infrastructure?** → `@packages/core-module`
5. **Shared plant types, DB, collection factories?** → `@packages/core-plants`
6. **Reusable UI with no domain logic?** → `@packages/components`
7. **Generic utility needed by `@packages/components`?** → New `core` package (doesn't exist yet)

## Domains

| Domain         | Mental model            | Modules                                                        |
| -------------- | ----------------------- | -------------------------------------------------------------- |
| **management** | Admin and configuration | `management/plants`, `management/user`, `management/household` |
| **today**      | Daily care dashboard    | `today/landing-page`, `today/vacation-planner`                 |

The **host** is not a domain — it's a thin bootstrap wiring `registerShell` with domain modules.

## Module Granularity

**Create a new module when:**

- Distinct route or route cluster (e.g., `/management/schedules`)
- Own data collection and API namespace (`/api/<domain>/<entity>`)
- Independently loadable via `MODULES` env var

**Keep in existing module when:**

- New component/sub-view within an existing route
- Shares the same collection and API surface
- Splitting would create a module with no route

Not every module needs a collection. `management/user` has no TanStack DB collection (simple MSW handler + session refresh). `management/household` uses direct fetch + useState. When in doubt, prefer fewer modules.

## MSW Handler Ownership

Every module registers its own MSW handlers in `src/mocks/`. Never rely on another module's handlers. The host only owns `/api/auth/*`. Module endpoints follow `/api/<domain>/<entity>`. Handlers share state through shared DB singletons (`plantsDb`, `householdDb`, `usersDb`), not through shared handler code. This is a hard rule — without it, modules aren't independently loadable and Storybook stories break.

## Module Isolation

Modules never import from each other. Small surface (a type, a constant): prefer duplication. Non-trivial shared logic: extract to `@packages/*`. This is a hard rule.

## Adding to a Domain

Each domain has its own `CLAUDE.md`: `apps/management/CLAUDE.md`, `apps/today/CLAUDE.md`. Use `/scaffold-domain-module` for new modules.
