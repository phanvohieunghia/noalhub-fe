import { ApiError } from "@/services/errors";

/**
 * Thông điệp hiển thị cho một lỗi bất kỳ.
 *
 * `ApiError.message` do backend soạn nên ưu tiên dùng — nhưng chỉ để HIỂN THỊ.
 * Muốn phân nhánh logic thì switch trên `code`, không parse message.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Hội thoại không tồn tại hoặc bạn không có quyền truy cập.";
    }
    return error.message;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

/** Thông điệp cho mã lỗi trong ack socket (`{ ok: false, code }`). */
export function ackErrorMessage(code: string | undefined): string {
  switch (code) {
    case "SOCKET_OFFLINE":
      return "Mất kết nối — tin sẽ được gửi lại khi kết nối lại.";
    case "RATE_LIMITED":
      return "Bạn gửi quá nhanh. Chờ một chút rồi thử lại.";
    case "NOT_FOUND":
      return "Hội thoại không còn khả dụng.";
    case "VALIDATION_FAILED":
      return "Nội dung tin nhắn không hợp lệ.";
    default:
      return "Không gửi được tin nhắn.";
  }
}
