---
name: plantz-validate-modules
description: |
    [Plantz] Validate that all Squide federated modules conform to the expected structure.
    Use when asked to "validate modules", "check module structure", "verify modules",
    or after scaffolding a new module.
    Triggers: /plantz-validate-modules, "validate modules", "check modules", "verify module structure"
license: MIT
---

# Validate Modules

Verify that every `@modules/*` package conforms to the scaffold template and is correctly wired into the host, storybooks, and CI tooling.

## Discovery

1. Read `pnpm-workspace.yaml` to confirm workspace globs.
2. List all directories matching `apps/*/*/package.json` and filter to those whose `name` starts with `@modules/`.
3. For each module, extract `domain` and `module` from the directory path `apps/{domain}/{module}/`.

## Naming Derivation

All names are mechanically derived. **PascalCase** means split on `-`, capitalize each segment's first letter, join (e.g., `landing-page` → `LandingPage`).

| Name              | Formula                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Package name      | `@modules/{domain}-{module}`                                                  |
| Register function | `register` + PascalCase(domain) + PascalCase(module)                          |
| Page component    | PascalCase(module) + `Page` (skip `Page` if module already ends with `-page`) |
| Registry key      | `{domain}/{module}`                                                           |
| Route path        | `/{domain}/{module}`                                                          |
| `$id`             | `{domain}-{module}`                                                           |
| Dev script        | `dev-{domain}-{module}`                                                       |
| Domain storybook  | `@apps/{domain}-storybook`                                                    |

## Checks

For each discovered module, run every check below. Track results as a checklist.

### 1. File structure

Verify these files exist:

- `apps/{domain}/{module}/package.json`
- `apps/{domain}/{module}/tsconfig.json`
- `apps/{domain}/{module}/src/index.ts`
- `apps/{domain}/{module}/src/{registerFunction}.tsx`
- `apps/{domain}/{module}/src/{PageComponent}.tsx`

### 2. Package.json fields

Read the module's `package.json` and verify:

- `name` equals the derived package name
- `version` is `"0.0.0"`
- `private` is `true`
- `type` is `"module"`
- `exports` includes `"./src/index.ts"` (exact value or object with `.` key)
- `scripts` contains `"typecheck"` and `"oxlint"`

### 3. Barrel export

Read `src/index.ts` and verify it exports the register function by name.

### 4. Host registration

Read `apps/host/src/getActiveModules.tsx` and verify:

- The register function is imported from the package name
- The registry key `"{domain}/{module}"` is present in `ModuleRegistry`

Read `apps/host/package.json` and verify:

- The package name appears in `dependencies` with value `"workspace:*"`

### 5. Storybook globs

Read `apps/{domain}/storybook/.storybook/main.ts` and verify:

- The `stories` array contains a glob that resolves to the module's `src/**/*.stories.tsx`
- The glob path is relative to the domain storybook's `.storybook/` directory (typically `../../{module}/src/**/*.stories.tsx`)

Read `apps/storybook/.storybook/main.ts` and verify:

- The `stories` array contains a glob for this module (typically `../{domain}/{module}/src/**/*.stories.tsx`)

### 6. Affected detection

Read `tooling/getAffectedStorybooks.ts` and verify:

- The `StorybookDependencies` object has an entry for `@apps/{domain}-storybook`
- That entry's array includes the module's package name

### 7. Root dev script

Read root `package.json` and verify:

- `scripts` contains `"dev-{domain}-{module}"` with value `"cross-env MODULES={domain}/{module} pnpm dev-host"`

### 8. Story file existence

Verify at least one `.stories.tsx` file exists under `apps/{domain}/{module}/src/`.

## Report

After all checks, output a summary:

```
## Module Validation Report

### @modules/{domain}-{module}  ✓ / ✗

- [x] File structure complete
- [x] package.json fields correct
- [x] Barrel export present
- [x] Host registration wired
- [x] Domain storybook glob present
- [x] Unified storybook glob present
- [x] Affected detection entry present
- [x] Root dev script present
- [x] Story file exists
```

Use `[x]` for passing checks, `[ ]` for failures. For each failure, include a one-line description of what's wrong and how to fix it.

## Prohibitions

- Never modify any files — this skill is read-only validation.
- Never skip a module — validate every `@modules/*` package found in the workspace.
- Never assume a check passes without reading the actual file content.
