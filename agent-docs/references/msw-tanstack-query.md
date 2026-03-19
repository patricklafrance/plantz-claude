# TanStack DB + TanStack Query + MSW

## Packages

- `@tanstack/db` (v0.5.32) — Embedded client-side database with reactive queries and optimistic mutations
- `@tanstack/react-db` (v0.1.76) — React hooks for TanStack DB (`useLiveQuery`)
- `@tanstack/query-db-collection` (v1.0.29) — Bridge that syncs TanStack DB collections via TanStack Query
- `@tanstack/react-query` (v5.90.21) — Server state management (used internally by collection sync)
- `msw` (v2.12.10) — Mock Service Worker for API mocking in browser and Storybook

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
import { createPlantsCollection } from "@packages/core-plants/collection";

const collection = createPlantsCollection({
    queryKey: ["management", "plants", "list"],
    queryFn: fetchPlants,
    queryClient,
    // getKey: (plant) => plant.id — hardcoded in factory
});
```

## Per-Module Collections

Each module has a `plantsCollection.ts` with a factory function that creates a fresh collection:

### Management (`apps/management/plants/src/plantsCollection.ts`)

- `createManagementPlantsCollection(queryClient)` — creates a collection instance (called once during registration, provided to components via `ManagementPlantsCollectionProvider` React Context)
- `createManagementPlantActions(collection)` — returns `{ insertPlant, updatePlant, deletePlant, deletePlants }`

### Today Landing (`apps/today/landing-page/src/plantsCollection.ts`)

- `createTodayPlantsCollection(queryClient)` — creates a collection instance (provided via `TodayPlantsCollectionProvider` React Context)

### Today Vacation Planner (`apps/today/vacation-planner/src/plantsCollection.ts`)

- `createTodayVacationPlantsCollection(queryClient)` — creates a read-only collection instance (provided via `TodayVacationPlantsCollectionProvider` React Context). No optimistic actions — vacation plan mutations use React state, not the plants collection.

## Optimistic Mutations

Use `createOptimisticAction` from `@tanstack/db`:

```typescript
const updatePlant = createOptimisticAction<{ id: string } & Partial<Plant>>({
    onMutate: ({ id, ...changes }) => {
        collection.update(id, (draft) => {
            Object.assign(draft, changes);
        });
    },
    mutationFn: async ({ id, ...data }) => {
        await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        await collection.utils.refetch();
    },
});
```

**Key:** `createOptimisticAction` returns a `Transaction`, not a `Promise`. Use `tx.isPersisted.promise` for async callbacks (e.g., showing a "Saved" indicator).

## Host App (Squide Integration)

The host creates `QueryClient` before `initializeFirefly` and passes it to module registrations:

```typescript
const queryClient = new QueryClient();
const runtime = initializeFirefly({
    useMsw: true,
    localModules: [registerShell, ...getActiveModules(process.env.MODULES, queryClient)],
    startMsw: async (x) => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    },
});
```

`getActiveModules` wraps module registrations in closures: `(runtime) => entry.register(runtime, queryClient)`.

## Module Registration

Each module accepts `(runtime, queryClient)`, creates its collection, and provides it via React Context:

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

## MSW Setup

### Shared DB Subpath Exports

Two shared in-memory databases exist:

**`@packages/core-plants/db`:**

- `plantsDb` — In-memory plant database singleton
- `defaultSeedPlants` — Pre-generated stable seed data (~250 plants)
- `generatePlants(count?)` — Generate random plant data

**`@packages/core-module/db`:**

- `householdDb` — In-memory household database singleton (households, members, invitations)
- `defaultSeedHouseholds`, `defaultSeedHouseholdMembers` — Seed data for dev (one household with Alice + Bob)
- `DEFAULT_HOUSEHOLD_ID` — Well-known constant `"household-1"` used by both `core-module` and `core-plants` seed data (hardcoded in both to avoid circular dependencies)
- `usersDb` — In-memory user database singleton
- `getUserId(request)` — Extracts the current user ID from MSW request auth headers

Care event types, schemas, insight utilities, and adjustment recommendation types/schemas/computation are exposed via `@packages/core-plants/care-event`. Module-local DBs (e.g., `careEventsDb` and `adjustmentsDb` in today-landing-page) stay in the module's `src/mocks/` folder — they are not shared across modules.

### Module-Specific Handlers

Each module defines its own MSW handlers in a local `mocks/` folder:

- **Management Plants:** `managementPlantHandlers` in `apps/management/plants/src/mocks/handlers.ts` — 8 routes at `/api/management/plants`; `managementCareEventHandlers` in `apps/management/plants/src/mocks/careEventHandlers.ts` — 3 routes at `/api/management/care-events`
- **Management Household:** `managementHouseholdHandlers` in `apps/management/household/src/mocks/handlers.ts` — 11 routes at `/api/management/household`
- **Today Landing:** `todayPlantHandlers` in `apps/today/landing-page/src/mocks/handlers.ts` — 3 routes at `/api/today/plants`; `todayCareEventHandlers` in `apps/today/landing-page/src/mocks/careEventHandlers.ts` — 3 routes at `/api/today/care-events`; `todayAdjustmentHandlers` in `apps/today/landing-page/src/mocks/adjustmentHandlers.ts` — 4 routes at `/api/today/adjustments`
- **Today Vacation:** `todayVacationPlannerHandlers` in `apps/today/vacation-planner/src/mocks/handlers.ts` — 5 routes at `/api/today/vacation-planner/`

## Storybook Setup

MSW is managed globally via `msw-storybook-addon` in each storybook's `preview.tsx`:

```typescript
import { initialize, mswLoader } from "msw-storybook-addon";
initialize({ onUnhandledRequest: "bypass" });
const preview: Preview = { loaders: [mswLoader] };
export default preview;
```

Each domain has a `storybook.setup.tsx` file shared by all its story files. It provides two decorators:

- `fireflyDecorator` — Squide runtime via `initializeFireflyForStorybook()` + `withFireflyDecorator()` from the domain storybook's `firefly.tsx` (e.g., `../../storybook/firefly.tsx`)
- `collectionDecorator` — fresh `QueryClient` + TanStack DB collection context per story via `useMemo` in a `CollectionDecorator` component

```typescript
import { initializeFireflyForStorybook, withFireflyDecorator } from "../../storybook/firefly.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import type { Decorator } from "@storybook/react-vite";

