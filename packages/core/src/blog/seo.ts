import type { BlogPost, BlogPostListItem } from "@noalhub/api/blog";

/**
 * Helper SEO thuần cho blog — không React, không fetch. Dùng ở **cả hai** phía:
 * `apps/web` dựng `generateMetadata` + JSON-LD, `apps/admin` dựng preview kết
 * quả Google trong panel SEO (§7.2). Một chỗ định nghĩa thì preview trong admin
 * không nói dối về thứ sẽ lên Google.
 */

/**
 * Ngưỡng cắt của Google. Đây là **cảnh báo mềm** ở editor, không chặn lưu —
 * Google cắt theo pixel chứ không theo ký tự, nên con số chỉ là ước lượng.
 */
export const SEO_LIMITS = { title: 60, description: 155 } as const;

/**
 * Origin công khai của `apps/web`.
 *
 * ⚠️ `NEXT_PUBLIC_*` bị **inline lúc build**, nên biến này phải có mặt trong
 * khối `env:` của `.github/workflows/publish.yml` và trong `build-args` của
 * Dockerfile. Thiếu là mọi URL tuyệt đối (canonical, OG, sitemap, JSON-LD) ra
 * `undefined/...` mà build vẫn xanh (§6.1).
 */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100").replace(
    /\/+$/,
    "",
  );
}

/** URL tuyệt đối cho JSON-LD và RSS — hai chỗ `metadataBase` không lo hộ. */
export function absoluteUrl(path: string): string {
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function postPath(slug: string): string {
  return `/blogs/${slug}`;
}

export function categoryPath(slug: string): string {
  return `/blogs/category/${slug}`;
}

export function tagPath(slug: string): string {
  return `/blogs/tag/${slug}`;
}

/**
 * Canonical của trang danh sách (§4.5).
 *
 * Trang 1 luôn là `/blogs` **kể cả khi URL có `?page=1`** — nếu không thì
 * `?page=1`, `/blogs` và `?page=` rỗng là ba URL cùng một nội dung.
 */
export function listCanonical(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/** `seo.metaTitle ?? title` (§6.2). */
export function postMetaTitle(post: BlogPost): string {
  return post.seo.metaTitle ?? post.title;
}

/**
 * `seo.metaDescription ?? excerpt` (§6.2).
 *
 * Không cần tầng thứ ba: backend tự sinh `excerpt` từ `contentText` lúc ghi nên
 * `excerpt` luôn có (§2.3b). Chuỗi `?? ""` chỉ là lưới cho ca backend chưa làm
 * phần đó — một bài không có description nào là lỗi SEO im lặng.
 */
export function postMetaDescription(post: BlogPost): string {
  return post.seo.metaDescription ?? post.excerpt ?? "";
}

/** `seo.ogImageUrl ?? coverImageUrl`. Không có ảnh nào thì trả `null` (§6.3). */
export function postOgImage(post: BlogPost): string | null {
  return post.seo.ogImageUrl ?? post.coverImageUrl;
}

/**
 * Cắt cho preview: cắt ở **ranh giới từ** rồi thêm `…`. Cắt giữa từ làm preview
 * trông sai lệch hơn thực tế và người viết sẽ sửa nhầm chỗ.
 */
export function truncateForSeo(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;

  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Mô tả hiển thị ở thẻ bài trong danh sách. */
export function listItemDescription(item: BlogPostListItem): string {
  return truncateForSeo(item.excerpt, 180);
}
