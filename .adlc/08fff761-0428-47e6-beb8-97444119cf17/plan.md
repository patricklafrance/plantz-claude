# Plan: Plant Care History and Insights

## Objective

Add care event tracking and insights to the plant detail view, allowing users to review past watering/skipping/delegating activity and understand their care patterns through derived metrics.

## Affected packages

- `@packages/core-plants` (`packages/core-plants/`) — new care event types, schema, insight computation utilities, presentational components
- `@modules/today-landing-page` (`apps/today/landing-page/`) — care history timeline UI, insights panel, event recording on watering actions, MSW handlers, module-local care events DB

## Scaffolding required

None. The feature adds to the existing `today/landing-page` module and the existing `@packages/core-plants` package. No new module or storybook scaffolding needed.

## File changes

### `@packages/core-plants`

1. **Create `src/care-event/careEventTypes.ts`** — Care event type definitions: `CareEventType` (`"watered" | "skipped" | "delegated"`), `CareEvent` interface (id, plantId, eventType, eventDate, notes, metadata), `CareInsight` interface (lastWateredDate, averageWateringIntervalDays, wateringStreak, missedWateringCount, consistencyScore).

2. **Create `src/care-event/careEventSchema.ts`** — Zod schema for `CareEvent` with `z.coerce.date()` for date fields (matching the `plantSchema` pattern). Export `careEventSchema`.

3. **Create `src/care-event/careEventUtils.ts`** — Pure functions to derive insights from an array of `CareEvent[]`: `computeCareInsights(events: CareEvent[]): CareInsight | null`, `getLastWateredDate(events)`, `computeAverageInterval(events)`, `computeWateringStreak(events)`, `countMissedWaterings(events, expectedFrequencyDays)`. Handle edge cases: empty array returns null, single event (streak = 1, no interval), sparse data.

4. **Create `src/care-event/index.ts`** — Barrel export for the care-event subpath. Exports types, schema, and utility functions.

5. **Modify `package.json`** — Add `"./care-event"` subpath export: `"./care-event": "./src/care-event/index.ts"`.

6. **Create `src/CareEventBadge.tsx`** — Small presentational component rendering a colored badge for each event type (watered = green, skipped = amber, delegated = blue). Uses `Badge` from `@packages/components`. reference: `src/PlantListItem.tsx` for component patterns.

7. **Create `src/CareEventBadge.stories.tsx`** — Stories for each event type badge variant. Title: `Packages/CorePlants/Components/CareEventBadge`. Variants: `Watered`, `Skipped`, `Delegated`.

8. **Create `src/CareInsightsSummary.tsx`** — Presentational component displaying insight metrics: last watered date, average interval, watering streak, missed count, consistency score. Accepts `CareInsight | null` prop. Shows empty state when null. Uses semantic text classes, `text-muted-foreground` for labels.

9. **Create `src/CareInsightsSummary.stories.tsx`** — Stories for insights summary. Title: `Packages/CorePlants/Components/CareInsightsSummary`. Variants: `Default` (with data), `NoHistory` (null insights), `HighConsistency`, `LowConsistency`, `SingleEvent`.

10. **Modify `src/index.ts`** — Export `CareEventBadge` and `CareInsightsSummary`.

### `@modules/today-landing-page` (`apps/today/landing-page/`)

11. **Create `src/mocks/careEventsDb.ts`** — Module-local in-memory care events store following the vacation planner pattern (`src/mocks/vacationDb.ts` in `today/vacation-planner`). Plain object with methods: `getAllByPlant(plantId): CareEvent[]` (filtered and sorted by date descending), `insert(event): CareEvent`, `getAll(): CareEvent[]`, `reset(events): void`. Uses a `Map<string, CareEvent>` keyed by event ID. Export `careEventsDb`. NOT in `@packages/core-plants` — only this module needs it for now; promote later per package promotion convention if another module needs it.

12. **Create `src/mocks/seedCareEvents.ts`** — Generate deterministic seed care events for the seed plants. Use fixed absolute dates (e.g., dates in 2024-2025) rather than relative "last 90 days" — relative dates cause non-deterministic snapshots. Produce a realistic mix of watered/skipped/delegated events for a subset of seed plants (~20 plants, ~5-15 events each). Export `defaultSeedCareEvents`. Import plant IDs from `defaultSeedPlants` via `@packages/core-plants/db`.

