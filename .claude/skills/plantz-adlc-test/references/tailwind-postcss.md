<\!-- Canonical source: plantz-sdlc-plan. Keep in sync with plantz-sdlc-code, plantz-sdlc-test. -->

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

Consuming apps use `@source` directives in their CSS to tell Tailwind where to find utility classes used in `@packages/components`:

```css
@import "tailwindcss";
@import "@packages/components/globals.css";
@source "../../../../packages/components/src/**/*.{ts,tsx}";
```

If you add new source directories under `packages/components/src/`, add a corresponding `@source` directive in consuming apps.
