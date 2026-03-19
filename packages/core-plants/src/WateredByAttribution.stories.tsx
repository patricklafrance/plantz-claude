import type { Meta, StoryObj } from "@storybook/react-vite";

import { WateredByAttribution } from "./WateredByAttribution.tsx";

const meta = {
    title: "Packages/CorePlants/Components/WateredByAttribution",
    component: WateredByAttribution,
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
} satisfies Meta<typeof WateredByAttribution>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RecentlyWatered: Story = {
    args: {
        actorName: "Alice",
        eventDate: new Date(2025, 0, 15, 11, 30),
        now: new Date(2025, 0, 15, 12, 0),
    },
};

export const WateredHoursAgo: Story = {
    args: {
        actorName: "Bob",
        eventDate: new Date(2025, 0, 15, 10, 0),
        now: new Date(2025, 0, 15, 12, 0),
    },
};
