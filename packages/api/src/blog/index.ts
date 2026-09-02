/**
 * The public barrel of the `blog` feature.
 *
 * `./api` is DELIBERATELY not exported (components only touch the hooks layer)
 * and **neither is `./server`**: folding `server.ts` in here would drag
 * `server-only` into every client component that imports `@noalhub/api/blog` —
 * a red build somewhere entirely unrelated. Public pages import
 * `@noalhub/api/blog/server` separately (`docs/data-layer.md` §7.1).
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
