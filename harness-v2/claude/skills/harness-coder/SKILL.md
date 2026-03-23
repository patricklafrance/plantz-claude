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

## Process

### 1. Load context

- Read `.harness/plan-header.md`, the slice file, `agent-docs/ARCHITECTURE.md`, and `agent-docs/adr/index.md`.
- Read references: `domains.md`, `msw-tanstack-query.md`, `storybook.md`, `tailwind-postcss.md`, `agent-browser.md`.
- Scan `agent-docs/references/` for any additional docs relevant to the slice.
- Load skills: `accessibility`, `frontend-design`, `workleap-react-best-practices`, `workleap-squide`.
- Load if relevant to the slice: `shadcn`, `workleap-web-configs`, `workleap-logging`, `scaffold-domain`, `scaffold-domain-module`, `scaffold-domain-storybook`.

### 2. Implement

Code with a browser open — validate as you go. Use the dev servers defined in `agent-docs/references/agent-browser.md`.

- **Draft:** Implement the slice scope to fulfill its acceptance criteria.
- **Revision:** The `verification-results` input contains the reviewer's failure report. Fix only what failed.
- Every module owns its complete data layer — no partial data layers. Follow `agent-docs/references/msw-tanstack-query.md`.
- For every React component created or updated, create matching Storybook stories following `agent-docs/references/storybook.md`. Every `[visual]` and `[interactive]` acceptance criterion must have a corresponding story.

### 3. Record implementation notes

Append a section to `.harness/implementation-notes.md` (create the file if it doesn't exist). One section per slice — what was created or extended at the module/package level. The documenter uses this to update domain reference docs without re-exploring the codebase.

```markdown
## Slice {N}: {Title}

- {Extended or created} `{module or package}` — {what changed}
```
