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
2. **Subagent B** (challenger): reviews Subagent A's output and improves it. B fixes everything it can by editing the output files and the code directly. The one exception: B can write a bail file when the plan is fundamentally unimplementable (see "Bail Check").

The **orchestrator** spawns both subagents directly — subagents never spawn further subagents. Subagent A must complete and produce its expected output file before Subagent B is spawned. They run sequentially, never in parallel.

"Subagents" here means agents spawned to run ADLC skills (any skill prefixed with `plantz-adlc-`). Built-in tools — such as the Agent tool for codebase exploration — are not ADLC subagents and do not violate this constraint.

The real validation gate is the `plantz-adlc-test` phase — B improves quality before that gate but is not the final check.

Context is passed between phases via files in `.adlc/[run-uuid]/`. Always pass the relevant file paths when spawning or resuming subagents.

### Resuming Code Subagents

In the code-test loop (Step 6), **resume** the code subagents from Step 4 via `SendMessage` instead of spawning new ones. Tell the resumed subagent to compact its context before starting fix work. Test subagents are always spawned fresh.

## Hard Constraints

- **Never edit repository files directly** — only `.adlc/` and git/shell commands. All source code, config, docs, and tests go through subagents. The orchestrator's context window is too scarce to spend on code. If a change seems "too small to delegate," delegate it anyway.

## Port Cleanup Between Subagents

**After every code or test subagent returns** — whether proceeding to the next step, handling a bail, or entering failure handling — kill any processes listening on ports 8080 and 6006.

## Failure Handling

If a subagent fails to produce its expected output file, or if a command fails unexpectedly:

1. **Stop the run** — do not retry blindly.
2. **Write a failure summary** to `.adlc/[run-uuid]/failure-summary.md` containing: the step that failed, the error or unresolved issues, and what was attempted. **Output the failure summary to the console** so the user sees the issue immediately.

## Steps

### Step 1 — Generate run UUID and create run folder

Delete any existing `.adlc/` directory (handle both tracked and untracked files). Generate a UUID and create `.adlc/[run-uuid]/`. Pass the UUID to every subagent.

### Step 2 — Create a branch from `main`

Verify the working tree is clean. If there are uncommitted changes, stop and ask the user to resolve them. Pull latest `main` and create a branch. Branch format: `{type}/{short-description}` (kebab-case). Use the commit type matching the feature intent: `feat`, `fix`, `chore`, `docs`, `refactor`. Example: `feat/add-watering-schedules`.

### Step 3 — Plan-Architect Loop (max 3 plan-iterations)

plan-iteration = 1

Spawn two subagents using the `plantz-adlc-plan` skill with `mode=draft`, `run-uuid`, feature description. Architect revision path is `null`.
Verify `.adlc/[run-uuid]/plan.md` exists. If not, fail the run.

**Loop:**

Spawn two subagents using the `plantz-adlc-architect` skill.
Pass: `run-uuid`, `Plan iteration`.

Check for `.adlc/[run-uuid]/architect-revision-[plan-iteration].md`:

- **If absent** → architect approved and enriched plan. Break loop, proceed to Step 4 (Code).
- **If present:**
    - Copy `plan.md` to `plan-iteration-[plan-iteration].md` (audit trail).
    - If plan-iteration ≥ 3 → failure handling. Include ALL revision request files (`architect-revision-1.md` through `architect-revision-[plan-iteration].md`) and ALL plan backups (`plan-iteration-1.md` through `plan-iteration-[plan-iteration].md`) in `failure-summary.md` so the user sees the full progression.
    - Increment plan-iteration.
    - Spawn two subagents using the `plantz-adlc-plan` skill with `mode=revision`, `run-uuid`, feature description (original), architect revision path = `.adlc/[run-uuid]/architect-revision-[plan-iteration - 1].md`.
    - Verify `.adlc/[run-uuid]/plan.md` exists. If not, fail the run.
    - Loop back to architect.

### Step 4 — Code

