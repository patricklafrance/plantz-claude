import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { LandingPage } from "./LandingPage.tsx";

const meta = {
    title: "Today/LandingPage/Pages/LandingPages",
    component: LandingPage,
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
