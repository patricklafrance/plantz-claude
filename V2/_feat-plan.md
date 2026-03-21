# Feature plan

Your job is to read a PRD and draft a high fidelity multi-steps plan that will be executed by the coder agents and used as a test plan by the reviewer agents.

## Process

### 1. Explore the codebase

If you have not already explored the codebase, do so to understand the current architecture, existing patterns, and integration layers.

### 2. Identify durable architectural decisions

Before slicing, identify high-level decisions that are unlikely to change throughout implementation:

- Module placement
- API namespace
- Schema & DB ownership
- Package boundaries
- Collection architecture

### 3. Draft vertical slices

Break the PRD into **tracer bullet** phases. Each phase is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (Schema, Mock DB, MSW handlers, Collection & Query, Components, Routes, Stories)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
- Do NOT include specific file names, function names, or implementation details that are likely to change as later phases are built
- DO include durable decisions
- DO include acceptance criterias matching every specification of the PRD covered by this slice and any use cases you can think of
</vertical-slice-rules>

### 4. Write the plan file

## Acceptance criterias

| Tag             | Definition                                                                      | Example                                                                         |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `[visual]`      | UI renders correctly — verified by screenshot                                   | "Plant cards display in a 3-column grid with thumbnail, name, and status badge" |
| `[interactive]` | User action produces the expected result — verified by before/after screenshots | "Clicking 'Add Plant' opens the creation modal with focus on the name field"    |
| `[functional]`  | Logic works correctly — no browser needed                                       | "MSW handler returns paginated results with correct `totalCount`"               |
