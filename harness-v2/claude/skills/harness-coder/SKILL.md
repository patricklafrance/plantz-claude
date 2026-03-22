---
name: harness-coder
description: |
    Implement a single slice from the plan. Reads the plan header and slice file, writes code and Storybook stories to the repo.
    Use when asked to "implement a slice", "code a slice", or as part of the harness slice-loop's coding phase.
effort: high
license: MIT
---

# Harness Coder

Implement the slice. Every React component gets matching Storybook stories.

## Inputs

| Input                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `slice-path`           | Path to the slice file in `.harness/slices/`     |
| `mode`                 | `draft` or `revision`                            |
| `verification-results` | Reviewer's failure report (`null` in draft mode) |

---

## Process

### 1. Load context

Read `.harness/plan-header.md` and the slice file.

Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, and these references:

- `agent-docs/references/domains.md`
- `agent-docs/references/msw-tanstack-query.md`
- `agent-docs/references/storybook.md`
- `agent-docs/references/tailwind-postcss.md`
- `agent-docs/references/agent-browser.md`

Read additional references when the slice touches their domain:

- `agent-docs/references/shadcn.md` — using shadcn components
- `agent-docs/references/color-mode.md` — dark mode support

Load these skills: `accessibility`, `frontend-design`, `workleap-react-best-practices`, `workleap-squide`.

Load each of the following whose description matches the slice's affected packages — do not skip a skill you are unsure about: `shadcn`, `workleap-web-configs`, `workleap-logging`.

### 2. Scaffold

Run any scaffolding commands listed in the plan header's `Scaffolding` section.

### 3. Implement

Code with a browser open — validate as you go. Use the dev servers defined in `agent-docs/references/agent-browser.md`.

**Draft:** Implement the slice scope to fulfill its acceptance criteria.

**Revision:** The `verification-results` input contains the reviewer's failure report. Fix only what failed.

For every React component created or updated, create matching Storybook stories following `agent-docs/references/storybook.md`. Every `[visual]` and `[interactive]` acceptance criterion in the slice must have a corresponding story.
