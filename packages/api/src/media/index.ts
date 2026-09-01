/**
 * Barrel công khai của feature `media`.
 *
 * KHÔNG export `./api`: component chỉ chạm tầng hooks (`docs/data-layer.md` §1).
 * `StorageUploadError` và `isStorageUploadError` vì vậy sống ở `types.ts` — UI
 * cần phân biệt lỗi của storage với `ApiError` của backend, mà đường duy nhất
 * để nó lấy được thứ đó là qua barrel này.
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
