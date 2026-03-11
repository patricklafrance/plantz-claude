import { useQuery } from "@tanstack/react-query";

import { fetchPlants } from "./todayPlantsApi.ts";
import { todayPlantsKeys } from "./todayPlantsQueryKeys.ts";

export function usePlantsQuery() {
    return useQuery({
        queryKey: todayPlantsKeys.lists(),
        queryFn: fetchPlants,
    });
}
