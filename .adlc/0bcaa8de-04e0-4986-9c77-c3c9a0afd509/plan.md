# Plan: Smart Watering Adjustment

## Objective

Add a Smart Watering Adjustment feature to the today landing page that analyzes past watering events, recommends watering interval adjustments when patterns deviate from the configured schedule, and lets users accept, dismiss, or ignore suggestions -- with a history of past adjustments visible in the plant detail dialog.

## Affected packages

- `@packages/core-plants` (`packages/core-plants/`) -- new adjustment types, schema, computation utilities, and shared UI components
- `@modules/today-landing-page` (`apps/today/landing-page/`) -- new adjustment section in plant detail dialog, MSW handlers, API client, adjustment history UI

## Scaffolding required

None. The feature integrates into the existing `today/landing-page` module and the existing `@packages/core-plants` package. No new modules or storybooks need to be scaffolded.

## File changes

### `@packages/core-plants` (`packages/core-plants/`)

**New files:**

- `src/care-event/adjustmentTypes.ts` -- Types for `AdjustmentRecommendation` (suggestedInterval, explanation, confidence, recentBehaviorSummary, plantId, currentInterval) and `AdjustmentEvent` (id, plantId, previousInterval, newInterval, adjustmentDate, note). Confidence enum: `"low" | "medium" | "high"`.
- `src/care-event/adjustmentSchema.ts` -- Zod schemas for `adjustmentRecommendationSchema` and `adjustmentEventSchema` (for parsing API responses).
- `src/care-event/adjustmentUtils.ts` -- Pure computation functions:
    - `computeAdjustmentRecommendation(events: CareEvent[], currentIntervalDays: number, options?: { minEvents?: number }): AdjustmentRecommendation | null` -- Analyzes watered events, computes average actual interval, deviation, variance, and confidence. Returns a recommendation when deviation exceeds a threshold (~20%) and sufficient data exists (default: 5+ watered events). Returns `null` when the current schedule is adequate.
    - `computeConfidence(eventCount: number, variance: number): Confidence` -- Derives confidence from event count and consistency of intervals.
    - `formatIntervalLabel(days: number): string` -- Converts numeric days to human-readable label (e.g., "every 5 days").

**Modified files:**

- `src/care-event/index.ts` -- Add exports for new adjustment types, schema, and utilities.
- `packages/core-plants/package.json` -- No changes needed (the `./care-event` subpath export already covers the new files).

**New shared component files:**

- `src/AdjustmentSuggestionCard.tsx` -- Presentational component displaying a recommendation: suggested interval, explanation text, confidence badge, and accept/dismiss action buttons. Props: `recommendation: AdjustmentRecommendation`, `onAccept: () => void`, `onDismiss: () => void`. Uses `Badge` for confidence indicator, `Button` for actions.
- `src/AdjustmentSuggestionCard.stories.tsx` -- Stories: `HighConfidence`, `MediumConfidence`, `LowConfidence`, `LongExplanation`. Title: `Packages/CorePlants/Components/AdjustmentSuggestionCard`. Presentational -- no decorators needed.
- `src/AdjustmentHistoryList.tsx` -- Presentational component displaying a list of past adjustment events. Each entry shows date, previous interval, new interval, and optional note. Props: `events: AdjustmentEvent[]`. Empty state when no events.
- `src/AdjustmentHistoryList.stories.tsx` -- Stories: `WithEvents`, `Empty`, `SingleEvent`, `WithNotes`. Title: `Packages/CorePlants/Components/AdjustmentHistoryList`. Presentational -- no decorators needed.

**Modified files:**

- `src/index.ts` -- Add exports for `AdjustmentSuggestionCard` and `AdjustmentHistoryList`.

### `@modules/today-landing-page` (`apps/today/landing-page/`)

**New files:**

- `src/adjustmentsApi.ts` -- API client functions:
    - `fetchAdjustmentRecommendation(plantId: string, currentIntervalDays: number): Promise<AdjustmentRecommendation | null>` -- GET `/api/today/adjustments/recommendation?plantId=...&currentInterval=...`
    - `acceptAdjustment(plantId: string, previousInterval: number, newInterval: number, note?: string): Promise<AdjustmentEvent>` -- POST `/api/today/adjustments`
    - `dismissRecommendation(plantId: string): Promise<void>` -- POST `/api/today/adjustments/dismiss`
    - `fetchAdjustmentHistory(plantId: string): Promise<AdjustmentEvent[]>` -- GET `/api/today/adjustments?plantId=...`
