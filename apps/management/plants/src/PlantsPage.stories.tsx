import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { PlantsPage } from "./PlantsPage.tsx";

const meta = {
    title: "Management/Plants/Pages/PlantsPage",
    component: PlantsPage
} satisfies Meta<typeof PlantsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