13. **Create `src/mocks/careEventHandlers.ts`** — MSW handlers for care event endpoints: `GET /api/today/care-events?plantId=` (list events for a plant, filtered by query param), `POST /api/today/care-events` (create a new event, server generates id). Scoped to `/api/today/care-events`. Uses local `careEventsDb` from `./careEventsDb.ts` and `getUserId` from `@packages/core-module/db`. reference: `src/mocks/handlers.ts`

14. **Create `src/mocks/createCareEventHandlers.ts`** — Factory function `createCareEventHandlers(data: CareEvent[] | "loading" | "error")` for story-level MSW handler overrides. Returns handlers for `GET /api/today/care-events` and `POST /api/today/care-events`. Follows the pattern of existing `createHandlers.ts` (which creates `createTodayPlantHandlers`). reference: `src/mocks/createHandlers.ts`

15. **Modify `src/mocks/index.ts`** — Add exports: `todayCareEventHandlers` from `./careEventHandlers.ts`, `createCareEventHandlers` from `./createCareEventHandlers.ts`, `defaultSeedCareEvents` from `./seedCareEvents.ts`. Keep `todayPlantHandlers` and `createTodayPlantHandlers` exports unchanged.

16. **Create `src/careEventsApi.ts`** — API client functions: `fetchCareEvents(plantId): Promise<CareEvent[]>`, `createCareEvent(event): Promise<CareEvent>`. Uses `getAuthHeaders()` from `@packages/core-module`. Parses responses through `careEventSchema` from `@packages/core-plants/care-event`.

17. **Create `src/useCareEvents.ts`** — React hook `useCareEvents(plantId: string | null)` using `useQuery` from TanStack Query to fetch care events for a plant. Returns `{ events, isLoading, error }`. Query is disabled when plantId is null. Query key: `["today", "care-events", plantId]`.

18. **Create `src/CareHistoryTimeline.tsx`** — Presentational timeline component showing care events in reverse chronological order (most recent first). Each entry shows: event type badge (via `CareEventBadge` from `@packages/core-plants`), date (formatted with date-fns), optional notes. Groups events by day when multiple events occur on the same day. Shows "No care history yet" empty state. Accepts `events: CareEvent[]` prop.

19. **Create `src/CareHistoryTimeline.stories.tsx`** — Stories for timeline. Title: `Today/LandingPage/Components/CareHistoryTimeline`. Variants: `Default` (mixed events), `Empty` (no events), `SingleEvent`, `MultipleEventsPerDay`, `LongHistory` (many events to test scroll). Purely presentational — no decorators or MSW needed; pass `events` prop directly with `makeCareEvent()` factories.

20. **Create `src/PlantCareSection.tsx`** — Container component that accepts `plantId: string` prop, calls `useCareEvents(plantId)` to fetch care events, computes insights using `computeCareInsights` from `@packages/core-plants/care-event`, and renders both `CareInsightsSummary` and `CareHistoryTimeline`. Shows loading state while fetching. This is the only stateful component for care events — it encapsulates the data fetching so that `PlantDetailDialog` remains presentational.

21. **Create `src/PlantCareSection.stories.tsx`** — Stories for the care section. Title: `Today/LandingPage/Components/PlantCareSection`. Variants: `WithHistory`, `NoHistory`, `SingleWatering`, `Loading`. Uses per-story MSW handlers via `createCareEventHandlers()`. Needs `QueryClientProvider` — create a lightweight `queryClientDecorator` inline (just wraps in `QueryClientProvider` with `{ retry: false, staleTime: Infinity }`). Also needs `fireflyDecorator`. Does NOT need `collectionDecorator` — care events use `useQuery` directly, not the plants TanStack DB collection.

22. **Modify `src/PlantDetailDialog.tsx`** — Keep the dialog presentational. Add an optional `careSection` prop of type `ReactNode`. Render it below the existing plant details, before the footer. The parent (`LandingPage.tsx`) will pass `<PlantCareSection plantId={plant.id} />` as the `careSection` prop when a plant is selected. Also add a "Mark as Watered" button in the `DialogFooter` via an `onMarkWatered` callback prop. The button uses `Button` from `@packages/components` with a water droplet icon from `lucide-react`.

23. **Modify `src/LandingPage.tsx`** — Import `PlantCareSection` and `createCareEvent` from local files. Pass `<PlantCareSection plantId={detailPlant.id} />` as the `careSection` prop to `PlantDetailDialog`. Pass an `onMarkWatered` handler that calls `createCareEvent` and invalidates the `["today", "care-events", plantId]` query. Import `useQueryClient` from `@tanstack/react-query` for query invalidation.

