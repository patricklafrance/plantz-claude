import type { Meta, StoryObj } from "@storybook/react-vite";

import { makeMember } from "@packages/core-module/test-utils";
import { makePlant } from "@packages/core-plants/test-utils";

import { SharedPlantsList } from "./SharedPlantsList.tsx";

const members = [makeMember({ id: "m1", userId: "user-alice", userName: "Alice", role: "owner" }), makeMember({ id: "m2", userId: "user-bob", userName: "Bob" })];

const meta = {
    title: "Management/Household/Components/SharedPlantsList",
    component: SharedPlantsList,
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
        members,
        onUnshare: () => {},
        onAssign: () => {},
    },
    decorators: [
        (Story) => (
            <div className="max-w-2xl p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof SharedPlantsList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPlants: Story = {
    args: {
        plants: [makePlant({ id: "p1", name: "Monstera Deliciosa", householdId: "household-1" }), makePlant({ id: "p2", name: "Snake Plant", householdId: "household-1" }), makePlant({ id: "p3", name: "Pothos", householdId: "household-1" })],
    },
};

export const Empty: Story = {
    args: {
        plants: [],
    },
};

export const WithAssignees: Story = {
    args: {
        plants: [
            makePlant({ id: "p1", name: "Monstera Deliciosa", householdId: "household-1", responsibilityUserId: "user-bob", responsibilityUserName: "Bob" }),
            makePlant({ id: "p2", name: "Snake Plant", householdId: "household-1", responsibilityUserId: "user-alice", responsibilityUserName: "Alice" }),
            makePlant({ id: "p3", name: "Pothos", householdId: "household-1" }),
        ],
    },
};
