import type { MetadataRoute } from "next";

import { getBlogCategories, getBlogSitemapEntries } from "@noalhub/api/blog/server";
import { absoluteUrl } from "@noalhub/core/blog/seo";

/**
 * **Dựng lúc chạy, không lúc build.**
 *
 * `sitemap.ts` mặc định được prerender lúc `next build`, mà lúc đó
 * `API_INTERNAL_URL` chưa tồn tại và backend production có thể không với tới
 * được từ CI (§4.4a). Kết cục đo được khi smoke test: **sitemap rỗng suốt tới
 * một tiếng sau mỗi lần deploy**, và không ai thấy vì build vẫn xanh.
 *
 * `force-dynamic` bỏ hẳn lượt prerender đó. Tải lên backend không đổi: `fetch`
 * trong `server.ts` vẫn cache 3600 giây và vẫn mang tag `blog-sitemap`, nên
 * webhook §5.2 vẫn xoá được — chỉ có phần ráp XML là làm lại mỗi request, và nó
 * gần như không tốn gì.
 */
export const dynamic = "force-dynamic";

/**
 * Sitemap gồm: `/blogs`, từng bài, từng chuyên mục (§6.3).
 *
 * KHÔNG gồm:
 * - `?page=N` — Google tự bò theo link phân trang (§4.5), và mỗi trang danh sách
 *   là nội dung gần trùng nhau.
 * - trang **thẻ** — thẻ là `noindex, follow` (§2.6); đưa URL noindex vào sitemap
 *   là gửi tín hiệu mâu thuẫn.
 * - `/` — trang chủ vẫn nằm sau `AuthGuard`, xem `robots.ts`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, categories] = await Promise.all([
    safe(getBlogSitemapEntries, []),
    safe(getBlogCategories, []),
  ]);

  return [
    {
      url: absoluteUrl("/blogs"),
      lastModified: entries[0]?.updatedAt ? new Date(entries[0].updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...categories.map((category) => ({
      url: absoluteUrl(`/blogs/category/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...entries.map((entry) => ({
      url: absoluteUrl(`/blogs/${entry.slug}`),
      lastModified: new Date(entry.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

/**
 * Lỗi tạm thời của backend thì **để nó ném** — sitemap 500 làm Google thử lại,
 * còn sitemap 200-nhưng-rỗng nói với Google rằng site không còn URL nào. Hàm này
 * chỉ nuốt ca 404 (`server.ts` đã quy về mảng rỗng) và giữ chữ ký gọn cho
 * `Promise.all`.
 */
async function safe<T>(load: () => Promise<T[]>, fallback: T[]): Promise<T[]> {
  const result = await load();
  return result.length ? result : fallback;
}
