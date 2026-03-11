import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { initTodayPlantsCollection } from "./plantsCollection.ts";

function registerRoutes(runtime: FireflyRuntime) {
    const lazy = async () => {
        const { LandingPage } = await import("./LandingPage.tsx");

        return {
            element: <LandingPage />,
        };
    };

    runtime.registerRoute({
        index: true,
        lazy,
    });

    runtime.registerRoute({
        path: "/today",
        lazy,
    });

    runtime.registerNavigationItem({
        $id: "today-landing-page",
        $label: "Today",
        to: "/today",
    });
}

export async function registerTodayLandingPage(runtime: FireflyRuntime, queryClient: QueryClient) {
    initTodayPlantsCollection(queryClient);
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { todayPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(todayPlantHandlers);
    }
}
