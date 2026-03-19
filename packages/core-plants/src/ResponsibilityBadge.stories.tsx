import type { Meta, StoryObj } from "@storybook/react-vite";

import { ResponsibilityBadge } from "./ResponsibilityBadge.tsx";

const meta = {
    title: "Packages/CorePlants/Components/ResponsibilityBadge",
    component: ResponsibilityBadge,
    parameters: {
        chromatic: {
            modes: {
                "light mobile": { theme: "light", viewport: 375 },
                "light tablet": { theme: "light", viewport: 768 },
                "light desktop": { theme: "light", viewport: 1280 },
                "dark mobile": { theme: "dark", viewport: 375 },
                "dark tablet": { theme: "dark", viewport: 768 },
                "dark desktop": { theme: "dark", viewport: 1280 },
            },
        },
    },
    decorators: [
        (Story) => (
            <div className="p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ResponsibilityBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Assigned: Story = {
    args: {
        assigneeName: "Alice",
    },
};

export const Unassigned: Story = {
    args: {
        assigneeName: null,
    },
};
