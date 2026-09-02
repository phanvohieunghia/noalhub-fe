/**
 * The public barrel of the `admin` feature.
 *
 * `./api` is DELIBERATELY not exported: components may only touch the hooks
 * layer (`docs/data-layer.md` §1). This barrel should only be used by
 * `apps/admin` — an import from `apps/web` is a sign an admin screen ended up
 * in the wrong place.
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
