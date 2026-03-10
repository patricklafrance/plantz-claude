import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";

function registerRoutes(runtime: FireflyRuntime) {
    const lazy = async () => {
        const { PlantsPage } = await import("./PlantsPage.tsx");

        return {
            element: <PlantsPage />,
        };
    };

    runtime.registerRoute({
        index: true,
        lazy,
    });

    runtime.registerRoute({
        path: "/management/plants",
        lazy,
    });

    runtime.registerNavigationItem({
        $id: "management-plants",
        $label: "Plants",
        to: "/management/plants",
    });
}

export const registerManagementPlants: ModuleRegisterFunction<FireflyRuntime> = (runtime) => {
    registerRoutes(runtime);
};
