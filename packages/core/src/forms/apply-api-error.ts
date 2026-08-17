import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError, ERROR_CODES } from "@noalhub/api/errors";

/**
 * Map lỗi backend vào form.
 *
 * `ErrorResponseDto.details` là **danh sách câu**, không phải map field →
 * message (ví dụ `["email must be an email"]`). Ta lấy token đầu câu làm tên
 * field: đó là quy ước của class-validator ở backend. Token nào không khớp
 * field nào trong form thì dồn lên banner — không nuốt mất.
 *
 * Trả về message cho banner cấp form, hoặc `null` nếu mọi lỗi đã gắn vào input.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[] = [],
): string | null {
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
  return "Đã có lỗi xảy ra";
}
