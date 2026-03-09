import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { plantSchema, type Plant } from "./plantSchema.ts";

export const plantsCollection = createCollection(
    localStorageCollectionOptions({
        id: "plants",
        storageKey: "plantz-plants",
        getKey: (item: Plant) => item.id,
        schema: plantSchema,
    })
);
