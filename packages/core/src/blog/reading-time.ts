/**
 * Thời gian đọc ước lượng, tính từ `contentText` (plain text do **backend**
 * sinh, §2.3).
 *
 * ⚠️ Chỉ dùng được ở **trang bài viết**. `BlogPostListItem` cố tình không có
 * `content` lẫn `contentText` để list 20 bài không nặng vài trăm KB, nên ở
 * trang danh sách phải đọc `readingMinutes` do backend trả (§2.3a) — không có
 * đường thứ ba.
 */
const WORDS_PER_MINUTE = 200;

export function readingMinutes(contentText: string): number {
  const words = contentText.trim().split(/\s+/).filter(Boolean).length;
  // Bài rỗng vẫn là "1 phút đọc": hiện "0 phút đọc" trông như lỗi hiển thị.
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} phút đọc`;
}
