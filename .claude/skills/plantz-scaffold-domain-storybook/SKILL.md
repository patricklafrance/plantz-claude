---
name: plantz-scaffold-domain-storybook
description: |
    Scaffold a domain-scoped Storybook with Chromatic CI integration.
    Use when asked to "add a storybook", "create a domain storybook", "scaffold storybook for {domain}".
    Triggers: /plantz-scaffold-domain-storybook, "add storybook", "new domain storybook"
license: MIT
---

# Add Domain Storybook

Scaffold a complete domain-scoped Storybook application with Chromatic CI and affected-detection integration.

## Inputs

One required input; everything else is derived.

| Input    | Required | Description                                                  |
| -------- | -------- | ------------------------------------------------------------ |
| `domain` | Yes      | Domain directory under `apps/` (e.g., `management`, `today`) |

## Naming Derivation

| Derived value     | Formula                                  | Example (`management`)               |
| ----------------- | ---------------------------------------- | ------------------------------------ |
| Storybook path    | `apps/{domain}/storybook/`               | `apps/management/storybook/`         |
| Package name      | `@apps/{domain}-storybook`               | `@apps/management-storybook`         |
| Dev script        | `dev-{domain}-storybook`                 | `dev-management-storybook`           |
| Chromatic token   | `{DOMAIN_UPPER}_CHROMATIC_PROJECT_TOKEN` | `MANAGEMENT_CHROMATIC_PROJECT_TOKEN` |
| Chromatic step id | `chromatic-{domain}`                     | `chromatic-management`               |
| Domain title      | Capitalize first letter of `{domain}`    | `Management`                         |

Module-level values are discovered at runtime:

| Derived value                   | How                                                            |
| ------------------------------- | -------------------------------------------------------------- |
| Module directories              | `ls apps/{domain}/` minus `storybook/`                         |
| Story globs (domain storybook)  | `../../{module_dir}/src/**/*.stories.tsx` per module           |
| Story globs (unified storybook) | `../{domain}/{module_dir}/src/**/*.stories.tsx` per module     |
| Module package names            | Read `apps/{domain}/{module_dir}/package.json` -> `name` field |

## Reference Storybook

`apps/management/storybook/` is the canonical reference. Before creating any file, read these 7 files from the reference:

1. `apps/management/storybook/package.json`
2. `apps/management/storybook/.storybook/main.ts`
3. `apps/management/storybook/.storybook/preview.tsx`
4. `apps/management/storybook/.storybook/storybook.css`
5. `apps/management/storybook/chromatic.config.json`
6. `apps/management/storybook/tsconfig.json`
7. `apps/management/storybook/rsbuild.config.ts`

Never hardcode dependency versions or config values from memory — your general knowledge of these packages is wrong for this repo. Always read the reference files and replicate them.

## Procedure

### Step 1 — Validate inputs

1. Confirm `apps/{domain}/` exists. If not, stop and ask the user.
2. Confirm `apps/{domain}/storybook/` does NOT exist. If it does, stop and report.
3. Scan `apps/{domain}/` for module directories (every subdirectory except `storybook/`).
4. Read each module's `package.json` to get its canonical package name.

### Step 2 — Create storybook files

Read all 7 reference files listed above, then create 7 files under `apps/{domain}/storybook/`:

#### `package.json`

Clone the entire reference `package.json`. Change only:

- `name` -> `@apps/{domain}-storybook`
- `description` -> `Storybook application for the {domain} domain.`

Copy `scripts`, `dependencies`, and `devDependencies` verbatim — do not add, remove, or change any package or version.

#### `.storybook/main.ts`

Clone the structure from the reference. Replace the `stories` array with one glob per discovered module:

```ts
stories: ["../../{module_dir_1}/src/**/*.stories.tsx", "../../{module_dir_2}/src/**/*.stories.tsx"];
```

Preserve the `framework`, `addons`, and `getAbsolutePath` helper exactly as they appear in the reference.

#### `.storybook/preview.tsx`

Clone entirely from the reference. No substitutions.

#### `.storybook/storybook.css`

