import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPlant, deletePlant, deletePlants, updatePlant } from "./plantsApi.ts";
import type { Plant } from "./plantSchema.ts";
import { plantsKeys } from "./plantsQueryKeys.ts";

export function useCreatePlant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Plant, "id" | "creationDate" | "lastUpdateDate">) => createPlant(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: plantsKeys.lists() });
        },
    });
}

export function useUpdatePlant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Partial<Plant>) => updatePlant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: plantsKeys.lists() });
        },
    });
}

export function useDeletePlant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePlant(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: plantsKeys.lists() });
            const previous = queryClient.getQueryData<Plant[]>(plantsKeys.lists());
            queryClient.setQueryData<Plant[]>(plantsKeys.lists(), (old) => old?.filter((p) => p.id !== id));

            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(plantsKeys.lists(), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: plantsKeys.lists() });
        },
    });
}

export function useDeletePlants() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => deletePlants(ids),
        onMutate: async (ids: string[]) => {
            await queryClient.cancelQueries({ queryKey: plantsKeys.lists() });
            const previous = queryClient.getQueryData<Plant[]>(plantsKeys.lists());
            const idSet = new Set(ids);
            queryClient.setQueryData<Plant[]>(plantsKeys.lists(), (old) => old?.filter((p) => !idSet.has(p.id)));

            return { previous };
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) {
                queryClient.setQueryData(plantsKeys.lists(), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: plantsKeys.lists() });
        },
    });
}
