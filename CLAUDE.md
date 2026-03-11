## Rules

1. Before changing a module API or architectural pattern, check `agent-docs/adr/index.md`.
2. Before changing build tooling, CI, or dev workflows, check `agent-docs/odr/index.md`.
3. For feature development, load the `plantz-sdlc-orchestrator` skill. It coordinates the full lifecycle.
4. Never report a task as complete without running `git status --short` and checking every changed or new file against the index below. If a file touches a topic listed in the index, open that doc and fix any line that no longer matches reality.

## Index

### Architecture

- [ARCHITECTURE.md](agent-docs/ARCHITECTURE.md) — repo structure, package naming, Squide topology, data layer (BFF-per-module), tech stack, MODULES env var

### References

- [references/turborepo.md](agent-docs/references/turborepo.md) — task definitions, dependsOn, caching, conventions
- [references/typescript.md](agent-docs/references/typescript.md) — tsconfig, tsgo
- [references/ci-cd.md](agent-docs/references/ci-cd.md) — CI, Chromatic, Claude, code-review, audit-agent-docs, and smoke-tests GitHub Actions workflows
- [references/writing-agent-instructions.md](agent-docs/references/writing-agent-instructions.md) — principles for writing instructions agents actually follow

### Decisions

- [adr/index.md](agent-docs/adr/index.md) — architectural decision log (Squide local modules, domain Storybooks, MSW + TanStack Query data layer, BFF-per-module)
- [odr/index.md](agent-docs/odr/index.md) — operational decision log (pnpm+Turborepo, syncpack, Chromatic)

## Growth Conventions

- New `agent-docs/` files get an index entry above; keep this file under ~55 lines. Only document what is currently true.
- Domain-specific patterns belong in a scoped `CLAUDE.md` near the code (e.g., `apps/management/CLAUDE.md`), not in `agent-docs/`.
