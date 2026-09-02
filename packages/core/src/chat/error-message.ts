import { ApiError } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

/**
 * The message shown for an arbitrary error, as an i18n key (§7.3).
 *
 * `ApiError.message` is written by the backend and is preferred — but for
 * DISPLAY only. To branch on logic, switch on `code`; never parse the message.
 */
export function errorText(error: unknown): Message | string {
  if (error instanceof ApiError) {
    if (error.status === 404) return { key: "common.errors.conversationNotFound" };
    return error.message;
  }
  return { key: "common.errors.generic" };
}

/** The message for an error code in a socket ack (`{ ok: false, code }`). */
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
