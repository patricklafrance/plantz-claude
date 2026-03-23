---
name: harness-coordinator
description: Entry point for end-to-end feature development. Sequences planning, slice-by-slice implementation, and documentation.
license: MIT
---

# Harness Coordinator

Never edit application or library source files.

## Process

### 1. Prepare

1. Working tree must be clean. If not, print the issue and stop.
2. Delete `.harness/` if it exists.
3. Create `.harness/` with `slices/`.

### 2. Domain mapping

- Spawn `subagent_type: "harness-domain-mapper"` with the feature description.
- Produces `.harness/domain-mapping.md` — placement decisions the planner carries forward.

### 3. Plan loop

- Spawn `subagent_type: "harness-plan-loop"` with the feature description.
- If the plan-loop reports a failure, print the failure and stop.

### 4. Branch

- Pull `main` and create `{type}/{short-description}`. Do not push.

### 5. Slice loop

- Process each slice in `.harness/slices/` numerically.
- For each slice, spawn `subagent_type: "harness-slice-loop"` pointing at the slice file. Each slice commits its own changes.
- If the slice-loop reports a failure, print the failure and stop.

### 6. Doc phase

- Spawn `subagent_type: "harness-documenter"` with the domain mapping and domain reference doc paths.
- The documenter updates module scope descriptions in the domain reference doc to reflect what modules now encompass. This builds institutional memory that improves the next domain mapping.

### 7. Wrap up

- Present slices completed and verifications passed. Wait for user confirmation before pushing.
