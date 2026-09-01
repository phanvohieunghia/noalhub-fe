import { ApiError, ERROR_CODES } from "@noalhub/api/errors";

import { adminErrorMessage } from "../admin/error-message";

/**
 * Thông điệp lỗi cho các màn hình blog trong `apps/admin`.
 *
 * Bọc ngoài `adminErrorMessage` chứ không thay nó: 403/429/404/mất mạng vẫn nói
 * đúng câu cũ, ở đây chỉ thêm những mã riêng của blog (§2.3) mà người viết bài
 * cần một hành động cụ thể chứ không phải một câu chung chung.
 */
export function blogErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.postConflict:
        return "Bản trên máy chủ đã thay đổi (có thể bạn đang mở bài này ở tab khác). Tải lại để lấy bản mới — thay đổi chưa lưu ở đây sẽ mất.";
      case ERROR_CODES.slugTaken:
        return "Slug này đã có bài khác dùng. Đổi sang slug khác rồi lưu lại.";
      case ERROR_CODES.postNotPublishable:
        // Backend liệt kê field còn thiếu trong `message`; giữ nguyên câu đó.
        return `Chưa đăng được: ${error.message}`;
      case ERROR_CODES.categorySlugTaken:
        return "Slug chuyên mục này đã tồn tại.";
      case ERROR_CODES.categoryNotEmpty:
        // `message` của backend kèm số bài — đúng thứ người dùng cần biết.
        return error.message;
      default:
        break;
    }
  }

  return adminErrorMessage(error);
}
