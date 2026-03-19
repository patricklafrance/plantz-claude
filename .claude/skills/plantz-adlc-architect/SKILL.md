---
name: plantz-adlc-architect
description: |
    Analyze a plan's architectural implications: explore the codebase for friction, design interface contracts, classify dependency boundaries. Always-on step in the ADLC pipeline that self-scales — enriches the plan directly on approval, or requests revision for structural problems.
    Use when asked to "review architecture", "analyze plan architecture", or as part of the ADLC orchestrator's architect review phase.
license: MIT
---

# ADLC Architect

Analyze the plan's architectural implications by exploring the codebase for friction, designing interface contracts for cross-file boundaries, and classifying dependency boundaries. On approval, enrich the plan directly. On structural problems, request revision.

A **deep module** (John Ousterhout, "A Philosophy of Software Design") has a small interface hiding a large implementation. Deep modules are more testable, more navigable, and let you test at the boundary instead of inside. Apply the **"replace, don't layer"** principle: if testing a component requires wrapping it in additional providers or mocking hooks rather than driving behavior through its props, the interface is not deep enough.

## Inputs (provided by orchestrator)

| Input       | Description                                                                            |
| ----------- | -------------------------------------------------------------------------------------- |
| `run-uuid`  | Run folder identifier                                                                  |
| `iteration` | Current plan-iteration number (1, 2, or 3). Used for naming the revision request file. |

## Outcomes (mutually exclusive)

**Approve** — Enrich `plan.md` directly. No revision request file produced.

**Revision request** — Write `.adlc/[run-uuid]/architect-revision-[plan-iteration].md`. Do NOT modify `plan.md`.

Mutual exclusivity is critical: if the architect writes a revision request, it MUST NOT have modified `plan.md`. This prevents the Plan agent from encountering enrichments it didn't author during revision.

## Sections the architect MAY modify (on approval only)

- `## File changes` — Add compact inline contracts and `ARCHITECT CONSTRAINT:` blocks per entry
- `## Hard Constraints` — Add cross-cutting constraints discovered during exploration (create the section if absent)
- `## Decisions` — Append architectural decisions with rationale
- `## Implementation notes` — Append actionable patterns/gotchas

## Sections the architect MUST NOT modify

- Objective, Affected packages, Scaffolding required, New dependencies, Acceptance criteria

## Compact Inline Contract Format

```markdown
- `src/AdjustmentSection.tsx` (new) — Orchestrator component for adjustment UI
  **Contract**: `(props: { plantId: string; currentIntervalDays: number; onAdjustmentAccepted: () => void }) => JSX.Element` | hook | local-substitutable (MSW at /api/today/adjustments/\*)
  **ARCHITECT CONSTRAINT**: Do NOT use CollectionDecorator in stories — this component uses useQuery hooks directly. Use the inline QueryDecorator pattern from PlantCareSection.stories.tsx.
```

Format: `**Contract**: signature | testability-seam | boundary-classification`. One line. Coupling is added ONLY when non-trivial (not "self-contained").

`ARCHITECT CONSTRAINT:` replaces all advisory prose. Imperative phrasing within the block distinguishes intent ("Do NOT..." vs "Create X before..."). One annotation type = no classification taxonomy to learn. "CONSTRAINT" signals mandatory compliance.

## Revision Request Format

`.adlc/[run-uuid]/architect-revision-[plan-iteration].md`:

```markdown
# Architect Revision Request — Plan-Pass [N]

## Problem

[What about the plan is structurally wrong — specific]

## Evidence

[Code locations, data flow conflicts, boundary violations]

## Required changes

[Concrete modifications the plan must make]
```

## Plan-Pass Semantics

