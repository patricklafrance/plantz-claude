import "./storybook.css";
import { initialize, mswLoader } from "msw-storybook-addon";
import type { Preview } from "storybook-react-rsbuild";

initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
    loaders: [mswLoader],
};

export default preview;
