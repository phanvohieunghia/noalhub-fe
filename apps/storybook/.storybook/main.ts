import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { StorybookConfig } from "@storybook/nextjs";
import webpack from "webpack";

import { readThemeTokens } from "./theme-tokens.ts";

/**
 * `apps/storybook/.env` (không vào git — `.env*` bị ignore ở gốc repo).
 *
 * `process.loadEnvFile` là của Node, không cần `dotenv`: nó **không ghi đè**
 * biến đã có sẵn, nên `SB_AUDIENCE=public pnpm dev` vẫn thắng file. Đó cũng là
 * lý do phải nạp ở đây thay vì tin vào cơ chế `.env` của Storybook: cơ chế đó
 * dành cho biến đi vào bundle preview, còn file này chạy sớm hơn thế.
 *
 * `process.cwd()` là thư mục package: cả `pnpm dev` lẫn `turbo run
 * build-storybook` đều chạy task với cwd đặt ở đó.
 */
const envFile = resolve(process.cwd(), ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

/**
 * Who this build is for.
 *
 * `internal` (the default, and what `pnpm dev` runs) indexes everything.
 * `public` LEAVES OUT `src/internal/**` — not hidden, absent: a Storybook build
 * is static files, so anything in the bundle can be read out of `index.json` or
 * the source maps by anyone who can open the page. Sidebar filters and tags only
 * tidy the list; the split has to happen at build time to mean anything.
 *
 * The two builds ship as two images (`-storybook`, `-storybook-internal`) and
 * only the internal one sits behind nginx basic auth — see the Dockerfile.
 */
const audience = process.env.SB_AUDIENCE === "public" ? "public" : "internal";

/** Stories anyone may see: the design system itself. */
const PUBLIC_STORIES = [
  "../src/components/**/*.mdx",
  "../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  "../src/foundations/**/*.mdx",
  "../src/foundations/**/*.stories.@(js|jsx|mjs|ts|tsx)",
];

/**
 * Team-only stories. The flow maps live here: they spell out how auth behaves —
 * single-use OAuth codes, what the "email sent" screen deliberately does not
 * reveal — which a public component gallery has no reason to hand out.
 */
const INTERNAL_STORIES = [
  "../src/internal/**/*.mdx",
  "../src/internal/**/*.stories.@(js|jsx|mjs|ts|tsx)",
];

const config: StorybookConfig = {
  stories:
    audience === "public" ? PUBLIC_STORIES : [...PUBLIC_STORIES, ...INTERNAL_STORIES],
  /**
   * Serves `public/` at the root, which is also how Storybook picks up our
   * favicon: the `favicon` preset looks for a `favicon.svg` at the root of a
   * static dir before falling back to its own. `public/favicon.svg` is a copy of
   * the apps' `app/icon.svg` — the mark with fixed brand colors.
   */
  staticDirs: ["../public"],
  /**
   * `addon-docs` is what compiles `.mdx` and honours the `autodocs` tag set in
   * `preview.tsx` — without it that tag is a no-op (the index had zero `docs`
   * entries) and an MDX page never reaches the sidebar.
   */
  addons: ["@storybook/addon-a11y", "@storybook/addon-themes", "@storybook/addon-docs"],
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
