import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { CreatePlantDialog } from "./CreatePlantDialog.tsx";
import { managementPlantHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

// Fixed date for deterministic Chromatic snapshots — passed as a prop so the
// DatePicker always displays the same value regardless of when the snapshot runs.
const FIXED_FIRST_WATERING_DATE = new Date(2026, 2, 11, 0, 0, 0, 0);

const meta = {
    title: "Management/Plants/Components/CreatePlantDialog",
    component: CreatePlantDialog,
    decorators: [collectionDecorator, fireflyDecorator],
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
        msw: { handlers: managementPlantHandlers },
    },
    args: {
        open: true,
        onOpenChange: () => {},
        defaultFirstWateringDate: FIXED_FIRST_WATERING_DATE,
    },
} satisfies Meta<typeof CreatePlantDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
    args: {
        open: false,
    },
};