- **Plan-pass 1**: Standard rigor. Request revision for structural unsoundness, cross-module dependency, shallow interfaces, or unmet contract prerequisites.
- **Plan-pass 2**: Assume Plan addressed plan-iteration 1 feedback. Re-check. Request revision only for new issues or unaddressed feedback.
- **Plan-pass 3**: Final check. Prefer enrichment with workarounds over revision request. Request revision only if the plan is still broken (not merely suboptimal). Workaround examples:
    - Plan decomposes a dialog into two components, but the inner one needs provider setup in stories → add `ARCHITECT CONSTRAINT: Use QueryDecorator in stories for InnerComponent` rather than requesting restructuring.
    - Plan creates a hook returning a complex object, but a simpler signature would be better → narrow the contract in the `**Contract**:` line rather than requesting plan revision.
    - Plan's component tree makes a particular testability seam awkward → add an `Implementation notes` entry with the recommended pattern instead of requesting a decomposition change.
    - **Still request revision** when no enrichment can fix the issue: module boundary forces cross-module import, data flow requires a fundamentally different component tree, or the plan contradicts an ADR.

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`.
2. Always load the `accessibility`, `workleap-react-best-practices`, and `workleap-squide` skills. Load each of the following whose description matches the plan's affected packages — do not skip a skill you are unsure about: `shadcn`, `workleap-web-configs`.
3. Read the plan file. Identify the affected packages and the key boundaries (where modules meet packages, where components meet data layer, where new code meets existing patterns). **Early exit:** if the plan touches only code internal to a single existing component or file — no new exports, no new routes, no new packages, no cross-module data flow — AND the changes do not modify data-fetching patterns (`useQuery`, `useLiveQuery`, collection access, or `useState` holding query/collection results), make zero modifications and stop. Do not proceed to steps 4-7. If the single-file change involves data-fetching patterns, skip the early exit and continue to step 4 to check for stale-object risks.
4. **Explore the codebase around affected packages.** Use the Explore agent to navigate the code. Read the affected files and their direct dependencies (one hop outward). If none of the friction signals below appear within that scope, stop exploring. Note where:
    - Understanding one concept requires bouncing between many small files
    - Existing interfaces are shallow (props/params nearly as complex as the implementation)
    - Data flows are tangled (a component reaches through multiple layers to get what it needs)
    - A component stores a query/collection object in `useState` rather than storing just the ID and deriving the object from the reactive source — the stored object goes stale after mutations that update the source
    - Storybook stories require elaborate setup that reveals a leaking abstraction
    - Per-story MSW handler overrides are frequent (stories need custom `parameters.msw.handlers` to control state rather than driving state through props — the component is leaking its data-fetching seam)
    - A component's props mirror another component's internal state shape rather than representing a domain concept — the interface couples the two components to each other instead of to the domain model
    - A data-fetching component depends on data from a sibling or parent component with no loading boundary between them — waterfall risk
    - A changed or new export is imported by files outside the one-hop exploration scope (grep for the export name repo-wide) — scope underestimation risk
5. **Check for infrastructure patterns.** If the plan touches routing, module registration, Squide federation config, or Turborepo task graph, expand exploration to include the relevant host/infrastructure files.
6. **Design interface contracts and classify boundaries.** Skip this step entirely if no cross-file boundaries exist. For each cross-file boundary the plan introduces, determine:
    - The concrete export: function/component/hook name, signature (params → return type), and the named type for any data shape
    - The testability seam: pure function (preferred), hook, or component — choose the simplest that works
    - The dependency category and its testing implication. Categories:
        - **In-process**: pure computation, no I/O (e.g., utilities in `@packages/core-*`). Testable directly.
        - **Local-substitutable**: has a test stand-in (e.g., MSW-intercepted fetch — the MSW handler IS the boundary). Note whether a new MSW handler is required and which module owns it.
        - **Remote but owned / True external**: rare in this codebase — if applicable, note the category and mock strategy at the boundary
7. **Verify contract prerequisites.** For each fetch or mutation the plan describes:
    - Verify an MSW handler exists at the expected endpoint path in the owning module's `mocks/` directory, OR flag "new handler required" in the contract.
    - For each component the plan says consumes collection data or calls a data hook, verify it renders inside the required provider boundary in the plan's component tree — flag mismatches.

    For each pair of interface contracts where one component consumes another:
    - Verify the consumer's expected input types align with the producer's output types without requiring a transformation/wrapper layer — flag abstraction mismatches.

8. **ADR cross-check.** Before deciding approve or revise, scan `agent-docs/adr/index.md` for ADRs relevant to the plan's affected packages. For each relevant ADR, read its Decision and Consequences sections and verify the plan does not violate them. If a violation is found, include it as a required change in the revision request. This check is lightweight (2-3 minutes) — focus on the decision statements, not the full rationale.
9. **Decision gate**: Can the plan be enriched to make it implementable and ADR-compliant?
    - **YES** → Enrich `plan.md` directly: add compact contracts and `ARCHITECT CONSTRAINT:` blocks in File Changes; append to Hard Constraints, Decisions, and Implementation Notes as needed.
    - **NO** → Write `.adlc/[run-uuid]/architect-revision-[plan-iteration].md`. Do NOT modify `plan.md`.

## Hard Constraints

- On approval, the architect enriches `plan.md`. On revision request, the architect MUST NOT modify `plan.md`. These are mutually exclusive.
- The architect MUST NOT modify Objective, Affected packages, Scaffolding required, New dependencies, or Acceptance criteria sections.
- Every enrichment must be concrete. Vague observations are not enrichments — convert to imperative `ARCHITECT CONSTRAINT:` or drop.
- Interface contracts must be concrete: named exports, typed signatures in compact format (`**Contract**: signature | seam | boundary`).
- The architect MUST NOT spawn parallel competing interface designs. The A/B challenger pattern is sufficient given this codebase's constrained architecture (module isolation rule, fixed data layer pattern).

## Subagent Pattern

**Subagent A** explores the codebase and drafts the enrichments or revision request. A may use the Agent tool (Explore subagent type) for codebase navigation — this is a built-in tool, not an ADLC subagent.

**Subagent B** has five responsibilities, in order:

1. **Boundary scan.** Read File Changes. Identify every export that crosses file boundaries (new/modified function, hook, or component exported from one file and imported by another). These are B's focus list.

2. **Contract validation.** For each boundary in the focus list: find the inline `**Contract**:` line. Validate signature hides details, boundary classification is correct, testability seam is simplest that works. If the contract is missing, add it. If invalid, fix it.

3. **Pre-flight verification.** For each MSW-dependent contract, verify the handler exists in the module's `mocks/` directory or that File Changes includes creating one. For each component contract, verify it renders inside the required provider boundary per the plan's component tree. Fix issues directly.

4. **Structural soundness check.** If the enriched plan has a defect that enrichment cannot fix (e.g., module boundary forces cross-module import), first revert A's changes to `plan.md` (`git checkout -- .adlc/[run-uuid]/plan.md`), then write `architect-revision-[plan-iteration].md` and **stop — do not proceed to step 5**. The revert preserves mutual exclusivity: a revision request MUST NOT coexist with enrichments. Include the issues found in steps 1-3 as additional required changes in the revision request. Only B can write revision request files.

5. **Edit plan.md directly** for all fixes in steps 1-3. This step runs only if step 4 did not produce a revision request. Do not modify Objective, Affected packages, Scaffolding required, New dependencies, or Acceptance criteria.

B edits `plan.md` directly. B does not append concerns — it rewrites sections that need improvement.
