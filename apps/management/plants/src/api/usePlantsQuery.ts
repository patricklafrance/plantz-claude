import { useQuery } from "@tanstack/react-query";

import { fetchPlants } from "./managementPlantsApi.ts";
import { managementPlantsKeys } from "./managementPlantsQueryKeys.ts";

export function usePlantsQuery() {
    return useQuery({
        queryKey: managementPlantsKeys.lists(),
        queryFn: fetchPlants,
    });
}
