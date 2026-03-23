import type { Meta, StoryObj } from "@storybook/react-vite";

import { makeMember } from "@packages/core-module/test-utils";

import { MembersList } from "./MembersList.tsx";

const meta = {
    title: "Management/Household/Components/MembersList",
    component: MembersList,
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
        currentUserId: "user-alice",
        onRemove: () => {},
    },
    decorators: [
        (Story) => (
            <div className="max-w-lg p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MembersList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithMembers: Story = {
    args: {
        members: [makeMember({ id: "m1", userId: "user-alice", userName: "Alice", role: "owner" }), makeMember({ id: "m2", userId: "user-bob", userName: "Bob" }), makeMember({ id: "m3", userId: "user-charlie", userName: "Charlie" })],
    },
};

export const SingleMember: Story = {
    args: {
        members: [makeMember({ id: "m1", userId: "user-alice", userName: "Alice", role: "owner" })],
    },
};

export const CurrentUserIsOwner: Story = {
    args: {
        currentUserId: "user-alice",
        members: [makeMember({ id: "m1", userId: "user-alice", userName: "Alice", role: "owner" }), makeMember({ id: "m2", userId: "user-bob", userName: "Bob" })],
    },
};
