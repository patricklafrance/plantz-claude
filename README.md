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

## Agent harness

Five pillars make this repo fully agent-driven. Each section links to the implementation files.

### 1. SDLC skills — end-to-end feature development

Six skills that form a complete Software Development Lifecycle. The orchestrator (`/plantz-sdlc-orchestrator`) is the sole entry point for feature development — it spawns subagents for each phase and coordinates them through file-based handoffs in `./tmp/runs/[uuid]/`.

```
User: "Add watering schedules to the management domain"
  └─ Orchestrator (step 1-9)
       ├─ Plan    → plan.md
       ├─ Code    → changes-1.md  (scaffolds modules, implements features)
       ├─ Test    → test-issues-1.md or ∅  (lint, modules, visual, smoke)
       │    └─ Fix loop: Code → Test → Code → Test  (max 3 iterations)
       ├─ Simplify → /simplify on changed files
       ├─ Document → audits agent-docs for drift
       └─ Merge   → commit, PR, monitor CI
```

| Skill                      | What it does                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `plantz-sdlc-orchestrator` | Entry point. Generates a run UUID, creates a branch, and runs steps 1-9 sequentially                  |
| `plantz-sdlc-plan`         | Drafts a structured technical plan (affected packages, file changes, acceptance criteria)              |
| `plantz-sdlc-code`         | Implements the plan or fixes issues from the test phase. Scaffolds modules on iteration 1              |
| `plantz-sdlc-test`         | Validates code quality — lint, module structure, quality gates, visual verification, smoke tests       |
| `plantz-sdlc-document`     | Audits agent-docs and CLAUDE.md for drift, creates ADRs/ODRs if new decisions were made               |
| `plantz-sdlc-merge`        | Commits, pushes, opens a PR, monitors CI. Returns control to orchestrator if fixes are needed         |

Key design decisions:
- **Self-contained**: plan, code, and test skills each embed their own `references/` files (tech-stack rules, styling conventions, accessibility requirements). Subagents never need to read another skill's files.
- **Subagent protocol**: Every multi-agent step uses a drafter/reviewer pair. The orchestrator spawns both — subagents never spawn further subagents.
- **File-based coordination**: All inter-step communication goes through files in `./tmp/runs/[uuid]/` (plan.md, changes-N.md, test-issues-N.md). This makes handoffs explicit and debuggable.
- **Automated quality gates**: Visual verification uses `agent-browser` to screenshot pages in light/dark mode, inspect the accessibility tree, and test keyboard navigation — no human reviewer in the loop.

**Files:** [`.claude/skills/plantz-sdlc-*/`](.claude/skills/)

### 2. Hooks (`.claude/hooks/`)

Shell scripts that run automatically before or after agent tool calls, enforcing architectural guardrails in real time. These fire on every agent action — they are the hard constraints that skills cannot bypass.

| Hook                                           | Trigger           | What it does                                                        |
| ---------------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `pre-bash--enforce-pnpm.sh`                    | Before Bash       | Blocks npm/npx — only pnpm allowed                                  |
| `pre-bash--lint-on-commit.sh`                  | Before Bash       | Runs oxlint on staged files before git commit                       |
| `pre-bash--no-file-level-disable-on-commit.sh` | Before Bash       | Rejects file-level `/* oxlint-disable */` comments on commit        |
| `pre-edit--protect-files.sh`                   | Before Edit/Write | Prevents modification of sensitive files                            |
| `pre-edit--module-import-guard.sh`             | Before Edit/Write | Prevents cross-module imports (`@modules/*` packages stay isolated) |
| `post-edit--format.sh`                         | After Edit/Write  | Formats with oxfmt                                                  |
| `post-edit--lint.sh`                           | After Edit/Write  | Lints with oxlint — reports issues immediately                      |

Hook names follow the `{event}--{what}.sh` convention so it's clear at a glance when a hook fires and what it does.

**Files:** [`.claude/hooks/`](.claude/hooks/), [`.claude/settings.json`](.claude/settings.json)

### 3. Supporting skills

The SDLC skills don't work alone — they load project-specific utility skills and shared external skills at runtime.

**Utility skills** (prefixed with `plantz-`):

| Skill                              | What it does                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `plantz-scaffold-domain-module`    | Scaffolds a new Squide module — creates files, registers in host, wires Storybook, adds dev script |
| `plantz-scaffold-domain-storybook` | Scaffolds a domain Storybook with Chromatic CI integration                                         |
| `plantz-seed-plants`               | Generates seed data and injects it into localStorage via Chrome DevTools MCP                       |
| `plantz-audit-agent-docs`          | 3-pass audit of all docs against the live codebase (structural, accuracy, instruction quality)     |
| `plantz-validate-modules`          | Validates every module conforms to the expected structure (12 checks)                              |
| `plantz-smoke-tests`               | Smoke-tests every app by starting dev servers and verifying pages load in a browser                |

Utility skills use a **reference module pattern** — instead of hardcoding dependency versions or configs, they read a canonical reference module (e.g., `apps/management/plants/`) at execution time and clone from it.

**External skills** (symlinked from `.agents/skills/`):

| Skill                            | Loaded by                    | Purpose                                              |
| -------------------------------- | ---------------------------- | ---------------------------------------------------- |
| `workleap-react-best-practices`  | plan, code                   | React SPA performance patterns                       |
| `accessibility`                  | plan, code                   | WCAG 2.1 audit and remediation                       |
| `shadcn`                         | plan, code                   | shadcn/ui component management                       |
| `frontend-design`                | plan, code                   | Production-grade UI design                           |
| `workleap-squide`                | plan, code                   | Squide modular shell conventions                     |
| `pnpm`                           | code, test                   | Workspace dependency management                      |
| `turborepo`                      | code, test                   | Monorepo task orchestration                          |
| `vitest`                         | test                         | Unit testing                                         |
| `workleap-web-configs`           | code                         | Shared ESLint/TypeScript/Rsbuild configs             |
| `workleap-logging`               | code                         | Structured logging                                   |

**Files:** [`.claude/skills/`](.claude/skills/), [`.agents/skills/`](.agents/skills/)

### 4. ADRs and ODRs

Formal logs of _why_ decisions were made — not just what was decided. Agents check these before making changes to prevent contradictory work. The `plantz-sdlc-document` skill creates new records when implementation introduces new architectural or operational decisions.

| Record   | Decision                                                        |
| -------- | --------------------------------------------------------------- |
| ADR-0001 | Squide federated modules as the application shell               |
| ADR-0002 | Domain-scoped Storybooks for independent visual testing         |
| ODR-0001 | pnpm workspaces + Turborepo for package management              |
| ODR-0002 | Dependency versioning via syncpack (apps pin, packages use `^`) |
| ODR-0003 | Selective Chromatic runs — only test affected Storybooks        |
| ODR-0004 | JIT packages — no pre-build needed for dev                      |

**Files:** [`agent-docs/adr/`](agent-docs/adr/), [`agent-docs/odr/`](agent-docs/odr/)

### 5. CI/CD workflows (`.github/workflows/`)

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

---

### Other notable patterns

**Selective Chromatic runs** — a custom TypeScript utility ([`tooling/getAffectedStorybooks.ts`](tooling/getAffectedStorybooks.ts)) that detects which Storybooks were affected by code changes. Unaffected Storybooks skip their Chromatic build entirely.

**Instruction authoring principles** — a framework for writing agent instructions that actually get followed. Key insight: agents ignore advisory framing ("you should...") but follow prohibition framing ("never..."). See [`agent-docs/references/writing-agent-instructions.md`](agent-docs/references/writing-agent-instructions.md).

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
