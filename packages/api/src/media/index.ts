/**
 * The public barrel of the `media` feature.
 *
 * `./api` is NOT exported: components only touch the hooks layer
 * (`docs/data-layer.md` §1). That is why `StorageUploadError` and
 * `isStorageUploadError` live in `types.ts` — the UI needs to tell a storage
 * failure apart from the backend's `ApiError`, and this barrel is its only way
 * to reach them.
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
