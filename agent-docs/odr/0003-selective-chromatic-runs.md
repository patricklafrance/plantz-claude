# ODR-0003: Selective Chromatic Runs with Affected-Storybook Detection

## Status

proposed

## Context

Running all three Storybooks through Chromatic on every PR wastes snapshots and money. Most PRs only affect one domain. A mechanism is needed to skip unaffected Storybooks while still catching all visual regressions.

## Options Considered

1. **Custom affected-detection + label gating** — A script (`tooling/getAffectedStorybooks.ts`) uses Turborepo's dependency graph to determine which Storybooks are affected by the changeset. PRs additionally require the `run chromatic` label to trigger the workflow. Combined with Chromatic's `onlyChanged` flag for further snapshot reduction.
2. **Chromatic TurboSnap only** — Rely solely on Chromatic's built-in TurboSnap to reduce snapshots. Does not skip entire unaffected Storybook builds — all three Storybooks still build and upload.
3. **Run all Storybooks always** — Simplest approach. Guarantees no regressions are missed but wastes snapshots and build time.

## Decision

Combine custom affected-detection with label gating and Chromatic's `onlyChanged` (Option 1). This minimizes both build time and snapshot costs while maintaining regression coverage.

## Consequences

- PRs require the `run chromatic` label to trigger visual regression testing. The label is auto-removed after the workflow completes.
- `tooling/getAffectedStorybooks.ts` must be maintained when Storybook packages are added or renamed.
- Each Chromatic step uses `skip` to bypass unaffected Storybooks based on the script's outputs.
- On push to `main`, `autoAcceptChanges` is enabled — changes are auto-accepted as the new baseline.
- If the affected-detection script fails, all Storybooks should run as a fallback.
