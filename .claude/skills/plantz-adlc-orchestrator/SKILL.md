---
name: plantz-adlc-orchestrator
description: |
    Entry point for end-to-end feature development. Leads the ADLC (Agent Development Life Cycle) process by spawning subagents for planning, coding, testing, documenting, and merging.
    Use when asked to "build a feature", "develop end-to-end", "full ADLC", "implement feature from scratch", or any request that requires coordinated planning, implementation, testing, and PR creation.
license: MIT
---

# ADLC Orchestrator

Coordinates the full Agent Development Life Cycle for a feature by spawning specialized subagents sequentially. Each step must complete before the next begins.

## Subagent Protocol

1. **Subagent A** (drafter): produces the initial output (plan, code, test report, doc update).
2. **Subagent B** (challenger): reviews Subagent A's output and improves it. B applies all fixes directly — both mechanical (missing semicolons, import paths) and substantive (better component structure, missing accessibility, architectural improvements). B does not defer fixable concerns — it resolves them by editing the output files and the code. The one exception: B can write an escalation file for structural issues that require a plan revision (see "Escalation Check").

The **orchestrator** spawns both subagents directly — subagents never spawn further subagents. Only one subagent writes to the repo or output file at a time (A finishes before B starts).

The two subagents exist to produce better output through collaboration. The real validation gate is the `plantz-adlc-test` phase — not the reviewer subagent. B's job is to catch what it can and improve quality before that gate.

**Subagent lifecycle:** Claude Code subagents are stateless. Each spawned subagent starts fresh. Context is passed between iterations via files in `./tmp/runs/[run-uuid]/`. Always spawn new subagents with the relevant file paths — never refer to "existing subagents."

## Port Cleanup Between Subagents

Code and test subagents may start dev servers (port `8080`) or Storybooks (port `6006`) for browser verification. They may not clean up properly — especially if they crash or hit context limits. **After every code or test subagent returns**, run the port-cleanup procedure before spawning the next subagent:

```bash
# Linux:
kill -9 $(lsof -ti :8080) 2>/dev/null
kill -9 $(lsof -ti :6006) 2>/dev/null

# Windows:
netstat -ano | grep :8080 | grep LISTENING
# If a PID is found:
taskkill //PID <PID> //T //F
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

**If an inline plan was provided in the prompt:** Write it to `./tmp/runs/[run-uuid]/plan.md`. Then spawn only **Subagent B** using the `plantz-adlc-plan` skill. Pass: `run-uuid`, `mode=review`, feature description, and the plan path. B validates the format, challenges gaps, and improves the plan. Skip Subagent A entirely.

**Otherwise:** Spawn two subagents using the `plantz-adlc-plan` skill (following the subagent protocol). Pass: `run-uuid`, `mode=draft`, feature description. Existing plan path and escalation path are `null`.

When done, verify `./tmp/runs/[run-uuid]/plan.md` exists. If not, fail the run.

### Step 4 — Code

Spawn two subagents using the `plantz-adlc-code` skill.
Pass: `run-uuid`, `iteration=1`, plan path. Issues path and changes path are `null` for iteration 1.
When done, verify `./tmp/runs/[run-uuid]/changes-1.md` exists. If not, fail the run.

**Escalation check:** After the code subagent returns, check for `./tmp/runs/[run-uuid]/escalation-1.md`. If present, follow the escalation check procedure (see "Escalation check" below).

### Step 5 — Simplify

Spawn **one** subagent to run the `/simplify` skill — review the uncommitted changes for dead code, redundant abstractions, and over-engineering. This runs once on the initial implementation — fix iterations produce small surgical patches that don't need simplification.

### Step 6 — Test and iterate

Spawn two subagents using the `plantz-adlc-test` skill.
Pass: `run-uuid`, `iteration=1`.

- If `./tmp/runs/[run-uuid]/test-issues-[iteration].md` is produced with issues:
    - Increment the iteration number. Update `orchestrator-state.md` with the new iteration and sub-phase (`code`).
    - Spawn new `plantz-adlc-code` subagents. Pass: `run-uuid`, the new `iteration`, plan path, the previous iteration's issues file path, and the previous iteration's changes file path. They produce `changes-[iteration].md`.
    - **Escalation check:** After the code subagent returns, follow the escalation check procedure (see "Escalation check" below).
    - **Health check (iteration 3):** Before running the final test, compare `changes-[iteration].md` to the previous iteration. If the current iteration modified more files than the previous, and the same files appear in both iterations' test issues, the fix cycle is expanding rather than converging — follow the failure handling procedure instead of spending the last iteration.
    - Update `orchestrator-state.md` sub-phase to `test`.
    - Spawn new `plantz-adlc-test` subagents. Pass: `run-uuid`, the new `iteration`.
    - Repeat until no issues or max iterations reached.
- **Maximum 3 iterations.** If issues persist after 3 test-fix cycles, stop the run and follow the failure handling procedure (write `failure-summary.md` with the unresolved issues, set status to failed).
- If no issues file is produced (or it's empty), proceed.

### Step 7 — Document

Spawn two subagents using the `plantz-adlc-document` skill (following the subagent protocol).
Pass: `run-uuid`, the final iteration number.

### Step 8 — Merge

Spawn **one** subagent using the `plantz-adlc-merge` skill. This step uses a single subagent only — concurrent git operations would conflict.
Pass: `run-uuid`, the branch name from step 2, the commit type from step 2, the plan path (`./tmp/runs/[run-uuid]/plan.md`), and `CI attempt` (starts at `1`).

The merge subagent returns in one of three ways:

- **Success:** All CI checks passed and Chromatic succeeded. Proceed to Step 9.
- **CI failure:** The merge subagent writes `ci-issues-[attempt].md` and stops. Update `orchestrator-state.md` sub-phase to `ci-fix` and increment `CI fix attempts`. Spawn `plantz-adlc-code` subagents (2 subagents, following the subagent protocol) with: `run-uuid`, `iteration` continuing from where the test phase left off, plan path, the CI issues file, and the latest changes file. After the code subagent returns, run the escalation check (see "Escalation Check"). If no escalation, run `pnpm lint` to catch regressions before pushing again. Then spawn a new merge subagent (passing the incremented `CI attempt`) to commit, push, and resume monitoring. **Maximum 3 CI fix attempts** — if CI still fails, follow the failure handling procedure.
- **Chromatic failure:** The merge subagent tagged maintainers in the PR and stopped. No `ci-issues` file is produced — Chromatic failures are visual regressions requiring human review. Report this to the user and follow the failure handling procedure (set status to failed, preserve artifacts).

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
- Sub-phase: [code/test/none] (within step 6 only; within step 8: ci-fix/none)
- Plan revised: [yes/no]
- CI fix attempts: [0-3] (within step 8 only)
- Status: [completed/in-progress/failed]
```

