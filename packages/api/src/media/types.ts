/**
 * Feature `media` — upload asset (ảnh trước mắt, video/file về sau).
 *
 * Contract: tag `admin-media` trong `/docs-json`; thiết kế đầy đủ ở
 * `docs/media.md` bên repo `noalhub-be`. Mọi endpoint cần token + role `admin`.
 */

/**
 * Backend **suy `kind` từ mime đã duyệt**, client không gửi nó lên: cho gửi
 * nghĩa là backend phải kiểm nó khớp mime, và quên câu kiểm đó là lỗ hổng lách
 * giới hạn size (khai `video` để lấy hạn mức 200MB rồi upload một zip vốn chỉ
 * được 25MB). Ở đây kiểu này chỉ dùng để **đọc** phản hồi.
 */
export type MediaKind = "image" | "video" | "file";

export type MediaStatus = "pending" | "ready";

/** Phản hồi nhịp 1 — tấm vé để browser tự `PUT` lên storage. */
export type PresignedUpload = {
  id: string;
  kind: MediaKind;
  /**
   * Browser `PUT` **thẳng** lên đây, không qua backend. Phải gửi đúng
   * `Content-Type` và `Content-Length` đã khai: cả hai nằm trong phần được ký,
   * sai một cái là 403 từ storage chứ không phải lỗi của API.
   */
  uploadUrl: string;
  /**
   * ⚠️ Không phải hạn để *bắt đầu* upload — là hạn cho **toàn bộ** request PUT,
   * mà một PUT lớn kéo dài suốt thời gian truyền.
   */
  expiresIn: number;
};

/** Phản hồi nhịp 3. `url` chính là chuỗi nhét vào bài viết. */
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  /** Hàm thuần của `MEDIA_PUBLIC_URL` + `storageKey` bên backend. */
  url: string;
  mime: string;
  /** Số thật từ `HeadObject`, không phải số client khai ở nhịp 1. */
  sizeBytes: number;
  originalName: string | null;
  /** Luôn `null` ở vòng này — backend chưa giải mã ảnh/video để đọc kích thước. */
  width: number | null;
  height: number | null;
  durationMs: number | null;
  checksum: string | null;
  createdAt: string;
};

/** Tiến độ của nhịp 2. `total` là 0 khi trình duyệt không báo được độ dài. */
export type UploadProgress = {
  loaded: number;
  total: number;
  /** 0–1. Bằng 0 khi `total` không xác định. */
  ratio: number;
};

/**
 * Lỗi của **nhịp 2**, tức của storage — không phải của API.
 *
 * Không tái dùng `ApiError`: nó mô tả `ErrorResponseDto` của backend (`code`
 * ổn định, `details`), còn MinIO trả XML và không có mã nào trong contract đó.
 * Trộn hai thứ vào một lớp là mời người ta `switch` trên một `code` không tồn tại.
 */
export class StorageUploadError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "StorageUploadError";
    this.status = status;
  }
}

/** Lỗi đến từ nhịp 2 (storage) chứ không phải từ API — xem `StorageUploadError`. */
export function isStorageUploadError(
  error: unknown,
): error is StorageUploadError {
  return error instanceof StorageUploadError;
}
