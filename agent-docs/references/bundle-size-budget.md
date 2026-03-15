# Bundle Size Budget Policy

Standing rules for agents managing size-limit budgets. The decision to use size-limit is recorded in [ODR-0006](../odr/0006-bundle-budgets-size-limit.md).

## When size-limit fails

1. **Never increase a budget as a first response.** Optimize first: narrow imports, switch to lighter alternatives, lazy-load heavy components, remove dead code.
2. **Re-run after each optimization.** If the check passes, stop.
3. **Increase a budget only when** the PR adds genuine new functionality and optimizations have been applied.
4. **Never increase a budget for** refactors, test utilities, or dev-only code — those must not affect production bundles.
5. **Never increase a single app's budget by more than 20 KB gzipped in one PR.** If more is needed, flag it for human review in the PR description.
6. **When increasing a budget**, include a `## Budget increase` section in the PR description explaining: which app, how much, and why.
7. **Never split a large increase across multiple PRs** to stay under the 20 KB threshold.

## Adding budgets for new apps

When a new deployable app is created, add `size-limit`, `@size-limit/file` to its devDependencies, create a `.size-limit.json` with initial budgets based on the first build output + 20% headroom, and add a `"size": "size-limit"` script.

---

_See [CLAUDE.md](../../CLAUDE.md) for navigation._