This allows the orchestrator to recover if the context window is compacted mid-run. At the start of each step, read this file to restore state if needed.

## Run UUID

Every run has its own folder under `./tmp/runs/` to avoid file collisions between concurrent or successive runs. The UUID is generated once at the start and passed to every subagent. The `tmp/` directory is already in `.gitignore`.

## Iteration Tracking

The orchestrator maintains the iteration counter (starting at 1). Each test-fix cycle increments it. The counter is passed to subagents so they name their output files correctly:

- `changes-1.md`, `changes-2.md`, ...
- `test-issues-1.md`, `test-issues-2.md`, ...

## Escalation Check

Referenced from Step 4, Step 6, and Step 8. After any code subagent returns, check for `./tmp/runs/[run-uuid]/escalation-[iteration].md`. If absent, continue normally (proceed to the next phase — test, simplify, or lint depending on context). If present:

1. Read `orchestrator-state.md` to check whether `Plan revised` is already `yes`. If so, this is a second escalation — follow the failure handling procedure immediately.
2. Read the escalation file and judge whether the issue is genuinely structural (the plan's approach is fundamentally wrong) or whether the code agent is being too cautious about a fixable problem.
3. **If justified:** Spawn new `plantz-adlc-plan` subagents (following the subagent protocol) with `mode=revision`, the original feature description, the current `plan.md` path, and the escalation file path. They revise `plan.md`. After the plan subagents finish, delete all `escalation-*.md`, `changes-*.md`, `test-issues-*.md`, and `ci-issues-*.md` files from the run folder. Then reset the working tree and undo any commits from the failed approach:
    ```bash
    # If escalation happened during Step 8 (code was already committed), undo the commit:
    # git reset HEAD~1
    # Then discard all working tree changes:
    git checkout -- .
    git clean -fd --exclude=tmp/
    ```
    If this escalation happened during Step 8, first run `git reset HEAD~1` to undo the merge skill's commit before cleaning the working tree. The existing PR remains open — the merge skill checks for an existing PR and skips creation.
    Reset iteration to 1, update `orchestrator-state.md` with `Plan revised: yes`, and restart from Step 4 (Code). Step 5 (Simplify) runs again on the fresh implementation.
4. **If not justified:** Proceed to the next phase (simplify, test, or lint depending on context). The escalation file remains on disk. Pass it to the next code subagent via the `Escalation context` input if another fix cycle occurs — the code subagent reads it to understand what was tried and why the orchestrator disagreed. If no further fix cycle occurs (tests pass), ignore it.
5. **Maximum 1 plan revision per run.** Enforced by checking `Plan revised` in step 1 above.
