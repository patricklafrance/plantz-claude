import { defineStorybookConfig, type RsbuildConfigTransformer } from "@workleap/rsbuild-configs";

const tailwindPostCss: RsbuildConfigTransformer = config => {
    config.tools ??= {};
    config.tools.postcss ??= {};
    const postcss = config.tools.postcss as Record<string, unknown>;
    postcss.postcssOptions ??= {};
    const postcssOptions = postcss.postcssOptions as Record<string, unknown>;
    postcssOptions.plugins ??= [];
    (postcssOptions.plugins as unknown[]).push(["@tailwindcss/postcss", {}]);

    return config;
};

export default defineStorybookConfig({
    transformers: [tailwindPostCss]
});
