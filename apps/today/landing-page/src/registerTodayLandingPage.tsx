import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";

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

export const registerTodayLandingPage: ModuleRegisterFunction<FireflyRuntime> = async (runtime) => {
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { todayPlantHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(todayPlantHandlers);
    }
};
