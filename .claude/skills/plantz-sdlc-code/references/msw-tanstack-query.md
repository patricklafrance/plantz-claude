<!-- Canonical source: plantz-sdlc-plan. Keep in sync with plantz-sdlc-code, plantz-sdlc-test. -->

# TanStack DB + TanStack Query + MSW

## Packages

- `@tanstack/db` (v0.5.32) — Embedded client-side database with reactive queries and optimistic mutations
- `@tanstack/react-db` (v0.1.76) — React hooks for TanStack DB (`useLiveQuery`)
- `@tanstack/query-db-collection` (v1.0.29) — Bridge that syncs TanStack DB collections via TanStack Query
- `@tanstack/react-query` (v5.90.21) — Server state management (used internally by collection sync)
- `msw` (v2.12.10) — Mock Service Worker for API mocking in browser and Storybook

## Data Flow

1. Modules create a TanStack DB collection singleton during Squide registration via `createPlantsCollection` factory from `@packages/plants-core/collection`
2. Components read data with `useLiveQuery((q) => q.from({ plant: collection }))` — returns `{ data, isReady }`
3. Components write data with `createOptimisticAction` — applies optimistic update instantly, then persists to server
4. The collection's `queryFn` calls plain `fetch()` against domain-scoped endpoints (`/api/management/plants` or `/api/today/plants`)
5. MSW intercepts requests and serves from an in-memory `Map<string, Plant>` (shared DB in `@packages/plants-core/db`)
6. API client functions parse responses through `plantSchema.parse()` to convert ISO date strings to `Date` objects via `z.coerce.date()`

## Collection Factory

`@packages/plants-core/collection` exports the shared factory:

```typescript
import { createPlantsCollection } from "@packages/plants-core/collection";

const collection = createPlantsCollection({
    queryKey: ["management", "plants", "list"],
    queryFn: fetchPlants,
    queryClient,
    // getKey: (plant) => plant.id — hardcoded in factory
});
```

## Per-Module Collections

Each module has a `plantsCollection.ts` that creates a singleton during registration:

### Management (`apps/management/plants/src/plantsCollection.ts`)

- `initManagementPlantsCollection(queryClient)` — creates the collection singleton
- `getManagementPlantsCollection()` — returns the singleton for use in components
- `createManagementPlantActions(collection)` — returns `{ insertPlant, updatePlant, deletePlant, deletePlants }`

### Today (`apps/today/landing-page/src/plantsCollection.ts`)

- `initTodayPlantsCollection(queryClient)` — creates the collection singleton
- `getTodayPlantsCollection()` — returns the singleton
- `createTodayPlantActions(collection)` — returns `{ deletePlants }` (read + delete only)

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
    localModules: [registerHost, ...getActiveModules(process.env.MODULES, queryClient)],
    startMsw: async (x) => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    },
});
```

`getActiveModules` wraps module registrations in closures: `(runtime) => entry.register(runtime, queryClient)`.

## Module Registration

Each module accepts `(runtime, queryClient)` and initializes its collection:

```typescript
export async function registerManagementPlants(runtime: FireflyRuntime, queryClient: QueryClient) {
    initManagementPlantsCollection(queryClient);
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { managementPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
    }
}
```

## MSW Setup

### Shared DB Subpath Export

The shared in-memory database is exposed via `@packages/plants-core/db`:

- `plantsDb` — In-memory database singleton
- `defaultSeedPlants` — Pre-generated stable seed data (~250 plants)
- `generatePlants(count?)` — Generate random plant data

### Module-Specific Handlers

Each module defines its own MSW handlers in a local `mocks/` folder:

- **Management:** `managementPlantHandlers` in `apps/management/plants/src/mocks/handlers.ts` — 6 routes at `/api/management/plants`
- **Today:** `todayPlantHandlers` in `apps/today/landing-page/src/mocks/handlers.ts` — 3 routes at `/api/today/plants`

## Storybook Setup

Domain storybooks use per-story-file setup via utilities from `@packages/core-squide/storybook`:

- `initializeFireflyForStorybook(handlers)` — starts MSW worker singleton with the provided request handlers, returns `{ worker, mswReady }`
- `withModuleDecorator(config)` — creates a Storybook decorator handling MSW reset, db reset, module registration, per-story overrides, QueryClientProvider, and Suspense

Each domain has a `storybook.setup.ts` file shared by all its story files:

```typescript
import { initializeFireflyForStorybook, withModuleDecorator } from "@packages/core-squide/storybook";
import { managementPlantHandlers, plantsDb, defaultSeedPlants } from "./mocks/index.ts";
import { initManagementPlantsCollection } from "./plantsCollection.ts";

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

const { worker, mswReady } = initializeFireflyForStorybook(managementPlantHandlers);

export const moduleDecorator = withModuleDecorator({
    worker,
    mswReady,
    handlers: managementPlantHandlers,
    queryClient,
    resetDb: () => plantsDb.reset(defaultSeedPlants),
    register: () => initManagementPlantsCollection(queryClient),
});
```

Story files import `moduleDecorator` and add it to meta:

```typescript
import { moduleDecorator } from "./storybook.setup.ts";

const meta = {
    decorators: [moduleDecorator],
    // ...
};
```

Domain storybook `preview.tsx` files are minimal (CSS import only). The packages storybook does not need MSW or collections since it only tests presentational components.

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

### Management (`/api/management/plants`)

| Method | Path                         | Description                                     |
| ------ | ---------------------------- | ----------------------------------------------- |
| GET    | `/api/management/plants`     | List all plants (sorted by name)                |
| GET    | `/api/management/plants/:id` | Get single plant                                |
| POST   | `/api/management/plants`     | Create plant (server generates id + timestamps) |
| PUT    | `/api/management/plants/:id` | Update plant (server updates `lastUpdateDate`)  |
| DELETE | `/api/management/plants/:id` | Delete single plant                             |
| DELETE | `/api/management/plants`     | Bulk delete (body: `{ ids: string[] }`)         |

### Today (`/api/today/plants`)

| Method | Path                    | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/api/today/plants`     | List all plants                         |
| DELETE | `/api/today/plants/:id` | Delete single plant                     |
| DELETE | `/api/today/plants`     | Bulk delete (body: `{ ids: string[] }`) |

## Seed Data

The in-memory DB resets on page reload. For dev, `defaultSeedPlants` provides ~250 plants with realistic data. Stories use per-story MSW handler overrides with inline `makePlant()` helpers for focused data sets.
