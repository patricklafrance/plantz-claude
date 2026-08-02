# ODR-0007: Lighthouse CI as a Runtime Performance Gate

## Status

proposed

## Context

[ODR-0006](0006-bundle-budgets-size-limit.md) added size-limit as a payload-size gate and listed Lighthouse CI as a rejected option, on the grounds that its scores are noisy in CI. Payload size alone does not catch runtime regressions — render-blocking resources, layout thrash, or an expensive bootstrap can degrade the host app without changing gzipped bundle size.

Lighthouse CI has since been adopted alongside size-limit (`.github/workflows/lighthouse.yml`, `lighthouserc.json`), so the repository's operational record needed a decision that reflects what is actually running.

## Options Considered

1. **Lighthouse CI with a low absolute threshold and median aggregation** — Run Lighthouse against the built static output on every PR and push to `main`. Take 3 runs and assert on the median to absorb per-run variance, and set the failure threshold low enough (0.5) that only gross regressions fail. Restrict to the `performance` category so accessibility and SEO audits do not produce unrelated failures.
2. **Lighthouse CI with a strict threshold (e.g. 0.9)** — Higher signal, but run-to-run variance on shared GitHub runners produces false failures that train agents and reviewers to ignore the check.
3. **No runtime performance gate** — Rely on size-limit only. Cheapest, but leaves an entire class of regressions unmeasured.

## Decision

Use Lighthouse CI with a low absolute threshold and median aggregation (Option 1). It complements rather than replaces size-limit: size-limit gates payload, Lighthouse gates runtime performance. The low threshold is deliberate — the gate exists to catch gross regressions, not to police score deltas, which keeps it usable despite CI noise. This revisits option 2 of ODR-0006; that ODR's size-limit decision still stands.

## Consequences

- Configuration lives in `lighthouserc.json` at the repo root: performance category only, 3 runs, median aggregation, `error` below a 0.5 score, collected from `apps/host/dist` in single-page-application mode.
- `lighthouse.yml` runs a full unfiltered `pnpm build-host` on every PR and push to `main` — unlike `ci.yml`, it does not skip the build when the host is unaffected.
- Reports upload to Chromatic-independent temporary public storage and as workflow artifacts; there is no historical score database, so trends are not tracked across runs.
- Two independent gates now govern the host app's performance budget. A PR that regresses payload size fails `ci.yml`; one that regresses runtime performance fails `lighthouse.yml`.

See [references/ci-cd.md](../references/ci-cd.md) for the workflow's place in the CI topology and [references/bundle-size-budget.md](../references/bundle-size-budget.md) for the size-limit budget policy.
