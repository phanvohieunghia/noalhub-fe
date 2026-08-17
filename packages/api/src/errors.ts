/**
 * Contract lỗi dùng chung cho MỌI feature — thuộc tầng types, không phải
 * transport. Nhờ vậy component/form/provider bắt lỗi được mà không phải import
 * `services/*` (xem `docs/data-layer.md` §1).
 */

/** `ErrorResponseDto` trong OpenAPI spec. */
export type ApiErrorBody = {
  /** Mã ổn định — switch trên trường này. */
  code: string;
  /** Thông điệp cho người đọc. Có thể đổi bất cứ lúc nào, đừng parse. */
  message: string;
  statusCode: number;
  /** Chỉ có với VALIDATION_FAILED: danh sách lỗi từng field, dạng câu. */
  details?: string[];
};

/**
 * Lỗi chuẩn hoá từ `ErrorResponseDto`.
 *
 * `code` là mã ổn định — switch trên nó. `message` có thể đổi bất cứ lúc nào,
 * chỉ để hiển thị. `details` chỉ có với `VALIDATION_FAILED`, là danh sách câu
 * lỗi dạng `"email must be an email"` (KHÔNG phải map field → message).
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

/** Mã lỗi backend cam kết giữ ổn định — xem `/docs`. */
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
  oauthProviderUnsupported: "OAUTH_PROVIDER_UNSUPPORTED",
  oauthAccountLinkForbidden: "OAUTH_ACCOUNT_LINK_FORBIDDEN",
} as const;
