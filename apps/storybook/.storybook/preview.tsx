import "./storybook.css";
import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";

initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
    loaders: [mswLoader],
};

export default preview;
