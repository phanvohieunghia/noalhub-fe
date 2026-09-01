/**
 * Mirror của DTO trong OpenAPI spec (`/docs`, tag `auth`).
 * Đổi ở đây phải kèm đổi zod schema trong `./schemas.ts`.
 */

export type UserRole = "user" | "admin";

/**
 * Ngôn ngữ giao diện, lưu trên tài khoản. Mirror của enum `UserLanguage` bên
 * backend (`src/users/language.ts`) — thêm ngôn ngữ là đổi cả hai đầu cùng lúc.
 */
export type UserLanguage = "vi" | "en";

/** `UserDto` */
export type User = {
  id: string;
  email: string;
  /** Định danh công khai, duy nhất. Hệ thống cấp lúc tạo tài khoản. */
  username: string;
  /** Lần đổi username gần nhất. `null` = chưa từng đổi. */
  usernameChangedAt: string | null;
  /**
   * Mốc sớm nhất được đổi username tiếp. `null` = đổi được ngay.
   * Backend là nguồn sự thật — đừng tự cộng 6 tháng ở frontend.
   */
  nextUsernameChangeAt: string | null;
  emailVerified: boolean;
  role: UserRole;
  /**
   * Ngôn ngữ giao diện người dùng đã chọn. Đây là NGUỒN SỰ THẬT — cookie
   * `NOALHUB_LOCALE` chỉ là lớp đệm để SSR có gì đó dùng trước khi biết user là
   * ai (`docs/i18n-plan.md` §4.2).
   */
  language: UserLanguage;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

/** `TokenPairDto` */
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** TTL access token, tính bằng giây (ví dụ 900). */
  expiresIn: number;
  tokenType: string;
};

/** `AuthSessionDto` */
export type AuthSession = AuthTokens & {
  user: User;
};

export type OAuthProvider = "google" | "github";

// `ErrorResponseDto` dùng chung mọi feature → `lib/api/errors.ts`.
