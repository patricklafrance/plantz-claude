# Harness V2 — Session 6: Coder Skill, Git Strategy, Domain/Module Refinements

## What happened this session

Built the harness-coder skill, added per-slice git commit strategy with `/simplify`, restructured the coordinator, harmonized failure handling, refined domain/module granularity criteria, and created a scaffold-domain skill skeleton.

## Changes Made

### 1. harness-architect — structural alignment

- Restructured to match planner skeleton: Inputs (was numbered list, now removed entirely) → Process (numbered steps) → Output Format
- Added "Load context" as step 1 (reads files it needs on its own, no inputs table)
- Added "Wrong domain placement" to evaluation table
- Fixed duplicate step numbering (two "### 2." steps)

### 2. harness-coder — built from skeleton

- Full skill with: Inputs (table) → Process (5→4 steps after removing cleanup)
- Step 1 (Load context): reads plan-header, slice, ARCHITECTURE.md, adr/index.md, plus references (domains, msw-tanstack-query, storybook, tailwind-postcss, agent-browser; conditional: shadcn, color-mode)
- Loads skills: accessibility, frontend-design, workleap-react-best-practices, workleap-squide (always); shadcn, workleap-web-configs, workleap-logging (conditional)
- Step 2 (Scaffold): reads slice scope, dispatches to /scaffold-domain, /scaffold-domain-module, /scaffold-domain-storybook, or creates shared packages directly
- Step 3 (Implement): "Code with a browser open — validate as you go." Draft/revision mode pattern. Stories for every component created/updated + every [visual] and [interactive] AC must have a story
- Cleanup step removed — will be handled at harness level
- Removed from requirements: bundle-size-budget.md (CI concern), pnpm skill (scaffolding concern)

### 3. harness-coordinator — git strategy + simplified prepare

- Added Step 3 (Branch): creates branch after plan loop, before slice loop. No push.
- Simplified Prepare to 3 steps: check clean tree, delete .harness/, create .harness/slices/. Removed all resume detection logic.
- Step 5 (Wrap up): just push confirmation, no commit (slices commit themselves)
- Added plan-loop failure handling: "If the plan-loop reports a failure, print the failure and stop."
- Removed sequence line from top ("Sequence: prepare → plan loop → ...")

### 4. harness-slice-loop — simplify + commit

- Step 3 (all criteria pass) now has sub-steps: 3.1 rename verification file, 3.2 run /simplify, 3.3 commit (no push), 3.4 exit
- This means /simplify only sees current slice's uncommitted changes (previous slices already committed)

### 5. Failure handling harmonized across all skills

- Standardized on "print [what went wrong] and stop" everywhere
- Coordinator: all three stop conditions now use this pattern
- Plan-loop: "stop and report" → "print the unresolved problems and stop"
- Planner: "print what's missing and stop" (was already correct)
- Slice-loop: "print the unresolved failures and stop" (was already correct)
- Coordinator now handles plan-loop failure (was missing)

### 6. harness-planner — plan-header template changes

- Added "Domain placement" as 7th durable decision
- Added "New domains" row to Decisions table
- Added "New shared packages" row (was "Shared pkg changes")
- Removed "Extended modules" row (not a decision, it's a consequence)
- Removed "Affected Packages" section (redundant with Decisions + slice-level Modules Affected)
- Removed "Scaffolding" section (moved to slice scope, not plan header)

### 7. domains.md — domain and module granularity

- Added "Domain Granularity" section: "Each domain is a DDD bounded context"
- Rewrote "Module Granularity" section: anchored on Common Closure Principle, "cohesive feature area whose scope encompasses multiple related views and operations"
- Removed prescriptive create/keep bullet lists
- Added bidirectional coupling as a signal to merge modules
- "whose scope encompasses" — shifts lens from current size to intended breadth

### 8. scaffold-domain skill (NEW skeleton)

- Created at harness-v2/claude/skills/scaffold-domain/SKILL.md
- Inputs: domain name + description
- Procedure: validate → create directory → create CLAUDE.md (from management reference) → update domains.md

### 9. .harness/ gitignored

- User gitignored .harness/ folder — plan files are workspace artifacts, never committed
- This means /simplify per slice naturally scopes to only that slice's code changes

## Key Design Decisions

- **Per-slice commits** — each slice: code → verify → simplify → commit. Git boundaries naturally scope /simplify.
- **Branch after plan** — created after plan is approved, not during prepare. Plan files are gitignored so timing doesn't matter for them.
- **.harness/ gitignored** — workspace artifacts, not deliverables
- **No resume detection** — prepare always starts fresh (delete + recreate .harness/)
- **Scaffolding in slice scope** — plan header describes WHAT (decisions), slices describe WHAT to do (scope including scaffolding)
- **DDD bounded contexts for domains** — well-known reference, concise
- **Common Closure Principle for modules** — things that change together belong together
- **Browser throughout coding** — not a final validation step, a development tool used while writing code
- **Stories for every AC** — every [visual] and [interactive] acceptance criterion must have a corresponding story

## Files Modified

- `harness-v2/claude/skills/harness-architect/SKILL.md`
- `harness-v2/claude/skills/harness-coder/SKILL.md` (rewritten from skeleton)
- `harness-v2/claude/skills/harness-coordinator/SKILL.md`
- `harness-v2/claude/skills/harness-planner/SKILL.md`
- `harness-v2/claude/skills/harness-slice-loop/SKILL.md`
- `harness-v2/claude/skills/harness-plan-loop/SKILL.md`
- `harness-v2/claude/skills/harness-reviewer/SKILL.md` (cleanup step removal pending)
- `harness-v2/claude/skills/scaffold-domain/SKILL.md` (NEW)
- `harness-v2/agent-docs/references/domains.md`

## Open Questions

- Should the reviewer's cleanup step also be removed (like the coder's was)?
- The harness-coder skill is functional but hasn't been tested against a real feature yet
- scaffold-domain, scaffold-domain-module, scaffold-domain-storybook are all skeletons in harness-v2 — need fleshing out
