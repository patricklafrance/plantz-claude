import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { LandingPage } from "./LandingPage.tsx";

// This page reads from TanStack DB (localStorage). Stories render with whatever
// data is currently in localStorage. Seed the app with data via `pnpm seed-plants`
// if the list appears empty.

const meta = {
    title: "Today/LandingPage/Pages/LandingPage",
    component: LandingPage,
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
