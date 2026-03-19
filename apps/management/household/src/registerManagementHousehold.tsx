import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

function registerRoutes(runtime: FireflyRuntime) {
    runtime.registerRoute({
        path: "/management/household",
        lazy: async () => {
            const { HouseholdPage } = await import("./HouseholdPage.tsx");

            return {
                element: <HouseholdPage />,
            };
        },
    });

    runtime.registerNavigationItem({
        $id: "management-household",
        $label: "Household",
        $priority: 80,
        to: "/management/household",
    });
}

export async function registerManagementHousehold(runtime: FireflyRuntime, _queryClient: QueryClient) {
    registerRoutes(runtime);

    if (runtime.isMswEnabled) {
        const { managementHouseholdHandlers } = await import("./mocks/index.ts");
        runtime.registerRequestHandlers(managementHouseholdHandlers);
    }
}