import { ManagementPlantsCollectionProvider } from "./ManagementPlantsContext.tsx";
import { createManagementPlantsCollection } from "./plantsCollection.ts";

const runtime = await initializeFireflyForStorybook();
export const fireflyDecorator = withFireflyDecorator(runtime);

function CollectionDecorator({ children }: { children: ReactNode }) {
    const queryClient = useMemo(() => new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    }), []);
    const collection = useMemo(() => createManagementPlantsCollection(queryClient), [queryClient]);
    return (
        <QueryClientProvider client={queryClient}>
            <ManagementPlantsCollectionProvider collection={collection}>
                {children}
            </ManagementPlantsCollectionProvider>
        </QueryClientProvider>
    );
}

export const collectionDecorator: Decorator = story => <CollectionDecorator>{story()}</CollectionDecorator>;
```

Story files import both decorators:

```typescript
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    decorators: [collectionDecorator, fireflyDecorator],
    parameters: {
        msw: { handlers: managementPlantHandlers },
    },
};
```

The packages storybook does not need MSW or collections since it only tests presentational components.

### Per-Story Handler Overrides

```typescript
export const Empty: Story = {
    parameters: {
        msw: {
            handlers: [http.get("/api/management/plants", () => HttpResponse.json([]))],
        },
    },
};
```

Use `delay("infinite")` for loading state stories.

## REST API Endpoints

### Management Plants (`/api/management/plants`, `/api/management/care-events`)

| Method | Path                                                     | Description                                              |
| ------ | -------------------------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/management/plants/households`                      | List current user's households with members              |
| GET    | `/api/management/plants/households/:householdId/members` | List members of a specific household                     |
| GET    | `/api/management/plants`                                 | List all plants (sorted by name)                         |
| GET    | `/api/management/plants/:id`                             | Get single plant                                         |
| POST   | `/api/management/plants`                                 | Create plant (server generates id + timestamps)          |
| PUT    | `/api/management/plants/:id`                             | Update plant (server updates `lastUpdateDate`)           |
| DELETE | `/api/management/plants/:id`                             | Delete single plant                                      |
| DELETE | `/api/management/plants`                                 | Bulk delete (body: `{ ids: string[] }`)                  |
| GET    | `/api/management/care-events`                            | List care events for a plant (`?plantId=` query param)   |
| POST   | `/api/management/care-events`                            | Create a care event (includes `actorId`/`actorName`)     |
| POST   | `/api/management/care-events/bulk`                       | Bulk create care events (includes `actorId`/`actorName`) |

