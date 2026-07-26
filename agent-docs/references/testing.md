# Testing

`pnpm test` runs `turbo run test`. There are no standalone unit test files in this repo — **stories are the tests**. Every `test` task is a Storybook runner that renders each story in a real browser and asserts accessibility.

## What runs

Three packages define a `test` task — the same three Storybooks that Chromatic snapshots:

| Package                     | Path                        |
| --------------------------- | --------------------------- |
| `@apps/management-storybook` | `apps/management/storybook` |
| `@apps/today-storybook`      | `apps/today/storybook`      |
| `@apps/packages-storybook`   | `packages/storybook`        |

The unified Storybook (`apps/storybook`) has no `test` task — it only aggregates stories for local browsing. Adding a story to a module covers it automatically through that module's domain Storybook; there is no separate test file to write.

Each package runs its suite twice, sequentially: `test:light`, then `test:dark` (`cross-env STORYBOOK_THEME=dark vitest run`). The theme is read by `preview.tsx` via `import.meta.env.STORYBOOK_THEME` and applied with `withThemeByClassName`. A story that renders correctly in light mode but fails accessibility in dark mode fails the suite — see [color-mode.md](color-mode.md).

## How it works

Each Storybook has a `vitest.config.ts` using the `storybookTest` plugin from `@storybook/addon-vitest`, running in Vitest browser mode against headless Chromium via `@vitest/browser-playwright`. `.storybook/vitest.setup.ts` registers `@storybook/addon-a11y/preview` alongside the Storybook preview annotations.

Accessibility failures are errors, not warnings: `preview.tsx` sets `parameters: { a11y: { test: "error" } }`. Never downgrade that parameter or add per-story a11y skips to make a suite pass — fix the markup instead.

## Playwright browser install

The `test` turbo task depends on the root-level `//#install-playwright` task, which runs `scripts/install-playwright.ts`. That script finds the first Storybook workspace with Playwright and installs Chromium from it — all Storybooks share one Playwright version, so a single install serves every suite. Never add a per-package Playwright install step; it re-downloads the same browser.

## CI

`ci.yml` runs the suite as its "Test packages" step. On pull requests it filters to packages diverging from the PR base SHA; on pushes to `main` it runs `pnpm test` for everything. Read `.github/workflows/ci.yml` for the exact invocation — see [ci-cd.md](ci-cd.md).

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
