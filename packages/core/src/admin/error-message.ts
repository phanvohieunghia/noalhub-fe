import { ApiError, isForbidden, isRateLimited } from "@noalhub/api/errors";

/**
 * Thông điệp hiển thị cho lỗi ở màn hình admin — **một chỗ duy nhất**, để mọi
 * trang nói cùng một câu cho cùng một tình huống.
 *
 * Ba trường hợp phải tách riêng vì hành động của người đọc khác hẳn nhau:
 * 403 (mất quyền giữa phiên — đăng nhập lại bằng tài khoản khác),
 * 429 (chờ rồi thử lại) và 404 (không có bản ghi). Không có nhánh 403 thì mất
 * role giữa phiên cho ra màn hình trắng, đúng thứ `docs/admin-plan.md` §1 chặn.
 */
export function adminErrorMessage(error: unknown): string {
  if (isForbidden(error)) {
    return "Tài khoản của bạn không còn quyền quản trị. Hãy đăng nhập lại bằng tài khoản admin.";
  }

  if (isRateLimited(error)) {
    return "Bạn thao tác quá nhanh nên máy chủ tạm chặn. Chờ một chút rồi thử lại.";
  }

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Không tìm thấy bản ghi này. Có thể nó vừa bị xoá.";
    }
    if (error.status === 0) {
      return "Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.";
    }
    // `message` do backend soạn — chỉ để hiển thị, đừng parse.
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
