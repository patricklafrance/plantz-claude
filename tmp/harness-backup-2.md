# Harness V2 — Implementation Status

## What was created

51 files in `harness-v2/` — a complete, standalone agent harness folder.

### Structure

```
harness-v2/
  CLAUDE.md                          # Root instructions (philosophy, 3 layers, 5 rules, index)
  .gitignore                         # Ignores .harness/ contents, supervision state, node_modules
  .claude/
    settings.json                    # Full hook wiring (same pattern as existing repo)
    hooks/
      lib/
        supervision-engine.mjs       # Doom loop detection (ported, thresholds: Edit 7/12, Write 4/7, Bash 5/8)
        generate-repo-snapshot.mjs   # Repo snapshot generator (ported, .adlc→.harness exclusion)
      post-edit--format.sh           # oxfmt after every edit (copied as-is)
      post-edit--lint.sh             # oxlint after edits (copied as-is)
      post-tool-use--supervise.sh    # Track tool usage (copied as-is)
      pre-tool-use--supervise.sh     # Enforce supervision limits (copied as-is)
      pre-bash--enforce-pnpm.sh      # Block npm/npx (copied as-is)
      pre-bash--secret-scan.sh       # Block credential leaks (copied as-is)
      pre-bash--lint-on-commit.sh    # Lint before git commit (copied as-is)
      pre-bash--no-file-level-disable-on-commit.sh  # Block file-level lint disables (copied as-is)
      pre-edit--module-import-guard.sh # Block cross-module imports (copied as-is)
      pre-edit--protect-files.sh     # Block writes to protected files (copied as-is)
      session-start--repo-snapshot.sh # Capture repo state, reset supervision (ported)
      subagent-start--inject-snapshot.sh # Inject snapshot (adapted: plantz-adlc-* → harness-*)
      stop--verify-completion.sh     # Final verification gate (ported, .adlc→.harness in drift check)
      stop--verify-subagent.sh       # Verify subagent deliverables (SUBSTANTIALLY REWRITTEN for v2)
    skills/
      harness-plan/SKILL.md          # The ONE real skill (299 lines)
      harness-coordinator/SKILL.md   # Thin for-loop coordinator
      harness-architect/SKILL.md     # Lightweight pass/fail structural gate
  agent-docs/
    ARCHITECTURE.md                  # Ported from existing repo
    references/                      # 16 files (13 ported + 3 new)
      plan-format.md                 # NEW: v2 plan format reference
      acceptance-criteria.md         # NEW: [visual]/[interactive] criteria rules
      browser-verification.md        # NEW: browser verification protocol
      domains.md, msw-tanstack-query.md, storybook.md, tailwind-postcss.md,
      shadcn.md, color-mode.md, turborepo.md, typescript.md, ci-cd.md,
      writing-agent-instructions.md, static-analysis.md, bundle-size-budget.md,
      agent-browser.md               # All ported as-is
    adr/                             # 4 files (index + 3 ADRs, ported)
    odr/                             # 7 files (index + 6 ODRs, ported)
  .harness/
    .gitkeep                         # Keeps working directory in git
```

### Key Design Decisions Implemented

1. **3 skills only**: harness-plan, harness-coordinator, harness-architect
2. **No A/B subagent pattern** — one agent per invocation
3. **Multi-file plan**: .harness/header.md (~500 tokens) + .harness/slices/NN-{title}.md (~2K each)
4. **Only [visual] and [interactive] criteria** — no [static]
5. **Coordinator resumes coder** via SendMessage on fix iterations (not fresh spawn)
6. **Flat .harness/ directory** — no run UUIDs, one feature at a time
7. **Architect is pass/fail gate** — writes architect-revision.md on failure, nothing on pass

## Issues Found During Creation

1. **Subagents modified root project files** — The agent-docs subagent accidentally modified existing `agent-docs/` files and root `.claude/settings.json`, `.gitignore`, `knip.json`. All were restored via `git checkout --`. Root `.claude/hooks/` had stray untracked files that were deleted.

2. **Knip false positive** — Knip flags `harness-v2/.claude/hooks/lib/*.mjs` as unused files because they're bash-invoked, not JS-imported. If harness-v2 is used as a real project root, Knip config would need `"ignore": [".claude/hooks/lib/**"]`.

## Known Gaps / Improvements to Consider

1. **Open questions from design doc** (tmp/harness-design.md lines 291-298):
    - Regression across slices: If Slice 3 breaks Slice 1's behavior, how does the coordinator detect?
    - Feature size threshold: When should the agent plan+slice vs just code directly?
    - Documentation phase: V1 had a doc skill. V2 drops it — who updates agent-docs?

2. **Coordinator could be more specific** about:
    - How to detect [visual]/[interactive] criteria in a slice file (regex? section check?)
    - Verification result format in .harness/completed/{NN}/verification.md
    - How to determine whether to use dev-storybook vs dev-host for verification

3. **Plan skill could benefit from**:
    - Example complete plan (a real header.md + 2-3 slice files as a reference)
    - More concrete slice boundary examples from the plantz-claude codebase

4. **Missing from v1 that may be wanted**:
    - `simplify` skill integration (was Step 5 in v1 orchestrator)
    - Document phase / agent-docs audit after implementation
    - CI monitor skill after PR creation
    - Scaffold skills (scaffold-domain-module, scaffold-domain-storybook) — referenced in plan but not ported as skills

5. **The stop--verify-subagent.sh** only checks harness-plan and harness-architect deliverables. Generic coder/verification agents spawned by the coordinator are pass-through. This is by design but may need refinement.

## Design Document

The full v2 design is at `tmp/harness-design.md` (299 lines). It covers philosophy, architecture, plan format, acceptance criteria, browser verification, architect gate, AI engineering learnings, v1→v2 comparison, and open questions.
