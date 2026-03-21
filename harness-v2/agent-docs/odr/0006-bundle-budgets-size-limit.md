# ODR-0006: Bundle Budgets via size-limit

## Status

accepted

## Context

As the app grows with more Squide modules, shared packages, and dependencies, bundle sizes will creep upward without a measurable gate. Agents adding dependencies or refactoring code have no automated signal telling them they regressed payload size. Instructions alone ("keep bundles small") are insufficient — agents rationalize past guidance but respond to hard pass/fail signals.

## Options Considered

1. **size-limit with per-app budgets enforced in CI** — Measures gzipped output size against checked-in budgets. Produces a pass/fail signal. Budget changes appear in PR diffs, making size increases visible and reviewable.
2. **Lighthouse CI performance budgets** — Measures runtime performance metrics (LCP, TBT, CLS). Powerful but noisy in CI (scores vary 5-10 points between runs) and requires serving the full app with mocked APIs.
3. **Rsbuild bundle analysis** — Built-in reporting, but produces informational output only — no gates, no budgets, no pass/fail.
4. **Manual review** — Rely on code review to spot bundle regressions. Error-prone — reviewers cannot calculate bundle impact from reading code.

## Decision

Use size-limit with per-app budgets enforced in CI (Option 1). Each deployable app defines budgets in a `.size-limit.json` file. CI runs `pnpm sizecheck` after the build step and fails if any budget is exceeded.

## Consequences

Configuration lives in each app's `.size-limit.json` (e.g., `apps/host/.size-limit.json`). Dependencies (`size-limit`, `@size-limit/file`) are installed in the app's own `package.json`, not the root. The root `package.json` provides `pnpm sizecheck` as the entry point.
