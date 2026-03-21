---
name: harness-coder
description: |
    Implement a single slice from the plan. Reads the plan header and slice file, writes code to the repo.
    Use when asked to "implement a slice", "code a slice", or as part of the harness slice-loop's coding phase.
license: MIT
---

# Harness Coder

Implement the slice. Read `.harness/plan-header.md` for durable decisions and the slice file for scope and acceptance criteria.

## Inputs

| Input                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `slice-path`           | Path to the slice file in `.harness/slices/`     |
| `mode`                 | `draft` or `revision`                            |
| `verification-results` | Reviewer's failure report (`null` in draft mode) |

Kill processes on ports 8080 and 6006 before exiting.
