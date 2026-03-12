import type { Meta, StoryObj } from "storybook-react-rsbuild";

import { makePlant, FAR_PAST, FAR_FUTURE } from "@packages/plants-core/test-utils";

import { EditPlantDialog } from "./EditPlantDialog.tsx";
import { createManagementPlantHandlers } from "./mocks/index.ts";
import { collectionDecorator, fireflyDecorator } from "./storybook.setup.tsx";

const meta = {
    title: "Management/Plants/Components/EditPlantDialog",
    component: EditPlantDialog,
    decorators: [collectionDecorator, fireflyDecorator],
    parameters: {
        chromatic: { viewports: [375, 768, 1280] },
        // The dialog auto-saves via PUT — provide empty plants so the factory
        // stubs PUT with 200 instead of the plantsDb-backed defaults where
        // test plant IDs don't exist.
        msw: { handlers: createManagementPlantHandlers([]) },
    },
    args: {
        open: true,
        onOpenChange: () => {},
        onDelete: () => {},
    },
} satisfies Meta<typeof EditPlantDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPlant: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
            description: "A tropical plant with large fenestrated leaves",
            family: "Araceae",
            soilType: "Well-draining mix",
            nextWateringDate: FAR_FUTURE,
        }),
    },
};

export const MinimalPlant: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-2",
            name: "Monstera Deliciosa",
        }),
    },
};

export const AllOptionalFieldsFilled: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-3",
            name: "Monstera Deliciosa",
            description: "Beautiful tropical plant known for its distinctive split leaves and aerial roots. Thrives in indirect light.",
            family: "Araceae",
            soilType: "Peat moss, perlite, and orchid bark mix",
        }),
    },
};

export const DueForWatering: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-4",
            name: "Monstera Deliciosa",
            nextWateringDate: FAR_PAST,
        }),
    },
};

export const MistLeavesFalse: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-5",
            name: "Monstera Deliciosa",
            mistLeaves: false,
        }),
    },
};

export const LongFieldValues: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-6",
            name: "Philodendron Birkin Variegated Extra Special Limited Edition Tropical Houseplant Collection Premium Series",
            description:
                "This is an exceptionally rare and beautiful tropical plant that has been carefully cultivated over many generations. Known for its distinctive pinstripe variegation patterns on dark green leaves, it thrives in indirect light conditions and requires consistent moisture without overwatering. Originally native to the tropical forests of South America.",
            family: "Araceae (Philodendron subfamily)",
            soilType: "Premium organic peat moss mixed with perlite, vermiculite, and orchid bark in equal parts",
            wateringQuantity: "250ml slowly poured around the base every 5-7 days",
        }),
    },
};

export const NullPlant: Story = {
    args: {
        plant: null,
    },
};

export const Closed: Story = {
    args: {
        plant: makePlant({
            id: "test-edit-1",
            name: "Monstera Deliciosa",
        }),
        open: false,
    },
};
