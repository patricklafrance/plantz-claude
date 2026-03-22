---
name: scaffold-domain
description: |
    Scaffold a new domain directory under apps/.
    Use when asked to "create a domain", "scaffold a domain", "add a domain", "new domain".
license: MIT
---

# Scaffold Domain

Create a new domain with its CLAUDE.md governance file.

## Inputs

| Input         | Description                                             |
| ------------- | ------------------------------------------------------- |
| `domain`      | Domain name (e.g., `scheduling`)                        |
| `description` | One-line mental model (e.g., "Recurring care routines") |

## Reference Domain

`apps/management/` is the canonical reference. Read `apps/management/CLAUDE.md` before creating the new domain's CLAUDE.md.

## Procedure

### Step 1 — Validate

1. Confirm `apps/{domain}/` does NOT exist. If it does, stop and report.

### Step 2 — Create domain directory

Create `apps/{domain}/`.

### Step 3 — Create CLAUDE.md

Write `apps/{domain}/CLAUDE.md` following the structure of the reference domain's CLAUDE.md. Adapt the content to the new domain:

- Domain title and description
- Story title prefix: `{PascalCase(domain)}/`
- Storybook dev command: `pnpm dev-{domain}-storybook`
- Data layer section: leave generic until modules are added
- API surface: `/api/{domain}/`

### Step 4 — Update domains.md

Add the new domain to the domain table in `agent-docs/references/domains.md`. Include the domain name, mental model, and an empty modules list.
