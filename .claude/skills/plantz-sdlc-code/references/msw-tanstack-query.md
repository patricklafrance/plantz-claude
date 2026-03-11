<!-- Canonical source: plantz-sdlc-plan. Keep in sync with plantz-sdlc-code, plantz-sdlc-test. -->

# TanStack Query + MSW

## Packages

- `@tanstack/react-query` (v5.90.21) — Server state management and data fetching
- `msw` (v2.12.10) — Mock Service Worker for API mocking in browser and Storybook

## Data Flow

1. Components call query hooks (`usePlantsQuery`, `useCreatePlant`, etc.) from their own module's local `api/` folder
2. Hooks use `useQuery` / `useMutation` from `@tanstack/react-query`
3. Query/mutation functions call plain `fetch()` against domain-scoped endpoints (`/api/management/plants` or `/api/today/plants`)
4. MSW intercepts the requests and serves from an in-memory `Map<string, Plant>` (shared DB in `@packages/plants-core/db`)
5. API client functions parse responses through `plantSchema.parse()` to convert ISO date strings to `Date` objects via `z.coerce.date()`

## Query Hooks

Each module defines its own hooks in a local `api/` folder:

### Management (`apps/management/plants/src/api/`)

- `usePlantsQuery()` — `useQuery` wrapping `GET /api/management/plants`
- `useCreatePlant()` — `useMutation` wrapping `POST /api/management/plants`, invalidates list cache on success
- `useUpdatePlant()` — `useMutation` wrapping `PUT /api/management/plants/:id`, invalidates list cache on success
- `useDeletePlant()` — `useMutation` wrapping `DELETE /api/management/plants/:id`, with optimistic cache removal
- `useDeletePlants()` — `useMutation` wrapping `DELETE /api/management/plants` (bulk), with optimistic cache removal

### Today (`apps/today/landing-page/src/api/`)

- `usePlantsQuery()` — `useQuery` wrapping `GET /api/today/plants`
- `useDeletePlants()` — `useMutation` wrapping `DELETE /api/today/plants` (bulk), with optimistic cache removal

## Query Key Factories

Each module has its own scoped query keys:

### Management (`managementPlantsKeys` in `managementPlantsQueryKeys.ts`)

```typescript
managementPlantsKeys.all; // ["management", "plants"]
managementPlantsKeys.lists(); // ["management", "plants", "list"]
managementPlantsKeys.detail(id); // ["management", "plants", "detail", id]
```

### Today (`todayPlantsKeys` in `todayPlantsQueryKeys.ts`)

```typescript
todayPlantsKeys.all; // ["today", "plants"]
todayPlantsKeys.lists(); // ["today", "plants", "list"]
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

### Host App (Squide Integration)

MSW is configured through Squide's built-in integration in `apps/host/src/index.tsx`:

```typescript
const runtime = initializeFirefly({
    useMsw: true,
    localModules: [registerHost, ...getActiveModules(process.env.MODULES)],
    startMsw: async (x) => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    },
});
```

The `startMsw` function in `apps/host/src/mocks/browser.ts` seeds the DB and starts the worker. Each module registers its own handlers via `runtime.registerRequestHandlers()` conditionally on `runtime.isMswEnabled`. Squide collects all handlers and passes them to `startMsw` before rendering.

### Module Handler Registration

Each module registers MSW handlers in its registration function using dynamic import from its local `mocks/` folder:

```typescript
// Management module
export const registerManagementPlants: ModuleRegisterFunction<FireflyRuntime> = async (runtime) => {
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { managementPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
    }
};

// Today module
export const registerTodayLandingPage: ModuleRegisterFunction<FireflyRuntime> = async (runtime) => {
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { todayPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(todayPlantHandlers);
    }
};
```

### Storybook Previews

Domain storybooks import handlers from their module's local `mocks/` folder:

- **Management storybook** (`apps/management/storybook/.storybook/preview.tsx`): imports `managementPlantHandlers` from `../../plants/src/mocks/index.ts`
- **Today storybook** (`apps/today/storybook/.storybook/preview.tsx`): imports `todayPlantHandlers` from `../../landing-page/src/mocks/index.ts`
- **Unified storybook** (`apps/storybook/.storybook/preview.tsx`): imports both handler sets and concatenates them

```typescript
// Management storybook example
import { managementPlantHandlers, plantsDb, defaultSeedPlants } from "../../plants/src/mocks/index.ts";
import { setupWorker } from "msw/browser";

const worker = setupWorker(...managementPlantHandlers);

// Decorator sets up MSW worker, resets DB per story, wraps in QueryClientProvider + Suspense.
// Per-story overrides via context.parameters.msw.handlers are applied with worker.use().
```

The packages storybook (`packages/storybook/`) does not need MSW or QueryClient since it only tests presentational components.

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

| Method | Path                          | Description                                     |
| ------ | ----------------------------- | ----------------------------------------------- |
| GET    | `/api/management/plants`      | List all plants (sorted by name)                |
| GET    | `/api/management/plants/:id`  | Get single plant                                |
| POST   | `/api/management/plants`      | Create plant (server generates id + timestamps) |
| PUT    | `/api/management/plants/:id`  | Update plant (server updates `lastUpdateDate`)  |
| DELETE | `/api/management/plants/:id`  | Delete single plant                             |
| DELETE | `/api/management/plants`      | Bulk delete (body: `{ ids: string[] }`)         |

### Today (`/api/today/plants`)

| Method | Path                     | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| GET    | `/api/today/plants`      | List all plants                         |
| DELETE | `/api/today/plants/:id`  | Delete single plant                     |
| DELETE | `/api/today/plants`      | Bulk delete (body: `{ ids: string[] }`) |

## Seed Data

The in-memory DB resets on page reload. For dev, `defaultSeedPlants` provides ~250 plants with realistic data. Stories use per-story MSW handler overrides with inline `makePlant()` helpers for focused data sets.
