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
   * The allowed hosts for in-post and cover images (`docs/blog.md` §6.2). A host
   * missing here makes `next/image` answer **400 in production** while dev keeps
   * working — so it has to be settled at the same time as the write allowlist.
   *
   * The list lives in `@noalhub/config/blog-image-hosts.mjs` — plain JS, because
   * this config file is loaded BEFORE `transpilePackages` applies and therefore
   * cannot import an internal package (they export raw TS). `isSafeImageSrc` in
   * `packages/api/src/blog/schemas.ts` reads that same file, so the two ends can
   * no longer drift.
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

    /**
     * With this flag off, `next/image` REJECTS every SVG — and the backend's
     * media allows `image/svg+xml`, so leaving it off breaks uploaded SVGs in
     * production only (dev keeps working because `next dev` does not optimize
     * images).
     *
     * The "dangerously" is real, and it is offset by three OTHER layers rather
     * than by this flag (`docs/media.md` §7a in `noalhub-be`): the backend
     * sanitizes the file with DOMPurify and overwrites the object, nginx serves
     * every `.svg` with `Content-Security-Policy: sandbox`, and the image host
     * is a separate origin from the app.
     *
     * The third layer is A CONSTRAINT OF THIS REPO: an SVG may only be embedded
     * through `next/image` / `<img src>`. Inlining it into the DOM
     * (`dangerouslySetInnerHTML`, importing it as a component) runs it on the
     * app's origin — none of the layers above can help there, since all three
     * depend on the file being loaded as an image.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  /**
   * `/blogs/rss.xml` is the **old** path, subscribed to in readers before the
   * locale prefix existed. The real feed now lives at `/vi/blogs/rss.xml` (a
   * single one — `docs/i18n.md` §8), so the old path has to redirect
   * permanently rather than 404: a reader that sees a few 404s unsubscribes
   * itself.
   *
   * It cannot be done in `proxy.ts`: that matcher excludes every path with a dot
   * so static files are left alone.
   */
  async redirects() {
    return [
      { source: "/blogs/rss.xml", destination: "/vi/blogs/rss.xml", permanent: true },
    ];
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
