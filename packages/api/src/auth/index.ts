/**
 * The public barrel of the `auth` feature.
 *
 * `./api` and `./client` are DELIBERATELY not exported: the rule in
 * `docs/data-layer.md` is that components only touch the hooks layer. That used
 * to be a convention; now it is a package boundary — from outside the package
 * there is no import path to `api.ts` at all.
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
export * from "./store";
export * from "./token-store";
