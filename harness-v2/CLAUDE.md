## Philosophy

Harness, not workflow. The plan provides predictability. The implementation is free. The hooks are the safety net.

## Three Layers

1. **Knowledge** (passive) — agent-docs/, ARCHITECTURE.md, ADRs/ODRs. Read when context is needed.
2. **Guardrails** (active) — Hooks fire on every tool call: supervision engine, import guard, format-on-save, secret scan, protected files.
3. **Gates** (boundaries) — Per-slice: static checks + browser verification. Pre-PR: all slices pass.

## Rules

1. Never change a module API or architectural pattern without first checking `agent-docs/adr/index.md`. Ignoring an existing ADR produces code that contradicts deliberate choices.
2. Never change build tooling, CI, or dev workflows without first checking `agent-docs/odr/index.md`. Operational decisions exist for reasons that are not obvious from the code alone.
3. Never report a task complete without running `git status --short`. If any changed file affects repo structure, build/CI config, module registration, package exports, or a topic in the Index below, open the matching doc and fix any line that no longer matches reality. Pure feature code within an existing module does not require a doc check. Stop after one pass.
4. Never add dependencies to the root `package.json` unless they are global workspace tools. Domain-specific deps belong in the consuming package. Misplaced deps break isolation and cause phantom resolution in other packages.
5. Never write code until `agent-docs/ARCHITECTURE.md` has been read. Your general knowledge of this repo's patterns is insufficient — the architecture doc is the source of truth.

## Working Directory

`.harness/` is the workspace for plans and verification results:

- `.harness/plan-header.md` — plan header (durable decisions, data model)
- `.harness/slices/` — per-slice plan files
- `.harness/domain-mapping.md` — module placement decisions
- `.harness/implementation-notes.md` — what the coder created/extended per slice
- `.harness/verification-results.md` — per-slice verification results

One feature at a time. The coordinator cleans `.harness/` before starting. Never modify `.harness/` contents from a previous feature — stale plan files cause the coder to implement against outdated decisions.

## Index

### Architecture

- [ARCHITECTURE.md](agent-docs/ARCHITECTURE.md) — repo structure, package naming, Squide topology, data layer, tech stack

### References

- [references/domains.md](agent-docs/references/domains.md) — domain responsibilities, module granularity
- [references/msw-tanstack-query.md](agent-docs/references/msw-tanstack-query.md) — data layer patterns
- [references/storybook.md](agent-docs/references/storybook.md) — Storybook conventions
- [references/tailwind-postcss.md](agent-docs/references/tailwind-postcss.md) — Tailwind CSS v4
- [references/shadcn.md](agent-docs/references/shadcn.md) — shadcn/ui patterns
- [references/color-mode.md](agent-docs/references/color-mode.md) — dark mode
- [references/turborepo.md](agent-docs/references/turborepo.md) — task definitions, caching
- [references/typescript.md](agent-docs/references/typescript.md) — tsconfig, tsgo
- [references/ci-cd.md](agent-docs/references/ci-cd.md) — CI workflows
- [references/static-analysis.md](agent-docs/references/static-analysis.md) — lint tools
- [references/agent-browser.md](agent-docs/references/agent-browser.md) — browser verification CLI

### Decisions

- [adr/index.md](agent-docs/adr/index.md) — architectural decision log
- [odr/index.md](agent-docs/odr/index.md) — operational decision log

## Growth Conventions

- New `agent-docs/` files get an index entry above; keep this file under ~60 lines.
- Domain-specific patterns belong in a scoped CLAUDE.md near the code, not here. Duplicating domain rules causes drift.