24. **Modify `src/PlantDetailDialog.stories.tsx`** — The dialog remains presentational, so existing stories (Default, MinimalFields, LongValues) need NO decorators or MSW changes. Add new stories: `WithCareSection` (pass a static mock `careSection` node showing the care UI), `WithMarkWatered` (pass an `onMarkWatered` action). For full integration testing with real data fetching, the `PlantCareSection.stories.tsx` covers that.

25. **Modify `src/registerTodayLandingPage.tsx`** — Import and register `todayCareEventHandlers` alongside existing `todayPlantHandlers`. Import `defaultSeedCareEvents` and `careEventsDb` from the local mocks, and seed the DB during MSW initialization: `careEventsDb.reset(defaultSeedCareEvents)`.

### Host app wiring (no changes needed)

The host already registers `today/landing-page`. No new module registration required. No new `@source` directives needed since the module path is already covered.

## New dependencies

None. All needed packages (`@tanstack/react-query`, `date-fns`, `zod`, `msw`, `lucide-react`) are already available in the relevant workspaces.

## Decisions

1. **Keep in existing `today/landing-page` module, not a new module.** The feature adds sub-views to the existing plant detail dialog, not a new route. It shares the same data surface (plants). Creating a separate module would violate the granularity guideline ("prefer adding to an existing module when it shares the same collection and API surface"). Rejected: creating `today/care-history` as a separate module.

2. **Use TanStack Query (not TanStack DB collection) for care events.** Care events are read-only from the UI perspective (created as side effects of watering actions, not via CRUD). A full TanStack DB collection with optimistic mutations is unnecessary. A simple `useQuery` hook is simpler and avoids the overhead of a collection + context. Rejected: creating a `CareEventsCollection` with TanStack DB.

3. **Place care event types, schema, and utility functions in `@packages/core-plants/care-event`, but keep the DB local to the module.** Types and utilities are plant-domain code that other modules may need later (e.g., management showing care history). The `./care-event` subpath export keeps it cleanly separated. However, the in-memory DB (`careEventsDb`) stays in `src/mocks/careEventsDb.ts` within the module — following the vacation planner pattern where `vacationDb` is module-local. Only `plantsDb` is shared because multiple modules read/write the same plant data. Care events are currently consumed by only one module. Promote the DB to `@packages/core-plants/db` later if a second module needs it. Rejected: putting the DB in `@packages/core-plants/db` prematurely.

4. **Place shared presentational components (`CareEventBadge`, `CareInsightsSummary`) in `@packages/core-plants`.** These are plant-domain UI components, matching the pattern of `PlantListItem` and `PlantListHeader` already in core-plants. Their stories use the `Packages/CorePlants/Components/` title prefix since they're in the packages layer. Rejected: putting them in the module (would require duplication if management needs them later).

5. **Keep `PlantDetailDialog` presentational.** The dialog currently accepts a `plant` prop and renders it — it has no hooks or data fetching. Rather than embedding `useCareEvents` inside the dialog (making it stateful and requiring decorators in all stories), introduce a `careSection` render prop and an `onMarkWatered` callback. The parent (`LandingPage`) composes `PlantCareSection` into the dialog slot. This preserves the dialog's testability — existing stories need no MSW handlers or decorators. Rejected: making the dialog stateful with internal `useCareEvents` call.

6. **Add "Mark as Watered" button in the plant detail dialog.** The current landing page has no watering action — only a view-detail click handler. This feature adds a "Mark as Watered" button in the `PlantDetailDialog` footer that records a "watered" care event. Skip and delegate events will be recorded when those workflows are built (e.g., vacation planner delegations). Rejected: building full skip/delegate UI flows in this feature.

7. **Create `createCareEventHandlers` factory for stories.** Following the existing `createTodayPlantHandlers` pattern in `src/mocks/createHandlers.ts`, create a `createCareEventHandlers` factory that accepts data or state ("loading"/"error") for story-level MSW overrides. This enables focused stories without relying on the module-level handlers. Rejected: using only inline MSW handlers in stories (less reusable, more duplication).

## Implementation notes

