# Design Docs

Documents cross-cutting patterns, end-to-end flows, and non-obvious conventions.

## When to create a design doc

Write a design doc when implementing a pattern that spans multiple modules or has non-obvious mechanics. Examples of future design docs:

- `squide-module-registration.md` — how modules register routes and navigation
- `data-fetching.md` — data loading patterns across host and modules
- `storybook-conventions.md` — shared Storybook configuration and story patterns

## Conventions

- File naming: `kebab-case-topic.md`
- Only create files when the pattern is actually implemented — no aspirational docs.
- Add an index entry in [CLAUDE.md](../../CLAUDE.md) for every new file.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
