import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { PlantListItem } from "./PlantListItem.tsx";
import type { Plant } from "./plantSchema.ts";

function makePlant(overrides: Partial<Plant> = {}): Plant {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 7);

    return {
        id: "test-1",
        name: "Monstera Deliciosa",
        description: "A tropical plant",
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
    title: "Management/Plants/Components/PlantListItem",
    component: PlantListItem,
    args: {
        selected: false,
        onToggleSelect: () => {},
        onEdit: () => {},
        onDelete: () => {},
    },
    decorators: [
        (Story) => (
            <div className="border-border w-[900px] rounded-lg border">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PlantListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        plant: makePlant(),
    },
};

export const Selected: Story = {
    args: {
        plant: makePlant(),
        selected: true,
    },
};

export const DueForWatering: Story = {
    args: {
        plant: makePlant({ nextWateringDate: pastDate() }),
    },
};

export const DueAndSelected: Story = {
    args: {
        plant: makePlant({ nextWateringDate: pastDate() }),
        selected: true,
    },
};

export const LongName: Story = {
    args: {
        plant: makePlant({
            name: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant Collection",
        }),
    },
};

export const LongFieldValues: Story = {
    args: {
        plant: makePlant({
            wateringQuantity: "500ml every other day when soil is dry",
            wateringType: "deep",
            location: "bathroom",
        }),
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

export const DueToday: Story = {
    args: {
        plant: makePlant({
            nextWateringDate: (() => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                return d;
            })(),
        }),
    },
};

export const NoEditButton: Story = {
    args: {
        plant: makePlant(),
        onEdit: undefined,
    },
};
