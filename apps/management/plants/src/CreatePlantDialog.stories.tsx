import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { CreatePlantDialog } from "./CreatePlantDialog.tsx";

const meta = {
    title: "Management/Plants/Components/CreatePlantDialog",
    component: CreatePlantDialog,
    args: {
        open: true,
        onOpenChange: () => {},
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
