import "./storybook.css";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
    decorators: [
        withThemeByClassName({
            themes: {
                light: "",
                dark: "dark",
            },
            defaultTheme: "light",
            parentSelector: "html",
        }),
    ],
    parameters: {
        a11y: { test: "error" },
        chromatic: {
            modes: {
                light: { globals: { theme: "light" } },
                dark: { globals: { theme: "dark" } },
            },
        },
    },
};

export default preview;
