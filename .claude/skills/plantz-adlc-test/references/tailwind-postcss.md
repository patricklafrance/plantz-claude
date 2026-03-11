<\!-- Canonical source: plantz-adlc-plan. Keep in sync with plantz-adlc-code, plantz-adlc-test. -->

# Tailwind CSS / PostCSS

Tailwind v4 is integrated via `@tailwindcss/postcss`. Both library packages (`@packages/components`) and app packages (`@apps/host`) add it through a config transformer:

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

## Cross-package class scanning

The `@import "tailwindcss"` directive lives inside `packages/components/src/styles/globals.css`. Consuming apps import it transitively via `@import "@packages/components/globals.css"` — they must **not** add a separate `@import "tailwindcss"` line.

Consuming apps also use `@source` directives to tell Tailwind where to find utility classes in workspace packages:

```css
@import "@packages/components/globals.css";

@source "../../../../packages/components/src/**/*.{ts,tsx}";
@source "../../../../packages/plants-core/src/**/*.{ts,tsx}";
```

If you add a new workspace package whose components are rendered in the host app, add a corresponding `@source` directive in `apps/host/src/styles/globals.css`. Domain-module source paths (e.g., `management/plants`, `today/landing-page`) also need their own `@source` entries there.