- `src/useAdjustmentRecommendation.ts` -- Custom hook wrapping `useQuery` for fetching the recommendation for a plant. Returns `{ recommendation, isLoading }`. Keyed on `["today", "adjustments", "recommendation", plantId]`.
- `src/useAdjustmentHistory.ts` -- Custom hook wrapping `useQuery` for fetching adjustment history. Returns `{ events, isLoading }`. Keyed on `["today", "adjustments", "history", plantId]`.
- `src/AdjustmentSection.tsx` -- Orchestrator component rendered inside `PlantCareSection`. Fetches recommendation and history via hooks, passes data to `AdjustmentSuggestionCard` and `AdjustmentHistoryList`. Props: `plantId: string`, `currentIntervalDays: number`, `onAdjustmentAccepted: () => void`. The accept handler calls `acceptAdjustment` from `adjustmentsApi`, invalidates recommendation and history queries, then calls `onAdjustmentAccepted` so the parent can refetch the plants collection. The dismiss handler calls `dismissRecommendation` and invalidates the recommendation query. This callback-based approach avoids coupling `AdjustmentSection` to the plants collection context, making it testable in stories without `CollectionDecorator`.
- `src/AdjustmentSection.stories.tsx` -- Stories: `WithRecommendation`, `NoRecommendation`, `WithHistory`, `WithRecommendationAndHistory`, `Loading`. Title: `Today/LandingPage/Components/AdjustmentSection`. Uses `QueryDecorator` + `fireflyDecorator` pattern (same as `PlantCareSection.stories.tsx`). Per-story MSW handler overrides via `createAdjustmentHandlers(...)`. Default args: `onAdjustmentAccepted: () => {}` (no-op for story isolation).
- `src/mocks/adjustmentsDb.ts` -- Module-local in-memory DB for adjustment events and dismissed recommendations. Same pattern as `careEventsDb.ts`. Not shared -- stays in the module.
- `src/mocks/adjustmentHandlers.ts` -- MSW handlers for `/api/today/adjustments/*`:
    - GET `/api/today/adjustments/recommendation` -- Reads care events from `careEventsDb`, runs `computeAdjustmentRecommendation` from `@packages/core-plants/care-event`, checks dismissed state, returns recommendation or null.
    - POST `/api/today/adjustments` -- Records an adjustment event in `adjustmentsDb`, updates the plant's `wateringFrequency` and `nextWateringDate` in `plantsDb`.
    - POST `/api/today/adjustments/dismiss` -- Records a dismissed recommendation so it is not shown again until new data arrives.
    - GET `/api/today/adjustments` -- Returns adjustment history for a plant from `adjustmentsDb`.
- `src/mocks/createAdjustmentHandlers.ts` -- Story-friendly handler factory (same pattern as `createCareEventHandlers.ts`). Accepts typed data or `"loading"` / `"error"` for per-story overrides.
- `src/mocks/seedAdjustments.ts` -- Seed data: a few deterministic adjustment events for the first 3-5 plants that have care event history. Used during module registration to populate `adjustmentsDb`.

**Modified files:**

- `src/PlantCareSection.tsx` -- Add `<AdjustmentSection>` below existing care insights and history. Accept new props: `wateringFrequency: string` (to derive `currentIntervalDays` via `getFrequencyDays`) and `onAdjustmentAccepted: () => void` (forwarded to `AdjustmentSection` so the parent can refetch the plants collection).
- `src/PlantCareSection.stories.tsx` -- Add new stories for the adjustment section integration: `WithAdjustmentSuggestion`, `WithAdjustmentHistory`. Update existing stories to include adjustment handler overrides that return no recommendation (so existing stories are unaffected visually).
- `src/LandingPage.tsx` -- Pass `wateringFrequency` and an `onAdjustmentAccepted` callback to `PlantCareSection` when rendering inside `PlantDetailDialog`'s `careSection`. The callback calls `collection.utils.refetch()` so the updated watering interval is reflected in the plant list.
- `src/mocks/index.ts` -- Add exports for `todayAdjustmentHandlers`, `createAdjustmentHandlers`, `adjustmentsDb`, `defaultSeedAdjustments`.
- `src/registerTodayLandingPage.tsx` -- Import and register `todayAdjustmentHandlers`. Seed `adjustmentsDb` with `defaultSeedAdjustments`.

