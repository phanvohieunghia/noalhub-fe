/**
 * Barrel công khai của feature `auth`.
 *
 * CHỦ Ý không export `./api` và `./client`: luật ở `docs/data-layer.md` nói
 * component chỉ được chạm tầng hooks. Trước đây đó là quy ước, giờ nó là
 * ranh giới package — ngoài package không có đường nào import tới `api.ts`.
 */
export * from "./hooks";
export * from "./types";
export * from "./schemas";
export * from "./store";
export * from "./token-store";
