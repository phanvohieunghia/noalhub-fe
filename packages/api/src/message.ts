/**
 * Một thông điệp **chưa dịch**: khoá i18n cộng tham số của nó.
 *
 * Tầng dữ liệu (schema zod, hàm map lỗi) chạy ở module scope, nạp một lần lúc
 * import — nó không biết và không thể biết locale của request nào. Nên nó trả
 * về khoá, còn component dịch lúc render bằng `useMessage()` của
 * `@noalhub/i18n` (`docs/i18n-plan.md` §7.3).
 *
 * Chuỗi trần vẫn hợp lệ ở những chỗ nhận `Message`: đó là câu do **backend**
 * soạn, không có khoá tương ứng, hiện nguyên văn.
 */
export type Message = { key: string; values?: Record<string, string | number> };

export function isMessage(value: unknown): value is Message {
  return typeof value === "object" && value !== null && "key" in value;
}

/**
 * `Error` mang theo một `Message` chưa dịch.
 *
 * Cần một lớp riêng vì `Error.message` là `string`: nhét khoá vào đó thì chỗ
 * bắt lỗi không phân biệt được "khoá cần dịch" với "câu backend gửi về". Ở đây
 * `message` giữ khoá cho log/stack, còn `text` mới là thứ đem đi dịch.
 */
export class MessageError extends Error {
  readonly text: Message;

  constructor(text: Message) {
    super(text.key);
    this.name = "MessageError";
    this.text = text;
  }
}

/** Lấy phần hiển thị được của một lỗi bất kỳ. */
export function messageOf(error: unknown): Message | string {
  if (error instanceof MessageError) return error.text;
  if (error instanceof Error) return error.message;
  return { key: "common.errors.unknown" };
}
