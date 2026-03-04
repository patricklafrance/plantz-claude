import type { FireflyRuntime, ModuleRegisterFunction } from "@squide/firefly";

function registerRoutes(runtime: FireflyRuntime) {
    runtime.registerRoute({
        path: "/today",
        lazy: async () => {
            const { LandingPage } = await import("./LandingPage.tsx");

            return {
                element: <LandingPage />
            };
        }
    });

    runtime.registerNavigationItem({
        $id: "today-landing-page",
        $label: "Today",
        to: "/today"
    });
}

export const registerTodayLandingPage: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    registerRoutes(runtime);
};
