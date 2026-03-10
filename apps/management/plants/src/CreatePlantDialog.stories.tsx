import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { freezeDate, restoreDate } from "@packages/plants-core/msw";

import { CreatePlantDialog } from "./CreatePlantDialog.tsx";

// Fixed date for deterministic Chromatic snapshots — the component internally
// calls `new Date()` to compute the default "first watering date", so we freeze
// the global Date constructor for the lifetime of each story.
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0, 0);

const meta = {
    title: "Management/Plants/Components/CreatePlantDialog",
    component: CreatePlantDialog,
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
    },
    args: {
        open: true,
        onOpenChange: () => {},
    },
    decorators: [
        (Story) => {
            // Freeze Date synchronously so the component's initial render sees the fixed date.
            const frozenRef = useRef(false);
            if (!frozenRef.current) {
                freezeDate(FIXED_NOW);
                frozenRef.current = true;
            }

            useEffect(() => {
                return () => {
                    restoreDate();
                };
            }, []);

            return <Story />;
        },
    ],
} satisfies Meta<typeof CreatePlantDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
    args: {
        open: false,
    },
};
