# ADR-0001: Federated Module Architecture with Workleap Squide

## Status

proposed

## Context

plantz-claude needs to support multiple feature areas (plant management, daily watering) with independent lifecycles. Each domain should be developed, tested, and deployed without tight coupling to the others.

## Options Considered

1. **Workleap Squide** — Workleap's federated module shell. Modules register routes and navigation via `ModuleRegisterFunction`. Host is a thin shell (`FireflyRuntime` + `AppRouter`). No runtime federation overhead — modules are imported at build time but architecturally isolated.
2. **Webpack Module Federation** — Runtime federation with independently deployed micro-frontends. Adds runtime complexity (shared scope, version negotiation) that is unnecessary for a single-repo app.
3. **Monolithic React app** — Single app with folder-based code organization. Simpler initially, but domain boundaries are conventions only — no enforcement of isolation.

## Decision

Use Workleap Squide (Option 1). It provides module isolation boundaries enforced by the framework without the operational complexity of runtime federation. Since all code lives in one monorepo, build-time composition is sufficient.

## Consequences

- Every feature area is a module with a `ModuleRegisterFunction` entry point.
- The host app (`apps/host/`) is a thin shell — it bootstraps `FireflyRuntime` and renders `AppRouter` but contains no domain logic.
- Modules never import from each other. Cross-module communication goes through Squide runtime APIs (event bus, shared data queries).
- New feature areas require creating a new module package under `apps/<domain>/`.
