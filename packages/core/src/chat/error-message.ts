import { ApiError } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

/**
 * Thông điệp hiển thị cho một lỗi bất kỳ, dưới dạng khoá i18n (§7.3).
 *
 * `ApiError.message` do backend soạn nên ưu tiên dùng — nhưng chỉ để HIỂN THỊ.
 * Muốn phân nhánh logic thì switch trên `code`, không parse message.
 */
export function errorText(error: unknown): Message | string {
  if (error instanceof ApiError) {
    if (error.status === 404) return { key: "common.errors.conversationNotFound" };
    return error.message;
  }
  return { key: "common.errors.generic" };
}

/** Thông điệp cho mã lỗi trong ack socket (`{ ok: false, code }`). */
export function ackErrorText(code: string | undefined): Message {
  switch (code) {
    case "SOCKET_OFFLINE":
      return { key: "common.errors.socket.offline" };
    case "RATE_LIMITED":
      return { key: "common.errors.socket.rateLimited" };
    case "NOT_FOUND":
      return { key: "common.errors.socket.notFound" };
    case "VALIDATION_FAILED":
      return { key: "common.errors.socket.validationFailed" };
    default:
      return { key: "common.errors.socket.sendFailed" };
  }
}
