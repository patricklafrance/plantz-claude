import { http, HttpResponse, delay } from "msw";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import type { Plant } from "@packages/plants-core";
import { freezeDate, restoreDate } from "@packages/plants-core/msw";

import { PlantsPage } from "./PlantsPage.tsx";

// Fixed date for deterministic Chromatic snapshots — PlantListItem calls
// isDueForWatering() which uses new Date() internally.
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
    title: "Management/Plants/Pages/PlantsPage",
    component: PlantsPage,
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
} satisfies Meta<typeof PlantsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
    parameters: {
        msw: {
            handlers: [http.get("/api/plants", () => HttpResponse.json([]))],
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
                http.get("/api/plants", () =>
                    HttpResponse.json([
                        makePlant({ id: "due-1", name: "Aloe Vera", nextWateringDate: new Date(2026, 2, 5) }),
                        makePlant({ id: "due-2", name: "Boston Fern", nextWateringDate: new Date(2026, 2, 7) }),
                        makePlant({ id: "due-3", name: "Calathea Orbifolia", nextWateringDate: new Date(2026, 2, 6) }),
                        makePlant({ id: "due-4", name: "Dracaena Marginata", nextWateringDate: new Date(2026, 2, 4) }),
                        makePlant({ id: "due-5", name: "English Ivy", nextWateringDate: new Date(2026, 2, 3) }),
                        makePlant({ id: "due-6", name: "Fiddle Leaf Fig", nextWateringDate: new Date(2026, 2, 9) }),
                        makePlant({ id: "due-7", name: "Golden Barrel Cactus", nextWateringDate: new Date(2026, 2, 2) }),
                        makePlant({ id: "due-8", name: "Hoya Carnosa", nextWateringDate: new Date(2026, 2, 1) }),
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
                http.get("/api/plants", async () => {
                    await delay("infinite");

                    return HttpResponse.json([]);
                }),
            ],
        },
    },
};
