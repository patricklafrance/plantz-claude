# ODR-0002: Dependency Versioning Strategy via Syncpack

## Status

proposed

## Context

A monorepo with multiple packages risks version drift — different packages depending on different versions of the same library. A consistent strategy is needed to prevent conflicts and keep the dependency tree predictable.

## Options Considered

1. **Syncpack with differentiated policies** — Apps pin all dependencies for reproducible builds. Modules and packages use `^` for prod/peer deps (allowing compatible updates) but pin devDeps. Enforced via `syncpack lint` in CI.
2. **pnpm catalogs** — Centralized version declarations in `pnpm-workspace.yaml`. Simpler but less granular control over range policies per package type.
3. **Manual discipline** — Rely on code review to catch version inconsistencies. Error-prone and doesn't scale.

## Decision

Use syncpack with differentiated policies (Option 1). The split between apps (pinned) and packages (caret for prod/peer) balances reproducibility for deployable apps with flexibility for shared libraries.

## Consequences

- `syncpack lint` runs in CI via Turborepo (`//#syncpack` root-level task).
- `.syncpackrc.js` defines four semver groups: modules/packages prod/peer (`^`), modules/packages dev (pin), apps prod/dev (pin), workspace-root dev (pin).
- A version group ensures all packages converge on a single version per dependency (`highestSemver`).
- Version range changes are visible in `package.json` diffs and caught by syncpack before merge.
