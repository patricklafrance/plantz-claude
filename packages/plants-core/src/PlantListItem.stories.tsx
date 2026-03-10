import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { PlantListItem } from "./PlantListItem.tsx";
import type { Plant } from "./plantSchema.ts";

// Fixed dates for deterministic Chromatic snapshots.
// The Date freeze decorator is required because isDueForWatering() calls new Date() internally.
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0, 0);
const FIXED_FUTURE = new Date(2026, 2, 17, 0, 0, 0, 0);
const FIXED_PAST = new Date(2026, 2, 8, 0, 0, 0, 0);
const OriginalDate = globalThis.Date;

function freezeDate() {
    const Frozen = function (this: Date, ...args: unknown[]) {
        if (args.length === 0) {
            return new OriginalDate(FIXED_NOW);
        }
        return new (OriginalDate as unknown as new (...a: unknown[]) => Date)(...args);
    } as unknown as DateConstructor;
    Object.setPrototypeOf(Frozen, OriginalDate);
    Object.setPrototypeOf(Frozen.prototype, OriginalDate.prototype);
    Frozen.now = () => FIXED_NOW.getTime();
    Frozen.parse = OriginalDate.parse.bind(OriginalDate);
    Frozen.UTC = OriginalDate.UTC.bind(OriginalDate);
    globalThis.Date = Frozen;
}

function restoreDate() {
    globalThis.Date = OriginalDate;
}

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
        nextWateringDate: FIXED_FUTURE,
        creationDate: FIXED_NOW,
        lastUpdateDate: FIXED_NOW,
        ...overrides,
    };
}

const meta = {
    title: "Packages/PlantsCore/Components/PlantListItem",
    component: PlantListItem,
    args: {
        selected: false,
        onToggleSelect: () => {},
        onEdit: () => {},
        onDelete: () => {},
    },
    decorators: [
        (Story) => {
            const frozenRef = useRef(false);
            if (!frozenRef.current) {
                freezeDate();
                frozenRef.current = true;
            }

            useEffect(() => {
                return () => {
                    restoreDate();
                };
            }, []);

            return (
                <div className="border-border w-[900px] rounded-lg border">
                    <Story />
                </div>
            );
        },
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
        plant: makePlant({ nextWateringDate: FIXED_PAST }),
    },
};

export const DueAndSelected: Story = {
    args: {
        plant: makePlant({ nextWateringDate: FIXED_PAST }),
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
            nextWateringDate: new Date(2026, 2, 10, 0, 0, 0, 0),
        }),
    },
};

export const NoEditButton: Story = {
    args: {
        plant: makePlant(),
        onEdit: undefined,
    },
};
