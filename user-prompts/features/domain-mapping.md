# Domain Mapping — Add Plant Care History and Insights

PRD: `user-prompts/features/ADD_PLANT_CARE_HISTORY_AND_INSIGHTS.md`
Date: 2026-03-22

---

## 1. Feature Terms Extracted from PRD

| Term               | PRD definition                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Care event         | An action performed on a plant (watered, skipped, delegated). Has id, plantId, eventType, eventDate, notes. |
| Care history       | The full ordered log of past care events for a plant.                                                       |
| Care timeline      | Chronological rendering of care events — when did I last water? how often?                                  |
| Care insight       | A derived metric computed from the history (avg interval, streak, consistency score, missed count).         |
| Event type         | Enumerated values: watered, skipped, delegated.                                                             |
| Plant details page | The per-plant detail view that should host the history section and insights section.                        |
| History section    | Sub-view within the plant details page showing the care timeline.                                           |
| Insights section   | Sub-view within the plant details page showing computed care metrics.                                       |
| Record care event  | The act of persisting an event when a watering task completes (or is skipped/delegated).                    |
| Manual event entry | A future-compatible ability to add events with a backdated date.                                            |

---

## 2. Convergence Table

### Concern A — Care Event types, schema, insight calculation utilities

| Heuristic          | Signal                                                                                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language alignment | "Care event", "CareInsight", event types (watered/skipped/delegated), `computeCareInsights`, `computeWateringStreak` — all of these terms already exist verbatim in `@packages/core-plants/care-event` (`careEventTypes.ts`, `careEventUtils.ts`). Same term, same meaning. |
| CCP                | Changing `CareEvent` shape or insight formulas would already force changes to `@packages/core-plants/care-event`. No new change coupling is introduced.                                                                                                                     |
| Stability boundary | Already a shared package. Two modules (`management/plants` and `today/landing-page`) already consume it.                                                                                                                                                                    |

**Verdict: No change needed. `@packages/core-plants/care-event` already owns this concern completely.**

---

### Concern B — Care History Timeline and Insights UI (display-only components)

| Heuristic          | Signal                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language alignment | `CareHistoryTimeline` and `CareInsightsSummary` already exist — `CareHistoryTimeline` is in `today/landing-page/src/`, `CareInsightsSummary` is in `@packages/core-plants/src/`. Same terms, same meaning.                                                                                                                                                 |
| CCP                | The PRD adds care history to the **plant details page**. In `management/plants` the plant detail UI is the `EditPlantDialog`. In `today/landing-page` the equivalent is `PlantDetailDialog` + `PlantCareSection` (which already wires `CareHistoryTimeline` + `CareInsightsSummary`). Changes to these components cascade within their respective modules. |
| Stability boundary | `CareInsightsSummary` is already in `@packages/core-plants` (stable, shared). `CareHistoryTimeline` lives in `today/landing-page` (module-local).                                                                                                                                                                                                          |

**Verdict:** The shared presentational layer (`CareInsightsSummary`, `CareEventBadge`) is already in `@packages/core-plants` and needs no promotion. `CareHistoryTimeline` is already built in `today/landing-page` and can be reused by promoting to `@packages/core-plants` only **if** `management/plants` needs to render the same component — see Decision D2 below.

---

### Concern C — Fetching and displaying care events in `management/plants`

| Heuristic          | Signal                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language alignment | "View plant history", "view care timeline", "history section on the plant details page" — the plant details page in `management` is the `EditPlantDialog`. Extending an existing dialog/route. |
| CCP                | Adding a care history section to `EditPlantDialog` forces changes only within `management/plants`.                                                                                             |
| Route proximity    | Lives entirely within `/management/plants` — no new route, no new top-level navigation.                                                                                                        |
| Lifecycle cohesion | The same dialog already has the "Mark as Watered" button that records care events. History display is the natural complement of that mutation.                                                 |

**Verdict: Extend `management/plants`.** Add a care history + insights section to `EditPlantDialog`, backed by a `useCareEvents` hook (scoped to `/api/management/care-events`) — a direct parallel to the existing hook in `today/landing-page`.

---

### Concern D — Fetching and displaying care events in `today/landing-page`

| Heuristic          | Signal                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Language alignment | All relevant terms (`PlantCareSection`, `CareHistoryTimeline`, `useCareEvents`, `PlantDetailDialog.careSection`) already exist in `today/landing-page`.                                                                                                |
| CCP                | The PRD goal is already fully realized in `today/landing-page`: `PlantDetailDialog` accepts a `careSection` slot, `PlantCareSection` renders `CareInsightsSummary` + `CareHistoryTimeline`, and `useCareEvents` fetches from `/api/today/care-events`. |
| Route proximity    | `/today` — same route.                                                                                                                                                                                                                                 |

**Verdict: No new work needed in `today/landing-page`.** The feature is already implemented there. The delta is surface extension in `management/plants` only.

---

### Concern E — MSW handler for `GET /api/management/care-events`

| Heuristic          | Signal                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Language alignment | Follows the BFF-per-module pattern. Each module owns its API surface under `/api/<domain>/`.                                                                                                                       |
| CCP                | `management/plants` already owns and registers `managementCareEventHandlers` at `/api/management/care-events` (POST, bulk POST). The GET endpoint for listing by plantId already exists in that same handler file. |

