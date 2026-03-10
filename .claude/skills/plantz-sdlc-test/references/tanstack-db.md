<\!-- Canonical source: plantz-sdlc-plan. Keep in sync with plantz-sdlc-code, plantz-sdlc-test. -->

# TanStack DB

## Package

- `@tanstack/react-db` (v0.1.75+) — re-exports everything from `@tanstack/db`
- Installed in: `apps/management/plants/`

## Collection

Defined in `apps/management/plants/src/plantsCollection.ts`.

```typescript
import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";

export const plantsCollection = createCollection(
    localStorageCollectionOptions({
        id: "plants",
        storageKey: "plantz-plants",
        getKey: (item: Plant) => item.id,
        schema: plantSchema,
    }),
);
```

- **localStorage key:** `plantz-plants`
- **Schema:** Zod schema at `apps/management/plants/src/plantSchema.ts`

## Date coercion

localStorage serializes Date objects as JSON strings. Use `z.coerce.date()` in the Zod schema so dates round-trip correctly:

```typescript
nextWateringDate: z.coerce.date(),
creationDate: z.coerce.date(),
lastUpdateDate: z.coerce.date(),
```

Without coercion, `collection.update()` fails because the draft contains a string but the schema expects a Date.

## CRUD mutations

```typescript
// Insert
plantsCollection.insert({ id: crypto.randomUUID(), name: "Monstera", ... });

// Update (Immer-style draft)
plantsCollection.update(plantId, (draft) => {
    draft.name = "Updated Name";
    draft.lastUpdateDate = new Date();
});

// Delete
plantsCollection.delete(plantId);
```

## Querying with useLiveQuery

```typescript
import { useLiveQuery } from "@tanstack/react-db";

const { data: plants } = useLiveQuery((q) => q.from({ plant: plantsCollection }).orderBy("plant.name" as any, "asc"));
```

The collection state is a `Map<string, Plant>`. Access via `plantsCollection.state.size` or `plantsCollection.state.values()`.

## Seed script

Defined in `scripts/seed-plants.ts`. Run via `pnpm seed-plants` (requires the dev server to be running).

- Generates 220-280 plants with real species names in TanStack DB localStorage format
- Writes the JSON to `apps/host/public/seed-plants.json`
- Opens `http://localhost:8080/seed.html` in the default browser, which wipes existing data, loads the seed, and redirects to the app
- The seed is **not** available from the app UI — it is a manual, terminal-only operation
