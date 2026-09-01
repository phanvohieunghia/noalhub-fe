import type { BlogPostFormValues } from "@noalhub/api/blog";

/** Slug backend sinh cho bản nháp trống — dấu hiệu bài chưa được đặt tên thật. */
const DEFAULT_SLUG_PREFIX = "bai-viet-khong-ten";

export type PublishIssue = {
  id: string;
  message: string;
  /** `true` = không cho bấm Đăng. `false` = cảnh báo mềm, vẫn đăng được. */
  blocking: boolean;
};

/**
 * Checklist của nút Publish (`docs/blog-plan.md` §7.4).
 *
 * **Chuyên mục là chặn cứng**, không phải cảnh báo mềm: backend cũng sẽ trả
 * `POST_NOT_PUBLISHABLE` (§2.2), nên để người dùng bấm rồi mới báo lỗi là bắt họ
 * đi hai vòng.
 *
 * Ba mục còn lại là cảnh báo: bài thiếu ảnh bìa vẫn là bài đúng, chỉ là chia sẻ
 * lên mạng xã hội sẽ xấu. Chặn cứng thứ không thật sự hỏng là cách nhanh nhất
 * làm người ta học cách bỏ qua checklist.
 */
export function publishChecklist(
  values: BlogPostFormValues,
  { hasUnsavedChanges }: { hasUnsavedChanges: boolean },
): PublishIssue[] {
  const issues: PublishIssue[] = [];

  if (!values.categorySlug) {
    issues.push({
      id: "category",
      message: "Chưa chọn chuyên mục. Bài không có chuyên mục thì không đăng được.",
      blocking: true,
    });
  }

  // Đăng bản đang gõ dở nghĩa là độc giả thấy nội dung CŨ trong khi editor hiện
  // nội dung mới — không có autosave nên khoảng lệch này hoàn toàn im lặng (§7.3).
  if (hasUnsavedChanges) {
    issues.push({
      id: "unsaved",
      message: "Còn thay đổi chưa lưu. Lưu trước rồi hãy đăng, nếu không bản lên sóng là bản cũ.",
      blocking: true,
    });
  }

  if (!values.metaDescription.trim() && !values.excerpt.trim()) {
    issues.push({
      id: "description",
      message:
        "Chưa có meta description lẫn tóm tắt. Google sẽ tự cắt một đoạn trong bài, thường không hay bằng.",
      blocking: false,
    });
  }

  if (!values.coverImageUrl.trim()) {
    issues.push({
      id: "cover",
      message: "Chưa có ảnh bìa. Link chia sẻ lên mạng xã hội sẽ chỉ có chữ.",
      blocking: false,
    });
  }

  if (values.slug.startsWith(DEFAULT_SLUG_PREFIX)) {
    issues.push({
      id: "slug",
      message:
        "Slug vẫn là slug mặc định. Đổi trước khi đăng — sau khi đăng thì đổi slug là chuyện của redirect 301.",
      blocking: false,
    });
  }

  return issues;
}
