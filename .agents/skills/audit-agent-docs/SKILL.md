---
name: audit-agent-docs
description: |
  Audit agent-docs/ for accuracy, completeness, and instruction quality.
  Use when asked to "audit docs", "review agent-docs", "check documentation",
  or after significant architectural or tooling changes.
  Triggers: /audit-agent-docs, "audit docs", "review documentation quality"
license: MIT
---

# Audit Agent Documentation

Audit `CLAUDE.md` and `agent-docs/` against the live codebase. This skill defines the audit **procedure** — whether findings are fixed or only reported depends on the caller's instructions.

## Cross-Reference Map

Each doc has specific codebase sources. Check these files for accuracy:

| Doc | Codebase sources |
|---|---|
| `ARCHITECTURE.md` | `apps/**/package.json`, `packages/**/package.json`, `pnpm-workspace.yaml`, directory structure |
| `references/development.md` | root `package.json` (engines, packageManager, scripts), `pnpm-workspace.yaml` |
| `references/build-tooling.md` | `turbo.json`, `.syncpackrc.js`, root `tsconfig.json` |
| `references/ci-cd.md` | `.github/workflows/*.yml`, `tooling/getAffectedStorybooks.ts` |
| `references/writing-agent-instructions.md` | `CLAUDE.md` (verify that CLAUDE.md rules follow the principles this doc defines) |
| `adr/index.md` | `agent-docs/adr/0*.md` |
| `adr/0001-squide-federated-modules.md` | `ARCHITECTURE.md` (Squide topology section), `apps/host/` directory structure |
| `adr/0002-domain-scoped-storybooks.md` | `ARCHITECTURE.md` (domain isolation section), `apps/*/storybook/` directories |
| `odr/index.md` | `agent-docs/odr/0*.md` |
| `odr/0001-pnpm-turborepo-monorepo.md` | `pnpm-workspace.yaml`, `turbo.json` |
| `odr/0002-dependency-versioning-syncpack.md` | `.syncpackrc.js`, `references/build-tooling.md` (syncpack section) |
| `odr/0003-selective-chromatic-runs.md` | `.github/workflows/chromatic.yml`, `tooling/getAffectedStorybooks.ts` |

## Audit Procedure

Run three sequential passes. Each pass depends on the previous one.

### Pass 1 — Structural Integrity

1. Read `CLAUDE.md` and extract every index entry path.
2. Glob `agent-docs/**/*.md` and list every file.
3. Check: every index entry resolves to an existing file. Every substantive file (excluding `template.md` and `README.md` in ADR/ODR folders) has an index entry.
4. Check: all relative links within docs resolve to existing files.

### Pass 2 — Accuracy and Completeness

For each doc in the cross-reference map above:

1. Read the doc.
2. Read every codebase source listed for that doc.
3. Compare every factual claim (versions, file paths, config values, script names, workflow steps, task definitions) against the codebase source.
4. Flag any claim that does not match reality.
5. Flag any codebase source that contains significant content not covered by its doc (completeness gap).

Pay special attention to:
- Version numbers (Node, pnpm, TypeScript, Turborepo, Syncpack)
- Turbo task definitions (inputs, outputs, dependencies)
- CI workflow steps (triggers, conditions, step names, tool restrictions)
- Syncpack semver group configurations
- ADR/ODR index tables matching actual record files
- ADR/ODR Consequences sections — they should cross-reference reference docs, not duplicate them

### Pass 3 — Instruction Quality and Redundancy

1. Read `agent-docs/references/writing-agent-instructions.md`.
2. Check every instruction in `CLAUDE.md` and `agent-docs/` against those principles:
   - Prohibition framing (not advisory)
   - Consequences stated explicitly
   - Concrete verification steps (not vague diligence)
   - No duplication of tooling-enforced constraints
3. Check for prescriptive content duplicated across files. Descriptive routing summaries (like CLAUDE.md index paraphrases) are acceptable. Identical rules, commands, or config values in multiple files are not.
4. Check for contradictions between files.

## Severity Definitions

- **Critical** — A doc states something factually wrong that would cause an agent to produce broken code (wrong file path, wrong command, wrong config value, wrong dependency constraint).
- **High** — Index entry points to a missing file, or a substantive file has no index entry. Or: a significant codebase feature lacks doc coverage entirely.
- **Medium** — Prescriptive content duplicated across files (drift risk). Instructions use advisory framing instead of prohibition framing.
- **Low** — Minor imprecision, slightly outdated descriptions that would not cause broken code, style inconsistencies.

## Report Format

Output findings in this format:

```
## Audit Report — {date}

### Summary
- Critical: N | High: N | Medium: N | Low: N

### Findings

#### [{SEVERITY}] {dimension} — {file}:{line-range}
**Claim:** {what the doc says}
**Reality:** {what the codebase shows}
**Source:** {codebase file and line checked}
**Fix:** {concrete action to resolve}
```

## Prohibitions

- Never skip a pass — the passes are ordered because each depends on the previous.
- Never invent severity levels beyond the four defined above.
- Never modify ADR/ODR Decision sections — flag them for a superseding record instead.
