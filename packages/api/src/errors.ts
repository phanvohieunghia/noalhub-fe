/**
 * The error contract shared by EVERY feature — part of the types layer, not the
 * transport. That way components, forms and providers can catch errors without
 * importing `services/*` (see `docs/data-layer.md` §1).
 */

/** `ErrorResponseDto` trong OpenAPI spec. */
export type ApiErrorBody = {
  /** The stable code — switch on this field. */
  code: string;
  /** The human-readable message. It can change at any time; never parse it. */
  message: string;
  statusCode: number;
  /** Present only on VALIDATION_FAILED: per-field errors, as sentences. */
  details?: string[];
};

/**
 * The normalized error built from `ErrorResponseDto`.
 *
 * `code` is the stable identifier — switch on it. `message` can change at any
 * time and is for display only. `details` exists only on `VALIDATION_FAILED`
 * and is a list of sentences like `"email must be an email"` (NOT a field →
 * message map).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

/** The error codes the backend promises to keep stable — see `/docs`. */
export const ERROR_CODES = {
  validationFailed: "VALIDATION_FAILED",
  invalidCredentials: "INVALID_CREDENTIALS",
  unauthenticated: "UNAUTHENTICATED",
  invalidToken: "INVALID_TOKEN",
  emailTaken: "EMAIL_TAKEN",
  userNotFound: "USER_NOT_FOUND",
  cannotFriendSelf: "CANNOT_FRIEND_SELF",
  alreadyFriends: "ALREADY_FRIENDS",
  friendRequestExists: "FRIEND_REQUEST_EXISTS",
  friendRequestNotFound: "FRIEND_REQUEST_NOT_FOUND",
  notFriends: "NOT_FRIENDS",
  cannotDmSelf: "CANNOT_DM_SELF",
  recipientNotFound: "RECIPIENT_NOT_FOUND",
  usernameTaken: "USERNAME_TAKEN",
  usernameChangeTooSoon: "USERNAME_CHANGE_TOO_SOON",
  passwordNotSet: "PASSWORD_NOT_SET",
  rateLimited: "RATE_LIMITED",
  /**
   * A valid session without sufficient permission — every `/admin/*` endpoint
   * answers 403 for an ordinary user. UNLIKE `unauthenticated`: a refresh token
   * cannot help, so `client.ts` leaves it alone.
   *
   * ⚠️ Not yet verified against `/docs-json` (the backend was not running when
   * this was written). That is why `isForbidden()` below checks **status 403**
   * first and treats the code as a secondary signal — if the backend named it
   * differently, the UI is still right.
   */
  forbidden: "FORBIDDEN",
  oauthProviderUnsupported: "OAUTH_PROVIDER_UNSUPPORTED",
  oauthAccountLinkForbidden: "OAUTH_ACCOUNT_LINK_FORBIDDEN",

  /**
   * The `blog` feature's codes (`docs/blog.md` §2.3).
   *
   * The seven below match `src/common/errors/error-codes.ts` in the
   * `noalhub-be` repo and each one is actually produced by an e2e test.
   */
  postNotFound: "POST_NOT_FOUND",
  slugTaken: "SLUG_TAKEN",
  /** The submitted `version` is stale — two tabs overwriting each other (§7.3). */
  postConflict: "POST_CONFLICT",
  /** A required field is missing at publish time, including a **missing category** (§2.6). */
  postNotPublishable: "POST_NOT_PUBLISHABLE",
  categoryNotFound: "CATEGORY_NOT_FOUND",
  categorySlugTaken: "CATEGORY_SLUG_TAKEN",
  /** Deleting a category that still has posts — 409, with the count in `message` (§2.2). */
  categoryNotEmpty: "CATEGORY_NOT_EMPTY",

  /**
   * The `media` feature's codes (`docs/media.md` §5 in `noalhub-be`).
   *
   * Note: **there is no code for step 2** (the browser PUTting straight to
   * storage). Storage answers with S3's XML, not an `ErrorResponseDto` — a
   * failure there is `@noalhub/api/media`'s `StorageUploadError`, not an
   * `ApiError`.
   */
  mediaMimeNotAllowed: "MEDIA_MIME_NOT_ALLOWED",
  mediaTooLarge: "MEDIA_TOO_LARGE",
  mediaAssetNotFound: "MEDIA_ASSET_NOT_FOUND",
  /** `HeadObject` found no object: the PUT never ran or failed midway. */
  mediaNotUploaded: "MEDIA_NOT_UPLOADED",
  /** The magic bytes do not match the declared mime, or the SVG will not parse. */
  mediaContentMismatch: "MEDIA_CONTENT_MISMATCH",
} as const;

/**
 * 403 means a valid session without permission. Used in admin to tell it apart
 * from a 401 (which `client.ts` refreshes) and from ordinary business errors.
 *
 * Checking `status` before `code` is deliberate: the status is defined by HTTP
 * and is therefore more stable than a code name, and the backend's 403 code has
 * not been verified against the spec.
 */
export function isForbidden(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 403 || error.code === ERROR_CODES.forbidden)
  );
}

/** 429 — declared by all three admin endpoints. Extracted so the UI never compares strings inline. */
export function isRateLimited(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.code === ERROR_CODES.rateLimited)
  );
}

/**
 * An overwrite conflict in the blog editor: two tabs editing one post, and the
 * second sends a stale `version` (§7.3). Its own function because the UI has to
 * react quite differently from other 409s — not just report an error, but offer
 * to reload the server's copy.
 */
export function isPostConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === ERROR_CODES.postConflict;
}