Spawn two subagents using the `plantz-adlc-code` skill.
Pass: `run-uuid`, `iteration=1`. Issues path and changes path are `null` for iteration 1.
When done, verify `.adlc/[run-uuid]/changes-1.md` exists. If not, fail the run. **Save the agent IDs of both code subagents (A and B) for resumption in Step 6.**

**Bail check:** After the code subagent returns, check for `.adlc/[run-uuid]/bail.md`. If present: copy `.adlc/[run-uuid]/plan.md` to `.adlc/[run-uuid]/plan-backup.md`, then reset the working tree to the merge-base with `main`. Follow the failure handling procedure — include the bail file's content verbatim in `failure-summary.md`, prefixed with which step and iteration the bail occurred at.

### Step 5 — Simplify

Spawn **one** subagent with the `simplify` skill. Simplify is best-effort — its absence does not block the pipeline. If it crashes or returns no output, **output a warning to the console** so the user sees it immediately, then continue.

### Step 6 — Test and iterate

The orchestrator tracks the current code-iteration locally (starts at 1, maximum 5).

Spawn two subagents using the `plantz-adlc-test` skill.
Pass: `run-uuid`, `iteration=1`.

- If `.adlc/[run-uuid]/test-issues-[code-iteration].md` is produced with issues:
    - If code-iteration ≥ 5, follow the failure handling procedure (maximum 5 code-test iterations).
    - Increment code-iteration.
    - Resume the code subagents saved in Step 4 via `SendMessage` (resume A first, wait for completion, then resume B — same sequential protocol). In the message, pass: `iteration=code-iteration`, issues path = `.adlc/[run-uuid]/test-issues-[code-iteration - 1].md`, changes path = `.adlc/[run-uuid]/changes-[code-iteration - 1].md`. Also tell the subagent that dev servers were killed and must be restarted. They produce `changes-[code-iteration].md`.
    - Verify `.adlc/[run-uuid]/changes-[code-iteration].md` exists. If not, fail the run.
    - **Bail check:** After the code subagent returns, check for `.adlc/[run-uuid]/bail.md`. If present, follow the same bail procedure as Step 4.
    - Spawn new `plantz-adlc-test` subagents. Pass: `run-uuid`, `iteration=code-iteration`.
    - Repeat until no issues or max reached.
- **Completion check (after each test subagent run):** Verify `.adlc/[run-uuid]/verification-results-[code-iteration].md` exists. If absent, follow failure handling.
- If no issues file exists and the verification results file is present, proceed.

### Step 7 — Document

Spawn two subagents using the `plantz-adlc-document` skill (following the subagent protocol).
Pass: `run-uuid`, the final code-iteration number.

The A/B protocol provides the quality check. No additional output verification is needed — if the subagent returns, the step is complete.

### Step 8 — PR

Spawn **one** subagent using the `plantz-adlc-pr` skill.
Pass: `run-uuid`, the branch name from step 2, the commit type from step 2, and the final code-iteration number (as `iteration`).

### Step 9 — Monitor

Spawn **one** subagent using the `plantz-adlc-monitor` skill.
Pass: `run-uuid`, the branch name from step 2. The monitor discovers the PR number from the branch itself.

The monitor skill handles CI monitoring and fixes internally. It returns success or failure.

- **Success:** All CI checks passed. The run is complete.
- **Failure:** The monitor exhausted its fix budget or a timeout occurred. Follow the failure handling procedure.

## Bail Check

Referenced from Step 4 and Step 6. After any code subagent returns, check for `.adlc/[run-uuid]/bail.md`. If absent, continue normally (proceed to the next phase — simplify or test depending on context). If present:

1. Copy `.adlc/[run-uuid]/plan.md` to `.adlc/[run-uuid]/plan-backup.md`.
2. Reset the working tree to the merge-base with `main`.
3. Follow the failure handling procedure — include the bail file's content verbatim in `failure-summary.md`, prefixed with which step and iteration the bail occurred at.
