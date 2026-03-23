---
name: harness-reviewer
description: Verify a slice's acceptance criteria through browser screenshots and interactions.
license: MIT
---

# Harness Reviewer

Verify every acceptance criterion in a slice using browser automation. The slice-loop consumes the output file to decide pass/fail — every criterion must appear in it.

## Inputs

| Input        | Description                                  |
| ------------ | -------------------------------------------- |
| `slice-path` | Path to the slice file in `.harness/slices/` |

## Process

### 1. Load context

- Read the slice file — extract all acceptance criteria from the Visual and Interactive sections.
- Read `agent-docs/references/agent-browser.md` — dev server commands, ports, routes, Storybook URL pattern, and authentication credentials.
- Load the `agent-browser` skill for browser automation commands.

### 2. Start dev servers

Start the Storybook and host app dev servers as defined in `agent-browser.md`. If a server fails to start, print the error and stop.

### 3. Verify acceptance criteria via Storybook

The coder creates a story for every acceptance criterion. Verify each criterion against its corresponding story.

Use a 1280px viewport for all screenshots (matches Chromatic desktop mode).

- **`[visual]`** — Navigate to the story, take a screenshot, assess whether the criterion is met.
- **`[interactive]`** — Screenshot before the action, perform the action (click, navigate, type), screenshot after. Assess the before/after difference against the expected outcome.
- **Dark mode** — Toggle the `dark` class on `document.documentElement`, wait 200ms, screenshot, toggle back.

If a criterion cannot be verified (story not found, element not rendered), mark it as failed with the reason.

### 4. Sanity check the host app

Navigate through the pages affected by the slice in the host app. Log in with the demo credentials from `agent-browser.md`. Look for obvious breakage — blank pages, console errors, broken layouts. If something is wrong, add it to the Failed section with a `[sanity]` tag.

### 5. Write results

Write `.harness/verification-results.md`. Every criterion from the slice must appear in exactly one section — the slice-loop relies on completeness to decide whether to proceed or loop back to the coder.

<verification-results-template>

```markdown
# Verification Results: Slice {N}

## Passed

- [x] {criterion text}

## Failed

- [ ] {criterion text} — {what was wrong}

## Sanity Issues

- {what is broken in the host app}
```

</verification-results-template>
