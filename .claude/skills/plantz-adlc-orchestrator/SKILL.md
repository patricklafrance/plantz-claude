---
name: plantz-adlc-orchestrator
description: |
    Entry point for end-to-end feature development. Leads the ADLC (Agent Development Life Cycle) process by spawning subagents for planning, architectural review, coding, testing, documenting, and merging.
    Use when asked to "build a feature", "develop end-to-end", "full ADLC", "implement feature from scratch", or any request that requires coordinated planning, implementation, testing, and PR creation.
license: MIT
---

# ADLC Orchestrator

Coordinates the full Agent Development Life Cycle for a feature by spawning specialized subagents sequentially. Each step must complete before the next begins.

## Subagent Protocol

1. **Subagent A** (drafter): produces the initial output (plan, code, test report, doc update).
2. **Subagent B** (challenger): reviews Subagent A's output and improves it. B fixes everything it can by editing the output files and the code directly. The one exception: B can write an escalation file for structural issues that require a plan revision (see "Escalation Check").

The **orchestrator** spawns both subagents directly — subagents never spawn further subagents. Subagent A must complete and produce its expected output file before Subagent B is spawned. They run sequentially, never in parallel.

"Subagents" here means agents spawned to run ADLC skills — built-in tools like the Agent tool (used for codebase exploration) are not subagents and do not violate this constraint.

The real validation gate is the `plantz-adlc-test` phase — B improves quality before that gate but is not the final check.

Context is passed between subagents via files in `.adlc/[run-uuid]/`. Always spawn new subagents with the relevant file paths.

## Hard Constraints

- **Never edit repository files directly** — only `.adlc/` and git/shell commands. All source code, config, docs, and tests go through subagents. The orchestrator's context window is too scarce to spend on code. If a change seems "too small to delegate," delegate it anyway.

## Inputs (optional — for revise mode)

| Input                 | Description                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--revise`            | The user's change request (feedback text). Presence of this input indicates revise mode — skip `.adlc/` cleanup, use current branch |
| `--previous-run-uuid` | UUID of the previous run. Required when `--revise` is set. Used to locate `.adlc/[uuid]/plan.md`                                    |

## Port Cleanup Between Subagents

**After every code or test subagent returns**, kill any processes listening on ports 8080 and 6006 before spawning the next subagent.

## Failure Handling

If a subagent fails to produce its expected output file, or if a command fails unexpectedly:

1. **Stop the run** — do not retry blindly.
2. **Write a failure summary** to `.adlc/[run-uuid]/failure-summary.md` containing: the step that failed, the error or unresolved issues, and what was attempted.

## Steps

### Step 1 — Generate run UUID and create run folder

**New feature (default):** Delete any existing `.adlc/` directory (handle both tracked and untracked files). Generate a UUID and create `.adlc/[run-uuid]/`. Pass the UUID to every subagent.

**Revise mode (when `--revise` is provided):** Do NOT delete `.adlc/`. Generate a new UUID and create `.adlc/[run-uuid]/`.

### Step 2 — Create a branch from `main` (or checkout existing)

**New feature (default):** Verify the working tree is clean. If there are uncommitted changes, stop and ask the user to resolve them. Pull latest `main` and create a branch. Branch format: `{type}/{short-description}` (kebab-case). Use the commit type matching the feature intent: `feat`, `fix`, `chore`, `docs`, `refactor`. Example: `feat/add-watering-schedules`.

**Revise mode (when `--revise` is provided):** Skip branch creation. Use the current branch. Pull latest. Discover the PR number from the branch.

### Step 3 — Plan

**Revise mode (when `--revise` is provided):** Spawn two subagents using the `plantz-adlc-plan` skill with `mode=revision`, `run-uuid`, feature description (the `--revise` text), the previous plan path (`.adlc/[--previous-run-uuid value]/plan.md`), and escalation path `null`.

**New feature (default):** Spawn two subagents using the `plantz-adlc-plan` skill with `mode=draft`, `run-uuid`, feature description. Existing plan path and escalation path are `null`.

When done, verify `.adlc/[run-uuid]/plan.md` exists. If not, fail the run.

### Step 4 — Architect Review

Spawn two subagents using the `plantz-adlc-architect` skill.
Pass: `run-uuid`, plan path (`.adlc/[run-uuid]/plan.md`).

When done, verify `.adlc/[run-uuid]/architecture-review.md` exists. If the subagent crashed or produced no file, set `Architecture reviewed: no` in `orchestrator-state.md`, log a warning, and continue to Step 5 — this step is advisory, not blocking.

If the file exists, set `Architecture reviewed: yes` in `orchestrator-state.md`.

### Step 5 — Code

Spawn two subagents using the `plantz-adlc-code` skill.
Pass: `run-uuid`, `iteration=1`, plan path, architecture review path (`.adlc/[run-uuid]/architecture-review.md` if `Architecture reviewed` is `yes`, otherwise `null`). Issues path, changes path, and escalation context are `null` for iteration 1.
When done, verify `.adlc/[run-uuid]/changes-1.md` exists. If not, fail the run.

**Escalation check:** After the code subagent returns, check for `.adlc/[run-uuid]/escalation-1.md`. If present, follow the escalation check procedure (see "Escalation check" below).

### Step 6 — Simplify

Spawn **one** subagent with the `simplify` skill. If it crashes or returns no output, log a warning and continue.

If it made changes, append a `## Simplify` section to `changes-[iteration].md` listing the files it modified. This keeps the changes file accurate for downstream phases.

