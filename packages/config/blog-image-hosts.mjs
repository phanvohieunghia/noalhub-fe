/**
 * Host allowlist for images inside posts (`docs/blog.md` §6.2) — THE SINGLE
 * SOURCE OF TRUTH for all three places that need it:
 *
 *   1. `images.remotePatterns` — `apps/web/next.config.ts`
 *   2. `images.remotePatterns` — `apps/admin/next.config.ts` (preview tab)
 *   3. `isSafeImageSrc` — `packages/api/src/blog/schemas.ts` (validation on write)
 *
 * Why `.mjs` here rather than `.ts` in `packages/api`: `next.config.ts` is
 * loaded BEFORE `transpilePackages` takes effect, so it cannot import an
 * internal package (they export raw TS). Plain JS needs no transpiling, so the
 * config can load it directly — which is the entire reason this file exists.
 *
 * This is a SECURITY POLICY, not operational config: it is the second line of
 * defence against stored XSS through `image.src` (see
 * `packages/ui/src/blog/post-content.tsx`). That is why it is hardcoded and NOT
 * read from env — widening the allowlist must go through a PR, not through an
 * environment variable editable at deploy time. On top of that `isSafeImageSrc`
 * also runs on the client (the Tiptap editor), so the env var would have to be
 * `NEXT_PUBLIC_*` and inlined into the bundle anyway — trading away
 * immutability for exactly nothing.
 */

/**
 * `next build` always sets `NODE_ENV=production`, so a production build NEVER
 * carries a dev host — not even when built on this machine. On the client Next
 * inlines this constant and drops the dead branch, so `"localhost"` never
 * reaches the production bundle either.
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Production hosts. Always `https:` — see `isSafeImageSrc`. */
export const BLOG_IMAGE_HOSTS = [
  "images.unsplash.com",
  "img-noalhub.duckdns.org",
];

/**
 * Development-only hosts, and the ONLY `http:` exception.
 *
 * Deliberately narrow: the exact hostname `localhost` (not `127.0.0.1`, not
 * `*.localhost`), any port — so moving the dev media server to another port
 * needs no edit here. Leaving `port` empty matches every port:
 * `matchRemotePattern` only compares the port when the pattern declares one.
 *
 * Allowing `http:` here is safe PRECISELY because it is tied to `localhost`: an
 * origin only the developer's own machine can reach, so it has none of the
 * remote attack surface that opening `http:` on a public host would. Do not add
 * non-localhost hosts to this list — a new host belongs in `BLOG_IMAGE_HOSTS`
 * and must be `https:`.
 */
export const BLOG_IMAGE_DEV_HOSTS = IS_PRODUCTION ? [] : ["localhost"];

/**
 * Next's `images.remotePatterns` shape, so neither `next.config.ts` has to map it.
 *
 * The protocol here must say the same thing as `isSafeImageSrc`: `https:` for
 * production hosts, `http:` for dev hosts. Diverge on either side and you are
 * back to the bug this file exists to erase — one the editor accepts to write
 * but `next/image` answers with a 400.
 */
/**
 * `images.dangerouslyAllowLocalIP` for both `next.config.ts` files.
 *
 * Why this is needed beyond the allowlist: Next 16's image optimizer resolves
 * the upstream host's DNS and REJECTS every private/loopback IP — SSRF
 * protection, running BEFORE `remotePatterns`. So even with `localhost` in the
 * allowlist dev images break, and the client-facing message is
 * `400 "url" parameter is not allowed` — identical to an allowlist failure. The
 * truth only shows up in the server log:
 *
 *   ⨯ upstream image http://localhost:9000/... resolved to private ip ["::1","127.0.0.1"]
 *
 * Tied to the same `IS_PRODUCTION` as `BLOG_IMAGE_DEV_HOSTS`: the two must
 * switch on and off together; splitting them costs another afternoon of hunting.
 */
export const BLOG_IMAGE_ALLOW_LOCAL_IP = !IS_PRODUCTION;

export const blogImageRemotePatterns = [
  ...BLOG_IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
  ...BLOG_IMAGE_DEV_HOSTS.map((hostname) => ({ protocol: "http", hostname })),
];
