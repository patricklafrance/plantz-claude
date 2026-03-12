import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlantListHeader } from "./PlantListHeader.tsx";

const meta = {
    title: "Packages/PlantsCore/Components/PlantListHeader",
    component: PlantListHeader,
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
    decorators: [
        (Story) => (
            <div className="border-border w-full max-w-[1200px] rounded-lg border">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof PlantListHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCheckbox: Story = {
    args: {
        selectAllChecked: false,
        onToggleSelectAll: () => {},
    },
};

export const WithCheckboxChecked: Story = {
    args: {
        selectAllChecked: true,
        onToggleSelectAll: () => {},
    },
};

export const WithActions: Story = {
    args: {
        showActions: true,
    },
};

export const WithCheckboxAndActions: Story = {
    args: {
        showActions: true,
        selectAllChecked: false,
        onToggleSelectAll: () => {},
    },
};