### Storybook / CSS wiring

No changes needed. The today storybook already globs `../../landing-page/src/**/*.stories.tsx`. The `@source` directives in the today storybook CSS and host globals.css already cover both `packages/core-plants/src/**` and `apps/today/landing-page/src/**`.

## New dependencies

None. All required packages (`date-fns`, `zod`, `msw`, `@tanstack/react-query`, `lucide-react`, `@packages/components`) are already available in the affected workspaces.

## Decisions

1. **Feature lives in today/landing-page, not a new module.** The adjustment UI is a sub-section within the existing plant detail dialog -- it shares the same route, collection, and care event data. Creating a new module would violate the granularity criteria (no distinct route, no separate collection). Rejected: new `today/adjustments` module.

2. **Adjustment computation lives in `@packages/core-plants/care-event`, not in the module.** The computation logic is pure domain logic operating on care events and plant data. Placing it in the shared package makes it testable in isolation and available if the management module later wants to show adjustment history. Rejected: duplicating computation logic inside the module.

3. **Presentational components (`AdjustmentSuggestionCard`, `AdjustmentHistoryList`) live in `@packages/core-plants`, not in the module.** These are plant-domain UI components (like `CareInsightsSummary` and `CareEventBadge`) that may be rendered by multiple modules. They have no module-specific dependencies. Rejected: placing them in the module, which would block reuse.

4. **Server-side computation for recommendations (MSW handler computes, not client).** The MSW handler reads care events, runs the adjustment algorithm, and returns the recommendation. This mirrors how a real BFF would work -- the frontend receives the recommendation, it does not run the algorithm client-side. Rejected: client-side computation in a hook (would not survive migration to real backend).

5. **Adjustment events stored in a module-local DB, not promoted to shared.** Only today-landing-page consumes adjustment events. Following the existing pattern (`careEventsDb` was module-local before promotion), the adjustment DB stays in the module's `mocks/` folder. Promote only when a second module needs it. Rejected: immediately adding to `@packages/core-plants/db`.

