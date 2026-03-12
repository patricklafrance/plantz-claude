# Tailwind CSS / PostCSS

Tailwind v4 is integrated via `@tailwindcss/postcss`. The host app and library packages use an Rsbuild/Rslib config transformer. Storybooks use a plain `vite.config.ts`.

### Host app & library packages (Rsbuild/Rslib)

```ts
const tailwindPostCss: RsbuildConfigTransformer = (config) => {
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

### Storybooks (Vite)

Domain and packages Storybooks use `vite.config.ts` with `@tailwindcss/postcss` as a PostCSS plugin:

```ts
import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "vite";

export default defineConfig({
    css: {
        postcss: {
            plugins: [tailwindcss()],
        },
    },
});
```

No `@workleap/rsbuild-configs` or `defineStorybookConfig` is needed for Storybooks.

## Cross-package class scanning

The `@import "tailwindcss"` directive lives inside `packages/components/src/styles/globals.css`. Consuming apps import it transitively via `@import "@packages/components/globals.css"` — they must **not** add a separate `@import "tailwindcss"` line.

Consuming apps also use `@source` directives to tell Tailwind where to find utility classes in workspace packages:

```css
@import "@packages/components/globals.css";

@source "../../../../packages/components/src/**/*.{ts,tsx}";
@source "../../../../packages/plants-core/src/**/*.{ts,tsx}";
```

If you add a new workspace package whose components are rendered in the host app, add a corresponding `@source` directive in `apps/host/src/styles/globals.css`. Domain-module source paths (e.g., `management/plants`, `today/landing-page`) also need their own `@source` entries there.
