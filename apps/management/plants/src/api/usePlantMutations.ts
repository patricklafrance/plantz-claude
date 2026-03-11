import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Plant } from "@packages/plants-core";

import { createPlant, deletePlant, deletePlants, updatePlant } from "./managementPlantsApi.ts";
import { managementPlantsKeys } from "./managementPlantsQueryKeys.ts";

export function useCreatePlant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Plant, "id" | "creationDate" | "lastUpdateDate">) => createPlant(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: managementPlantsKeys.lists() });
        },
    });
}

export function useUpdatePlant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Partial<Plant>) => updatePlant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: managementPlantsKeys.lists() });
        },
    });
}

export function useDeletePlant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePlant(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: managementPlantsKeys.lists() });
            const previous = queryClient.getQueryData<Plant[]>(managementPlantsKeys.lists());
            queryClient.setQueryData<Plant[]>(managementPlantsKeys.lists(), (old) => old?.filter((p) => p.id !== id));

            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(managementPlantsKeys.lists(), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: managementPlantsKeys.lists() });
        },
    });
}

export function useDeletePlants() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => deletePlants(ids),
        onMutate: async (ids: string[]) => {
            await queryClient.cancelQueries({ queryKey: managementPlantsKeys.lists() });
            const previous = queryClient.getQueryData<Plant[]>(managementPlantsKeys.lists());
            const idSet = new Set(ids);
            queryClient.setQueryData<Plant[]>(managementPlantsKeys.lists(), (old) => old?.filter((p) => !idSet.has(p.id)));

            return { previous };
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) {
                queryClient.setQueryData(managementPlantsKeys.lists(), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: managementPlantsKeys.lists() });
        },
    });
}
