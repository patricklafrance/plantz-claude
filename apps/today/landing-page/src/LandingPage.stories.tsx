import { http, HttpResponse } from "msw";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import type { Plant } from "@packages/plants-core";

import { LandingPage } from "./LandingPage.tsx";

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
    title: "Today/LandingPage/Pages/LandingPage",
    component: LandingPage,
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
            handlers: [
                http.get("/api/today/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: FAR_FUTURE }),
                        makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "not-due-2", name: "Echeveria", nextWateringDate: FAR_FUTURE }),
                    ]),
                ),
            ],
        },
    },
};

// All plants have future watering dates -- none are due
export const NoPlantsdue: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/today/plants", () =>
                    HttpResponse.json([makePlant({ id: "future-1", name: "Monstera", nextWateringDate: FAR_FUTURE }), makePlant({ id: "future-2", name: "Pothos", nextWateringDate: FAR_FUTURE }), makePlant({ id: "future-3", name: "Snake Plant", nextWateringDate: FAR_FUTURE })]),
                ),
            ],
        },
    },
};

// All plants have past watering dates -- all are due
export const AllDueForWatering: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/today/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-3", name: "Calathea", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-4", name: "Dracaena", nextWateringDate: FAR_PAST }),
                        makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: FAR_PAST }),
                    ]),
                ),
            ],
        },
    },
};

export const SinglePlant: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/today/plants", () =>
                    HttpResponse.json([
                        makePlant({
                            id: "single-1",
                            name: "Monstera Deliciosa",
                            description: "A tropical plant with large fenestrated leaves.",
                            family: "Araceae",
                            nextWateringDate: FAR_PAST,
                        }),
                    ]),
                ),
            ],
        },
    },
};
