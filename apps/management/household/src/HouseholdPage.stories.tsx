import type { Meta, StoryObj } from "@storybook/react-vite";

import { makeMember } from "@packages/core-module/test-utils";
import { makePlant } from "@packages/core-plants/test-utils";

import { HouseholdPage } from "./HouseholdPage.tsx";
import { createManagementHouseholdHandlers } from "./mocks/index.ts";
import { fireflyDecorator } from "./storybook.setup.tsx";

const defaultMembers = [makeMember({ id: "m1", userId: "user-alice", userName: "Alice", role: "owner" }), makeMember({ id: "m2", userId: "user-bob", userName: "Bob" })];

const defaultPlants = [
    makePlant({ id: "p1", name: "Monstera Deliciosa", householdId: "household-1", responsibilityUserId: "user-bob", responsibilityUserName: "Bob" }),
    makePlant({ id: "p2", name: "Snake Plant", householdId: "household-1" }),
    makePlant({ id: "p3", name: "Pothos", householdId: "household-1", responsibilityUserId: "user-alice", responsibilityUserName: "Alice" }),
];

const meta = {
    title: "Management/Household/Pages/HouseholdPage",
    component: HouseholdPage,
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
    decorators: [fireflyDecorator],
} satisfies Meta<typeof HouseholdPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [{ id: "household-1", name: "Our Apartment", ownerId: "user-alice", creationDate: new Date(2024, 0, 15) }],
                members: defaultMembers,
                plants: defaultPlants,
            }),
        },
    },
};

export const NoHousehold: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers({
                households: [],
                members: [],
                plants: [],
            }),
        },
    },
};

export const Loading: Story = {
    parameters: {
        msw: {
            handlers: createManagementHouseholdHandlers("loading"),
        },
    },
};
