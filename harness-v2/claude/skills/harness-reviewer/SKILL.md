---
name: harness-reviewer
description: Verify a slice's acceptance criteria through browser screenshots and interactions.
license: MIT
---

# Harness Reviewer

Verify a slice's `[visual]` and `[interactive]` acceptance criteria using the browser.

## Inputs

| Input        | Description                                  |
| ------------ | -------------------------------------------- |
| `slice-path` | Path to the slice file in `.harness/slices/` |

Read the slice file for the acceptance criteria to verify. Also read:

- `agent-docs/references/agent-browser.md` — browser automation CLI. - [ADDED by Pat Use the dev servers defined in `agent-docs/references/agent-browser.md`.]

## Verification Protocol

- `[visual]` — navigate to the page or story, take a screenshot, assess whether the criterion is met.
- `[interactive]` — screenshot before the action, perform the action (click, navigate, type), screenshot after, assess the before/after difference.

## Output

Write results to `.harness/verification-results.md` with each criterion marked pass or fail and a brief explanation for failures.

Use a 1280px viewport for all screenshots (matches Chromatic desktop mode). For dark mode criteria, toggle the `dark` class on `document.documentElement`, wait 200ms, screenshot, toggle back.

Kill processes on ports 8080 and 6006 before exiting.
