import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { PlantsPage } from "./PlantsPage.tsx";

const meta = {
    title: "Management/Plants/Pages/PlantsPage",
    component: PlantsPage,
} satisfies Meta<typeof PlantsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// PlantsPage reads from TanStack DB (localStorage). Seed data with `pnpm seed-plants`.
// Additional visual states (filtered, selected, dialogs open) require user interaction
// and cannot be expressed as static stories. Sub-component stories in this module
// (PlantListItem, FilterBar, EditPlantDialog, etc.) provide full variant coverage.
export const Default: Story = {};
