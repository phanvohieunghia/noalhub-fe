/**
 * A mirror of the DTOs in the OpenAPI spec (`/docs`, tag `auth`).
 * A change here must come with a change to the zod schemas in `./schemas.ts`.
 */

export type UserRole = "user" | "admin";

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