### Management Household (`/api/management/household`)

| Method | Path                                                       | Description                              |
| ------ | ---------------------------------------------------------- | ---------------------------------------- |
| GET    | `/api/management/household`                                | List user's households                   |
| POST   | `/api/management/household`                                | Create household                         |
| GET    | `/api/management/household/:id`                            | Get household detail                     |
| PUT    | `/api/management/household/:id`                            | Update household                         |
| DELETE | `/api/management/household/:id`                            | Delete household                         |
| GET    | `/api/management/household/:id/members`                    | List members                             |
| GET    | `/api/management/household/:id/plants`                     | List plants shared with household        |
| POST   | `/api/management/household/:id/invitations`                | Create invitation                        |
| POST   | `/api/management/household/:id/invitations/:invId/accept`  | Accept invitation                        |
| DELETE | `/api/management/household/:id/members/:userId`            | Remove member                            |
| PUT    | `/api/management/household/:id/plants/:plantId/assignment` | Set responsibility assignment on a plant |

### Today Landing (`/api/today/plants`, `/api/today/care-events`, `/api/today/adjustments`)

| Method | Path                                    | Description                                                              |
| ------ | --------------------------------------- | ------------------------------------------------------------------------ |
| GET    | `/api/today/plants`                     | List user's plants (own + shared via household membership)               |
| DELETE | `/api/today/plants/:id`                 | Delete single plant                                                      |
| DELETE | `/api/today/plants`                     | Bulk delete (body: `{ ids: string[] }`)                                  |
| GET    | `/api/today/care-events`                | List care events for a plant (`?plantId=` query param)                   |
| POST   | `/api/today/care-events`                | Create a care event (includes `actorId`/`actorName`)                     |
| POST   | `/api/today/care-events/bulk`           | Bulk create care events (includes `actorId`/`actorName`)                 |
| GET    | `/api/today/adjustments/recommendation` | Get adjustment recommendation for a plant (`?plantId=&currentInterval=`) |
| POST   | `/api/today/adjustments`                | Accept an adjustment (updates plant frequency + records event)           |
| POST   | `/api/today/adjustments/dismiss`        | Dismiss a recommendation for a plant                                     |
| GET    | `/api/today/adjustments`                | List adjustment history for a plant (`?plantId=` query param)            |

### Today Vacation Planner (`/api/today/vacation-planner/`)

| Method | Path                                       | Description                                         |
| ------ | ------------------------------------------ | --------------------------------------------------- |
| GET    | `/api/today/vacation-planner/plants`       | List all user plants (reads from shared `plantsDb`) |
| POST   | `/api/today/vacation-planner/plans`        | Create a new vacation plan                          |
| GET    | `/api/today/vacation-planner/plans/active` | Get the active plan (if any)                        |
| PUT    | `/api/today/vacation-planner/plans/:id`    | Update plan (save, cancel, update recommendations)  |
| DELETE | `/api/today/vacation-planner/plans/:id`    | Delete a plan                                       |

## Seed Data

The in-memory DBs reset on page reload. For dev, the host seeds two shared DBs in `apps/host/src/index.tsx` before `initializeFirefly`: `plantsDb.reset(defaultSeedPlants)` (~250 plants) and `householdDb.reset({ households, members })` (one household with two members). Some seed plants have `householdId = "household-1"` to demonstrate shared-plant UX. The today-landing-page module also seeds `careEventsDb` with `defaultSeedCareEvents` (deterministic care events for ~20 plants using fixed absolute dates, including `actorId`/`actorName` fields) and `adjustmentsDb` with `defaultSeedAdjustments` (deterministic adjustment events for the first few plants with care history). Stories use per-story MSW handler overrides with inline `makePlant()` / `makeCareEvent()` / `makeAdjustmentRecommendation()` / `makeAdjustmentEvent()` helpers for focused data sets.
