import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { CreatePlantDialog } from "./CreatePlantDialog.tsx";

// Fixed date for deterministic Chromatic snapshots — the component internally
// calls `new Date()` to compute the default "first watering date", so we freeze
// the global Date constructor for the lifetime of each story.
const FIXED_NOW = new Date(2026, 2, 10, 12, 0, 0, 0);
const OriginalDate = globalThis.Date;

function freezeDate() {
    const Frozen = function (this: Date, ...args: unknown[]) {
        if (args.length === 0) {
            return new OriginalDate(FIXED_NOW);
        }
        return new (OriginalDate as unknown as new (...a: unknown[]) => Date)(...args);
    } as unknown as DateConstructor;
    Object.setPrototypeOf(Frozen, OriginalDate);
    Object.setPrototypeOf(Frozen.prototype, OriginalDate.prototype);
    Frozen.now = () => FIXED_NOW.getTime();
    Frozen.parse = OriginalDate.parse.bind(OriginalDate);
    Frozen.UTC = OriginalDate.UTC.bind(OriginalDate);
    globalThis.Date = Frozen;
}

function restoreDate() {
    globalThis.Date = OriginalDate;
}

const meta = {
    title: "Management/Plants/Components/CreatePlantDialog",
    component: CreatePlantDialog,
    args: {
        open: true,
        onOpenChange: () => {},
    },
    decorators: [
        (Story) => {
            // Freeze Date synchronously so the component's initial render sees the fixed date.
            const frozenRef = useRef(false);
            if (!frozenRef.current) {
                freezeDate();
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
