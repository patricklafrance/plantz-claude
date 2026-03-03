`plantz-claude` — Plants watering app. pnpm monorepo, Turborepo, Squide federated modules.

## Agent Memory

Never guess about architecture, tooling, or conventions — always load the relevant doc first.

1. Read this index before every task to find the right doc.
2. Before changing a module API or architectural pattern, check `agent-docs/adr/index.md`.
3. Before changing build tooling, CI, or dev workflows, check `agent-docs/odr/index.md`.
4. Before writing code, load any applicable agent skill from `.agents/skills/` or `.claude/skills/`.
5. After completing a task, update any `agent-docs/` file whose topic was affected — match your changes against the index descriptions below.

## Index

### Architecture

- [ARCHITECTURE.md](agent-docs/ARCHITECTURE.md) — repo structure, package naming, Squide topology, tech stack, MODULES env var

### Design

- [design/README.md](agent-docs/design/README.md) — conventions for cross-cutting design docs

### References

- [references/development.md](agent-docs/references/development.md) — pnpm workspace, Node version, all dev/build/serve commands, MODULES
- [references/build-tooling.md](agent-docs/references/build-tooling.md) — Turborepo tasks, caching, syncpack semver groups, TypeScript config
- [references/ci-cd.md](agent-docs/references/ci-cd.md) — CI, Chromatic, Claude, and code-review GitHub Actions workflows

### Quality

- [quality/pre-commit-validation.md](agent-docs/quality/pre-commit-validation.md) — required checks before committing
- [quality/README.md](agent-docs/quality/README.md) — conventions for test and validation docs

### Decisions

- [adr/index.md](agent-docs/adr/index.md) — architectural decision log (Squide modules, domain Storybooks)
- [odr/index.md](agent-docs/odr/index.md) — operational decision log (pnpm+Turborepo, syncpack, Chromatic)

## Growth Conventions

- Every new file in `agent-docs/` gets an index entry above. To add a line, shorten or remove another to stay under ~55 lines.
- Only document what is currently true — no aspirational content.
- Never edit the Decision section of an accepted ADR/ODR. Create a new superseding record.
- When an ARCHITECTURE.md section exceeds ~40 lines, extract it to its own file.
- Cross-package contracts (e.g., "modules never import each other") belong in ARCHITECTURE.md, not in per-package files. Let the code (TypeScript types, barrel exports) document its own public API.
