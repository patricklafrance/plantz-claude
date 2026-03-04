import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";

function registerRoutes(runtime: FireflyRuntime) {
    runtime.registerRoute({
        path: "/management/plants",
        lazy: async () => {
            const { PlantsPage } = await import("./PlantsPage.tsx");

            return {
                element: <PlantsPage />
            };
        }
    });

    runtime.registerNavigationItem({
        $id: "management-plants",
        $label: "Plants",
        to: "/management/plants"
    });
}

export const registerManagementPlants: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    registerRoutes(runtime);
};
