# Design Docs

Documents cross-cutting patterns, end-to-end flows, and non-obvious conventions.

## When to create a design doc

Create a design doc when implementing a pattern that spans multiple modules or has non-obvious mechanics that agents would otherwise guess wrong.

Examples of future design docs: Squide module registration flow, data-fetching patterns, Storybook conventions.

## File naming

`kebab-case-topic.md` (e.g., `squide-module-registration.md`).

## Rules

- Never create a design doc for a pattern that does not yet exist in the codebase — only document what is implemented.
- Every new file here gets a CLAUDE.md index entry.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
