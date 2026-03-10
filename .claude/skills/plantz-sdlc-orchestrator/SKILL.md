---
name: plantz-sdlc-orchestrator
description: |
    Entry point for end-to-end feature development. Leads the SDLC process by spawning subagents for planning, coding, testing, documenting, and merging.
    Use when asked to "build a feature", "develop end-to-end", "full SDLC", "implement feature from scratch", or any request that requires coordinated planning, implementation, testing, and PR creation.
disable-model-invocation: true
license: MIT
---

# SDLC Orchestrator

Coordinates the full software development lifecycle for a feature by spawning specialized subagents sequentially. Each step must complete before the next begins.

## Subagent Protocol

1. **Subagent A** (drafter): produces the initial output (plan, code, test report, doc update).
2. **Subagent B** (challenger): reviews Subagent A's output and improves it. B applies all fixes directly — both mechanical (missing semicolons, import paths) and substantive (better component structure, missing accessibility, architectural improvements). B does not defer concerns — it resolves them by editing the output files and the code.

The **orchestrator** spawns both subagents directly — subagents never spawn further subagents. Only one subagent writes to the repo or output file at a time (A finishes before B starts).

The two subagents exist to produce better output through collaboration. The real validation gate is the `plantz-sdlc-test` phase — not the reviewer subagent. B's job is to catch what it can and improve quality before that gate.

**Subagent lifecycle:** Claude Code subagents are stateless. Each spawned subagent starts fresh. Context is passed between iterations via files in `./tmp/runs/[run-uuid]/`. Always spawn new subagents with the relevant file paths — never refer to "existing subagents."

## Port Cleanup Between Subagents

Code subagents may start dev servers (port `8080`) or Storybooks (port `6006`) to verify their work in a browser. They may not clean up properly — especially if they crash or hit context limits. **After every code or test subagent returns**, run the port-cleanup procedure before spawning the next subagent:

```bash
# Check and kill any process on port 8080
netstat -ano | grep :8080 | grep LISTENING
# If a PID is found:
taskkill //PID <PID> //T //F

# Check and kill any process on port 6006
netstat -ano | grep :6006 | grep LISTENING
# If a PID is found:
taskkill //PID <PID> //T //F
```

This is a safety net, not an indication that subagents should skip their own cleanup. But always run it — orphan servers cause port conflicts that fail subsequent subagents.

## Failure Handling

If a subagent fails to produce its expected output file, or if a command fails unexpectedly:

1. **Stop the run** — do not retry blindly.
2. **Preserve artifacts** — do not clean up `./tmp/runs/[run-uuid]/`. All intermediate files (`changes-*.md`, `test-issues-*.md`, `orchestrator-state.md`) remain on disk for post-mortem.
3. **Write a failure summary** to `./tmp/runs/[run-uuid]/failure-summary.md` containing: the step that failed, the error or unresolved issues, and what was attempted.
4. **Update `orchestrator-state.md`** with `Status: failed`.

Only clean up the run folder on successful completion (step 9).

## Steps

### Step 1 — Generate run UUID and create run folder

```bash
node -e "console.log(require('crypto').randomUUID())"
mkdir -p ./tmp/runs/[run-uuid]/
```

Pass the UUID to every subagent.

### Step 2 — Create a branch from `main`

First, run `git status --short` to verify the working tree is clean. If there are uncommitted changes, stop and ask the user to resolve them.

Branch format: `{type}/{short-description}` (kebab-case).
Use the conventional commit type matching the feature intent: `feat`, `fix`, `chore`, `docs`, `refactor`.
Example: `feat/add-watering-schedules`.

```bash
git checkout main
git pull origin main
git checkout -b {type}/{short-description}
```

### Step 3 — Plan

Spawn two subagents using the `plantz-sdlc-plan` skill (following the subagent protocol).
Pass: `run-uuid`, feature description.
When done, verify `./tmp/runs/[run-uuid]/plan.md` exists. If not, fail the run.

### Step 4 — Code

