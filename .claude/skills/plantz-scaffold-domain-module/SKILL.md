---
name: plantz-scaffold-domain-module
description: |
    Scaffold a new Squide local module in the monorepo.
    Use when asked to "create a module", "scaffold a module", "add a module", "new module".
license: MIT
---

# Scaffold Module

Create a new Squide local module with all required registrations.

## Inputs

Two required inputs; everything else is derived.

| Input    | Required | Description                                                  |
| -------- | -------- | ------------------------------------------------------------ |
| `domain` | Yes      | Domain directory under `apps/` (e.g., `management`, `today`) |
| `module` | Yes      | Module name (e.g., `plants`, `watering-schedules`)           |

## Naming Derivation

All names are mechanically derived from `domain` and `module`. **PascalCase** means split on `-`, capitalize each segment's first letter, join (e.g., `landing-page` → `LandingPage`).

| Name              | Formula                                                                                                      | Example (`management` + `plants`)  |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Package name      | `@modules/{domain}-{module}`                                                                                 | `@modules/management-plants`       |
| Directory         | `apps/{domain}/{module}/`                                                                                    | `apps/management/plants/`          |
| Register function | `register` + PascalCase(domain) + PascalCase(module)                                                         | `registerManagementPlants`         |
| Page component    | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`)                                | `PlantsPage`                       |
| Register file     | `src/{registerFunction}.tsx`                                                                                 | `src/registerManagementPlants.tsx` |
| Page file         | `src/{PageComponent}.tsx`                                                                                    | `src/PlantsPage.tsx`               |
| `$id`             | `{domain}-{module}`                                                                                          | `management-plants`                |
| Registry key      | `{domain}/{module}`                                                                                          | `management/plants`                |
| Route path        | `/{domain}/{module}` (default — confirm with user if module ends with `-page` or represents a landing route) | `/management/plants`               |
| Nav label         | PascalCase(module) with spaces between words (default — confirm with user if module name is ambiguous)       | `Plants`                           |
| Dev script        | `dev-{domain}-{module}`                                                                                      | `dev-management-plants`            |

## Reference Module

`apps/management/plants/` is the canonical reference. Before creating any file, read these 5 files from the reference module: `package.json`, `tsconfig.json`, `src/index.ts`, `src/registerManagementPlants.tsx`, and `src/PlantsPage.tsx`. Do not read domain-specific files (dialogs, schemas, collections, utilities, stories) — they are irrelevant to scaffolding.

Reproduce the same 5-file skeleton for the new module with substituted names. Copy dependency versions and scripts exactly — do not invent or upgrade versions.

## Procedure

### Step 1 — Validate inputs

1. Confirm `apps/{domain}/` exists. If not, ask the user whether to create the domain directory.
2. Confirm `apps/{domain}/{module}/` does NOT exist. If it does, stop and report.

### Step 2 — Create module files

Create only the files listed below — do not copy domain-specific source files from the reference (e.g., dialogs, schemas, collections, utilities, stories). The reference module contains many files specific to the plants domain; only its config files and skeletal source structure are relevant.

| File                         | What to substitute                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`               | Package name, description; `license` must be `"Apache-2.0"`, `author` must be `"Patrick Lafrance"` (never copy from root `package.json`); copy `scripts`, `devDependencies`, and `peerDependencies` exactly; for `dependencies`, copy only `workspace:*` deps — do not copy domain-specific deps (e.g., `zod`, `date-fns`); omit `dependencies` entirely if none are `workspace:*` |
| `tsconfig.json`              | Identical copy                                                                                                                                                                                                                                                                                                                                                                     |
| `src/index.ts`               | Barrel export of the register function                                                                                                                                                                                                                                                                                                                                             |
| `src/{registerFunction}.tsx` | Register function name, route path, `$id`, nav label, page component import                                                                                                                                                                                                                                                                                                        |
| `src/{PageComponent}.tsx`    | Component name                                                                                                                                                                                                                                                                                                                                                                     |

### Step 3 — Register in host

1. In `apps/host/src/getActiveModules.tsx`:
    - Add import: `import { {registerFunction} } from "{packageName}";`
    - Add entry to `ModuleRegistry`: `"{registryKey}": {registerFunction}`
2. In `apps/host/package.json`:
    - Add `"{packageName}": "workspace:*"` to `dependencies`

### Step 4 — Update domain storybook CSS

In `apps/{domain}/storybook/.storybook/storybook.css`, add a `@source` directive for the new module:

```css
@source "../../{module}/src/**/*.{ts,tsx}";
```

Without this, Tailwind classes used in the new module will not be scanned and will be missing from the domain storybook.

If the domain storybook does not exist yet, skip this step and warn the user.

### Step 5 — Update unified storybook

In `apps/storybook/.storybook/main.ts`, add a story glob for the new module under the appropriate `// {DomainTitle}` comment section in the `stories` array:

```ts
"../{domain}/{module}/src/**/*.stories.tsx";
```

Follow the existing comment-section pattern visible in the file. The `stories` array has a `// Packages` comment section for non-module packages — never add module globs under that section.

### Step 6 — Update storybook affected map

In `tooling/getAffectedStorybooks.ts`, add `"{packageName}"` to the `StorybookDependencies` entry for the domain's storybook (`@apps/{domain}-storybook`).

**Only list module package names (`@modules/*`).** Never add shared packages (`@packages/*`) — Turborepo's `--filter=...[baseSha]` already detects transitive dependency changes, so if a shared package changes, the modules that depend on it are automatically marked as affected.

If no storybook entry exists for the domain, warn the user but do not create one.

### Step 7 — Add dev script

In root `package.json`, add to `scripts`:

```
"dev-{domain}-{module}": "cross-env MODULES={domain}/{module} pnpm dev-host"
```

### Step 8 — Install dependencies

Run `pnpm install` to link the new workspace package.

### Step 9 — Verify

1. Confirm all 5 files from the Step 2 table exist in the new module.
2. Confirm `getActiveModules.tsx` imports the register function and has the registry entry.
3. Confirm `apps/host/package.json` lists the new package in `dependencies`.
4. Confirm domain storybook's `storybook.css` includes a `@source` directive for the new module.
5. Confirm `apps/storybook/.storybook/main.ts` includes a story glob for the new module.
6. Confirm `getAffectedStorybooks.ts` includes the new package.
7. Confirm root `package.json` has the dev script.
8. Run `pnpm syncpack` — fix any version mismatches.
9. Run `pnpm typecheck` — fix any type errors.

## Prohibitions

- Never hardcode dependency versions — always read them from the reference module.
- Never skip host registration (Step 3), storybook CSS update (Step 4), unified storybook update (Step 5), or affected-map registration (Step 6) — these are silent failures at runtime and in CI.
- Never create a module directory that already exists.
