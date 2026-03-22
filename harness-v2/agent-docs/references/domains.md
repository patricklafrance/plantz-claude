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

## Domain Granularity

Each domain is a DDD bounded context — a distinct area of the product with its own ubiquitous language and model. Create a new domain when the feature's language and user intent don't fit any existing domain. When in doubt, prefer existing domains.

## Module Granularity

A module carries significant scaffolding overhead — only justified for a **cohesive feature area** whose scope encompasses multiple related views and operations, not a feature whose entire scope is a single page or form.

Apply the Common Closure Principle: things that change together belong together. If two features share data bidirectionally or always evolve in lockstep, they belong in one module. When in doubt, prefer fewer modules.

## MSW Handler Ownership

Every module registers its own MSW handlers in `src/mocks/`. Never rely on another module's handlers. The host only owns `/api/auth/*`. Module endpoints follow `/api/<domain>/<entity>`. Handlers share state through shared DB singletons (`plantsDb`, `householdDb`, `usersDb`), not through shared handler code. This is a hard rule — without it, modules aren't independently loadable and Storybook stories break.

## Module Isolation

Modules never import from each other. Small surface (a type, a constant): prefer duplication. Non-trivial shared logic: extract to `@packages/*`. This is a hard rule.

## Adding to a Domain

Each domain has its own `CLAUDE.md`: `apps/management/CLAUDE.md`, `apps/today/CLAUDE.md`. Use `/scaffold-domain-module` for new modules.
