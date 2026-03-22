---
name: harness-coordinator
description: |
    Entry point for end-to-end feature development. Sequences the planning loop, then slice-by-slice implementation, then PR.
    Use when asked to "build a feature", "develop end-to-end", "implement feature", or any request that requires coordinated planning and implementation.
license: MIT
---

# Harness Coordinator

Never edit application or library source files.

## Process

### 1. Prepare

1. Working tree must be clean. If not, tell the user and stop.
2. Delete `.harness/` if it exists.
3. Create `.harness/` with `slices/`.

### 2. Plan loop

Spawn `subagent_type: "harness-plan-loop"` with the feature description.

### 3. Branch

Pull `main` and create `{type}/{short-description}`. Do not push.

### 4. Slice loop

Process each slice in `.harness/slices/` numerically.

For each slice, spawn `subagent_type: "harness-slice-loop"` pointing at the slice file. Each slice commits its own changes.

If the slice-loop reports a failure, stop.

### 5. Wrap up

Present slices completed and verifications passed. Wait for user confirmation before pushing.
