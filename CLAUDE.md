## Agent Memory

Never guess about architecture, tooling, or conventions — always load the relevant doc first.

1. Read this index before every task to find the right doc.
2. Before changing a module API or architectural pattern, check `agent-docs/adr/index.md`.
3. Before changing build tooling, CI, or dev workflows, check `agent-docs/odr/index.md`.
4. Never report a task as complete without running `git status --short` and checking every changed or new file against the index below. If a file touches a topic listed in the index, open that doc and fix any line that no longer matches reality. Stale docs cause the next agent to generate code that contradicts the actual codebase.

## Index

### Architecture

- [ARCHITECTURE.md](agent-docs/ARCHITECTURE.md) — repo structure, package naming, Squide topology, tech stack, MODULES env var

### Design

- [design/README.md](agent-docs/design/README.md) — conventions for cross-cutting design docs

### References

- [references/development.md](agent-docs/references/development.md) — pnpm workspace, Node version, script naming conventions, MODULES
- [references/turborepo.md](agent-docs/references/turborepo.md) — task definitions, dependsOn, caching, conventions
- [references/syncpack.md](agent-docs/references/syncpack.md) — semver groups, version groups
- [references/typescript.md](agent-docs/references/typescript.md) — tsconfig, tsgo
- [references/tailwind-postcss.md](agent-docs/references/tailwind-postcss.md) — PostCSS transformer, cross-package class scanning
- [references/shadcn.md](agent-docs/references/shadcn.md) — Base UI preset, CLI bug explanations, Tailwind v4 source detection
- [references/ci-cd.md](agent-docs/references/ci-cd.md) — CI, Chromatic, Claude, code-review, and audit-agent-docs GitHub Actions workflows
- [references/writing-agent-instructions.md](agent-docs/references/writing-agent-instructions.md) — principles for writing instructions agents actually follow

### Decisions

- [adr/index.md](agent-docs/adr/index.md) — architectural decision log (Squide modules, domain Storybooks)
- [odr/index.md](agent-docs/odr/index.md) — operational decision log (pnpm+Turborepo, syncpack, Chromatic)

## Growth Conventions

- New `agent-docs/` files get an index entry above; keep this file under ~55 lines. Only document what is currently true.
- Domain-specific patterns belong in a scoped `CLAUDE.md` near the code (e.g., `apps/management/CLAUDE.md`), not in `agent-docs/`.
