import path from "node:path";

import {
  BLOG_IMAGE_ALLOW_LOCAL_IP,
  blogImageRemotePatterns,
} from "@noalhub/config/blog-image-hosts.mjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /**
   * Docker: `standalone` emits `.next/standalone` — a pre-traced copy of the
   * server plus exactly the `node_modules` files actually needed, so the runtime
   * image never runs `pnpm install` again.
   *
   * `outputFileTracingRoot` is REQUIRED in a monorepo: by default Next traces
   * from the app directory, while `packages/*` lives outside it and pnpm
   * symlinks them into `node_modules` — without pinning the root to the repo
   * root, standalone is missing files and the container dies at startup rather
   * than at build time.
   */
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),

  /**
   * Internal packages are exported as RAW TS (`./src/*.ts`) with no `dist/`
   * build. Next has to compile them with the app's SWC — which is what
   * `transpilePackages` turns on. In exchange: editing a file in `packages/`
   * hot-reloads immediately, with no parallel watch build.
   *
   * A new package under `packages/` MUST be declared here, or the build dies
   * with a syntax error on the very first `import type` line.
   */
  transpilePackages: [
    "@noalhub/api",
    "@noalhub/core",
    "@noalhub/i18n",
    "@noalhub/ui",
  ],

  /**
   * Admin needs this block too, public pages or not: the editor's **Preview**
   * tab renders through the very same `@noalhub/ui/blog/post-content`, and that
   * renderer uses `next/image`. Without the hosts declared here the preview
   * answers 400 for every image — in production, while `next dev` looks fine
   * because dev does not optimize images.
   *
   * It shares its source with `apps/web/next.config.ts` and with
   * `isSafeImageSrc` (`packages/api/src/blog/schemas.ts`):
   * `@noalhub/config/blog-image-hosts.mjs`. That file is plain JS because the
   * config is loaded before `transpilePackages` applies.
   *
   * `dangerouslyAllowSVG` + `contentDispositionType`: the full reasoning is in
   * `apps/web/next.config.ts` — three layers of protection sit outside this
   * flag.
   */
  images: {
    remotePatterns: [...blogImageRemotePatterns],

    /**
     * Enabled outside production only — see `BLOG_IMAGE_ALLOW_LOCAL_IP`. Without
     * it, images from a local MinIO (`http://localhost:9000`) are blocked by the
     * SSRF guard rather than the allowlist, and the returned error looks exactly
     * like an allowlist failure.
     */
    dangerouslyAllowLocalIP: BLOG_IMAGE_ALLOW_LOCAL_IP,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  turbopack: {
    /**
     * Turbopack does NOT resolve files outside its root, and it detects that
     * root by walking up looking for a lockfile — on this machine it found
     * `~/yarn.lock` and picked all of `$HOME`. Pin it to the repo root instead:
     * wide enough to see `packages/*`, narrow enough not to watch the entire
     * home directory.
     *
     * `process.cwd()` is the app directory because `next build` always runs from
     * there (turbo runs the script inside the package too).
     */
    root: path.join(process.cwd(), "..", ".."),
  },
};

/**
 * next-intl's plugin points `next-intl/config` at `./i18n/request.ts`. Without
 * it, every `getTranslations`/`useTranslations` runs with an empty config and
 * throws "no messages" on the very first page.
 */
export default createNextIntlPlugin()(nextConfig);
