import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { initManagementPlantsCollection } from "./plantsCollection.ts";

function registerRoutes(runtime: FireflyRuntime) {
    runtime.registerRoute({
        path: "/management/plants",
        lazy: async () => {
            const { PlantsPage } = await import("./PlantsPage.tsx");

            return {
                element: <PlantsPage />,
            };
        },
    });

    runtime.registerNavigationItem({
        $id: "management-plants",
        $label: "Plants",
        $priority: 90,
        to: "/management/plants",
    });
}

export async function registerManagementPlants(runtime: FireflyRuntime, queryClient: QueryClient) {
    initManagementPlantsCollection(queryClient);
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { managementPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementPlantHandlers);
    }
}
