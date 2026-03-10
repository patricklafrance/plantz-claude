---
name: plantz-sdlc-test
description: |
    Validate code quality — lint, module structure, and accessibility. Reports issues but does not fix them.
    Use when asked to "test the feature", "validate code quality", "run checks", or as part of the SDLC orchestrator's test phase.
license: MIT
---

# SDLC Test

Validate that the generated code meets quality standards. Does NOT fix issues — only reports them.

Smoke tests and visual verification run in CI (not here) — see the `smoke-tests.yml` workflow.

## Inputs (provided by orchestrator)

| Input       | Description              |
| ----------- | ------------------------ |
| `run-uuid`  | Run folder identifier    |
| `iteration` | Current iteration number |

## Procedure

1. Read all `./tmp/runs/[run-uuid]/changes-*.md` files (1 through current iteration) to build the cumulative set of affected files. This ensures accessibility checks cover the full feature scope, not just the latest fix.
2. Read all files in this skill's `references/` directory for technology rules and quality standards.
3. Run `pnpm lint` from the workspace root. This includes typecheck and syncpack. Record any errors.
4. Load the `plantz-validate-modules` skill and validate all modules. Record any failures.
5. **Accessibility review** (static): Load the `accessibility` skill. Review every changed file for WCAG AA violations — focus on semantic HTML, interactive element labelling, form error associations, color-only indicators, and live regions. For each failure, include the file path and element reference so the code skill can act on it.

## Output

- If **all checks pass**: do NOT create an output file (absence of the file signals success to the orchestrator).
- If **any check fails**: write the issues to `./tmp/runs/[run-uuid]/test-issues-[iteration].md` with this format:

```markdown
# Test Issues — Iteration [N]

## Lint (includes typecheck + syncpack)

- [error details, or "Pass"]

## Module validation

- [failures, or "Pass"]

## Accessibility (code-level)

- `path/to/file.tsx` — @elementRef: [what's wrong and how to fix it], or "Pass"
```

## Subagent Pattern

Subagent A runs all checks (1-5) sequentially and writes the test issues file. Subagent B reviews the report by spot-checking a sample of findings against actual file contents — removing false positives, adding missed issues, and correcting inaccurate descriptions. B edits the test issues file directly to produce the final report.
