import { ApiError, isForbidden, isRateLimited } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/message";

/**
 * Thông điệp hiển thị cho lỗi ở màn hình admin — **một chỗ duy nhất**, để mọi
 * trang nói cùng một câu cho cùng một tình huống.
 *
 * Trả về **khoá i18n** chứ không phải câu đã dịch: hàm này không chạy trong
 * ngữ cảnh của một request nào, không biết locale. Component gọi `useMessage()`
 * để dịch (`docs/i18n-plan.md` §7.3).
 *
 * Ba trường hợp phải tách riêng vì hành động của người đọc khác hẳn nhau:
 * 403 (mất quyền giữa phiên — đăng nhập lại bằng tài khoản khác),
 * 429 (chờ rồi thử lại) và 404 (không có bản ghi). Không có nhánh 403 thì mất
 * role giữa phiên cho ra màn hình trắng, đúng thứ `docs/admin-plan.md` §1 chặn.
 */
export function adminErrorText(error: unknown): Message | string {
  if (isForbidden(error)) return { key: "common.errors.forbidden" };
  if (isRateLimited(error)) return { key: "common.errors.rateLimited" };

  if (error instanceof ApiError) {
    if (error.status === 404) return { key: "common.errors.notFound" };
    if (error.status === 0) return { key: "common.errors.network" };
    // `message` do backend soạn — chỉ để hiển thị, đừng parse. Không có bản
    // dịch nên hiện nguyên văn, kể cả ở giao diện tiếng Anh (§7.3).
    return error.message;
  }

  return { key: "common.errors.generic" };
}
