# Agent Harness v2 — Design Document

Status: design exploration, not yet implemented.

## Philosophy

**Harness, not workflow.** V1 was a rigid pipeline (plan → architect → code → test → document → PR) with prescribed skills for each step. V2 is an environment with constraints, tools, and guidance. The agent decides how to approach work; the harness ensures quality and catches mistakes.

The plan provides predictability. The implementation is free. The hooks are the safety net.

## Architecture

### Three layers

**Layer 1 — Knowledge (passive, always available)**
agent-docs, ARCHITECTURE.md, ADRs/ODRs. The agent reads them when it needs context. A plan template exists as a reference doc, not a skill to invoke.

**Layer 2 — Guardrails (active, real-time)**
Hooks that fire on every tool call:

- Supervision engine: detects doom loops (12+ edits to same file in 15 min), nudges/blocks
- Import guard: blocks cross-module imports (@modules/_ can only import @packages/_)
- Format on save: oxfmt after every edit
- Secret scan: blocks credential leaks
- Protected files: blocks writes to lock files, .env

**Layer 3 — Gates (enforced at boundaries)**

- Per-slice: static checks (lint + typecheck) + browser verification for [visual]/[interactive] criteria
- Pre-PR: all slices pass, all criteria verified

### Skills

Only ONE real skill: the **planning skill**. It produces a structured plan (header + slice files) because the plan format IS the predictability. Everything else is the environment.

No coding skill — the coder gets a slice file and agent-docs. Hooks catch mistakes.
No review skill — verification is automated (lint + browser).
No A/B subagent pattern — one agent per invocation.

### Thin coordinator

Not a skill with procedures, just the thing that manages the slice-by-slice flow:

```
coordinator receives: feature request + plan (header.md + slices/*.md)

for each slice file in slices/:

  # 1. Spawn coder
  coder = spawn agent:
    "Read .harness/header.md and .harness/slices/03-household-page.md.
     Implement the file changes described in the slice."

  # 2. Static checks (always, automated)
  run: pnpm typecheck && pnpm lint
  if fail → resume coder with errors (max 3 attempts)

  # 3. Browser verification (conditional)
  if slice has [visual] or [interactive] criteria:
    spawn verification agent (reads criteria from slice file)
    if fail → resume coder with verification report (max 3 attempts)

  # 4. Slice done, next

after all slices:
  commit, push, open PR
```

The coder agent is resumed (via SendMessage) on fix iterations, not replaced. This preserves the coder's full context — it already knows what it built, what patterns it followed, and what trade-offs it made. A fresh agent would waste tokens re-reading files and risk making different choices.

## Plan format

### Multi-file split

The monolithic plan.md (~10K tokens, 400 lines) is split into:

- `header.md` (~500 tokens) — durable decisions, shared context
- `slices/01-title.md` (~1.5-2.5K tokens each) — per-slice file changes + acceptance criteria

Rationale: The coder reads ~2.5K tokens (header + slice) instead of 10K. Prior slices are already on disk as real code — the coder reads the actual files it needs, not plan descriptions.

### Directory structure

```
.harness/
  header.md                    # Durable decisions, data model, affected packages
  slices/
    01-{title}.md              # Slice file changes + acceptance criteria
    02-{title}.md
    ...
  completed/
    01/
      verification.md          # Browser verification results
    ...
```

Flat directory — no run IDs. One feature at a time. The coordinator cleans `.harness/` before starting a new feature. No `current/` staging folder, no `prior-summary.md`. The coder reads the actual codebase for context on prior slices.

### header.md (~500 tokens)

Compressed, table-based. Under 1,000 tokens maximum.

