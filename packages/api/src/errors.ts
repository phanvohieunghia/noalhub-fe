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
  /**
   * Đăng nhập hợp lệ nhưng không đủ quyền — mọi endpoint `/admin/*` trả 403 cho
   * user thường. KHÁC `unauthenticated`: refresh token không cứu được, nên
   * `client.ts` không đụng tới nó.
   *
   * ⚠️ Chưa đối chiếu được với `/docs-json` (backend chưa chạy lúc viết). Vì vậy
   * `isForbidden()` dưới đây switch trên **status 403** trước, mã chỉ là lớp
   * phụ — nếu backend đặt tên khác thì UI vẫn đúng.
   */
  forbidden: "FORBIDDEN",
  oauthProviderUnsupported: "OAUTH_PROVIDER_UNSUPPORTED",
  oauthAccountLinkForbidden: "OAUTH_ACCOUNT_LINK_FORBIDDEN",

  /**
   * Mã của feature `blog` (`docs/blog-plan.md` §2.3).
   *
   * Bảy mã dưới đây đã khớp `src/common/errors/error-codes.ts` bên repo
   * `noalhub-be` và đều có e2e bắn ra thật.
   */
  postNotFound: "POST_NOT_FOUND",
  slugTaken: "SLUG_TAKEN",
  /** `version` gửi lên đã cũ — hai tab ghi đè nhau (§7.3). */
  postConflict: "POST_CONFLICT",
  /** Thiếu field bắt buộc lúc publish, gồm cả **thiếu chuyên mục** (§2.6). */
  postNotPublishable: "POST_NOT_PUBLISHABLE",
  categoryNotFound: "CATEGORY_NOT_FOUND",
  categorySlugTaken: "CATEGORY_SLUG_TAKEN",
  /** Xoá chuyên mục còn bài — 409, kèm số bài trong `message` (§2.2). */
  categoryNotEmpty: "CATEGORY_NOT_EMPTY",

  /**
   * Mã của feature `media` (`docs/media.md` §5 bên `noalhub-be`).
   *
   * Lưu ý: **không có mã nào cho nhịp 2** (browser PUT thẳng lên storage).
   * Storage trả XML của S3, không trả `ErrorResponseDto` — lỗi nhịp đó là
   * `StorageUploadError` của `@noalhub/api/media`, không phải `ApiError`.
   */
  mediaMimeNotAllowed: "MEDIA_MIME_NOT_ALLOWED",
  mediaTooLarge: "MEDIA_TOO_LARGE",
  mediaAssetNotFound: "MEDIA_ASSET_NOT_FOUND",
  /** `HeadObject` không thấy object: PUT chưa chạy hoặc hỏng giữa chừng. */
  mediaNotUploaded: "MEDIA_NOT_UPLOADED",
  /** Magic bytes không khớp mime đã khai, hoặc SVG không parse được. */
  mediaContentMismatch: "MEDIA_CONTENT_MISMATCH",
} as const;

/**
 * 403 = đủ phiên nhưng không đủ quyền. Dùng ở admin để phân biệt với 401
 * (`client.ts` tự refresh) và với lỗi nghiệp vụ thường.
 *
 * Kiểm `status` trước `code` là cố ý: status do HTTP quy định nên ổn định hơn
 * tên mã, và mã 403 của backend chưa đối chiếu được với spec.
 */
export function isForbidden(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 403 || error.code === ERROR_CODES.forbidden)
  );
}

/** 429 — cả ba endpoint admin đều khai. Tách ra để UI khỏi so chuỗi rải rác. */
export function isRateLimited(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 429 || error.code === ERROR_CODES.rateLimited)
  );
}

/**
 * Xung đột ghi đè ở editor blog: hai tab cùng sửa một bài, tab thứ hai gửi
 * `version` đã cũ (§7.3). Tách hàm vì UI phải phản ứng khác hẳn lỗi 409 khác —
 * không phải báo lỗi rồi thôi, mà phải mời tải lại bản trên server.
 */
export function isPostConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === ERROR_CODES.postConflict;
}
