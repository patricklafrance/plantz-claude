import type { Meta, StoryObj } from "@storybook/react-vite";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";

const meta = {
    title: "Management/Household/Components/CreateHouseholdDialog",
    component: CreateHouseholdDialog,
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
    args: {
        open: true,
        onOpenChange: () => {},
        onSubmit: async () => {},
    },
} satisfies Meta<typeof CreateHouseholdDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const WithName: Story = {
    render: (args) => {
        // Re-render with pre-filled value via a wrapper
        return <CreateHouseholdDialog {...args} />;
    },
};
