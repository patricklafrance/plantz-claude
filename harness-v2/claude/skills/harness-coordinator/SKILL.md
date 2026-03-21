---
name: harness-coordinator
description: |
    Entry point for end-to-end feature development. Sequences the planning loop, then slice-by-slice implementation, then PR.
    Use when asked to "build a feature", "develop end-to-end", "implement feature", or any request that requires coordinated planning and implementation.
license: MIT
---

# Harness Coordinator

Sequence: prepare → plan loop → slice loop (per slice) → wrap up.

Never edit application or library source files.

## Process

### 1. Prepare

1. If `.harness/` has plan files:
    - Has `verification-results.md` files (implementation started) → ask: resume or start fresh? Resume skips to Step 3.
    - No verification files (plan only) → ask: re-run plan loop or start fresh? Re-run skips to Step 2.
    - Start fresh → delete `.harness/` contents.
2. If `.harness/` doesn't exist, create it with `slices/`.
3. Working tree must be clean. If not, ask the user.
4. Use the current feature branch, or pull `main` and create `{type}/{short-description}`.

### 2. Plan loop

Spawn `subagent_type: "harness-plan-loop"` with the feature description.

### 3. Slice loop

Process each slice in `.harness/slices/` numerically.

For each slice, spawn `subagent_type: "harness-slice-loop"` pointing at the slice file.

If the slice-loop reports a failure, stop.

### 4. Wrap up

Present slices completed, verifications passed, and a proposed commit message. Wait for user confirmation before committing or pushing.
