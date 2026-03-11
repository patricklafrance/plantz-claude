import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Plant } from "@packages/plants-core";

import { deletePlants } from "./todayPlantsApi.ts";
import { todayPlantsKeys } from "./todayPlantsQueryKeys.ts";

export function useDeletePlants() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => deletePlants(ids),
        onMutate: async (ids: string[]) => {
            await queryClient.cancelQueries({ queryKey: todayPlantsKeys.lists() });
            const previous = queryClient.getQueryData<Plant[]>(todayPlantsKeys.lists());
            const idSet = new Set(ids);
            queryClient.setQueryData<Plant[]>(todayPlantsKeys.lists(), (old) => old?.filter((p) => !idSet.has(p.id)));

            return { previous };
        },
        onError: (_err, _ids, context) => {
            if (context?.previous) {
                queryClient.setQueryData(todayPlantsKeys.lists(), context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: todayPlantsKeys.lists() });
        },
    });
}
