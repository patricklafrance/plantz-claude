import { useQuery } from "@tanstack/react-query";

import { fetchPlants } from "./plantsApi.ts";
import { plantsKeys } from "./plantsQueryKeys.ts";

export function usePlantsQuery() {
    return useQuery({
        queryKey: plantsKeys.lists(),
        queryFn: fetchPlants,
    });
}
