import { blogPageParamSchema } from "@noalhub/api/blog";

/**
 * Đọc `?page=` của các trang danh sách công khai.
 *
 * `null` = giá trị không hợp lệ → chỗ gọi phải `notFound()`, **không** render
 * danh sách rỗng trả 200: trang 200 rỗng bị Google index như nội dung mỏng
 * (`docs/blog-plan.md` §4.5, §6.5).
 *
 * Vắng mặt hoặc rỗng thì là trang 1, không phải lỗi — `/blogs`, `/blogs?page=1`
 * và `/blogs?page=` là ba URL cùng một nội dung, và cả ba canonical về `/blogs`.
 */
export function readPageParam(value: string | string[] | undefined): number | null {
  if (value === undefined || value === "") return 1;
  // `?page=1&page=2` cho ra mảng — không đoán ý người gõ, coi là URL sai.
  if (typeof value !== "string") return null;

  const parsed = blogPageParamSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * `?page` vượt tổng số trang cũng là URL sai. Kiểm được là nhờ `total` trong
 * envelope (§2.1a) — không có nó thì không phân biệt được "trang 9 không tồn
 * tại" với "trang 9 tình cờ rỗng".
 *
 * Ngoại lệ: danh sách rỗng hoàn toàn (`total === 0`) thì trang 1 vẫn hợp lệ —
 * đó là trạng thái đúng của site khi chưa có bài, không phải lỗi (§6.5).
 */
export function isPageOutOfRange(page: number, total: number, limit: number): boolean {
  if (total === 0) return page > 1;
  return page > Math.ceil(total / Math.max(1, limit));
}
