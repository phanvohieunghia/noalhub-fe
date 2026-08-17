import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ZodType } from "zod";

import { API_BASE_URL } from "./config";
import { ApiError, ERROR_CODES } from "./errors";
import type { ApiErrorBody } from "./errors";
import { tokenStore } from "./auth/token-store";
import { tokenPairSchema } from "./auth/schemas";
import type { AuthTokens } from "./auth/types";

/**
 * Thêm option riêng của app vào config của axios, để tầng service dùng thẳng
 * `http.get/post` mà vẫn khai báo được "cần token" và "validate bằng schema
 * này" — không phải bọc thêm hàm nào.
 *
 * `authRequired` KHÔNG được đặt tên `auth`: axios đã lấy key đó cho HTTP Basic
 * (`{ username, password }`).
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    /** Gắn `Authorization: Bearer <access>` và bật refresh-on-401. */
    authRequired?: boolean;
    /** Validate response bằng zod — bắt lỗi backend đổi shape ngay tại chỗ. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema?: ZodType<any>;
    /** Nội bộ: đánh dấu request đã retry sau refresh. */
    isRetry?: boolean;
  }
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Instance riêng cho `/auth/refresh`: không có interceptor 401 nên không thể
 * đệ quy vào chính nó.
 */
const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Được `lib/auth/store.ts` đăng ký. Tách qua callback để client không phải
 * import store (tránh phụ thuộc vòng).
 */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

function expireSession() {
  tokenStore.clear();
  onSessionExpired?.();
}

/**
 * Single-flight: nếu N request cùng nhận 401, chỉ MỘT lần gọi /auth/refresh.
 * Backend XOAY VÒNG refresh token và trình lại token cũ sẽ thu hồi TOÀN BỘ
 * phiên — nên gọi song song là mất phiên thật, không chỉ là lãng phí.
 */
let refreshPromise: Promise<AuthTokens> | null = null;

function refreshTokens(): Promise<AuthTokens> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      throw new ApiError(401, {
        code: ERROR_CODES.unauthenticated,
        message: "Phiên đã hết hạn",
        statusCode: 401,
      });
    }

    const { data } = await refreshHttp.post("/auth/refresh", { refreshToken });
    const tokens = tokenPairSchema.parse(data);
    tokenStore.setTokens(tokens);
    return tokens;
  })();

  refreshPromise
    .catch(() => {})
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Trả về một access token còn dùng được, refresh nếu trong memory đang rỗng
 * (vừa reload — access token chỉ nằm trong memory).
 *
 * Đây là cửa DUY NHẤT cho tầng socket lấy token. Socket KHÔNG được tự gọi
 * `/auth/refresh`: backend xoay vòng refresh token và trình lại token cũ sẽ
 * thu hồi TOÀN BỘ phiên — chạy song song với single-flight ở đây là mất phiên
 * thật, không chỉ là lãng phí một request.
 */
export async function ensureAccessToken(): Promise<string | null> {
  const current = tokenStore.getAccess();
  if (current) return current;
  if (!tokenStore.getRefresh()) return null;

  try {
    const tokens = await refreshTokens();
    return tokens.accessToken;
  } catch {
    expireSession();
    return null;
  }
}

/** Gắn `Authorization: Bearer <access>` cho request có `authRequired`. */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.authRequired) {
    const accessToken = tokenStore.getAccess();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Nhánh thành công: validate bằng `config.schema` nếu có, và quy 204 về
 * `undefined` (axios trả chuỗi rỗng cho body rỗng).
 *
 * Nhánh lỗi: chuẩn hoá + refresh-on-401. Mọi lỗi rời khỏi interceptor này đều
 * là `ApiError` (trừ huỷ request — giữ nguyên `CanceledError` để React Query
 * nhận đúng là abort chứ không phải lỗi thật).
 */
http.interceptors.response.use(
  (response) => {
    if (response.status === 204) {
      response.data = undefined;
    } else if (response.config.schema) {
      response.data = response.config.schema.parse(response.data);
    }
    return response;
  },
  async (error: unknown) => {
    if (axios.isCancel(error)) throw error;
    if (!(error instanceof AxiosError)) throw error;

    const config = error.config;

    // Không có response = không kết nối được (DNS, CORS, mạng chết).
    if (!error.response) {
      throw new ApiError(0, {
        code: "NETWORK_ERROR",
        message: "Không kết nối được máy chủ",
        statusCode: 0,
      });
    }

    const { status } = error.response;

    if (status === 401 && config?.authRequired && !config.isRetry) {
      try {
        await refreshTokens();
      } catch {
        expireSession();
        throw new ApiError(401, {
          code: ERROR_CODES.unauthenticated,
          message: "Phiên đăng nhập đã hết hạn",
          statusCode: 401,
        });
      }
      // Retry ĐÚNG một lần — isRetry chặn vòng lặp vô hạn.
      config.isRetry = true;
      return http.request(config);
    }

    if (status === 401 && config?.authRequired && config.isRetry) {
      expireSession();
    }

    throw new ApiError(status, readErrorBody(error.response.data, status));
  },
);

function readErrorBody(data: unknown, status: number): ApiErrorBody {
  if (
    data &&
    typeof data === "object" &&
    typeof (data as ApiErrorBody).message === "string" &&
    typeof (data as ApiErrorBody).code === "string"
  ) {
    return data as ApiErrorBody;
  }
  return {
    code: fallbackCodeFor(status),
    message: defaultMessageFor(status),
    statusCode: status,
  };
}

function fallbackCodeFor(status: number): string {
  if (status === 401) return ERROR_CODES.unauthenticated;
  if (status === 429) return ERROR_CODES.rateLimited;
  return "UNKNOWN";
}

function defaultMessageFor(status: number): string {
  if (status === 401) return "Phiên đăng nhập đã hết hạn";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này";
  if (status === 404) return "Không tìm thấy tài nguyên";
  if (status === 429) return "Bạn thao tác quá nhanh, vui lòng thử lại sau";
  if (status >= 500) return "Máy chủ đang gặp sự cố, vui lòng thử lại";
  return "Đã có lỗi xảy ra";
}
