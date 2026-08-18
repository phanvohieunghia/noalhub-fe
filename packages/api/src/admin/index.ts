/**
 * Barrel công khai của feature `admin`.
 *
 * CHỦ Ý không export `./api`: component chỉ được chạm tầng hooks
 * (`docs/data-layer.md` §1). Barrel này chỉ nên được `apps/admin` dùng —
 * `apps/web` import vào là dấu hiệu đặt màn hình quản trị sai chỗ.
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
