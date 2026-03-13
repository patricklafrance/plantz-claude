import type { Meta, StoryObj } from "@storybook/react-vite";

import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/plants-core/test-utils";

import { LandingPage } from "./LandingPage.tsx";
import { createTodayPlantHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Today/LandingPage/Pages/LandingPage",
    component: LandingPage,
    decorators: [collectionDecorator, fireflyDecorator],
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: mix of due and not-due plants (landing page filters to due only)
export const Default: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE }),
                makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: FAR_PAST }),
                makePlant({ id: "not-due-2", name: "Echeveria", nextWateringDate: FAR_FUTURE }),
            ]),
        },
    },
};

// All plants have future watering dates -- none are due
export const NoPlantsDue: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([makePlant({ id: "future-1", name: "Monstera", nextWateringDate: FAR_FUTURE }), makePlant({ id: "future-2", name: "Pothos", nextWateringDate: FAR_FUTURE }), makePlant({ id: "future-3", name: "Snake Plant", nextWateringDate: FAR_FUTURE })]),
        },
    },
};

// All plants have past watering dates -- all are due
export const AllDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-3", name: "Calathea", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-4", name: "Dracaena", nextWateringDate: FAR_PAST }),
                makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST }),
            ]),
        },
    },
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: createTodayPlantHandlers([
                makePlant({
                    id: "single-1",
                    name: "Monstera Deliciosa",
                    description: "A tropical plant with large fenestrated leaves.",
                    family: "Araceae",
                    nextWateringDate: FAR_PAST,
                }),
            ]),
        },
    },
};

export const Empty: Story = {
    parameters: {
        msw: { handlers: createTodayPlantHandlers([]) },
    },
};

export const Loading: Story = {
    parameters: {
        msw: { handlers: createTodayPlantHandlers("loading") },
    },
};
