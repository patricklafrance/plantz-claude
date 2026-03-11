import { createOptimisticAction } from "@tanstack/db";
import type { QueryClient } from "@tanstack/react-query";

import { plantSchema, type Plant } from "@packages/plants-core";
import { createPlantsCollection, type PlantsCollection } from "@packages/plants-core/collection";

const API_BASE = "/api/management/plants";

async function fetchPlants(): Promise<Plant[]> {
    const response = await fetch(API_BASE);

    if (!response.ok) {
        throw new Error(`Failed to fetch plants: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => plantSchema.parse(item));
}

let collection: PlantsCollection | undefined;

export function initManagementPlantsCollection(queryClient: QueryClient) {
    if (collection) return;

    collection = createPlantsCollection({
        queryKey: ["management", "plants", "list"],
        queryFn: fetchPlants,
        queryClient,
    });
}

export function getManagementPlantsCollection(): PlantsCollection {
    if (!collection) {
        throw new Error("Collection not initialized. Call initManagementPlantsCollection() first.");
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

export function createManagementPlantActions(plantsCollection: PlantsCollection) {
    const insertPlant = createOptimisticAction<Omit<Plant, "id" | "creationDate" | "lastUpdateDate">>({
        onMutate: (data) => {
            plantsCollection.insert({
                ...data,
                id: crypto.randomUUID(),
                creationDate: new Date(),
                lastUpdateDate: new Date(),
            } as Plant);
        },
        mutationFn: async (data) => {
            const response = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Failed to create plant: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    const updatePlant = createOptimisticAction<{ id: string } & Partial<Plant>>({
        onMutate: ({ id, ...changes }) => {
            plantsCollection.update(id, (draft) => {
                Object.assign(draft, changes, { lastUpdateDate: new Date() });
            });
        },
        mutationFn: async ({ id, ...data }) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Failed to update plant ${id}: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

    const deletePlant = createOptimisticAction<string>({
        onMutate: (id) => {
            plantsCollection.delete(id);
        },
        mutationFn: async (id) => {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`Failed to delete plant ${id}: ${response.status}`);
            }

            await plantsCollection.utils.refetch();
        },
    });

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

    return { insertPlant, updatePlant, deletePlant, deletePlants };
}
