import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import type { StorybookConfig } from "storybook-react-rsbuild";

const require = createRequire(import.meta.url);

const storybookConfig: StorybookConfig = {
    framework: getAbsolutePath("storybook-react-rsbuild"),
    addons: [getAbsolutePath("@storybook/addon-a11y")],
    stories: ["../../components/src/**/*.stories.tsx"],
};

export default storybookConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}