6. **Frequency update via `plantsDb.update()` in MSW handler, not via management API.** When an adjustment is accepted, the handler directly updates the plant's `wateringFrequency` and `nextWateringDate` in `plantsDb`. This is how the existing care event handler works (it updates `nextWateringDate` when marking a plant as watered). In production, this would be a dedicated backend endpoint. Rejected: calling the management module's PUT endpoint (modules must not depend on each other's handlers).

## Implementation notes

- **Adjustment computation pattern:** Reference `packages/core-plants/src/care-event/careEventUtils.ts` for the existing computation style. The new `computeAdjustmentRecommendation` function should follow the same pure-function pattern: accept sorted events, return a typed result or null.
- **Frequency mapping:** Use `getFrequencyDays()` from `@packages/core-plants` to convert the plant's `wateringFrequency` string (e.g., `"1-week"`) to numeric days. The recommendation should suggest a numeric interval in days -- the MSW handler maps this back to the closest `WateringFrequencyId` when updating the plant.
- **Hook pattern:** Reference `apps/today/landing-page/src/useCareEvents.ts` for the `useQuery` wrapper pattern. The adjustment hooks follow the same shape.
- **MSW handler pattern:** Reference `apps/today/landing-page/src/mocks/careEventHandlers.ts` for auth checking, response shapes, and DB interaction patterns.
- **Story factory pattern:** Reference `apps/today/landing-page/src/mocks/createCareEventHandlers.ts` for the `createAdjustmentHandlers` factory that supports `"loading"` / `"error"` / typed data.
- **Dismissal persistence:** Dismissed recommendations are stored per-plant in `adjustmentsDb` as simple records. When new care events arrive that significantly change the data (e.g., 3+ new watered events since dismissal), the recommendation reappears. The handler checks the dismissed state and the latest event date.
- **Confidence thresholds:** Low = fewer than 5 events or high variance. Medium = 5-10 events with moderate consistency. High = 10+ events with low variance and clear directional trend.
- **Interval bounds:** The suggested interval must remain between 2 and 21 days. Recommendations outside this range are suppressed.
- **Collection refetch:** After accepting an adjustment, the `onAdjustmentAccepted` callback triggers `collection.utils.refetch()` to update the plant's watering frequency and next watering date in the TanStack DB collection.
- **Accessibility:** The `AdjustmentSuggestionCard` must include a heading (e.g., `<h4>`) for screen reader navigation. Confidence badges must convey meaning through text, not color alone (the badge label text reads "Low confidence", "Medium confidence", or "High confidence"). Use `aria-live="polite"` on the container wrapping the suggestion so screen readers announce when a recommendation appears or is dismissed. Accept and dismiss buttons need clear accessible labels (e.g., "Accept suggested interval of X days", "Dismiss suggestion").

## Acceptance criteria

- [static] All new TypeScript types (`AdjustmentRecommendation`, `AdjustmentEvent`, `Confidence`) compile without errors and are exported from `@packages/core-plants/care-event`.
- [static] All new Zod schemas (`adjustmentRecommendationSchema`, `adjustmentEventSchema`) parse valid data without errors.
- [static] `computeAdjustmentRecommendation` returns `null` when fewer than 5 watered events exist.
- [static] `computeAdjustmentRecommendation` returns a recommendation with `"high"` confidence when 10+ consistent events deviate from the configured interval by more than 20%.
- [static] `AdjustmentSuggestionCard` accepts `recommendation`, `onAccept`, and `onDismiss` props without type errors.
- [static] `AdjustmentHistoryList` accepts `events` prop without type errors.
- [static] `AdjustmentSection` accepts `plantId`, `currentIntervalDays`, and `onAdjustmentAccepted` props without type errors.
- [static] API client functions in `adjustmentsApi.ts` compile without errors and use `getAuthHeaders()` for authentication.
- [static] `useAdjustmentRecommendation` and `useAdjustmentHistory` hooks compile without errors and return typed results.
- [static] New MSW handlers are registered in `registerTodayLandingPage` without import errors.
- [static] All new exports from `@packages/core-plants/care-event` and `@packages/core-plants` resolve without module resolution errors.
- [visual] `AdjustmentSuggestionCard` renders the suggested interval, explanation text, confidence badge, and two action buttons (Accept, Dismiss) with readable text in both light and dark modes.
- [visual] Confidence badge displays distinct visual treatments for low (muted/secondary), medium (default), and high (primary/success-like) confidence levels.
- [visual] `AdjustmentHistoryList` renders each adjustment event showing the date, previous interval, new interval, and optional note with no visual overlap or clipping.
- [visual] `AdjustmentHistoryList` empty state displays a "No adjustment history" message centered in the container.
- [visual] `AdjustmentSection` within the plant detail dialog renders below the care history, separated by a visual divider, with no layout overflow in the scrollable dialog.
- [visual] The adjustment section heading ("Schedule Adjustments") aligns with the existing "Care Insights" and "Care History" headings in font size and weight.
- [visual] All new components render correctly at mobile (375px), tablet (768px), and desktop (1280px) viewports in both light and dark themes.
- [interactive] Clicking "Accept" on an adjustment suggestion calls the accept API, updates the plant's watering frequency, and removes the suggestion from view.
- [interactive] Clicking "Dismiss" on an adjustment suggestion hides the suggestion without changing the watering schedule.
- [interactive] After accepting an adjustment, the plant detail dialog reflects the updated watering frequency.
- [interactive] After accepting an adjustment, the adjustment appears in the adjustment history list below.
- [interactive] Opening a plant detail dialog for a plant with sufficient watering history shows the adjustment suggestion section with a recommendation (when the schedule is suboptimal) or no recommendation (when the schedule matches behavior).
- [visual] Confidence badge conveys its level through text label (e.g., "High confidence"), not color alone, ensuring accessibility for color-blind users.
- [visual] Accept and dismiss buttons in `AdjustmentSuggestionCard` have visible focus indicators when navigated via keyboard.
