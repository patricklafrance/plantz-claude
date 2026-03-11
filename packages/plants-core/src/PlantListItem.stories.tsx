import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { PlantListItem } from "./PlantListItem.tsx";
import type { Plant } from "./plantSchema.ts";

// Extreme dates ensure isDueForWatering() returns a deterministic result
// regardless of when the snapshot runs — no Date freeze needed.
const FAR_FUTURE = new Date(2099, 0, 1, 0, 0, 0, 0);
const FAR_PAST = new Date(2020, 0, 1, 0, 0, 0, 0);
const FIXED_CREATION = new Date(2025, 0, 1, 0, 0, 0, 0);

function makePlant(overrides: Partial<Plant> = {}): Plant {
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
        nextWateringDate: FAR_FUTURE,
        creationDate: FIXED_CREATION,
        lastUpdateDate: FIXED_CREATION,
        ...overrides,
    };
}

const meta = {
    title: "Packages/PlantsCore/Components/PlantListItem",
    component: PlantListItem,
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
    args: {
        selected: false,
        onToggleSelect: () => {},
        onEdit: () => {},
        onDelete: () => {},
    },
    decorators: [
        (Story) => (
            <div className="border-border w-full max-w-[900px] rounded-lg border">
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
        plant: makePlant({ nextWateringDate: FAR_PAST }),
    },
};

export const DueAndSelected: Story = {
    args: {
        plant: makePlant({ nextWateringDate: FAR_PAST }),
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
        // Use FAR_PAST — a plant due "today" would be non-deterministic across runs,
        // so we test the "due" visual state with a clearly past date instead.
        plant: makePlant({
            nextWateringDate: FAR_PAST,
        }),
    },
};

export const NoEditButton: Story = {
    args: {
        plant: makePlant(),
        onEdit: undefined,
    },
};
