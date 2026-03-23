# Harness V2 — Session 12: Documenter, PR, and Monitor Skills

## What happened this session

Continued from session 11 (restored via `tmp/harness-backup-11-session.md`). This session focused on completing the remaining harness-v2 skills: documenter, PR, and monitor.

### Changes made

1. **Documenter skill → harness-document (full rewrite)**
    - Removed inputs table — reads `.harness/` directly (plan-header, domain-mapping, implementation-notes)
    - Removed stale "Module Scope Updates" reference from session 10
    - Added `implementation-notes.md` as a primary information source ("coder's notes on what was created or extended")
    - Expanded from single responsibility (domain reference) to: domains.md, ARCHITECTURE.md, ADR index, CLAUDE.md indexes, other references
    - Each step has skip conditions so the skill doesn't do unnecessary work
    - Added consistency verification step
    - Added commit step (no push)
    - Added step 6: "Scan other references" — skim `agent-docs/references/` for any other docs affected, add/update/remove content as needed
    - Trimmed to lean style matching Matt Pocock's prd-to-plan skill
    - Renamed from `harness-documenter` to `harness-document` (directory, frontmatter name, heading)
    - ODR dropped — harness builds features, not operational tooling

2. **Coordinator skill updates**
    - Doc phase: removed input paths, simplified to `Spawn subagent_type: "harness-document"`
    - Added step 7: PR — spawns `harness-pr` with the feature description
    - Added step 8: Monitor — spawns `harness-monitor` with the PR number
    - Updated documenter reference from `harness-documenter` to `harness-document`

3. **PR skill (new — harness-pr)**
    - Takes `feature-description` as input
    - Reads `plan-header.md` and `implementation-notes.md` from `.harness/`
    - PR body template: Summary (user perspective) + Technical Changes (structural changes)
    - Returns the PR number (for the monitor skill)

4. **Monitor skill (new — harness-monitor)**
    - Two-phase monitoring: Phase 1 (CI, Code review, Smoke tests, Lighthouse CI) → Phase 2 (Chromatic)
    - Fixes failures by creating a slice file and spawning `harness-coder` in draft mode
    - PR comments: post when issue found (pending), edit when fixed
    - CI Validation comment on exit with checkbox status per workflow
    - Sliding 30-minute timeout, resets on fix push
    - Max 5 fix attempts across both phases
    - `run chromatic` label added after Phase 1 passes, re-added after any fix push
    - Three exit conditions: all green, timeout, fix budget exhausted
    - Removed mid-flight "phase 1 passed" comment (noise)
    - "Phase 1/2" kept as internal skill language, not exposed in PR comments

5. **Harness-v2 CLAUDE.md**
    - Added `domain-mapping.md` and `implementation-notes.md` to Working Directory listing

6. **Storybook reference (harness-v2)**
    - Removed redundant line about unified storybook browser verification (agent-browser.md already covers this)
    - Added "A11y Test Suppression" section — `parameters.a11y.config.rules` for per-story and per-file suppression

## Current state of harness-v2 skills

| Skill                 | Status                                       |
| --------------------- | -------------------------------------------- |
| harness-coordinator   | Updated — steps 7 (PR) and 8 (Monitor) added |
| harness-domain-mapper | Complete (user-edited in session 11)         |
| harness-planner       | Complete (session 10-11)                     |
| harness-architect     | Complete (session 11)                        |
| harness-plan-loop     | Complete (session 11)                        |
| harness-coder         | Complete (session 11)                        |
| harness-reviewer      | Complete (session 11)                        |
| harness-slice-loop    | Complete (session 11)                        |
| harness-document      | Complete — full rewrite this session         |
| harness-pr            | New — created this session                   |
| harness-monitor       | New — created this session                   |

## Key decisions made

- Documenter reads `.harness/` directly — no inputs needed (same pattern as reviewer)
- ODR updates dropped from documenter — harness is for features, not operational changes
- Documenter commits its own changes (no push)
- PR skill returns the PR number so the coordinator can forward it to the monitor
- Monitor fixes go through the coder (creates a slice, spawns harness-coder) — not inline fixes
- No mid-flight PR comments for phase transitions — only fix comments and final CI Validation
- A11y test suppression documented in storybook.md, not static-analysis.md (it runs through Storybook, not as standalone lint)
- Coder doesn't need to know specific a11y rules — the verify-then-fix loop catches violations

## Pending / Deferred

- **Test the harness** — run against real PRDs to validate
- **Monitor skill: Include `[visual]` and `[interactive]` acceptance criteria when they apply to the failure** — noted in the skill but the coder may not always need these for CI fixes
- **Review all skills end-to-end** — ensure cross-skill consistency after all additions
