# Harness V2 — Review & Fix Session (Post-Compaction #3)

## What happened this session

Read `tmp/harness-backup-2.md` for the full creation context (51 files, previous session). This session focused on **reviewing and fixing all three skills** using the skill-creator methodology.

## Review findings and fixes applied

### harness-plan/SKILL.md (302 lines after fixes)

7 fixes applied:

| ID  | Severity | Issue                                                                                                                                      | Fix                                                                                                          |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| P1  | High     | Revision mode told planner to read `architect-revision.md` from disk, but the coordinator deletes that file before re-spawning the planner | Phase 2 now reads from `revision-note` input parameter, with explicit note that coordinator deletes the file |
| P2  | High     | "Load applicable skills" instruction doesn't work in subagent context — subagents can't invoke skills                                      | Replaced with conditional file reading: 5 always-read files + 5 read-based-on-feature files                  |
| P3  | Medium   | Token budgets (1K, 1.5-2.5K) are unverifiable — agents have no token counter                                                               | Converted to line counts: under 40 lines for header, 60-100 lines per slice                                  |
| P4  | Medium   | 8-file ceiling conflicts with new module scaffolding (which legitimately needs 8+ files)                                                   | Added exception for first slice of a new module                                                              |
| P5  | Medium   | No upper bound on total slices — planner could produce 15+ slices for an oversized feature                                                 | Added 8-slice limit with user confirmation gate                                                              |
| P6  | Low      | No escape hatch for vague requirements — planner would guess instead of asking                                                             | Added "Both modes" paragraph: if decisions can't be resolved, write a note listing missing info and stop     |
| P7  | Low      | Checklist still referenced token counts                                                                                                    | Updated to match new line-count budgets                                                                      |

### harness-coordinator/SKILL.md (131 lines after fixes)

8 fixes applied:

| ID  | Severity     | Issue                                                                                                                                                            | Fix                                                                                                                                   |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| C1  | **Critical** | Step 4a told coder to "Use agent-browser to verify your work visually as you go" — contradicts "never spawn subagent chains" AND duplicates Step 4c verification | Removed. Coder prompt now says "Do not start a dev server or open a browser — the coordinator handles verification separately"        |
| C2  | High         | Step 3 said "Architect gate (optional)" with no decision criteria for when to skip                                                                               | Removed "optional" — architect gate always runs                                                                                       |
| C3  | High         | Step 5 auto-committed and pushed — contradicts user's "never commit unless asked" feedback memory                                                                | Step 5 now presents summary and waits for user confirmation                                                                           |
| C4  | High         | No `subagent_type` specified for spawned agents — `stop--verify-subagent.sh` hook checks for `harness-*` types                                                   | All spawn instructions now include explicit `subagent_type`: `harness-plan`, `harness-architect`, `harness-coder`, `harness-verifier` |
| C5  | Medium       | Revision note passing was vague ("pass the content") with no format shown                                                                                        | Step 3 now includes exact prompt template with `{paste content here}` placeholder                                                     |
| C6  | Medium       | Verification agent prompt inlined partial instructions instead of referencing the protocol doc                                                                   | Now reads `agent-docs/references/browser-verification.md` for full protocol                                                           |
| C7  | Medium       | Port cleanup inlined Windows-only `netstat                                                                                                                       | grep` syntax                                                                                                                          | Now references `browser-verification.md` for platform-specific commands |
| C8  | Medium       | Step 1 assumed fresh start — no handling for existing branch or previous plan files                                                                              | Added resume logic (ask user) and existing branch detection                                                                           |

### harness-architect/SKILL.md (101 lines after fixes)

5 fixes applied:

| ID  | Severity | Issue                                                                                                              | Fix                                                                                                     |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| A1  | Medium   | "Read all of the following before making a judgment" uses advisory framing                                         | Changed to prohibition: "Never write output until all of the following have been read" with consequence |
| A2  | Medium   | No example revision note — architect might produce vague, unactionable notes                                       | Added concrete example (HouseholdMember entity placement across modules)                                |
| A3  | Medium   | "Do NOT flag: implementation details (exact prop interfaces)" conflicted with plan skill requiring prop interfaces | Clarified: missing prop interfaces in file change descriptions IS a plan quality problem worth flagging |
| A4  | Low      | `domains.md` not in required reading list — essential for module boundary evaluation                               | Added as item #4 in inputs list                                                                         |
| A5  | Low      | "Fundamental problem" threshold subjective ("waste multiple slices")                                               | Sharpened to: "require changes to 2+ slices or header.md decisions"                                     |
| A6  | Low      | No guidance for evaluating new entities/packages that don't exist yet                                              | Added "Evaluating proposed changes" section: evaluate against principles, not just existing structure   |

## Files modified this session

Only 3 files were modified (all inside harness-v2/):

1. `harness-v2/claude/skills/harness-plan/SKILL.md` — 7 edits
2. `harness-v2/claude/skills/harness-coordinator/SKILL.md` — 8 edits
3. `harness-v2/claude/skills/harness-architect/SKILL.md` — 5 edits

No root project files were touched. No new files were created.

## Known remaining gaps (from backup-2, not yet addressed)

1. **Regression across slices**: If Slice 3 breaks Slice 1's behavior, how does the coordinator detect? (Step 5 now runs final `pnpm typecheck && pnpm lint` but that only catches type/lint regressions, not visual/interactive regressions)
2. **Feature size threshold**: When should the agent plan+slice vs just code directly? (8-slice limit added, but no "too small to plan" threshold)
3. **Documentation phase**: V1 had a doc skill. V2 drops it — who updates agent-docs?
4. **Missing skills from v1**: simplify, document, CI monitor, scaffold
5. **Coordinator doesn't specify what to include in the coder's prompt about prior slices**: The coder reads "any relevant files under agent-docs/references/" but has no guidance on which prior-slice files to inspect
6. **No example complete plan**: A real header.md + 2-3 slice files as reference would help calibrate the planner

## Design documents

- `tmp/harness-design.md` — Original v2 design (299 lines)
- `tmp/harness-backup-2.md` — Full creation context (51 files, issues, gaps)
- `tmp/harness-backup-3.md` — This file (review & fix session)