Clone the structure from the reference. Keep the `@import` for `globals.css` and the `@source` for `@packages/components` as-is. Replace the module-specific `@source` lines with one per discovered module:

```css
@import "../../../../packages/components/src/styles/globals.css";

@source "../../../../packages/components/src/**/*.{ts,tsx}";
@source "../../{module_dir_1}/src/**/*.{ts,tsx}";
@source "../../{module_dir_2}/src/**/*.{ts,tsx}";
```

Without this file, Tailwind styles will not work in the new storybook.

#### `chromatic.config.json`

Clone from the reference. Change only:

- `storybookBaseDir` -> `apps/{domain}/storybook`

The `projectId` field must be removed — it is specific to the reference project. The user will set it after creating the Chromatic project.

#### `tsconfig.json`

Clone entirely from the reference. No substitutions.

#### `rsbuild.config.ts`

Clone entirely from the reference. No substitutions.

### Step 3 — Add root dev script

In root `package.json`, add to `scripts`:

```
"dev-{domain}-storybook": "turbo run dev --filter=@apps/{domain}-storybook"
```

### Step 4 — Add story globs to unified storybook

In `apps/storybook/.storybook/main.ts`, add story globs for each module under a `// {DomainTitle}` comment section in the `stories` array:

```ts
// {DomainTitle}
("../{domain}/{module_dir_1}/src/**/*.stories.tsx", "../{domain}/{module_dir_2}/src/**/*.stories.tsx");
```

Follow the existing comment-section pattern visible in the file.

### Step 5 — Add affected-detection entry

In `tooling/getAffectedStorybooks.ts`, add a new entry to the `StorybookDependencies` object:

```ts
"@apps/{domain}-storybook": [
    "{module_package_name_1}",
    "{module_package_name_2}"
]
```

Use the canonical package names read from each module's `package.json`.

### Step 6 — Add Chromatic CI step

In `.github/workflows/chromatic.yml`, add a new step after the existing Chromatic steps (before the "Remove run chromatic label" step):

```yaml
- name: Chromatic - {DomainTitle}
  id: chromatic-{domain}
  uses: chromaui/action@latest
  with:
      projectToken: ${{ secrets.{DOMAIN_UPPER}_CHROMATIC_PROJECT_TOKEN }}
      workingDir: apps/{domain}/storybook
      onlyChanged: true
      exitOnceUploaded: true
      autoAcceptChanges: main
      skip: ${{ steps.affected-storybooks.outputs['@apps/{domain}-storybook'] == 'false' }}
      debug: true
```

Copy the `uses` action reference and all `with` properties from an existing Chromatic step — never guess the action version or property names.

### Step 7 — Install dependencies

Run `pnpm install` to link the new workspace package.

### Step 8 — Verify

1. Confirm all 7 storybook files exist under `apps/{domain}/storybook/` (including `.storybook/storybook.css`).
2. Confirm root `package.json` has the `dev-{domain}-storybook` script.
3. Confirm `apps/storybook/.storybook/main.ts` includes the new story globs.
4. Confirm `tooling/getAffectedStorybooks.ts` includes the new `StorybookDependencies` entry.
5. Confirm `.github/workflows/chromatic.yml` has the new Chromatic step.
6. Run `pnpm syncpack` — fix any version mismatches.
7. Run `pnpm typecheck` — fix any type errors.
8. Start the dev server with `pnpm dev-{domain}-storybook` and confirm it launches without errors.

## Prohibitions

- Never hardcode dependency versions — always read them from the reference storybook. Your general knowledge of Storybook and Rsbuild versions is wrong for this repo.
- Never skip the affected-detection entry (Step 5) — Chromatic CI will run the storybook on every PR regardless of changes, wasting build minutes.
- Never skip the Chromatic CI step (Step 6) — the storybook will not be tested in CI.
- Never skip the unified storybook integration (Step 4) — the domain's stories will be missing from the unified Storybook.
- Never invent a `projectId` in `chromatic.config.json` — remove it and let the user configure it after creating the Chromatic project.
