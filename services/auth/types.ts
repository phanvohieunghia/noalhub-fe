/**
 * Mirror của DTO trong OpenAPI spec (`/docs`, tag `auth`).
 * Đổi ở đây phải kèm đổi zod schema trong `./schemas.ts`.
 */

export type UserRole = "user" | "admin";

/** `UserDto` */
export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
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
