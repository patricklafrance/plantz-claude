# TanStack DB + TanStack Query + MSW

## Data Flow

1. Modules create a TanStack DB collection during Squide registration via `createPlantsCollection` factory from `@packages/core-plants/collection`, provided to components via React Context
2. Components read data with `useLiveQuery((q) => q.from({ plant: collection }))` — returns `{ data, isReady }`
3. Components write data with `createOptimisticAction` — applies optimistic update instantly, then persists to server
4. The collection's `queryFn` calls plain `fetch()` against domain-scoped endpoints (`/api/management/plants` or `/api/today/plants`)
5. MSW intercepts requests and serves from an in-memory `Map<string, Plant>` (shared DB in `@packages/core-plants/db`)
6. API client functions parse responses through `plantSchema.parse()` to convert ISO date strings to `Date` objects via `z.coerce.date()`

## Collection Factory

`@packages/core-plants/collection` exports the shared factory:

```typescript
const collection = createPlantsCollection({
    queryKey: ["management", "plants", "list"],
    queryFn: fetchPlants,
    queryClient,
});
```

## Per-Module Collections

Each module has a `plantsCollection.ts` with a factory function:

- **Management** (`apps/management/plants/src/plantsCollection.ts`): `createManagementPlantsCollection(queryClient)` + `createManagementPlantActions(collection)` → `{ insertPlant, updatePlant, deletePlant, deletePlants }`
- **Today Landing** (`apps/today/landing-page/src/plantsCollection.ts`): `createTodayPlantsCollection(queryClient)`
- **Today Vacation** (`apps/today/vacation-planner/src/plantsCollection.ts`): `createTodayVacationPlantsCollection(queryClient)` — read-only, no optimistic actions

## Optimistic Mutations

`createOptimisticAction` returns a `Transaction`, not a `Promise`. Use `tx.isPersisted.promise` for async callbacks.

```typescript
const updatePlant = createOptimisticAction<{ id: string } & Partial<Plant>>({
    onMutate: ({ id, ...changes }) => {
        collection.update(id, (draft) => {
            Object.assign(draft, changes);
        });
    },
    mutationFn: async ({ id, ...data }) => {
        await fetch(`${API_BASE}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        await collection.utils.refetch();
    },
});
```

## Host App (Squide Integration)

The host creates `QueryClient` before `initializeFirefly` and passes it to module registrations. `getActiveModules` wraps module registrations in closures: `(runtime) => entry.register(runtime, queryClient)`.

## Module Registration

Each module accepts `(runtime, queryClient)`, creates its collection, provides it via React Context, and conditionally registers MSW handlers:

```typescript
export async function registerManagementPlants(runtime: FireflyRuntime, queryClient: QueryClient) {
    const collection = createManagementPlantsCollection(queryClient);
    registerRoutes(runtime, collection);
    if (runtime.isMswEnabled) {
        const { managementPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
    }
}
```

## Shared DB Subpath Exports

**`@packages/core-plants/db`:** `plantsDb`, `defaultSeedPlants` (~250 plants), `generatePlants(count?)`

**`@packages/core-module/db`:** `householdDb` (households, members, invitations), `defaultSeedHouseholds`, `defaultSeedHouseholdMembers`, `DEFAULT_HOUSEHOLD_ID = "household-1"`, `usersDb`, `getUserId(request)`

Care event types/schemas/utilities via `@packages/core-plants/care-event`. Module-local DBs (e.g., `careEventsDb`, `adjustmentsDb` in today-landing-page) stay in the module's `src/mocks/` folder.

## Module-Specific Handlers

Each module defines handlers in `src/mocks/`. Endpoints follow `/api/<domain>/<entity>`:

- **Management Plants:** `managementPlantHandlers` (8 routes at `/api/management/plants`), `managementCareEventHandlers` (3 routes at `/api/management/care-events`)
- **Management Household:** `managementHouseholdHandlers` (11 routes at `/api/management/household`)
- **Today Landing:** `todayPlantHandlers` (3 routes at `/api/today/plants`), `todayCareEventHandlers` (3 routes at `/api/today/care-events`), `todayAdjustmentHandlers` (4 routes at `/api/today/adjustments`)
- **Today Vacation:** `todayVacationPlannerHandlers` (5 routes at `/api/today/vacation-planner/`)

## Storybook Setup

MSW is managed globally via `msw-storybook-addon` (`initialize({ onUnhandledRequest: "bypass" })` + `mswLoader` in preview.tsx).

Each domain has a `storybook.setup.tsx` providing two decorators:

- `fireflyDecorator` — Squide runtime via `initializeFireflyForStorybook()` + `withFireflyDecorator()` from the domain storybook's `firefly.tsx`
- `collectionDecorator` — fresh `QueryClient` + collection context per story

Story files: `decorators: [collectionDecorator, fireflyDecorator]`, `parameters: { msw: { handlers: [...] } }`. Per-story overrides via `parameters.msw.handlers`. Use `delay("infinite")` for loading states. The packages storybook needs none of this (presentational only).

## Seed Data

The host seeds `plantsDb` (~250 plants) and `householdDb` (one household, two members) before `initializeFirefly`. Today-landing-page also seeds `careEventsDb` and `adjustmentsDb`. Stories use per-story MSW handler overrides with `makePlant()` / `makeCareEvent()` / `makeAdjustmentRecommendation()` / `makeAdjustmentEvent()` helpers.
