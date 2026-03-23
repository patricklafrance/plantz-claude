# Harness V2 — Session 8: Domain Mapper Comparison, PRD Exercise, Plan Finalization

## What happened this session

1. **Compared two approaches** (DDD-adapted vs heuristics-based) using 5 subagents with distinct lenses (Frontend DX, DDD Purist, AI Agent Reliability, Enterprise Scale, Devil's Advocate). Unanimous recommendation: **heuristics approach**, with two additions from the DDD approach (doc-phase circuit, JSON output schema — JSON later dropped per user).

2. **Wrote the implementation plan** at `tmp/harness-v2-domain-mapper-plan.md` covering 8 changes across 6 files.

3. **Ran domain mapping exercises** against 4 real PRDs using 28 total subagents:
    - PRD 1: ADD_USER_ACCOUNT_CONCEPT (8 agents)
    - PRD 2: ADD_PLANT_CARE_HISTORY_AND_INSIGHTS (8 agents)
    - PRD 3: ADD_VACATION_PLANNER (6 agents)
    - PRD 4: ADD_SMART_WATERING_ADJUSTMENT (6 agents)

4. **Identified 3 generic refinements** and updated the plan:
    - Apply `domains.md` decision tree before heuristics (guard clause)
    - Heuristics must operate on actual code, not just PRD text
    - When language is ambiguous, check feature purpose against domain mental models

5. **User clarified:** the skill must be generic, not bloated with repo-specific knowledge. Repo-specific stuff stays in `domains.md` and `ARCHITECTURE.md`.

## The Plan (to execute)

Read `tmp/harness-backup-8-domain-mapper-plan.md` for the full plan. Summary of changes:

### Files to create

- `harness-v2/claude/skills/harness-domain-mapper/SKILL.md` — New domain mapper skill
- `harness-v2/claude/skills/harness-documenter/SKILL.md` — New doc phase skill (skeleton)

### Files to modify

- `agent-docs/references/domains.md` — Add Scope column + flip module default
- `harness-v2/claude/skills/harness-planner/SKILL.md` — Generic durable decisions + read domain mapping
- `harness-v2/claude/skills/harness-architect/SKILL.md` — Read domain mapping + fix duplicate step numbering
- `harness-v2/claude/skills/harness-coordinator/SKILL.md` — Add domain mapper step + doc phase step

### Key design decisions

- Heuristics approach (not DDD-adapted)
- No `domain-mapping.json` (guardrail hooks dropped)
- Skill is generic; repo-specific knowledge stays in existing docs
- Analysis process: decision tree first → read code → extract terms → run heuristics → converge
- Doc-phase circuit: mapper → planner → architect → documenter updates domains.md

## Exercise Results Summary

| PRD                | Modules Affected                          | New Modules | Key Pattern                               |
| ------------------ | ----------------------------------------- | ----------- | ----------------------------------------- |
| User Account       | core-module/shell, each module's handlers | 0           | Decision tree guard clause needed         |
| Plant Care History | Extend management/plants                  | 0           | Cross-domain data via shared DB singleton |
| Vacation Planner   | today/vacation-planner (exists)           | 0           | Domain = purpose, not verb form           |
| Smart Watering Adj | today/landing-page                        | 0           | Cross-domain mutation via shared plantsDb |

## Files Created This Session

- `tmp/harness-v2-domain-mapper-plan.md` — The implementation plan
- `tmp/harness-backup-8-domain-mapper-plan.md` — Backup of the plan
- `tmp/harness-backup-8-session.md` — This file
