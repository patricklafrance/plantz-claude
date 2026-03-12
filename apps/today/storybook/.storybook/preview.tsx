import "./storybook.css";
import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";

initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
    loaders: [mswLoader],
    parameters: {
        a11y: { test: "error" },
    },
};

export default preview;
