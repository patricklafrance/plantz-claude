## Rules

1. Before changing a module API or architectural pattern, check `agent-docs/adr/index.md`.
2. Before changing build tooling, CI, or dev workflows, check `agent-docs/odr/index.md`.
3. Before reporting a task complete, run `git status --short`. If any changed file affects repo structure, build/CI config, module registration, package exports, or a topic in the Index below, open the matching doc and fix any line that no longer matches reality. Pure feature code within an existing module does not require a doc check. Stop after one pass.
4. Never add dependencies to the root `package.json` unless they are global workspace tools (turbo, syncpack, oxlint, tsx, cross-env, etc.). Domain-specific deps belong in the `package.json` of the app or package that uses them.

## Index

### Architecture

- [ARCHITECTURE.md](agent-docs/ARCHITECTURE.md) — repo structure, package naming, Squide topology, data layer (BFF-per-module), tech stack, MODULES env var

### References

- [references/domains.md](agent-docs/references/domains.md) — domain responsibilities, feature placement decision tree, module granularity criteria
- [references/msw-tanstack-query.md](agent-docs/references/msw-tanstack-query.md) — TanStack DB + TanStack Query + MSW data layer patterns
- [references/storybook.md](agent-docs/references/storybook.md) — Storybook CSF3 conventions, Chromatic modes, story structure
- [references/tailwind-postcss.md](agent-docs/references/tailwind-postcss.md) — Tailwind CSS v4, PostCSS config, @source scanning
- [references/shadcn.md](agent-docs/references/shadcn.md) — shadcn/ui v4 + Base UI, CLI fixups, component patterns
- [references/color-mode.md](agent-docs/references/color-mode.md) — dark mode via class strategy, theme tokens, color-mode hook
- [references/turborepo.md](agent-docs/references/turborepo.md) — task definitions, dependsOn, caching, conventions
- [references/typescript.md](agent-docs/references/typescript.md) — tsconfig, tsgo
- [references/ci-cd.md](agent-docs/references/ci-cd.md) — CI, Chromatic, Claude, code-review, audit-agent-docs, and smoke-tests GitHub Actions workflows
- [references/writing-agent-instructions.md](agent-docs/references/writing-agent-instructions.md) — principles for writing instructions agents actually follow
- [references/bundle-size-budget.md](agent-docs/references/bundle-size-budget.md) — size-limit budget rules (when to optimize vs. bump, limits, PR requirements)

### Decisions

- [adr/index.md](agent-docs/adr/index.md) — architectural decision log (Squide local modules, domain Storybooks, MSW + TanStack Query data layer, BFF-per-module)
- [odr/index.md](agent-docs/odr/index.md) — operational decision log (pnpm+Turborepo, syncpack, Chromatic, JIT packages, Knip, size-limit)

## Growth Conventions

- New `agent-docs/` files get an index entry above; keep this file under ~55 lines. Only document what is currently true.
- Domain-specific patterns belong in a scoped `CLAUDE.md` near the code (e.g., `apps/management/CLAUDE.md`), not in `agent-docs/`.
