import type { Meta, StoryObj } from "storybook-react-rsbuild";

import type { Plant } from "@packages/plants-core";

import { EditPlantDialog } from "./EditPlantDialog.tsx";

function makePlant(overrides: Partial<Plant> = {}): Plant {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);

    return {
        id: "test-edit-1",
        name: "Monstera Deliciosa",
        description: "A tropical plant with large fenestrated leaves",
        family: "Araceae",
        location: "living-room",
        luminosity: "medium",
        mistLeaves: true,
        soilType: "Well-draining mix",
        wateringFrequency: "1-week",
        wateringQuantity: "200ml",
        wateringType: "surface",
        nextWateringDate: future,
        creationDate: now,
        lastUpdateDate: now,
        ...overrides,
    };
}

function pastDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d;
}

const meta = {
    title: "Management/Plants/Components/EditPlantDialog",
    component: EditPlantDialog,
    args: {
        open: true,
        onOpenChange: () => {},
        onDelete: () => {},
    },
} satisfies Meta<typeof EditPlantDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPlant: Story = {
    args: {
        plant: makePlant(),
    },
};

export const MinimalPlant: Story = {
    args: {
        plant: makePlant({
            description: undefined,
            family: undefined,
            soilType: undefined,
        }),
    },
};

export const AllOptionalFieldsFilled: Story = {
    args: {
        plant: makePlant({
            description: "Beautiful tropical plant known for its distinctive split leaves and aerial roots. Thrives in indirect light.",
            family: "Araceae",
            soilType: "Peat moss, perlite, and orchid bark mix",
        }),
    },
};

export const DueForWatering: Story = {
    args: {
        plant: makePlant({ nextWateringDate: pastDate() }),
    },
};

export const MistLeavesFalse: Story = {
    args: {
        plant: makePlant({ mistLeaves: false }),
    },
};

export const LongFieldValues: Story = {
    args: {
        plant: makePlant({
            name: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant Collection Premium Series",
            description:
                "This is an exceptionally rare and beautiful tropical plant that has been carefully cultivated over many generations. Known for its distinctive pinstripe variegation patterns on dark green leaves, it thrives in indirect light conditions and requires consistent moisture without overwatering. Originally native to the tropical forests of South America.",
            family: "Araceae (Philodendron subfamily)",
            soilType: "Premium organic peat moss mixed with perlite, vermiculite, and orchid bark in equal parts",
            wateringQuantity: "250ml slowly poured around the base every 5-7 days",
        }),
    },
};

export const NullPlant: Story = {
    args: {
        plant: null,
    },
};

export const Closed: Story = {
    args: {
        plant: makePlant(),
        open: false,
    },
};
