---
name: scaffold-domain-module
description: |
  Scaffold a new Squide federated module in the monorepo.
  Use when asked to "create a module", "scaffold a module", "add a module", "new module".
license: MIT
---

# Scaffold Module

Create a new Squide federated module with all required registrations.

## Inputs

Two required inputs; everything else is derived.

| Input | Required | Description |
|---|---|---|
| `domain` | Yes | Domain directory under `apps/` (e.g., `management`, `today`) |
| `module` | Yes | Module name (e.g., `plants`, `watering-schedules`) |

## Naming Derivation

All names are mechanically derived from `domain` and `module`. **PascalCase** means split on `-`, capitalize each segment's first letter, join (e.g., `landing-page` → `LandingPage`).

| Name | Formula | Example (`management` + `plants`) |
|---|---|---|
| Package name | `@modules/{domain}-{module}` | `@modules/management-plants` |
| Directory | `apps/{domain}/{module}/` | `apps/management/plants/` |
| Register function | `register` + PascalCase(domain) + PascalCase(module) | `registerManagementPlants` |
| Page component | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`) | `PlantsPage` |
| Register file | `src/{registerFunction}.tsx` | `src/registerManagementPlants.tsx` |
| Page file | `src/{PageComponent}.tsx` | `src/PlantsPage.tsx` |
| `$id` | `{domain}-{module}` | `management-plants` |
| Registry key | `{domain}/{module}` | `management/plants` |
| Route path | `/{domain}/{module}` | `/management/plants` |
| Nav label | PascalCase(module) with spaces between words | `Plants` |
| Dev script | `dev-{domain}-{module}` | `dev-management-plants` |

## Reference Module

`apps/management/plants/` is the canonical reference. Before creating any file, list the reference module's directory tree (`apps/management/plants/` and `apps/management/plants/src/`) and read every file. This ensures new config files, scripts, or dependencies added to the reference are automatically picked up.

Reproduce the same structure for the new module with substituted names. Copy dependency versions and scripts exactly — do not invent or upgrade versions.

## Procedure

### Step 1 — Validate inputs

1. Confirm `apps/{domain}/` exists. If not, ask the user whether to create the domain directory.
2. Confirm `apps/{domain}/{module}/` does NOT exist. If it does, stop and report.

### Step 2 — Create module files

Mirror every file from the reference module. For each file, apply the relevant substitutions:

| File | What to substitute |
|---|---|
| `package.json` | Package name, description; copy `scripts`, `dependencies`, `devDependencies`, and `peerDependencies` exactly |
| `tsconfig.json` | Identical copy |
| `src/index.ts` | Barrel export of the register function |
| `src/{registerFunction}.tsx` | Register function name, route path, `$id`, nav label, page component import |
| `src/{PageComponent}.tsx` | Component name |
| Any other file (config files, etc.) | Identical copy |

### Step 3 — Register in host

1. In `apps/host/src/getActiveModules.tsx`:
   - Add import: `import { {registerFunction} } from "{packageName}";`
   - Add entry to `ModuleRegistry`: `"{registryKey}": {registerFunction}`
2. In `apps/host/package.json`:
   - Add `"{packageName}": "workspace:*"` to `dependencies`

### Step 4 — Update storybook affected map

In `tooling/getAffectedStorybooks.ts`, add `"{packageName}"` to the `StorybookDependencies` entry for the domain's storybook (`@apps/{domain}-storybook`).

If no storybook entry exists for the domain, warn the user but do not create one.

### Step 5 — Add dev script

In root `package.json`, add to `scripts`:

```
"dev-{domain}-{module}": "cross-env MODULES={domain}/{module} pnpm dev-host"
```

### Step 6 — Install dependencies

Run `pnpm install` to link the new workspace package.

### Step 7 — Verify

1. Confirm every file from the reference module has a corresponding file in the new module.
2. Confirm `getActiveModules.tsx` imports the register function and has the registry entry.
3. Confirm `apps/host/package.json` lists the new package in `dependencies`.
4. Confirm `getAffectedStorybooks.ts` includes the new package.
5. Confirm root `package.json` has the dev script.
6. Run `pnpm syncpack lint` — fix any version mismatches.
7. Run `pnpm typecheck` — fix any type errors.

## Prohibitions

- Never hardcode dependency versions — always read them from the reference module.
- Never skip host registration (Step 3) or storybook registration (Step 4) — these are silent failures at runtime and in CI.
- Never create a module directory that already exists.
