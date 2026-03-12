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
2. **Subagent B** (challenger): reviews Subagent A's output and improves it. B fixes everything it can by editing the output files and the code directly. The one exception: B can write an escalation file for structural issues that require a plan revision (see "Escalation Check").

The **orchestrator** spawns both subagents directly — subagents never spawn further subagents. Only one subagent writes to the repo or output file at a time (A finishes before B starts).

The real validation gate is the `plantz-adlc-test` phase — B improves quality before that gate but is not the final check.

**Subagent lifecycle:** Claude Code subagents are stateless. Each spawned subagent starts fresh. Context is passed between iterations via files in `./tmp/runs/[run-uuid]/`. Always spawn new subagents with the relevant file paths — never refer to "existing subagents."

## Port Cleanup Between Subagents

**After every code or test subagent returns**, kill any processes listening on ports 8080 and 6006 before spawning the next subagent.

## Failure Handling

If a subagent fails to produce its expected output file, or if a command fails unexpectedly:

1. **Stop the run** — do not retry blindly.
2. **Preserve artifacts** — do not clean up `./tmp/runs/[run-uuid]/`. All intermediate files (`changes-*.md`, `test-issues-*.md`, `orchestrator-state.md`) remain on disk for post-mortem.
3. **Write a failure summary** to `./tmp/runs/[run-uuid]/failure-summary.md` containing: the step that failed, the error or unresolved issues, and what was attempted.

Only clean up the run folder on successful completion (step 9).

## Steps

### Step 1 — Generate run UUID and create run folder

Generate a UUID and create `./tmp/runs/[run-uuid]/`. Pass the UUID to every subagent. Each run gets its own folder to avoid file collisions. (`tmp/` is already in `.gitignore`.)

### Step 2 — Create a branch from `main`

First, run `git status --short` to verify the working tree is clean. If there are uncommitted changes, stop and ask the user to resolve them.

Branch format: `{type}/{short-description}` (kebab-case).
Use the commit type matching the feature intent: `feat`, `fix`, `chore`, `docs`, `refactor`.
Example: `feat/add-watering-schedules`.

Pull latest `main` and create the branch.

### Step 3 — Plan

**If an inline plan was provided in the prompt:** Write it to `./tmp/runs/[run-uuid]/plan.md`. Spawn only **Subagent B** with `mode=review`, `run-uuid`, feature description, and the plan path.

**Otherwise:** Spawn two subagents with `mode=draft`, `run-uuid`, feature description. Existing plan path and escalation path are `null`.

When done, verify `./tmp/runs/[run-uuid]/plan.md` exists. If not, fail the run.

### Step 4 — Code

Spawn two subagents using the `plantz-adlc-code` skill.
Pass: `run-uuid`, `iteration=1`, plan path. Issues path, changes path, and escalation context are `null` for iteration 1.
When done, verify `./tmp/runs/[run-uuid]/changes-1.md` exists. If not, fail the run.

**Escalation check:** After the code subagent returns, check for `./tmp/runs/[run-uuid]/escalation-1.md`. If present, follow the escalation check procedure (see "Escalation check" below).

### Step 5 — Simplify

Spawn **one** subagent with the `simplify` skill to review the uncommitted changes for dead code, redundant abstractions, and over-engineering. This runs once on the initial implementation — fix iterations produce small surgical patches that don't need simplification.

If the subagent crashes or returns no output, log a warning and continue.

### Step 6 — Test and iterate

Spawn two subagents using the `plantz-adlc-test` skill.
Pass: `run-uuid`, `iteration=1`, plan path (`./tmp/runs/[run-uuid]/plan.md`), previous issues path (`null` for iteration 1).

- If `./tmp/runs/[run-uuid]/test-issues-[test iteration].md` is produced with issues:
    - Check `Test iteration` in `orchestrator-state.md` — if ≥ 3, follow the failure handling procedure (maximum 3 test iterations).
    - Increment `Test iteration`. Update `orchestrator-state.md` with the new value and set `Current step: 6-code`.
    - Spawn new `plantz-adlc-code` subagents. Pass: `run-uuid`, `iteration` = `Test iteration`, plan path, the previous iteration's issues file path (`test-issues-[test iteration - 1].md`), the previous iteration's changes file path (`changes-[test iteration - 1].md`), and escalation context (the rejected escalation file path if one was rejected earlier, otherwise `null`). They produce `changes-[test iteration].md`.
    - **Escalation check:** After the code subagent returns, follow the escalation check procedure (see "Escalation check" below).
    - Update `orchestrator-state.md` `Current step: 6-test`.
    - Spawn new `plantz-adlc-test` subagents. Pass: `run-uuid`, `iteration` = `Test iteration`, plan path, previous issues path (`test-issues-[test iteration - 1].md`).
    - Repeat until no issues or max reached.
- **Completion check:** Verify `changes-[test iteration].md` contains `<!-- test-complete -->`. If absent, the test subagent crashed — follow failure handling (note in `failure-summary.md` whether the issues file exists, indicating static checks ran but browser verification did not).
- If no issues file exists and the marker is present, proceed.

### Step 7 — Document

Spawn two subagents using the `plantz-adlc-document` skill (following the subagent protocol).
Pass: `run-uuid`, the final `Test iteration` number, plan path (`./tmp/runs/[run-uuid]/plan.md`).

