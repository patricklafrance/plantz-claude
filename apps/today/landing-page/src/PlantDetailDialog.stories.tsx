import type { Meta, StoryObj } from "storybook-react-rsbuild";

import type { Plant } from "@packages/plants-core";

import { PlantDetailDialog } from "./PlantDetailDialog.tsx";

const FAR_PAST = new Date(2020, 0, 1, 0, 0, 0, 0);
const FIXED_CREATION = new Date(2025, 0, 1, 0, 0, 0, 0);

function makePlant(overrides: Partial<Plant> = {}): Plant {
    return {
        id: "test-1",
        name: "Monstera Deliciosa",
        description: "A tropical plant with large fenestrated leaves.",
        family: "Araceae",
        location: "living-room",
        luminosity: "medium",
        mistLeaves: true,
        soilType: "Well-draining mix",
        wateringFrequency: "1-week",
        wateringQuantity: "200ml",
        wateringType: "surface",
        nextWateringDate: FAR_PAST,
        creationDate: FIXED_CREATION,
        lastUpdateDate: FIXED_CREATION,
        ...overrides,
    };
}

const meta = {
    title: "Today/LandingPage/Components/PlantDetailDialog",
    component: PlantDetailDialog,
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
    args: {
        open: true,
        onOpenChange: () => {},
    },
} satisfies Meta<typeof PlantDetailDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        plant: makePlant(),
    },
};

export const MinimalFields: Story = {
    args: {
        plant: makePlant({
            description: undefined,
            family: undefined,
            soilType: undefined,
        }),
    },
};

export const LongValues: Story = {
    args: {
        plant: makePlant({
            name: "Philodendron Birkin Variegated Extra Special Limited Edition",
            description: "A rare variegated cultivar of the Philodendron Birkin with stunning white pinstripe patterns on dark green leaves. Requires consistent humidity and indirect light.",
            wateringQuantity: "500ml every other day when soil is dry",
        }),
    },
};