**Verdict: No new handler work needed.** `GET /api/management/care-events?plantId=` is already implemented in `apps/management/plants/src/mocks/careEventHandlers.ts`. The `management/plants` module just needs to call it from a new `useCareEvents` hook.

---

## 3. Feature-to-Module Mapping

| PRD Feature / Concern                                                | Target module                             | Action                                                                                     |
| -------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Care event types, schema, insight computation                        | `@packages/core-plants/care-event`        | No change — already complete                                                               |
| `CareInsightsSummary` component (presentational)                     | `@packages/core-plants`                   | No change — already exists and is exported                                                 |
| `CareEventBadge` component (presentational)                          | `@packages/core-plants`                   | No change — already exists and is exported                                                 |
| `CareHistoryTimeline` component                                      | `today/landing-page` → consider promotion | See D2 below                                                                               |
| Care history + insights section in plant details (today domain)      | `today/landing-page`                      | No change — already fully implemented                                                      |
| Care history + insights section in plant details (management domain) | `management/plants`                       | Extend — add `useCareEvents` hook + care history/insights section to `EditPlantDialog`     |
| `GET /api/management/care-events` MSW handler                        | `management/plants`                       | No change — handler already registered                                                     |
| Recording care events when watering (management domain)              | `management/plants`                       | No change — `createCareEvent` + `createBulkCareEvents` already called on "Mark as Watered" |
| Recording care events when watering (today domain)                   | `today/landing-page`                      | No change — already implemented                                                            |

---

## 4. Decisions

### D1 — Do not create a new module

**Decision:** All PRD requirements land in existing modules. No new module is warranted.

**Justification:**

- No new top-level route is introduced. The history and insights surface is a sub-view within the existing plant details dialog at `/management/plants` and the existing detail panel at `/today`.
- The feature does not introduce an independent API namespace. `management/plants` already owns `/api/management/care-events` and `today/landing-page` already owns `/api/today/care-events`.
- The shared domain types and computation utilities already live in `@packages/core-plants/care-event` — no new shared package is required.
- Splitting care history into its own module would produce a module with no route of its own and no independent data namespace — exactly the pattern the granularity criteria forbid.

---

### D2 — Promote `CareHistoryTimeline` to `@packages/core-plants` when `management/plants` needs it

**Decision:** When implementing the care history section in `EditPlantDialog`, move `CareHistoryTimeline` from `apps/today/landing-page/src/CareHistoryTimeline.tsx` to `@packages/core-plants` (alongside `CareInsightsSummary`) and export it from the package root index.

**Justification:**

- Two modules — `management/plants` and `today/landing-page` — will now both render the same care timeline component.
- The package-promotion rule is explicit: "Move it to a shared package when two or more modules need the same type, utility, or component and the shared surface is non-trivial."
- `CareHistoryTimeline` is stateless and domain-typed (uses `CareEvent[]`) — it belongs in `@packages/core-plants` alongside `CareInsightsSummary` and `CareEventBadge`, which are already there.
- Modules must never import from each other, so duplication is the only alternative — but the surface is non-trivial enough that promotion is the right call.

---

### D3 — Add `useCareEvents` hook local to `management/plants`

**Decision:** Add a `useCareEvents(plantId)` hook to `apps/management/plants/src/` that fetches from `/api/management/care-events?plantId=`. Do not share this hook with `today/landing-page`.

**Justification:**

- Both modules already have their own `careEventsApi.ts` (`fetchCareEvents` calls different domain-scoped URLs). The BFF-per-module pattern requires each module to shape its own data.
- The hook in `today/landing-page` uses query key `["today", "care-events", plantId]`; the management version should use `["management", "care-events", plantId]`.
- This is a small surface (one `useQuery` call) — duplication is preferred over a shared hook that couples two modules to the same query key or API path.

---

### D4 — No changes to `today/landing-page`

**Decision:** Do not modify `today/landing-page` as part of this PRD implementation.

**Justification:** Every PRD requirement that maps to the today domain is already fully implemented: `PlantDetailDialog` exposes a `careSection` slot, `PlantCareSection` renders insights + history, `useCareEvents` fetches from `/api/today/care-events`, and recording events on watering/skip/delegate is wired through the landing page's action handlers.

---

## 5. Implementation Checklist

The following steps fully implement the PRD within the established module boundaries:

1. **Promote `CareHistoryTimeline`** — Move from `apps/today/landing-page/src/CareHistoryTimeline.tsx` to `packages/core-plants/src/CareHistoryTimeline.tsx`. Export from `packages/core-plants/src/index.ts`. Update the import in `today/landing-page/src/PlantCareSection.tsx`.

2. **Add `useCareEvents` to `management/plants`** — Create `apps/management/plants/src/useCareEvents.ts` using `useQuery` with key `["management", "care-events", plantId]` calling `fetchCareEvents` from `careEventsApi.ts` (which already has a `GET` variant — add `fetchCareEvents` if not present, or verify the existing file covers it).

3. **Extend `EditPlantDialog`** — Add a care history + insights section below the plant fields: render `CareInsightsSummary` (from `@packages/core-plants`) and `CareHistoryTimeline` (from `@packages/core-plants` after promotion), both fed by `useCareEvents`.

4. **Stories** — Add stories for the extended `EditPlantDialog` state (with care history populated, with empty history). `CareHistoryTimeline` stories currently live in `today/landing-page`; after promotion, add a `CareHistoryTimeline.stories.tsx` to `packages/core-plants/src/`.
