import { http } from "../client";
import { API_BASE_URL } from "../config";
import { sessionSchema, tokenPairSchema, userSchema } from "./schemas";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";
import type { AuthSession, AuthTokens, OAuthProvider, User } from "./types";

/**
 * Toàn bộ bề mặt tiếp xúc với backend auth, map 1-1 với OpenAPI spec tại
 * `http://localhost:3101/docs` (tag `auth`, `auth/oauth`).
 * Backend đổi contract → chỉ file này phải sửa.
 *
 * `schema` và `authRequired` là option `services/client.ts` cắm thêm vào config
 * của axios: schema validate response, authRequired bật Bearer + refresh-on-401.
 */

/** POST /auth/register → 201 AuthSessionDto. 409 EMAIL_TAKEN. */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const { email, password, displayName } = input;
  const { data } = await http.post<AuthSession>(
    "/auth/register",
    // displayName optional — gửi chuỗi rỗng sẽ khác với "không gửi".
    displayName ? { email, password, displayName } : { email, password },
    { schema: sessionSchema },
  );
  return data;
}

/** POST /auth/login → 200 AuthSessionDto. 401 INVALID_CREDENTIALS. */
export async function login(input: LoginInput): Promise<AuthSession> {
  const { data } = await http.post<AuthSession>("/auth/login", input, {
    schema: sessionSchema,
  });
  return data;
}

/**
 * POST /auth/refresh → 200 TokenPairDto.
 *
 * Được `services/client.ts` gọi tự động khi gặp 401 — **không gọi tay**.
 * Token xoay vòng: trình lại một token đã dùng sẽ thu hồi toàn bộ phiên.
 */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await http.post<AuthTokens>(
    "/auth/refresh",
    { refreshToken },
    { schema: tokenPairSchema },
  );
  return data;
}

/** POST /auth/logout → 204. Chỉ thu hồi refresh token gửi lên. */
export async function logout(refreshToken: string): Promise<void> {
  await http.post("/auth/logout", { refreshToken });
}

/** POST /auth/logout-all → 204. Vô hiệu cả access token đang lưu hành. */
export async function logoutAll(): Promise<void> {
  await http.post("/auth/logout-all", undefined, { authRequired: true });
}

/** GET /auth/me → 200 UserDto (trả thẳng user, không bọc trong `{ user }`). */
export async function me(signal?: AbortSignal): Promise<User> {
  const { data } = await http.get<User>("/auth/me", {
    authRequired: true,
    schema: userSchema,
    signal,
  });
  return data;
}

/** POST /auth/verify-email → 204. 400 INVALID_TOKEN. */
export async function verifyEmail(token: string): Promise<void> {
  await http.post("/auth/verify-email", { token });
}

/** POST /auth/verify-email/resend → 204 kể cả khi email không tồn tại. */
export async function resendVerifyEmail(email: string): Promise<void> {
  await http.post("/auth/verify-email/resend", { email });
}

/**
 * POST /auth/forgot-password → 204 kể cả khi email không tồn tại (cố ý, chống
 * dò email). UI không được suy ra sự tồn tại của tài khoản từ kết quả này.
 */
export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<void> {
  await http.post("/auth/forgot-password", input);
}

/** POST /auth/reset-password → 204. Vô hiệu mọi phiên đang mở. */
export async function resetPassword(
  token: string,
  input: ResetPasswordInput,
): Promise<void> {
  await http.post("/auth/reset-password", {
    token,
    newPassword: input.newPassword,
  });
}

/**
 * POST /auth/change-password → 200 AuthSessionDto.
 * Giết mọi phiên cũ và cấp phiên mới — caller BẮT BUỘC thay cặp token bằng
 * cặp trả về, nếu không request kế tiếp sẽ 401.
 */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<AuthSession> {
  const { currentPassword, newPassword } = input;
  const { data } = await http.post<AuthSession>(
    "/auth/change-password",
    { currentPassword, newPassword },
    { authRequired: true, schema: sessionSchema },
  );
  return data;
}

/**
 * GET /auth/oauth/{provider} — 302 sang trang đồng ý của provider.
 *
 * Trả URL để `window.location.assign`, KHÔNG gọi bằng axios: backend đặt
 * cookie httpOnly chứa `state` + PKCE verifier, cần điều hướng top-level.
 * Callback URL do backend cấu hình, spec không nhận `redirect_uri`.
 */
export function oauthStartUrl(provider: OAuthProvider): string {
  return `${API_BASE_URL}/auth/oauth/${provider}`;
}

/**
 * POST /auth/oauth/exchange → 200 AuthSessionDto.
 * Handoff code dùng một lần, hết hạn sau 60 giây.
 */
export async function oauthExchange(code: string): Promise<AuthSession> {
  const { data } = await http.post<AuthSession>(
    "/auth/oauth/exchange",
    { code },
    { schema: sessionSchema },
  );
  return data;
}