- Follow the `vacationDb` pattern in `apps/today/vacation-planner/src/mocks/vacationDb.ts` for `careEventsDb` — a plain object (not a class) with a backing `Map<string, CareEvent>`. Include `getAllByPlant(plantId)` that filters and sorts by date descending.
- The `computeCareInsights` function should handle: empty arrays (return null), single events (streak = 1, no interval), and irregular gaps gracefully. Consistency score: ratio of on-time waterings to expected waterings based on plant's `wateringFrequency`.
- `CareHistoryTimeline` groups events by date using `format(date, "PPP")` from date-fns, matching the existing date formatting in `PlantDetailDialog`.
- Care event seed data should reference plant IDs from `defaultSeedPlants` to ensure consistency. Generate ~5-15 events per plant for a representative subset (~20 plants). Use fixed absolute dates (not relative to `new Date()`) for Chromatic determinism.
- The `useCareEvents` hook should use query key `["today", "care-events", plantId]` to scope caching per plant.
- For story determinism, use fixed dates (far-past dates like `new Date(2024, 6, 15)`) in `makeCareEvent()` factory functions, following the pattern in `PlantDetailDialog.stories.tsx`.
- Badge colors: watered = `variant="default"` with green semantic, skipped = amber/warning, delegated = blue/info. Use `cn()` for conditional styling on the `Badge` component, or use custom className overrides per the shadcn pattern.
- All story files (both in `core-plants` and `today/landing-page`) must include full Chromatic modes in `meta.parameters.chromatic.modes` (light/dark x mobile/tablet/desktop). Follow the existing pattern in `PlantListItem.stories.tsx`.
- The folder name in core-plants is `care-event/` (kebab-case), matching existing folders (`collection/`, `vacation/`, `test-utils/`). The subpath export is `./care-event`.

## Acceptance criteria

- [static] `CareEvent`, `CareEventType`, `CareInsight` types export from `@packages/core-plants/care-event` without type errors.
- [static] `careEventSchema` validates a JSON payload with ISO date strings, producing `Date` objects via `z.coerce.date()`.
- [static] `computeCareInsights` returns `null` for an empty events array and valid `CareInsight` for non-empty arrays.
- [static] `careEventsDb` exports from `src/mocks/careEventsDb.ts` in the today-landing-page module without import errors.
- [static] `useCareEvents` hook returns `{ events, isLoading, error }` and accepts `plantId: string | null`.
- [static] All new files pass `typecheck` and `lint` without errors.
- [visual] `CareEventBadge` renders three distinct badge colors: green-tinted for "watered", amber-tinted for "skipped", blue-tinted for "delegated", each with readable text in both light and dark modes.
- [visual] `CareInsightsSummary` with data displays five labeled metrics (last watered, average interval, streak, missed count, consistency score) in a readable grid layout with `text-muted-foreground` labels.
- [visual] `CareInsightsSummary` with null data displays an empty state message ("No care history yet") centered, with muted text.
- [visual] `CareHistoryTimeline` with events displays entries in reverse chronological order, each showing an event type badge and a formatted date.
- [visual] `CareHistoryTimeline` with events on the same day groups them under a single date heading.
- [visual] `CareHistoryTimeline` with no events displays "No care history yet" empty state.
- [visual] `PlantDetailDialog` with care section shows "Care Insights" and "Care History" sections below the existing plant details, with readable text on both light and dark backgrounds.
- [visual] `PlantDetailDialog` without care section shows only the existing plant details (no empty state for care — the section is simply absent).
- [visual] All new components render correctly at mobile (375px), tablet (768px), and desktop (1280px) viewports in both light and dark themes.
- [interactive] Opening the plant detail dialog triggers a fetch for care events (visible as a network request to `/api/today/care-events?plantId=`).
- [interactive] Scrolling within the plant detail dialog reveals care history entries below the plant details when history is long.
- [interactive] Clicking "Mark as Watered" in the plant detail dialog sends a POST request to `/api/today/care-events` and the new event appears in the care history timeline without closing the dialog.
- [visual] The "Mark as Watered" button is visible in the plant detail dialog footer with a water droplet icon, readable text, and accessible label in both light and dark modes.
- [static] `todayCareEventHandlers` and `createCareEventHandlers` export from `src/mocks/index.ts` without import errors.
- [static] `todayCareEventHandlers` is registered in `registerTodayLandingPage.tsx` alongside `todayPlantHandlers`.
- [static] `fetchCareEvents` and `createCareEvent` API functions in `careEventsApi.ts` parse responses through `careEventSchema` and include auth headers via `getAuthHeaders()`.
