import type { Meta, StoryObj } from "@storybook/react-vite";

import { makeMember } from "@packages/core-module/test-utils";
import { makePlant } from "@packages/core-plants/test-utils";

import { SharePlantDialog } from "./SharePlantDialog.tsx";

const households = [{ id: "household-1", name: "Our Apartment" }];

const members = [makeMember({ id: "m1", userId: "user-alice", userName: "Alice", role: "owner" }), makeMember({ id: "m2", userId: "user-bob", userName: "Bob" })];

const meta = {
    title: "Management/Plants/Components/SharePlantDialog",
    component: SharePlantDialog,
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
        onShare: () => {},
        households,
        members,
    },
} satisfies Meta<typeof SharePlantDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
    args: {
        plant: makePlant({ id: "p1", name: "Monstera Deliciosa" }),
    },
};

export const WithHouseholdSelected: Story = {
    args: {
        plant: makePlant({ id: "p1", name: "Monstera Deliciosa" }),
    },
};

export const AlreadyShared: Story = {
    args: {
        plant: makePlant({ id: "p1", name: "Monstera Deliciosa", householdId: "household-1", responsibilityUserId: "user-bob", responsibilityUserName: "Bob" }),
    },
};
