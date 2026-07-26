/**
 * Backend không khai báo `servers` trong OpenAPI và path không có tiền tố —
 * base URL trỏ thẳng vào origin của API (`/auth/login`, không phải `/api/auth/login`).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3101";