### Step 7 — Test and iterate

Spawn two subagents using the `plantz-adlc-test` skill.
Pass: `run-uuid`, `iteration=1`, plan path (`.adlc/[run-uuid]/plan.md`), previous issues path (`null` for iteration 1).

- If `.adlc/[run-uuid]/test-issues-[test iteration].md` is produced with issues:
    - Check `Test iteration` in `orchestrator-state.md` — if ≥ 5, follow the failure handling procedure (maximum 5 test iterations).
    - Increment `Test iteration`. Update `orchestrator-state.md` with the new value and set `Current step: 7-code`.
    - Spawn new `plantz-adlc-code` subagents. Pass: `run-uuid`, `iteration` = `Test iteration`, plan path, architecture review path (`.adlc/[run-uuid]/architecture-review.md` if `Architecture reviewed` is `yes`, otherwise `null`), the previous iteration's issues file path (`test-issues-[test iteration - 1].md`), the previous iteration's changes file path (`changes-[test iteration - 1].md`), and escalation context (the rejected escalation file path if one was rejected earlier, otherwise `null`). They produce `changes-[test iteration].md`.
    - Verify `.adlc/[run-uuid]/changes-[test iteration].md` exists. If not, fail the run.
    - **Escalation check:** After the code subagent returns, follow the escalation check procedure (see "Escalation check" below).
    - Update `orchestrator-state.md` `Current step: 7-test`.
    - Spawn new `plantz-adlc-test` subagents. Pass: `run-uuid`, `iteration` = `Test iteration`, plan path, previous issues path (`test-issues-[test iteration - 1].md`).
    - Repeat until no issues or max reached.
- **Completion check:** Verify `changes-[test iteration].md` contains a `## Verification results` section. If absent, the test subagent crashed or skipped browser verification — follow failure handling (note in `failure-summary.md` whether the issues file exists, indicating static checks ran but browser verification did not).
- If no issues file exists and the verification results section is present, proceed.

### Step 8 — Document

Spawn two subagents using the `plantz-adlc-document` skill (following the subagent protocol).
Pass: `run-uuid`, the final `Test iteration` number, plan path (`.adlc/[run-uuid]/plan.md`), architecture review path (`.adlc/[run-uuid]/architecture-review.md` if `Architecture reviewed` is `yes`, otherwise `null`).

The A/B protocol provides the quality check. No additional output verification is needed — if the subagent returns, the step is complete.

### Step 9 — PR

Spawn **one** subagent using the `plantz-adlc-pr` skill.
Pass: `run-uuid`, the branch name from step 2, the commit type from step 2, the plan path (`.adlc/[run-uuid]/plan.md`), the final `Test iteration` number, and `CI iteration` (starts at `0`). Set `CI iteration: 0` in `orchestrator-state.md`.

After the PR subagent creates the PR (or confirms one exists), record the PR number in `orchestrator-state.md`.

The PR subagent returns in one of two ways:

- **Success:** All CI checks passed. The run is complete.

**Revise mode or post-escalation:** Pass `--revise` to the PR subagent when either (a) the orchestrator was invoked with `--revise`, or (b) `Plan revised` is `yes` in `orchestrator-state.md` and a PR number is already recorded. The PR subagent appends a `## Revision [N]` section and updates the footer's revise command with the new run UUID.

