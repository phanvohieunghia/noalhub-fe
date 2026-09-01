/**
 * Slug kebab-case đã bỏ dấu tiếng Việt.
 *
 * Dùng cho **hai** việc, cố ý là cùng một hàm (`docs/blog-plan.md` §3.3):
 * - slug của bài (nút "sinh từ tiêu đề" ở panel SEO, §7.2),
 * - `id` của heading trong bài, để anchor và mục lục trỏ đúng chỗ.
 *
 * Hai chỗ dùng chung một luật thì URL `/blogs/gioi-thieu#cai-dat` không bao giờ
 * lệch với thứ renderer đặt vào DOM.
 */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      // Bỏ dấu thanh + dấu phụ (U+0300–U+036F) sau khi tách khỏi ký tự gốc.
      .replace(/[\u0300-\u036f]/g, "")
      // `đ`/`Đ` không phải chữ `d` có dấu phụ nên NFD không tách được — phải
      // thay tay, nếu không "đường" ra "ung" thay vì "duong".
      .replace(/[đĐ]/g, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120)
      // `slice` có thể cắt đúng giữa một dấu gạch — dọn lại lần nữa.
      .replace(/-+$/g, "")
  );
}
