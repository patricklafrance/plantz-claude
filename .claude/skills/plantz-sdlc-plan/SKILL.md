---
name: plantz-sdlc-plan
description: |
    Draft a technical plan for a feature. Analyzes requirements, identifies affected packages, and outputs a structured plan file.
    Use when asked to "plan a feature", "draft a technical plan", "design the approach", or as part of the SDLC orchestrator's planning phase.
license: MIT
---

# SDLC Plan

Draft the technical approach for a feature and output it to a plan file.

## Inputs (provided by orchestrator)

| Input               | Description               |
| ------------------- | ------------------------- |
| `run-uuid`          | Run folder identifier     |
| Feature description | What the user wants built |

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and all files in this skill's `references/` directory.
2. Load the `accessibility`, `shadcn`, `frontend-design`, and `workleap-react-best-practices` skills for design guidance.
3. Analyze the feature requirements and determine which packages/modules are affected.
4. If a new module or storybook needs to be scaffolded, note it in the plan. Do NOT scaffold during planning — that happens during the coding phase.
5. Draft the plan following the **plan output format** below.
6. Write the plan to `./tmp/runs/[run-uuid]/plan.md`.

## Plan Output Format

The plan file must contain these sections:

```markdown
# Plan: [Feature Name]

## Objective

[1-2 sentences describing what the feature does]

## Affected packages

[List of packages/modules that will be created or modified, with their paths]

## Scaffolding required

[Whether new modules or storybooks need to be scaffolded — list domain + module names]
[Or "None" if no scaffolding needed]

## File changes

[For each affected package, list files to create/modify/delete with a brief description
of the change. For story files, include the title convention and variant list inline.
When a new file should follow an existing file's pattern, include a "reference:" pointer.]

## New dependencies

[Any new npm packages to install, in which workspace package, or "None"]

## Decisions

[Key choices where alternatives existed. Each entry: what was decided, what was
rejected, and why. These feed the document phase's ADR/ODR check.]
[Or "None" if no non-obvious choices were made]

## Implementation notes

[Patterns to follow (reference existing files by path when applicable)
and gotchas to watch for]

## Acceptance criteria

[How to verify the feature works — specific, testable statements]
```

## Hard Constraints

- **Modules MUST NOT import from each other.** No direct imports, no subpath exports, no re-exports, no workarounds. This is absolute — no exceptions.
- When two modules need shared code (components, utilities, types, data collections), the plan MUST extract that code to a package under `packages/`. For plant domain code, use `@packages/plants-core`. For new domains, create a new `@packages/<domain>-core` package.
- If a feature request implies cross-module imports, redesign the approach to use a shared package instead. Never plan a module-to-module dependency.

## Subagent Pattern

Subagent A drafts the plan and writes `plan.md`. Subagent B reads the plan, challenges it — checking for missing affected packages, unrealistic scope, incorrect patterns, missing stories, or accessibility gaps — and edits `plan.md` directly to improve it. B does not append concerns; it rewrites sections that need improvement.
