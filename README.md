# plantz-claude

A plants watering app used as a proof-of-concept for a **Claude Code agent harness** — a structured setup that lets AI agents scaffold features, audit documentation, smoke-test apps, and maintain architectural consistency without human hand-holding.

The app itself is intentionally simple. The interesting part is the agent infrastructure around it.

## What's in this repo

### The application

A pnpm monorepo with Turborepo orchestration and [Squide](https://github.com/gsoft-inc/wl-squide) federated modules.

```
apps/
  host/                        # Thin shell — bootstraps Squide, no domain logic
  management/
    plants/                    # Management domain module
    storybook/                 # Management domain Storybook + Chromatic
  today/
    landing-page/              # Today domain module
    storybook/                 # Today domain Storybook + Chromatic
  storybook/                   # Packages-layer Storybook
packages/
  components/                  # Shared UI — shadcn/ui (Base UI) + Tailwind v4
  squide-core/                 # Shared Squide utilities
  storybook/                   # Shared Storybook config
```

Each domain is fully isolated — modules never import from each other. Each has its own Storybook and Chromatic token for independent visual regression testing.

**Packages are JIT** — they expose source via `exports` fields and consumers compile them directly. No pre-build step needed for dev.

### Tech stack

Node 24+, pnpm 10, TypeScript 7 (tsgo), Rsbuild, Tailwind CSS 4, TanStack DB, Storybook 10, Chromatic, Vitest, oxlint, oxfmt, syncpack.

---

## Agent harness concepts

These are the patterns and tools that make this repo agent-friendly. Each section links to the implementation files.

### 1. Agent memory (`CLAUDE.md` + `agent-docs/`)

Agents don't retain context between sessions. The `CLAUDE.md` file at the repo root acts as an **index** — a table of contents that agents read at the start of every task to find the right doc. Detailed documentation lives in `agent-docs/`.

The key rule: **agents must never guess about architecture or conventions**. They load the relevant doc first.

`CLAUDE.md` is kept under ~55 lines. When a topic grows, it gets extracted into `agent-docs/` with an index entry pointing to it.

**Files:** [`CLAUDE.md`](CLAUDE.md), [`agent-docs/`](agent-docs/)

### 2. Architectural Decision Records (ADRs) and Operational Decision Records (ODRs)

Formal logs of _why_ decisions were made — not just what was decided. Agents check these before making changes to prevent contradictory work.

| Record   | Decision                                                        |
| -------- | --------------------------------------------------------------- |
| ADR-0001 | Squide federated modules as the application shell               |
| ADR-0002 | Domain-scoped Storybooks for independent visual testing         |
| ODR-0001 | pnpm workspaces + Turborepo for package management              |
| ODR-0002 | Dependency versioning via syncpack (apps pin, packages use `^`) |
| ODR-0003 | Selective Chromatic runs — only test affected Storybooks        |
| ODR-0004 | JIT packages — no pre-build needed for dev                      |

**Files:** [`agent-docs/adr/`](agent-docs/adr/), [`agent-docs/odr/`](agent-docs/odr/)

### 3. Agent skills (`.claude/skills/`)

Skills are reusable procedures that agents load when a task matches. They contain step-by-step instructions, file templates, and prohibitions.

**Project-specific skills** (prefixed with `plantz-`):

| Skill                              | What it does                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `plantz-scaffold-domain-module`    | Scaffolds a new Squide module — creates files, registers in host, wires Storybook, adds dev script |
| `plantz-scaffold-domain-storybook` | Scaffolds a domain Storybook with Chromatic CI integration                                         |
| `plantz-seed-plants`               | Generates seed data and injects it into localStorage via Chrome DevTools MCP                       |
| `plantz-audit-agent-docs`          | 3-pass audit of all docs against the live codebase (structural, accuracy, instruction quality)     |
| `plantz-validate-modules`          | Validates every module conforms to the expected structure (9 checks)                               |
| `plantz-smoke-tests`               | Smoke-tests every app by starting dev servers and verifying pages load in a browser                |

Skills use a **reference module pattern** — instead of hardcoding dependency versions or configs, they read a canonical reference module (e.g., `apps/management/plants/`) at execution time and clone from it. When tooling changes, only the reference module needs updating.

**Shared skills** (symlinked from `.agents/skills/`): pnpm, turborepo, vitest, shadcn, accessibility, frontend-design, workleap-squide, workleap-logging, workleap-react-best-practices, workleap-web-configs.

**Files:** [`.claude/skills/`](.claude/skills/), [`.agents/skills/`](.agents/skills/)

### 4. Instruction authoring principles

A formal framework for writing agent instructions that actually get followed. The key insight: **agents ignore advisory framing** ("you should...") but follow **prohibition framing** ("never...").

Principles:

- Prohibition framing over advisory
- State consequences explicitly ("a stale skill silently produces incomplete modules")
- Concrete verification steps, not vague diligence
- Negative examples adjacent to rules
- Single source of truth — never duplicate prescriptive content across files
- Tooling over prose — don't document what linters/compilers already enforce

**File:** [`agent-docs/references/writing-agent-instructions.md`](agent-docs/references/writing-agent-instructions.md)

### 5. Hooks (`.claude/hooks/`)

Shell scripts that run automatically before or after agent tool calls, enforcing architectural guardrails in real time.

Hook names follow the `{event}--{what}.sh` convention so it's clear at a glance when a hook fires and what it does.

| Hook                                           | Trigger           | What it does                                                        |
| ---------------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `pre-bash--enforce-pnpm.sh`                    | Before Bash       | Blocks npm/npx — only pnpm allowed                                  |
| `pre-bash--lint-on-commit.sh`                  | Before Bash       | Runs oxlint on staged files before git commit                       |
| `pre-bash--no-file-level-disable-on-commit.sh` | Before Bash       | Rejects file-level `/* oxlint-disable */` comments on commit        |
| `pre-edit--protect-files.sh`                   | Before Edit/Write | Prevents modification of sensitive files                            |
| `pre-edit--module-import-guard.sh`             | Before Edit/Write | Prevents cross-module imports (`@modules/*` packages stay isolated) |
| `post-edit--format.sh`                         | After Edit/Write  | Formats with oxfmt                                                  |
| `post-edit--lint.sh`                           | After Edit/Write  | Lints with oxlint — reports issues immediately                      |

**Files:** [`.claude/hooks/`](.claude/hooks/), [`.claude/settings.json`](.claude/settings.json)

### 6. CI/CD workflows (`.github/workflows/`)

Five GitHub Actions workflows, three of which involve Claude Code:

| Workflow               | Trigger                         | Purpose                                                      |
| ---------------------- | ------------------------------- | ------------------------------------------------------------ |
| `ci.yml`               | Push to main, PRs               | Build, lint (oxlint, oxfmt, typecheck, syncpack), test       |
| `chromatic.yml`        | Push to main, labeled PRs       | Visual regression testing — only affected Storybooks         |
| `claude.yml`           | `@claude` mention in issues/PRs | Claude Code agent responds to issues and PR comments         |
| `code-review.yml`      | PRs opened/updated              | Automated code review by Claude (read-only tools)            |
| `audit-agent-docs.yml` | Weekly cron + manual            | Runs the audit skill, creates PRs for Critical/High findings |

The audit workflow is self-healing — it detects when docs drift from reality and opens PRs to fix them.

**Files:** [`.github/workflows/`](.github/workflows/), [`.github/prompts/`](.github/prompts/)

### 7. Selective Chromatic runs

A custom TypeScript utility that detects which Storybooks were affected by code changes. Unaffected Storybooks skip their Chromatic build entirely.

This is driven by a hardcoded dependency map (`StorybookDependencies`) that maps each Storybook to the packages it depends on. The affected-detection runs `turbo ls --filter=...[baseSha]` to find changed packages and cross-references against the map.

**File:** [`tooling/getAffectedStorybooks.ts`](tooling/getAffectedStorybooks.ts)

---

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 10+

### Install

```bash
pnpm install
```

### Seed data

The app stores plant data in localStorage via TanStack DB. Without seeding, the plant list will be empty.

**With Claude Code** (recommended): run `/seed-plants`. The skill generates data, injects it into localStorage via Chrome DevTools MCP, and reloads the page automatically.

**Manually:**

```bash
pnpm seed-plants      # Generates apps/host/public/seed-plants.json
```

Then start the dev server, open DevTools in the browser, and run:

```js
const data = await fetch("/seed-plants.json").then((r) => r.text());
localStorage.setItem("plantz-plants", data);
location.reload();
```

### Run the app

```bash
pnpm dev-host                  # Full app — all modules (http://localhost:8080)
pnpm dev-management-plants     # Just the plants module
pnpm dev-today-landing-page    # Just the today module
```

To load specific modules manually:

```bash
cross-env MODULES=management/plants pnpm dev-host
```

### Run Storybooks

```bash
pnpm dev-packages-storybook      # Shared components (http://localhost:6006)
pnpm dev-management-storybook    # Management domain
pnpm dev-today-storybook         # Today domain
```

### Run checks

```bash
pnpm lint          # ESLint (per-package, via Turborepo)
pnpm oxlint        # oxlint (custom config in oxlintrc.json)
pnpm oxfmt         # Formatter check (oxfmt with Tailwind class sorting)
pnpm typecheck     # TypeScript (tsgo)
pnpm syncpack      # Dependency version consistency
```
