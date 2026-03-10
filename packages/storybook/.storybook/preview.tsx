import "./storybook.css";
import type { Preview } from "storybook-react-rsbuild";

import { mswDecorator } from "@packages/plants-core/msw";

const preview: Preview = {
    decorators: [mswDecorator],
};

export default preview;
