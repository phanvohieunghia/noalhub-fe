import type { StorybookConfig } from "@storybook/nextjs";
import webpack from "webpack";

import { readThemeTokens } from "./theme-tokens.ts";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  /**
   * Serves `public/` at the root, which is also how Storybook picks up our
   * favicon: the `favicon` preset looks for a `favicon.svg` at the root of a
   * static dir before falling back to its own. `public/favicon.svg` is a copy of
   * the apps' `app/icon.svg` — the mark with fixed brand colors.
   */
  staticDirs: ["../public"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-themes"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  /**
   * Hands the Foundations page the token names declared in
   * `packages/config/theme.css`, parsed here at build time.
   *
   * Why not read them in the browser: Tailwind emits its own default palette as
   * `--color-*` variables too, so enumerating the live stylesheet would bury our
   * eleven brand steps under hundreds of Tailwind ones. The file itself is the
   * only place that knows which tokens are OURS.
   */
  webpackFinal: async (webpackConfig, { configDir }) => {
    webpackConfig.plugins?.push(
      new webpack.DefinePlugin({
        __THEME_TOKENS__: JSON.stringify(readThemeTokens(configDir)),
      }),
    );
    return webpackConfig;
  },
};
export default config;
