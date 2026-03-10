import { http, HttpResponse } from "msw";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import type { Plant } from "@packages/plants-core";
import { freezeDate, restoreDate } from "@packages/plants-core/msw";

import { LandingPage } from "./LandingPage.tsx";

// Fixed date for deterministic Chromatic snapshots — PlantListItem calls
// isDueForWatering() which uses new Date() internally, and LandingPage
// filters plants by isDueForWatering().
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0, 0);

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
        nextWateringDate: new Date(2026, 3, 1, 0, 0, 0, 0),
        creationDate: new Date(2026, 0, 1, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 2, 1, 0, 0, 0, 0),
        ...overrides,
    };
}

const meta = {
    title: "Today/LandingPage/Pages/LandingPage",
    component: LandingPage,
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
    decorators: [
        (Story) => {
            const frozenRef = useRef(false);
            if (!frozenRef.current) {
                freezeDate(FIXED_NOW);
                frozenRef.current = true;
            }

            useEffect(() => {
                return () => {
                    restoreDate();
                };
            }, []);

            return <Story />;
        },
    ],
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: mix of due and not-due plants (landing page filters to due only)
export const Default: Story = {
    parameters: {
        msw: {
            handlers: [
                http.get("/api/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: new Date(2026, 2, 5) }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: new Date(2026, 2, 7) }),
                        makePlant({ id: "not-due-1", name: "Cactus", nextWateringDate: new Date(2026, 5, 1) }),
                        makePlant({ id: "due-3", name: "Dracaena", nextWateringDate: new Date(2026, 2, 4) }),
                        makePlant({ id: "not-due-2", name: "Echeveria", nextWateringDate: new Date(2026, 5, 15) }),
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
                http.get("/api/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "future-1", name: "Monstera", nextWateringDate: new Date(2026, 5, 1) }),
                        makePlant({ id: "future-2", name: "Pothos", nextWateringDate: new Date(2026, 5, 5) }),
                        makePlant({ id: "future-3", name: "Snake Plant", nextWateringDate: new Date(2026, 6, 1) }),
                    ]),
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
                http.get("/api/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: new Date(2026, 2, 5) }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: new Date(2026, 2, 7) }),
                        makePlant({ id: "due-3", name: "Calathea", nextWateringDate: new Date(2026, 2, 6) }),
                        makePlant({ id: "due-4", name: "Dracaena", nextWateringDate: new Date(2026, 2, 4) }),
                        makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: new Date(2026, 2, 3) }),
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
                http.get("/api/plants", () =>
                    HttpResponse.json([
                        makePlant({
                            id: "single-1",
                            name: "Monstera Deliciosa",
                            description: "A tropical plant with large fenestrated leaves.",
                            family: "Araceae",
                            nextWateringDate: new Date(2026, 2, 8),
                        }),
                    ]),
                ),
            ],
        },
    },
};
