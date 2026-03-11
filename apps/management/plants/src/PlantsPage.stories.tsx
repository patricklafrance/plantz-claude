import { http, HttpResponse, delay } from "msw";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import type { Plant } from "@packages/plants-core";

import { PlantsPage } from "./PlantsPage.tsx";
import { moduleDecorator } from "./storybook.setup.ts";

// Extreme dates ensure isDueForWatering() returns a deterministic result
// regardless of when the snapshot runs — no Date freeze needed.
const FAR_FUTURE = new Date(2099, 0, 1, 0, 0, 0, 0);
const FAR_PAST = new Date(2020, 0, 1, 0, 0, 0, 0);
const FIXED_CREATION = new Date(2025, 0, 1, 0, 0, 0, 0);

function makePlant(overrides: Partial<Plant> & { id: string; name: string }): Plant {
    return {
        description: undefined,
        family: undefined,
        location: "living-room",
        luminosity: "medium",
        mistLeaves: true,
        soilType: undefined,
        wateringFrequency: "1-week",
        wateringQuantity: "200ml",
        wateringType: "surface",
        nextWateringDate: FAR_FUTURE,
        creationDate: FIXED_CREATION,
        lastUpdateDate: FIXED_CREATION,
        ...overrides,
    };
}

const meta = {
    title: "Management/Plants/Pages/PlantsPage",
    component: PlantsPage,
    decorators: [moduleDecorator],
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
} satisfies Meta<typeof PlantsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
    parameters: {
        msw: {
            handlers: [http.get("/api/management/plants", () => HttpResponse.json([]))],
        },
    },
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/management/plants", () =>
                    HttpResponse.json([
                        makePlant({
                            id: "single-1",
                            name: "Monstera Deliciosa",
                            description: "A tropical plant with large fenestrated leaves.",
                            family: "Araceae",
                        }),
                    ]),
                ),
            ],
        },
    },
};

export const ManyDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/management/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-3", name: "Calathea Orbifolia", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-4", name: "Dracaena Marginata", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-6", name: "Fiddle Leaf Fig", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-7", name: "Golden Barrel Cactus", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-8", name: "Hoya Carnosa", nextWateringDate: FAR_PAST }),
                    ]),
                ),
            ],
        },
    },
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/management/plants", async () => {
                    await delay("infinite");

                    return HttpResponse.json([]);
                }),
            ],
        },
    },
};
