<!-- Canonical source: plantz-sdlc-plan. Keep in sync with plantz-sdlc-code, plantz-sdlc-test. -->

# TanStack Query + MSW

## Packages

- `@tanstack/react-query` (v5.90.21) — Server state management and data fetching
- `msw` (v2.12.10) — Mock Service Worker for API mocking in browser and Storybook

## Data Flow

1. Components call query hooks (`usePlantsQuery`, `useCreatePlant`, etc.) from `@packages/plants-core`
2. Hooks use `useQuery` / `useMutation` from `@tanstack/react-query`
3. Query/mutation functions call plain `fetch()` against `/api/plants` endpoints
4. MSW intercepts the requests and serves from an in-memory `Map<string, Plant>`
5. API client functions parse responses through `plantSchema.parse()` to convert ISO date strings to `Date` objects via `z.coerce.date()`

## Query Hooks

Defined in `packages/plants-core/src/`:

- `usePlantsQuery()` — `useQuery` wrapping `GET /api/plants`
- `useCreatePlant()` — `useMutation` wrapping `POST /api/plants`, invalidates list cache on success
- `useUpdatePlant()` — `useMutation` wrapping `PUT /api/plants/:id`, invalidates list cache on success
- `useDeletePlant()` — `useMutation` wrapping `DELETE /api/plants/:id`, with optimistic cache removal
- `useDeletePlants()` — `useMutation` wrapping `DELETE /api/plants` (bulk), with optimistic cache removal

## Query Key Factory

`plantsKeys` in `packages/plants-core/src/plantsQueryKeys.ts`:

```typescript
plantsKeys.all; // ["plants"]
plantsKeys.lists(); // ["plants", "list"]
plantsKeys.detail(id); // ["plants", "detail", id]
```

## MSW Setup

### Subpath Export

MSW-specific code is exposed via `@packages/plants-core/msw`:

- `plantHandlers` — Default REST API handlers
- `plantsDb` — In-memory database singleton
- `defaultSeedPlants` — Pre-generated stable seed data (~250 plants)
- `generatePlants(count?)` — Generate random plant data
- `mswDecorator` — Shared Storybook decorator that initializes MSW + QueryClientProvider (all storybook previews use this)
- `freezeDate(fixedNow)` — Replace `Date` constructor with a frozen date for deterministic Chromatic snapshots
- `restoreDate()` — Restore the original `Date` constructor after a `freezeDate` call

### Host App

In `apps/host/src/mswSetup.ts`: calls `plantsDb.reset(defaultSeedPlants)` then `worker.start()` before React renders.

### Storybook Previews

Each storybook preview imports `mswDecorator` from `@packages/plants-core/msw` and adds it to the `decorators` array. The decorator handles:

1. Initializing MSW with `setupWorker(...plantHandlers)` and starting the worker with `onUnhandledRequest: "bypass"`
2. Wrapping each story in `QueryClientProvider` with a fresh `QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })`
3. Reading `context.parameters.msw.handlers` for per-story handler overrides via `worker.use()`
4. Resetting handlers and seed data between stories

### Per-Story Handler Overrides

```typescript
export const Empty: Story = {
    parameters: {
        msw: {
            handlers: [http.get("/api/plants", () => HttpResponse.json([]))],
        },
    },
};
```

Use `delay("infinite")` for loading state stories.

## REST API Endpoints

| Method | Path              | Description                                     |
| ------ | ----------------- | ----------------------------------------------- |
| GET    | `/api/plants`     | List all plants (sorted by name)                |
| GET    | `/api/plants/:id` | Get single plant                                |
| POST   | `/api/plants`     | Create plant (server generates id + timestamps) |
| PUT    | `/api/plants/:id` | Update plant (server updates `lastUpdateDate`)  |
| DELETE | `/api/plants/:id` | Delete single plant                             |
| DELETE | `/api/plants`     | Bulk delete (body: `{ ids: string[] }`)         |

## Seed Data

The in-memory DB resets on page reload. For dev, `defaultSeedPlants` provides ~250 plants with realistic data. Stories use per-story MSW handler overrides with inline `makePlant()` helpers for focused data sets.
