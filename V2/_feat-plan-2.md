# Feature plan

Your job is to read a PRD and draft a high fidelity multi-steps plan that will be executed by the coder agents and used as a test plan by the reviewer agents.

->->-> QUESTIONS:

- IS ARCHITECTURE NECESSARY??
- SHOULD LOOSELY COUPLED MENTIONNED HERE?
- THERE MUST BE A STORYBOOK STORY FOR EVERY ACCEPTATION CRITERIA BECAUSE THIS IS WHAT THE TEST REVIEW WILL USE

## Process

### 1. Explore the codebase

If you have not already explored the codebase, do so to understand the current architecture, existing patterns, and integration layers.

- Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`.
- Load the `workleap-squide` skill.

### 2. Identify durable architectural decisions and affected packages

- If a new module or storybook needs to be scaffolded, note it in the plan. Before proposing a new module, check `agent-docs/references/domains.md` for module granularity criteria — prefer adding to an existing module unless the criteria are clearly met.

Identify durable architectural decisions

If a new module or storybook needs to be scaffolded, note it in the plan. Before proposing a new module, check `agent-docs/references/domains.md` for module granularity criteria — prefer adding to an existing module unless the criteria are clearly met. Do NOT scaffold during planning — that happens during the coding phase.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** phases. Each phase is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

- Each slice delivers a narrow but COMPLETE path through every layer (Schema, Mock DB, MSW handlers, Collection & Query, Components, Routes, Stories)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
- Do NOT include specific file names, function names, or implementation details that are likely to change as later phases are built
- DO include durable decisions and affected packages
- DO include acceptance criterias matching every specification of the PRD covered by this slice and any use cases you can think of

### 4. Write the plan files

## Plan index output format

TBD...

## Plan slice output format

The slice file must contain these sections:

```markdown
## Objective

[1-2 sentences describing what the slice does]

## Affected packages

[List of modules/storybooks/shared packages that will be created or modified, with their paths]

## Scaffolding required

[Whether new modules, storybooks or shared packages need to be scaffolded]
[Or "None" if no scaffolding needed]

## Decisions

[Key choices where alternatives existed. Each entry: what was decided, what was
rejected, and why. These feed the document phase's ADR/ODR check.]
[Or "None" if no non-obvious choices were made]

## Implementation notes

[Patterns to follow (reference existing files by path when applicable)
and gotchas to watch for]

## Acceptance criteria

RULES (apply to every criterion below):

1. Every criterion MUST have exactly one tag: [static], [visual], or [interactive].
2. There MUST be at least one criterion per planned file change.
3. UI/UX changes MUST have more [visual] and [interactive] criteria than [static] criteria.
4. [visual] and [interactive] criteria MUST be specific enough for an agent with agent-browser to verify (e.g., "dialog has readable text on dark background" NOT "dark mode looks good").
5. When a feature adds, removes, or modifies columns/rows in a grid or table layout, include a [visual] criterion that explicitly compares header column positions to body column positions (e.g., "each header label's left edge is directly above the corresponding body value's left edge with no visible horizontal offset").
6. Every `[interactive]` criterion that triggers a mutation (create, update, delete, accept, dismiss) MUST have companion criteria for: (a) the trigger element's disabled or loading state while the async operation is in flight, and (b) every UI element outside the trigger that should visibly change as a consequence (list refreshes, counter updates, sibling section appears). Omitting these produces features where the action succeeds but the UI appears frozen or stale. Bad: a single criterion "Clicking Delete removes the plant." Good: three criteria — "Clicking Delete removes the plant from the list," "Delete button shows a loading state while the request is in flight," "Plant count in the header updates after deletion."

Tag definitions:

- [static] — verified by lint, typecheck, or module validation
- [visual] — verified by launching the app and visually inspecting a screenshot (color, presence, text content, layout structure)
- [interactive] — verified by clicking, typing, or navigating in the browser

Criteria:

- [static] Component accepts new prop without type errors
- [visual] List renders with the expected columns and no visual offset between header and body
- [interactive] Clicking a row opens the detail dialog
```

## Acceptance criterias

| Tag             | Definition                                                                      | Example                                                                         |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `[visual]`      | UI renders correctly — verified by screenshot                                   | "Plant cards display in a 3-column grid with thumbnail, name, and status badge" |
| `[interactive]` | User action produces the expected result — verified by before/after screenshots | "Clicking 'Add Plant' opens the creation modal with focus on the name field"    |
| `[functional]`  | Logic works correctly — no browser needed                                       | "MSW handler returns paginated results with correct `totalCount`"               |
