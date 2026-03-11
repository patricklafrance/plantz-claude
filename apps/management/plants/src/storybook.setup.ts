import { QueryClient } from "@tanstack/react-query";

import { initializeFireflyForStorybook, withModuleDecorator } from "@packages/core-squide/storybook";

import { managementPlantHandlers, plantsDb, defaultSeedPlants } from "./mocks/index.ts";
import { initManagementPlantsCollection } from "./plantsCollection.ts";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: Infinity,
        },
    },
});

const { worker, mswReady } = initializeFireflyForStorybook(managementPlantHandlers);

export const moduleDecorator = withModuleDecorator({
    worker,
    mswReady,
    handlers: managementPlantHandlers,
    queryClient,
    resetDb: () => plantsDb.reset(defaultSeedPlants),
    register: () => initManagementPlantsCollection(queryClient),
});
