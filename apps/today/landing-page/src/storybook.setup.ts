import { QueryClient } from "@tanstack/react-query";

import { initializeFireflyForStorybook, withModuleDecorator } from "@packages/core-squide/storybook";

import { todayPlantHandlers, plantsDb, defaultSeedPlants } from "./mocks/index.ts";
import { initTodayPlantsCollection } from "./plantsCollection.ts";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: Infinity,
        },
    },
});

const { worker, mswReady } = initializeFireflyForStorybook(todayPlantHandlers);

export const moduleDecorator = withModuleDecorator({
    worker,
    mswReady,
    handlers: todayPlantHandlers,
    queryClient,
    resetDb: () => plantsDb.reset(defaultSeedPlants),
    register: () => initTodayPlantsCollection(queryClient),
});
