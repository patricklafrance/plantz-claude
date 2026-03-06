# Build Tooling Reference

## Turborepo

Configuration in `turbo.json`. UI mode: `tui`.

### Task definitions

| Task | dependsOn | Inputs | Outputs | Notes |
|---|---|---|---|---|
| `transit` | `^transit` | — | — | Dependency graph propagation |
| `dev` | — | — | — | Persistent, no cache |
| `build` | `^build` | `$TURBO_DEFAULT$`, `!README.md` | `dist/**` | env: `MODULES` |
| `build-storybook` | — | — | — | No cache |
| `serve-build` | `build` | — | — | Persistent, no cache |
| `serve-storybook` | `build-storybook` | — | — | Persistent, no cache |
| `lint` | `typecheck`, `//#typecheck`, `//#syncpack` | — | — | Orchestrator task |
| `//#typecheck` | — | `src/**/*.ts(x)`, `test/**/*.ts(x)`, `tsconfig.json`, `!apps`, `!packages`, `!agent-docs` | `node_modules/.cache/tsbuildinfo.json` | Root-level |
| `typecheck` | `transit` | `src/**/*.ts(x)`, `test/**/*.ts(x)`, `tsconfig.json`, `tsconfig.build.json` | `node_modules/.cache/tsbuildinfo.json` | Per-package |
| `//#syncpack` | — | `.syncpackrc.js`, `**/package.json` | — | Root-level |
| `test` | `transit` | — | `node_modules/.cache/vitest/**` | Per-package |

### Conventions

- `$TURBO_DEFAULT$` — Turborepo's default input heuristic (all tracked files minus outputs).
- Root-level tasks use `//#taskname` syntax.
- `MODULES` is declared as task-level `env` on the `build` task (not `globalEnv`), scoping cache invalidation to build only.
- `transit` is a dependency graph propagation task that runs before typecheck/test.
- `dev` has no `^dev` dependency because packages are JIT — consumers compile package source directly, so no dependency build step is needed before starting a dev server. See [ODR-0004](../odr/0004-jit-packages.md).
- ESLint/Stylelint tasks are commented out; OXlint/OXfmt adoption is planned instead.

## Syncpack

Configuration in `.syncpackrc.js`.

### Semver groups

| Packages | Dependency types | Range | Policy |
|---|---|---|---|
| `@modules/*`, `@packages/*` | prod, peer | `^` | Caret for flexibility |
| `@modules/*`, `@packages/*` | dev | (pinned) | Pin devDependencies |
| `@apps/*` | prod, dev | (pinned) | Pin everything |
| `workspace-root` | dev | (pinned) | Pin devDependencies |

### Version groups

All packages must converge on a single version per dependency (`highestSemver` strategy).

## TypeScript

Root `tsconfig.json` extends `@workleap/typescript-configs/monorepo-workspace.json` with incremental builds enabled (`tsBuildInfoFile` in `node_modules/.cache/`).

Type checking runs via `tsgo` (native TypeScript compiler).

## Tailwind CSS / PostCSS

Tailwind v4 is integrated via `@tailwindcss/postcss`. Both library packages (`@packages/components`) and app packages (`@apps/host`) add it through a config transformer:

```ts
const tailwindPostCss: RsbuildConfigTransformer = config => {
    config.tools ??= {};
    config.tools.postcss ??= {};
    const postcss = config.tools.postcss as Record<string, unknown>;
    postcss.postcssOptions ??= {};
    const postcssOptions = postcss.postcssOptions as Record<string, unknown>;
    postcssOptions.plugins ??= [];
    (postcssOptions.plugins as unknown[]).push(["@tailwindcss/postcss", {}]);
    return config;
};
```

For Rslib (library) configs, import `RslibConfigTransformer` from `@workleap/rslib-configs`. For Rsbuild (app) configs, import `RsbuildConfigTransformer` from `@workleap/rsbuild-configs`.

### Cross-package class scanning

Consuming apps use `@source` directives in their CSS to tell Tailwind where to find utility classes used in `@packages/components`:

```css
@import "tailwindcss";
@import "@packages/components/globals.css";
@source "../../../../packages/components/src/**/*.{ts,tsx}";
```

### Adding shadcn components

Run `pnpm dlx shadcn@latest add <component>` from within `packages/components/`. After adding, move files from the `@/` directory to `src/` and replace `@/lib/utils` imports with relative paths (e.g., `../../lib/utils.ts`), because the project uses `moduleResolution: "nodenext"` which requires explicit extensions.

---
*See [CLAUDE.md](../../CLAUDE.md) for navigation.*