When done, run `git diff --stat` to verify the subagent made documentation changes. A documentation phase that changes nothing is unusual — review the subagent's output to confirm it completed normally. If it appears to have crashed, follow the failure handling procedure.

### Step 8 — Merge

Spawn **one** subagent using the `plantz-adlc-merge` skill. This step uses a single subagent only — concurrent git operations would conflict.
Pass: `run-uuid`, the branch name from step 2, the commit type from step 2, the plan path (`./tmp/runs/[run-uuid]/plan.md`), the final `Test iteration` number, and `CI iteration` (starts at `1`). Set `CI iteration: 1` in `orchestrator-state.md`.

After the merge subagent creates the PR (or confirms one exists), query the PR number (`gh pr list --head {branch-name} --json number --jq '.[0].number'`) and record it in `orchestrator-state.md`. This survives context compaction.

The merge subagent returns in one of two ways:

- **Success:** All CI checks passed and the `run chromatic` label was added to trigger visual regression testing. Chromatic runs asynchronously — the agent does not wait for it. Proceed to Step 9.
- **CI failure:** The merge subagent writes `ci-issues-[CI iteration].md` and stops. Check `CI iteration` in `orchestrator-state.md` — if ≥ 3, follow the failure handling procedure (maximum 3 CI iterations). Otherwise, set `Current step: 8-ci-fix`. Spawn `plantz-adlc-code` subagents (2 subagents, following the subagent protocol) with: `run-uuid`, `iteration` = `Test iteration` + `CI iteration` (to avoid overwriting test-phase artifacts), plan path, the CI issues file, the latest changes file, and escalation context (`null` unless a prior escalation was rejected). After the code subagent returns, run the escalation check (see "Escalation Check"). If no escalation, increment `CI iteration` in state and spawn a new merge subagent (passing the new `CI iteration`) to commit, push, and resume monitoring.

### Step 9 — Clean up

Delete the `./tmp/runs/[run-uuid]/` folder.

## State Persistence

After completing each step, write the current state to `./tmp/runs/[run-uuid]/orchestrator-state.md` atomically (write to a temp file, then rename).

Template:

```markdown
# Orchestrator State

- Run UUID: [uuid]
- Branch: [branch-name]
- Commit type: [feat/fix/chore/docs/refactor] (conventional commit prefix)
- Current step: [1-9] (use `6-code` / `6-test` within step 6; `8-ci-fix` within step 8)
- Test iteration: [1-3] (current test-fix cycle — starts at 1, incremented after each test failure)
- Plan revised: [yes/no]
- Escalation rejected: [none/iteration-N — brief reason]
- HEAD commit: [hash] (from `git rev-parse HEAD` — update after each commit or tree reset)
- PR number: [number/none]
- CI iteration: [1-3/none] (within step 8 only — starts at 1, incremented after each CI failure + fix)
```

**Before writing state**, confirm the step's expected artifact exists — do not write state claiming a step completed if its output is missing.

This allows the orchestrator to recover if the context window is compacted mid-run. At the start of each step, read this file to restore state if needed.

## Iteration Tracking

Two iteration counters, both starting at 1:

- **`Test iteration`** (Step 6): Incremented after each test failure. Passed to code and test subagents. Artifacts: `changes-[N].md`, `test-issues-[N].md`. Maximum 3.
- **`CI iteration`** (Step 8): Incremented after each CI failure + fix. Passed to merge subagent. CI fix code artifacts use `Test iteration + CI iteration` to avoid collisions. CI issues: `ci-issues-[N].md`. Maximum 3 (fail the run when `CI iteration ≥ 3`).

## Escalation Check

Referenced from Step 4, Step 6, and Step 8. After any code subagent returns, check for `./tmp/runs/[run-uuid]/escalation-[iteration].md`. If absent, continue normally (proceed to the next phase — test, simplify, or merge depending on context). If present:

1. Read `orchestrator-state.md` to check whether `Plan revised` is already `yes`. If so, a plan revision already occurred. Follow the failure handling procedure — but include the second escalation file's diagnosis in `failure-summary.md` so the user understands the additional structural issue that surfaced.
2. Read the escalation file and judge whether the issue is genuinely structural (the plan's approach is fundamentally wrong) or whether the code agent is being too cautious about a fixable problem.
3. **If justified:** Spawn `plantz-adlc-plan` subagents with `mode=revision`, feature description, `plan.md` path, and escalation file path. After revision, clean up:
    - Delete all `escalation-*.md`, `changes-*.md`, `test-issues-*.md`, and `ci-issues-*.md` from the run folder.
    - If escalation happened during Step 8: reset the branch to its merge-base with main (`git reset $(git merge-base HEAD main)`) then `git push --force-with-lease origin {branch-name}`.
    - Reset working tree: `git checkout -- .` and `git clean -fd --exclude=tmp/`.
    - Set `Test iteration` to 1, `Plan revised: yes` in state. Restart from Step 4.
4. **If not justified:** Update `orchestrator-state.md` with `Escalation rejected: iteration-[N] — [one-line reason]`. Proceed to the next phase (simplify, test, or merge depending on context). The escalation file remains on disk. Pass it to the next code subagent via the `Escalation context` input if another fix cycle occurs — the code subagent reads it to understand what was tried and why the orchestrator disagreed. If no further fix cycle occurs (tests pass), ignore it.
5. **Maximum 1 plan revision per run.** Enforced by checking `Plan revised` in step 1 above.
