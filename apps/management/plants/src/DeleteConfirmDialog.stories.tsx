import type { Meta, StoryObj } from "@storybook/react-vite";

import { DeleteConfirmDialog } from "@packages/plants-core";

const meta = {
    title: "Management/Plants/Components/DeleteConfirmDialog",
    component: DeleteConfirmDialog,
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
    args: {
        open: true,
        onOpenChange: () => {},
        onConfirm: () => {},
    },
} satisfies Meta<typeof DeleteConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SinglePlant: Story = {
    args: {
        plantNames: ["Monstera Deliciosa"],
    },
};

export const MultiplePlants: Story = {
    args: {
        plantNames: ["Monstera Deliciosa", "Golden Pothos", "Snake Plant"],
    },
};

export const ManyPlants: Story = {
    args: {
        plantNames: [
            "Monstera Deliciosa",
            "Golden Pothos",
            "Snake Plant",
            "Peace Lily",
            "Fiddle Leaf Fig",
            "Spider Plant",
            "Rubber Plant",
            "Aloe Vera",
            "Bird of Paradise",
            "ZZ Plant",
            "Philodendron",
            "Calathea Orbifolia",
            "String of Pearls",
            "Chinese Money Plant",
            "Boston Fern",
            "Jade Plant",
            "African Violet",
            "Dracaena Marginata",
            "Croton Petra",
            "Anthurium Clarinervium",
        ],
    },
};

export const LongPlantName: Story = {
    args: {
        plantNames: ["Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant", "Monstera Adansonii Swiss Cheese Variegated Albo Borsigiana Extremely Rare Collector Item", "Begonia Maculata Polka Dot Angel Wing Silver Spotted Premium Indoor Collection"],
    },
};

export const EmptyPlantNames: Story = {
    args: {
        plantNames: [],
    },
};

export const Closed: Story = {
    args: {
        open: false,
        plantNames: ["Monstera Deliciosa"],
    },
};