- **CI failure:** The PR subagent writes `ci-issues-[CI iteration].md` and stops.
    - Increment `CI iteration`. Update `orchestrator-state.md` with the new value.
    - Check `CI iteration` — if > 3, follow the failure handling procedure (maximum 3 fix attempts).
    - Set `Current step: 9-ci-fix`.
    - Spawn new `plantz-adlc-code` subagents. Pass: `run-uuid`, `iteration` = `Test iteration` + `CI iteration`, plan path, architecture review path (`.adlc/[run-uuid]/architecture-review.md` if `Architecture reviewed` is `yes`, otherwise `null`), the issues file path (`.adlc/[run-uuid]/ci-issues-[CI iteration - 1].md` for a CI failure, or `.adlc/[run-uuid]/test-issues-[iteration - 1].md` for a test failure in the previous cycle), the previous iteration's changes file path (`.adlc/[run-uuid]/changes-[Test iteration + CI iteration - 1].md`), and escalation context (`null` unless a prior escalation was rejected). They produce `changes-[iteration].md`.
    - Verify `.adlc/[run-uuid]/changes-[iteration].md` exists. If not, fail the run.
    - **Escalation check:** After the code subagent returns, follow the escalation check procedure (see "Escalation Check").
    - Update `orchestrator-state.md` `Current step: 9-ci-test`.
    - Spawn new `plantz-adlc-test` subagents. Pass: `run-uuid`, `iteration` = `Test iteration` + `CI iteration`, plan path, previous issues path = `null`.
    - **Completion check:** Verify `changes-[iteration].md` contains a `## Verification results` section. If absent, the test subagent crashed or skipped browser verification — follow failure handling.
    - If `test-issues-[iteration].md` exists (test failed): treat as a CI failure — return to the top of the CI failure flow above. The test failure consumes one attempt from the shared budget.
    - If no issues file exists and the verification results section is present (test passed): spawn a new PR subagent with `Iteration` = `Test iteration` + `CI iteration`, and the current `CI iteration`. On success, the run is complete. On CI failure, return to the top of the CI failure flow above.

## State Persistence

After completing each step, write the current state to `.adlc/[run-uuid]/orchestrator-state.md`.

Template:

```markdown
# Orchestrator State

- Run UUID: [uuid]
- Branch: [branch-name]
- Commit type: [feat/fix/chore/docs/refactor] (conventional commit prefix)
- Current step: [1-9] (use `7-code` / `7-test` within step 7; `9-ci-fix` / `9-ci-test` within step 9)
- Architecture reviewed: [yes/no]
- Test iteration: [1-5] (current test-fix cycle — starts at 1, incremented after each test failure)
- Plan revised: [yes/no]
- Escalation rejected: [none/iteration-N — brief reason]
- HEAD commit: [hash] (update after each commit or tree reset)
- PR number: [number/none]
- CI iteration: [0-3/none] (within step 9 only — starts at 0, incremented before each fix attempt)
```

**Before writing state**, confirm the step's expected artifact exists — do not write state claiming a step completed if its output is missing.

## Escalation Check

Referenced from Step 5, Step 7, and Step 9. After any code subagent returns, check for `.adlc/[run-uuid]/escalation-[iteration].md`. If absent, continue normally (proceed to the next phase — simplify, test, or CI-test depending on context). If present:

1. Read `orchestrator-state.md` to check whether `Plan revised` is already `yes`. If so, a plan revision already occurred. Follow the failure handling procedure — but include the second escalation file's diagnosis in `failure-summary.md` so the user understands the additional structural issue that surfaced.
2. Read the escalation file and judge whether the issue is genuinely structural (the plan's approach is fundamentally wrong) or whether the code agent is being too cautious about a fixable problem.
3. **If justified:** Spawn `plantz-adlc-plan` subagents with `mode=revision`, feature description, `plan.md` path, and escalation file path. After revision, clean up:
    - Delete all `escalation-*.md`, `changes-*.md`, `test-issues-*.md`, `ci-issues-*.md`, and `architecture-review.md` from the run folder.
    - If escalation happened during Step 9: reset the branch to its merge-base with main and force-push.
    - Reset the working tree to a clean state.
    - Set `Test iteration` to 1, `CI iteration` to `0`, `Plan revised: yes` in state. Restart from Step 4 (Architect Review).
4. **If not justified:** Update `orchestrator-state.md` with `Escalation rejected: iteration-[N] — [one-line reason]`. Proceed to the next phase (simplify, test, or CI-test depending on context). Pass the escalation file to the next code subagent via the `Escalation context` input if another fix cycle occurs.
5. **Maximum 1 plan revision per run.** Enforced by checking `Plan revised` in step 1 above.
