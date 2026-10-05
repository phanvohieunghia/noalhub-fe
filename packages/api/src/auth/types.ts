/**
 * A mirror of the DTOs in the OpenAPI spec (`/docs`, tag `auth`).
 * A change here must come with a change to the zod schemas in `./schemas.ts`.
 */

/**
 * A mirror of the backend's `UserRole` enum (`src/users/entities/user.entity.ts`).
 * Three values, not two — `super_admin` has existed since the RBAC migration and
 * a list missing it rejects the very accounts with the most access.
 *
 * Do NOT branch on this string. It is for display; the backend ships derived
 * flags (`isAdmin`, `canGenerateAi`) precisely so the role table lives in one
 * place. See `satisfiesRole` in `./roles.ts`.
 */
export type UserRole = "user" | "admin" | "super_admin";

/**
 * The interface language, stored on the account. A mirror of the backend's
 * `UserLanguage` enum (`src/users/language.ts`) — adding a language means
 * changing both ends at once.
 */
export type UserLanguage = "vi" | "en";

/** `UserDto` */
export type User = {
  id: string;
  email: string;
  /** The public, unique identifier. Assigned by the system at signup. */
  username: string;
  /** When the username last changed. `null` means never. */
  usernameChangedAt: string | null;
  /**
   * The earliest the username may change again. `null` means right now.
   * The backend is the source of truth — do not add six months on the frontend.
   */
  nextUsernameChangeAt: string | null;
  emailVerified: boolean;
  role: UserRole;
  /**
   * May enter the admin area. Derived by the backend from the role table — use
   * THIS, never `role === "admin"`, which locks `super_admin` out.
   */
  isAdmin: boolean;
  /** May trigger the AI actions that cost money (`super_admin` only, today). */
  canGenerateAi: boolean;
  /**
   * The interface language the user picked. This is THE SOURCE OF TRUTH — the
   * `NOALHUB_LOCALE` cookie is only a buffer so SSR has something to work with
   * before it knows who the user is (`docs/i18n.md` §4.2).
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
  /** The access token TTL in seconds (e.g. 900). */
  expiresIn: number;
  tokenType: string;
};

/** `AuthSessionDto` */
export type AuthSession = AuthTokens & {
  user: User;
};

export type OAuthProvider = "google" | "github";

// `ErrorResponseDto` is shared by every feature → `lib/api/errors.ts`.
