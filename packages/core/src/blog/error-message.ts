import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

import { adminErrorText } from "../admin/error-message";

/**
 * Thông điệp lỗi cho các màn hình blog trong `apps/admin`. Trả về khoá i18n —
 * xem `adminErrorText`.
 *
 * Bọc ngoài `adminErrorText` chứ không thay nó: 403/429/404/mất mạng vẫn nói
 * đúng câu cũ, ở đây chỉ thêm những mã riêng của blog (§2.3) mà người viết bài
 * cần một hành động cụ thể chứ không phải một câu chung chung.
 */
export function blogErrorText(error: unknown): Message | string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.postConflict:
        return { key: "common.errors.postConflict" };
      case ERROR_CODES.slugTaken:
        return { key: "common.errors.slugTaken" };
      case ERROR_CODES.postNotPublishable:
        // Backend liệt kê field còn thiếu trong `message`; giữ nguyên câu đó.
        return {
          key: "common.errors.postNotPublishable",
          values: { message: error.message },
        };
      case ERROR_CODES.categorySlugTaken:
        return { key: "common.errors.categorySlugTaken" };
      case ERROR_CODES.categoryNotEmpty:
        // `message` của backend kèm số bài — đúng thứ người dùng cần biết.
        return error.message;
      default:
        break;
    }
  }

  return adminErrorText(error);
}
