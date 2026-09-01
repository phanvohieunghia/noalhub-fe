/**
 * Thời gian đọc ước lượng, tính từ `contentText` (plain text do **backend**
 * sinh, §2.3).
 *
 * ⚠️ Chỉ dùng được ở **trang bài viết**. `BlogPostListItem` cố tình không có
 * `content` lẫn `contentText` để list 20 bài không nặng vài trăm KB, nên ở
 * trang danh sách phải đọc `readingMinutes` do backend trả (§2.3a) — không có
 * đường thứ ba.
 *
 * Chỉ còn phần TÍNH. Phần hiển thị ("… phút đọc") là chuỗi người dùng đọc nên
 * nó nằm ở `web.blog.post.readingTime`, dịch lúc render — hàm này không biết
 * locale nào (`docs/i18n-plan.md` §7.3).
 */
const WORDS_PER_MINUTE = 200;

export function readingMinutes(contentText: string): number {
  const words = contentText.trim().split(/\s+/).filter(Boolean).length;
  // Bài rỗng vẫn là "1 phút đọc": hiện "0 phút đọc" trông như lỗi hiển thị.
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
