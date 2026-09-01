import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

/**
 * Map lỗi backend vào form.
 *
 * `ErrorResponseDto.details` là **danh sách câu**, không phải map field →
 * message (ví dụ `["email must be an email"]`). Ta lấy token đầu câu làm tên
 * field: đó là quy ước của class-validator ở backend. Token nào không khớp
 * field nào trong form thì dồn lên banner — không nuốt mất.
 *
 * Trả về nội dung cho banner cấp form, hoặc `null` nếu mọi lỗi đã gắn vào
 * input. Câu do backend soạn đi qua nguyên văn; trường hợp không nhận dạng
 * được trả về khoá i18n để component dịch (`docs/i18n-plan.md` §7.3).
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[] = [],
): Message | string | null {
  if (error instanceof ApiError) {
    if (error.code === ERROR_CODES.validationFailed && error.details?.length) {
      const unmatched: string[] = [];
      const seen = new Set<string>();

      for (const detail of error.details) {
        const field = detail.split(" ")[0];
        // Chỉ gắn khi field thực sự có trong form; nếu không react-hook-form
        // giữ một lỗi mà không ô input nào hiển thị → form kẹt im lặng.
        if (knownFields.includes(field) && !seen.has(field)) {
          seen.add(field);
          setError(field as Path<T>, { type: "server", message: detail });
        } else {
          unmatched.push(detail);
        }
      }

      return unmatched.length ? unmatched.join(". ") : null;
    }

    return error.message;
  }

  if (error instanceof Error) return error.message;
  return { key: "common.errors.unknown" };
}
