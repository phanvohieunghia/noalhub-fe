import type { ThemeTokens } from "../.storybook/theme-tokens";

/**
 * Injected by `DefinePlugin` in `.storybook/main.ts`, parsed from
 * `packages/config/theme.css` at build time.
 */
declare global {
  const __THEME_TOKENS__: ThemeTokens;
}

export {};
