import type { MetadataRoute } from "next";

import { getBlogCategories, getBlogSitemapEntries } from "@noalhub/api/blog/server";
import { absoluteUrl } from "@noalhub/core/blog/seo";
import { DEFAULT_LOCALE, LOCALES } from "@noalhub/i18n/config";

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
 *
 * Từ khi có i18n, **mỗi URL xuất hiện một lần cho mỗi locale**, kèm khối
 * `alternates.languages` trỏ chéo sang bản kia (`docs/i18n-plan.md` §8). Liệt kê
 * một locale thôi thì bản còn lại chỉ vào index được qua đường bò link.
 *
 * Ngoại lệ là **bài viết**: chúng có mặt ở cả hai locale nhưng KHÔNG khai
 * `alternates`, vì nội dung vẫn là tiếng Việt ở cả hai (§8.1).
 */

/** `hreflang` cho một đường dẫn đã dịch. `x-default` trỏ về locale mặc định. */
function languagesFor(path: string) {
  return {
    languages: {
      ...Object.fromEntries(LOCALES.map((locale) => [locale, absoluteUrl(`/${locale}${path}`)])),
      "x-default": absoluteUrl(`/${DEFAULT_LOCALE}${path}`),
    },
  };
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, categories] = await Promise.all([
    safe(getBlogSitemapEntries, []),
    safe(getBlogCategories, []),
  ]);

  return LOCALES.flatMap((locale) => [
    {
      url: absoluteUrl(`/${locale}/blogs`),
      lastModified: entries[0]?.updatedAt ? new Date(entries[0].updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: languagesFor("/blogs"),
    },
    ...categories.map((category) => ({
      url: absoluteUrl(`/${locale}/blogs/category/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: languagesFor(`/blogs/category/${category.slug}`),
    })),
    ...entries.map((entry) => ({
      url: absoluteUrl(`/${locale}/blogs/${entry.slug}`),
      lastModified: new Date(entry.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]);
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
