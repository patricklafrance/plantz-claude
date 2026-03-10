# Writing Agent Instructions

> Principles for writing instructions that agents actually follow.
> Advisory language ("always consult", "consider whether") causes agents to skip
> rules and guess. Prohibition framing ("never guess", "never write code without
> loading skills") tests dramatically better.

## Principles

### 1. Prohibition framing over advisory framing

- **Bad:** "You should check the CLAUDE.md index before starting work."
- **Good:** "Never start a task without first matching it to the CLAUDE.md index.
  Skipping this step produces code that contradicts repo conventions."

### 2. State consequences explicitly

- **Bad:** "Load skills before writing code."
- **Good:** "Never write code until the applicable skill is loaded — your general
  knowledge of these tools is wrong for this repo."

### 3. Concrete verification steps over vague diligence

- **Bad:** "Make sure the documentation is up to date."
- **Good:** "Run `git diff HEAD~1 --name-only` and update every `agent-docs/`
  file whose topic was touched. If the diff is empty, stop."

### 4. Negative examples adjacent to rules

- **Bad:** State the rule alone and trust agents to infer edge cases.
- **Good:** Pair each rule with a Bad/Good example so the boundary is unambiguous.

### 5. Hard gates with specific triggers

- **Bad:** "Consider whether an ADR is needed."
- **Good:** "Before modifying a package's public API, adding a dependency, or
  changing how Squide modules communicate, read `agent-docs/adr/index.md`.
  Ignoring an existing ADR produces code that contradicts deliberate choices."

### 6. Single source of truth over duplicated content

- **Bad:** Repeat the same Turborepo task list in three different files.
- **Good:** Write it once in the relevant reference file (e.g., `references/turborepo.md`), link everywhere else.
  Duplicated content drifts and agents follow the stale copy.

**Clarification:** This applies to prescriptive content (rules, commands, config
values), not to descriptive summaries used for routing. CLAUDE.md index entries
may paraphrase a doc's topic — they must not reproduce its rules.

### 7. Scope mandates to specific actions

- **Bad:** "Always follow best practices."
- **Good:** "Never rewrite `agent-docs/` sections that are already correct.
  Only change lines affected by actual code changes."

### 8. Tooling over prose

- **Bad:** Documenting the syncpack semver policy as an agent instruction.
- **Good:** Running `pnpm syncpack lint` and letting the error output speak.

Do not write agent instructions for constraints already enforced by tooling
(TypeScript compiler, syncpack, CI checks). Agent instructions are for judgments
that tooling cannot make.

## Guardrails

**Prohibition inflation** — Reserve NEVER/MUST NOT for architectural invariants
(e.g., "modules never import each other"). Use concrete action verbs for
conventions that are important but not catastrophic if violated. When everything
is a prohibition, nothing stands out.

**Negative examples go stale** — Reference patterns, not specific paths.
Prefer "importing from any `@modules/*` package inside another module" over
"importing from `@modules/today-landing-page` in `management/plants`."

## Applying These Principles

When writing or editing any file in `agent-docs/` or `CLAUDE.md`:

1. Phrase every instruction as a prohibition or a concrete action — never as
   a suggestion.
2. Include a consequence or rationale in the same sentence.
3. If the rule has an edge case, add a negative example immediately after.
4. If tooling already enforces the rule, do not duplicate it as prose.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
