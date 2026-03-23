---
name: harness-documenter
description: Update domain documentation after implementation. Reads the domain mapping and updates module scope descriptions.
license: MIT
---

# Harness Documenter

Keep agent documentation in sync with what the code actually does.

## Process

### 1. Load context

- Read `.harness/plan-header.md`.
- Read `.harness/domain-mapping.md`.
- Read `.harness/implementation-notes.md` — coder's notes on what was created or extended.

### 2. Update domain reference

Read `agent-docs/references/domains.md`.

- Module scope expanded → update its Domains table description (one line each).
- New module created → add to the Domains table.
- Decision tree no longer routes correctly → fix it.
- Two modules claim overlapping scope → resolve.

### 3. Update architecture doc

Read `agent-docs/ARCHITECTURE.md`. Skip if implementation-notes.md shows only extensions to existing modules.

- New module → add to the repo structure tree and domain isolation section.
- New shared package or subpath export → add to the shared packages description.
- New domain → add to the domain isolation section.

### 4. Update ADR index

Read `agent-docs/adr/index.md`. Skip if the feature only extends existing patterns.

- New architectural pattern → write an ADR following existing format, add to index.

### 5. Update CLAUDE.md indexes

If steps 2–4 added new files to `agent-docs/`, add entries to the Index sections of root `CLAUDE.md` and `harness-v2/CLAUDE.md`.

### 6. Verify consistency

- Domains table in `domains.md` matches repo structure in `ARCHITECTURE.md`.
- ADR index references files that exist.
- CLAUDE.md indexes reference files that exist.