Spawn two subagents using the `plantz-sdlc-code` skill.
Pass: `run-uuid`, `iteration=1`, plan path. Issues path and changes path are `null` for iteration 1.
When done, verify `./tmp/runs/[run-uuid]/changes-1.md` exists. If not, fail the run.

### Step 5 — Simplify

Spawn **one** subagent to run the `/simplify` skill — review the uncommitted changes for dead code, redundant abstractions, and over-engineering. This runs once on the initial implementation — fix iterations produce small surgical patches that don't need simplification.

### Step 6 — Test and iterate

Spawn two subagents using the `plantz-sdlc-test` skill.
Pass: `run-uuid`, `iteration=1`.

- If `./tmp/runs/[run-uuid]/test-issues-[iteration].md` is produced with issues:
    - Increment the iteration number. Update `orchestrator-state.md` with the new iteration and sub-phase (`code`).
    - Spawn new `plantz-sdlc-code` subagents. Pass: `run-uuid`, the new `iteration`, plan path, the previous iteration's issues file path, and the previous iteration's changes file path. They produce `changes-[iteration].md`.
    - Update `orchestrator-state.md` sub-phase to `test`.
    - Spawn new `plantz-sdlc-test` subagents. Pass: `run-uuid`, the new `iteration`.
    - Repeat until no issues or max iterations reached.
- **Maximum 3 iterations.** If issues persist after 3 test-fix cycles, stop the run and follow the failure handling procedure (write `failure-summary.md` with the unresolved issues, set status to failed).
- If no issues file is produced (or it's empty), proceed.

### Step 7 — Document

Spawn two subagents using the `plantz-sdlc-document` skill (following the subagent protocol).
Pass: `run-uuid`, the final iteration number.

### Step 8 — Merge

Spawn **one** subagent using the `plantz-sdlc-merge` skill. This step uses a single subagent only — concurrent git operations would conflict.
Pass: `run-uuid`, the branch name from step 2, the commit type from step 2.

The merge subagent may return control in these cases:

- **CI failure:** The merge subagent writes `ci-issues-[attempt].md` and returns. The orchestrator spawns `plantz-sdlc-code` subagents (2 subagents, following the subagent protocol) with: `run-uuid`, `iteration` continuing from where the test phase left off, plan path, the CI issues file, and the latest changes file. After the fix, run `pnpm lint` to catch regressions before pushing again. Then spawn a new merge subagent to commit, push, and resume monitoring. **Maximum 3 CI fix attempts** — if CI still fails, follow the failure handling procedure.
- **PR comments:** The merge subagent writes `pr-comments-[attempt].md` and returns. The orchestrator spawns `plantz-sdlc-code` and/or `plantz-sdlc-document` subagents (2 subagents each, following the subagent protocol) to address legitimate comments. After the fix, spawn a new merge subagent to commit, push, resolve comments, and resume monitoring. **Maximum 3 PR comment cycles** — if comments keep coming, follow the failure handling procedure.

### Step 9 — Clean up

Delete the `./tmp/runs/[run-uuid]/` folder.

## State Persistence

After completing each step, write the current state to `./tmp/runs/[run-uuid]/orchestrator-state.md`:

```markdown
# Orchestrator State

- Run UUID: [uuid]
- Branch: [branch-name]
- Commit type: [type]
- Current step: [step number]
- Iteration: [current iteration number]
- Sub-phase: [code/test/none] (within step 6 only)
- Status: [completed/in-progress/failed]
```

This allows the orchestrator to recover if the context window is compacted mid-run. At the start of each step, read this file to restore state if needed.

## Run UUID

Every run has its own folder under `./tmp/runs/` to avoid file collisions between concurrent or successive runs. The UUID is generated once at the start and passed to every subagent. The `tmp/` directory is already in `.gitignore`.

## Iteration Tracking

The orchestrator maintains the iteration counter (starting at 1). Each test-fix cycle increments it. The counter is passed to subagents so they name their output files correctly:

- `changes-1.md`, `changes-2.md`, ...
- `test-issues-1.md`, `test-issues-2.md`, ...
