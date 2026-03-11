import { createOptimisticAction } from "@tanstack/db";
import type { QueryClient } from "@tanstack/react-query";

import { plantSchema, type Plant } from "@packages/plants-core";
import { createPlantsCollection, type PlantsCollection } from "@packages/plants-core/collection";

const API_BASE = "/api/today/plants";

async function fetchPlants(): Promise<Plant[]> {
    const response = await fetch(API_BASE);

    if (!response.ok) {
        throw new Error(`Failed to fetch plants: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => plantSchema.parse(item));
}

let collection: PlantsCollection | undefined;

export function initTodayPlantsCollection(queryClient: QueryClient) {
    if (collection) return;

    collection = createPlantsCollection({
        queryKey: ["today", "plants", "list"],
        queryFn: fetchPlants,
        queryClient,
    });
}

export function getTodayPlantsCollection(): PlantsCollection {
    if (!collection) {
        throw new Error("Collection not initialized. Call initTodayPlantsCollection() first.");
    }

    return collection;
}

// Reset singleton on HMR so the collection is re-created with fresh references.
// oxlint-disable @typescript-eslint/no-explicit-any -- import.meta.hot is provided by the bundler at runtime
if ((import.meta as any).hot) {
    (import.meta as any).hot.dispose(() => {
        collection = undefined;
    });
}

export function createTodayPlantActions(plantsCollection: PlantsCollection) {
    const deletePlants = createOptimisticAction<string[]>({
        onMutate: (ids) => {
            for (const id of ids) {
                plantsCollection.delete(id);
            }
        },
        mutationFn: async (ids) => {
            const response = await fetch(API_BASE, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete plants: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    return { deletePlants };
}