```markdown
# Plan: {Feature Name}

## Objective

{1-2 sentences}

## Decisions

| Decision           | Choice                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| New modules        | `management/household` → `@modules/management-household`                           |
| Extended modules   | `management-plants`, `today-landing-page`                                          |
| Shared pkg changes | `core-module`: household types/DB/seed; `core-plants`: Plant schema += householdId |
| API namespaces     | `management-household` owns `/api/management/household/*`                          |
| Routes             | `/management/household` → `management-household` module                            |
| Collections        | `management-household`: direct fetch+useState (no TanStack DB collection)          |

## Data Model

Household { id, name, ownerId, creationDate }
HouseholdMember { id, householdId, userId, userName, role: "owner"|"member", joinedDate }
Plant += { householdId?, responsibilityUserId?, responsibilityUserName? }
CareEvent += { actorId?, actorName? }

## Affected Packages

@packages/core-module, @packages/core-plants, @modules/management-household (new),
@modules/management-plants, @modules/today-landing-page, @apps/host

## Scaffolding

- Run /scaffold-domain-module with domain=management, module=household
```

### Durable architectural decisions (6 categories)

The planner identifies these BEFORE slicing. They apply across ALL slices:

| Category            | What the planner decides                            | Why it's durable                                       |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Entity placement    | Shared package vs module-local DB                   | Wrong choice forces cross-phase refactoring            |
| API namespace       | /api/<domain>/<entity> per module, who owns each    | Hardcoded in handlers, fetch calls, stories            |
| Module boundary     | New module vs extend existing                       | New module = package.json, registration, route cluster |
| Data model shape    | Zod schemas + types for new entities                | Imported by handlers, collections, components          |
| Collection strategy | TanStack DB collection vs fetch+useState per module | Determines component wiring, decorators                |
| Route structure     | Exact paths registered with Squide                  | Referenced in nav items, links, stories                |

### Slice file (~1.5-2.5K tokens)

```markdown
# Slice {N}: {Title}

> **Depends on:** Slice {X} (types/schemas), Slice {Y} (handlers)

## Goal

One sentence: what the user can do after this slice ships.

## File Changes

### 1. `{path/to/file}` — {Create|Modify}: {what}

**Reference:** `{path/to/existing-file}` (follow this pattern)

- {concrete instruction: prop interface, JSX structure, handler shape}
- {each bullet eliminates a design decision the coder would otherwise have to make}
- ...

### 2. `{path/to/next-file}` — {Create|Modify}: {what}

...

## Acceptance Criteria

### Visual [visual]

- [ ] {Story or page}: {what to look for — specific enough for agent-browser}

### Interactive [interactive]

- [ ] {User action} → {expected outcome}
- [ ] {Mutation action} → {loading state on trigger element}
- [ ] {After mutation} → {UI consequence: list refreshes, counter updates, etc.}
```

Key design decisions in slice format:

- File changes ordered by dependency (types before components, components before pages)
- **Reference:** pointers to existing files the coder should pattern-match against
- Coder reads actual code on disk for prior slice context (not plan descriptions)
- Every file description specific enough for one-pass implementation (supervision-safe)
- No [static] criteria — lint/typecheck run automatically
- [interactive] mutations require companion criteria for loading state + UI consequence

## Acceptance criteria

Only two tags:

| Tag             | Verified by              | Example                                                        |
| --------------- | ------------------------ | -------------------------------------------------------------- |
| `[visual]`      | Screenshot (browser)     | "Household page shows members list with role badges"           |
| `[interactive]` | Click/navigate (browser) | "Clicking Invite opens the dialog, submit shows loading state" |

No `[static]` tag — static linting tools (typecheck, oxlint, syncpack, knip) run automatically via hooks and the coordinator's static check gate. Listing them as criteria is redundant.

Rules for acceptance criteria:

1. Every criterion has exactly one tag: [visual] or [interactive]
2. UI changes need specific, verifiable descriptions (not "looks good")
3. Every [interactive] mutation needs companion criteria: loading state on trigger + UI consequence after completion
4. Grid/table changes need header-to-body alignment criteria

## Browser verification flow

Triggered by the coordinator after each slice that has [visual] or [interactive] criteria.

The verification agent:

1. Reads the slice file's Acceptance Criteria section
2. Starts the dev server (pnpm dev-storybook or pnpm dev-host)
3. For [visual]: navigates to relevant story, takes screenshot, assesses
4. For [interactive]: screenshots before state, performs action, screenshots after state, assesses
5. Writes results to .harness/completed/{NN}/verification.md
6. Stops the dev server

If criteria fail, the coordinator resumes the coder agent (via SendMessage) with the verification report. The coder retains its full implementation context. Max 3 fix attempts per slice.

## Architect skill (lightweight, optional)

Still valuable but reframed. Not enrichment (no inline contracts/constraints). Instead: a pass/fail structural review gate.

The architect reads the concatenated plan (header + all slices) and asks: "Is this plan structurally sound, or does it have a fundamental problem that would waste multiple slices of coder effort?"

- Pass: proceed to coding
- Fail: return a short revision note to the planner

Catches: wrong module boundary, missing denormalization, circular dependency, wrong entity placement.
Does NOT enrich the plan with contracts or constraints — keeps the plan clean.

Goal: keep the plan skill under 100K tokens by separating planning from structural review.

## AI engineering learnings embedded

Two learnings from V1 that shape the plan skill:

**1. Supervision-safe granularity**
File change descriptions must be specific enough for one-pass implementation. Ambiguous descriptions ("add shared plant functionality") cause the coder to iterate, hitting the doom-loop detector (blocks at 12 edits to same file in 15 min). Complex files need key decisions stated inline: which props, which state shape, which data source.

**2. Module import guard awareness**
The plan must resolve every cross-module data flow explicitly. If two modules need the same data, the plan must route through a shared package. The pre-edit hook blocks cross-module imports — this cannot be worked around at code time.

## What changed from V1

| Aspect               | V1                                                                 | V2                                                  |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| Philosophy           | Workflow (prescribed steps)                                        | Harness (environment + gates)                       |
| Plan format          | Single monolithic plan.md (~10K tokens)                            | header.md (~500) + slice files (~2K each)           |
| Skills               | 7 ADLC skills (plan, architect, code, test, document, PR, monitor) | 1 plan skill + thin coordinator                     |
| A/B pattern          | Every phase has drafting + review subagents                        | No A/B — one agent per invocation                   |
| Acceptance criteria  | [static], [visual], [interactive]                                  | [visual], [interactive] only                        |
| Architect            | Enriches plan with contracts/constraints                           | Pass/fail structural gate                           |
| Coder context        | Reads entire 10K plan                                              | Reads ~2.5K (header + slice) + actual code on disk  |
| Browser verification | Separate test skill, separate phase                                | Verification agent spawned by coordinator per-slice |
| Cross-slice context  | Prior-summary.md, reference pointers                               | Coder reads actual code files from prior slices     |

## Hooks (already implemented)

Supervision engine: `.claude/hooks/lib/supervision-engine.mjs`

- PostToolUse tracking: `.claude/hooks/post-tool-use--supervise.sh`
- PreToolUse enforcement: `.claude/hooks/pre-tool-use--supervise.sh`
- State: `.claude/snapshots/supervision-state.json` (gitignored, reset on session start)
- Thresholds: Edit nudge=7/block=12, Write nudge=4/block=7, Bash nudge=5/block=8
- Circuit breaker: on block, resets counter for that target

Other hooks (pre-existing):

- `post-edit--format.sh` — oxfmt after every edit (including .md files)
- `post-edit--lint.sh` — oxlint after edits
- `pre-edit--module-import-guard.sh` — blocks cross-module imports
- `pre-edit--protect-files.sh` — blocks writes to .env, lock files, node_modules
- `pre-bash--enforce-pnpm.sh` — blocks npm/npx, enforces pnpm
- `pre-bash--secret-scan.sh` — blocks credential leaks
- `session-start--repo-snapshot.sh` — captures repo state, resets supervision state
- `stop--verify-completion.sh` — verifies lint, structural doc drift, debug artifacts
- `stop--verify-subagent.sh` — verifies ADLC subagent deliverables (needs V2 update)

## Open questions

1. **Coordinator implementation**: Is it a skill, a hook, or just instructions in CLAUDE.md?
2. **Plan skill internals**: How does the planner decide slice boundaries? Heuristics needed.
3. **Architect gate**: When exactly in the flow? Before first slice only, or can it interrupt?
4. **Regression across slices**: If Slice 3 breaks Slice 1's behavior, how does the coordinator detect and handle it?
5. **Feature size threshold**: At what point does the agent plan+slice vs just code directly?
6. **Documentation phase**: V1 had a doc skill. V2 drops it — who updates agent-docs after implementation?
