# ADR-0002: Domain-Scoped Storybooks

## Status

proposed

## Context

Multiple domain areas (management, today) and a shared packages layer each need visual component development and regression testing. A single global Storybook would couple all domains' build times and Chromatic snapshot costs together.

## Options Considered

1. **Per-domain Storybooks** — Each domain and the shared packages layer gets its own Storybook instance. Independent build times, targeted Chromatic costs, and affected-detection per domain.
2. **Single global Storybook** — One Storybook importing stories from all domains. Simpler configuration but longer build times, higher Chromatic costs, and no way to skip unaffected domains.

## Decision

Use per-domain Storybooks (Option 1). Each domain area has a Storybook at `apps/<domain>/storybook/`, and shared packages have one at `apps/storybook/`. This allows independent Chromatic runs that skip unaffected domains.

## Consequences

- Separate Chromatic project tokens per domain (`MANAGEMENT_CHROMATIC_PROJECT_TOKEN`, `TODAY_CHROMATIC_PROJECT_TOKEN`, `PACKAGES_CHROMATIC_PROJECT_TOKEN`).
- The `tooling/getAffectedStorybooks.ts` script detects which Storybooks are affected by a change.
- Adding a new domain requires creating a new Storybook package and Chromatic token.
- Each Storybook can be developed independently (`pnpm dev-management-storybook`, `pnpm dev-today-storybook`, `pnpm dev-packages-storybook`).
