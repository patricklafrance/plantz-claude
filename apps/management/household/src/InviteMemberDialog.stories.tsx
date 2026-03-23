import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteMemberDialog } from "./InviteMemberDialog.tsx";

const meta = {
    title: "Management/Household/Components/InviteMemberDialog",
    component: InviteMemberDialog,
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
} satisfies Meta<typeof InviteMemberDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const WithEmail: Story = {
    render: (args) => {
        return <InviteMemberDialog {...args} />;
    },
};

export const InvalidEmail: Story = {
    render: (args) => {
        return <InviteMemberDialog {...args} />;
    },
};
