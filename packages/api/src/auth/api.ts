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
 * The entire contact surface with the auth backend, mapping 1-to-1 to the
 * OpenAPI spec at `http://localhost:3101/docs` (tags `auth`, `auth/oauth`).
 * When the backend changes the contract, only this file changes.
 *
 * `schema` and `authRequired` are options `services/client.ts` adds to axios'
 * config: `schema` validates the response, `authRequired` turns on Bearer plus
 * refresh-on-401.
 */

/** POST /auth/register → 201 AuthSessionDto. 409 EMAIL_TAKEN. */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const { email, password, displayName } = input;
  const { data } = await http.post<AuthSession>(
    "/auth/register",
    // displayName is optional — sending an empty string differs from omitting it.
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
 * Called automatically by `services/client.ts` on a 401 — **never call it by
 * hand**. Tokens rotate: presenting an already-used token revokes the whole
 * session.
 */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await http.post<AuthTokens>(
    "/auth/refresh",
    { refreshToken },
    { schema: tokenPairSchema },
  );
  return data;
}

/** POST /auth/logout → 204. Revokes only the refresh token that was sent. */
export async function logout(refreshToken: string): Promise<void> {
  await http.post("/auth/logout", { refreshToken });
}

/** POST /auth/logout-all → 204. Invalidates outstanding access tokens too. */
export async function logoutAll(): Promise<void> {
  await http.post("/auth/logout-all", undefined, { authRequired: true });
}

/** GET /auth/me → 200 UserDto (the user directly, not wrapped in `{ user }`). */
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

/** POST /auth/verify-email/resend → 204 even when the email does not exist. */
export async function resendVerifyEmail(email: string): Promise<void> {
  await http.post("/auth/verify-email/resend", { email });
}

/**
 * POST /auth/forgot-password → 204 even when the email does not exist
 * (deliberate, to prevent account enumeration). The UI must not infer whether
 * an account exists from this result.
 */
export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<void> {
  await http.post("/auth/forgot-password", input);
}

/** POST /auth/reset-password → 204. Invalidates every open session. */
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
 * Kills every old session and issues a new one — the caller MUST replace its
 * token pair with the returned one, or the next request is a 401.
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
 * GET /auth/oauth/{provider} — a 302 to the provider's consent screen.
 *
 * Returns a URL for `window.location.assign`; do NOT call it with axios: the
 * backend sets an httpOnly cookie holding `state` plus the PKCE verifier, which
 * requires a top-level navigation. The callback URL is configured by the
 * backend, and the spec takes no `redirect_uri`.
 */
export function oauthStartUrl(provider: OAuthProvider): string {
  return `${API_BASE_URL}/auth/oauth/${provider}`;
}

/**
 * POST /auth/oauth/exchange → 200 AuthSessionDto.
 * The handoff code is single-use and expires after 60 seconds.
 */
export async function oauthExchange(code: string): Promise<AuthSession> {
  const { data } = await http.post<AuthSession>(
    "/auth/oauth/exchange",
    { code },
    { schema: sessionSchema },
  );
  return data;
}
