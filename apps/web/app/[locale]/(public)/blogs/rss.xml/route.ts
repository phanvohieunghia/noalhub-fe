import { getPublishedPosts } from "@noalhub/api/blog/server";
import { absoluteUrl } from "@noalhub/core/blog/seo";
import { DEFAULT_LOCALE } from "@noalhub/i18n/config";
import { getTranslations } from "next-intl/server";

/**
 * Cùng lý do với `sitemap.ts`: prerender lúc build cho ra **feed rỗng** cho tới
 * khi hết `revalidate` sau mỗi lần deploy (đo được khi smoke test). Cache vẫn
 * nằm ở tầng `fetch` với tag `blog-list`, nên backend không bị gọi thêm.
 */
export const dynamic = "force-dynamic";

/** Vẫn dùng cho header `Cache-Control` gửi ra CDN/nginx. */
const FEED_MAX_AGE = 3600;

const FEED_SIZE = 20;

/**
 * RSS **tóm tắt**: `<description>` chỉ mang `excerpt`, không mang toàn bài
 * (`docs/blog-plan.md` §6.6).
 *
 * Đây là chỗ plan tự mâu thuẫn và đã gỡ: `rss.xml` là XML string nên nó cần
 * **chuỗi HTML đã escape**, trong khi §3 chốt "không có đường nào nhả HTML thô"
 * và renderer ở `packages/ui/src/blog/post-content.tsx` trả React element.
 *
 * Viết thêm một `postContentToHtml()` để lấp chỗ đó là dựng lại đúng cái đường
 * nhả HTML mà §3 vừa xoá — tự escape, tự map từng node, tự giữ đồng bộ với
 * renderer React mãi mãi, và sai một chỗ escape là XSS trong reader của người
 * khác. Feed tóm tắt là chuẩn quen thuộc và tốn 0 đồng: `excerpt` luôn có sẵn
 * (§2.3b).
 *
 * Nếu sau này thật sự cần full-content feed thì `postContentToHtml()` phải nằm
 * **cạnh** renderer trong `packages/ui/src/blog/`, dùng chung một bảng map node
 * — không phải một bản sao thứ hai đặt trong file này.
 *
 * **MỘT feed duy nhất, tiếng Việt** (`docs/i18n-plan.md` §8): nội dung bài chưa
 * dịch nên feed thứ hai chỉ khác nhau ở tiêu đề kênh, còn từng bài thì giống hệt
 * — hai feed cùng nội dung là chuyện phiền cho reader chứ không phải tính năng.
 * Route vẫn nằm trong `[locale]` (không thể để ngoài, vì `(public)` mới có
 * layout của blog), nhưng `/en/blogs/rss.xml` cố ý trả **đúng** feed tiếng Việt.
 * Đường cũ `/blogs/rss.xml` được `next.config.ts` redirect 308 sang bản `vi`.
 */
export async function GET() {
  // Khoá cứng vào `vi`, không đọc locale của request: xem chú thích trên.
  const t = await getTranslations({ locale: DEFAULT_LOCALE, namespace: "web.blog.rss" });

  // ⚠️ Cùng lý do với `generateStaticParams` ở §4.4a, và đây là chỗ nó **đã vỡ
  // thật**: Route Handler được Next prerender lúc `next build`, mà lúc đó
  // `API_INTERNAL_URL` chưa tồn tại nên `server.ts` gọi ra API production từ
  // GitHub runner. Backend không trả được là **build FE đỏ vì một file RSS**.
  //
  // §4.4a chỉ nêu `generateStaticParams` vì đó là ca tác giả plan tìm ra, nhưng
  // luật nó phát biểu ("build FE không được phụ thuộc backend đang sống") áp cho
  // MỌI route prerender lúc build. Feed rỗng tạm thời rẻ hơn một điểm gãy trong
  // CD, và `revalidate` sinh lại nó ở lượt truy cập sau.
  const items = await getPublishedPosts({ limit: FEED_SIZE })
    .then((list) => list.items)
    .catch(() => []);

  const feedUrl = absoluteUrl(`/${DEFAULT_LOCALE}/blogs/rss.xml`);
  const siteUrl = absoluteUrl(`/${DEFAULT_LOCALE}/blogs`);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(t("title"))}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(t("description"))}</description>
    <language>${DEFAULT_LOCALE}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items.map(itemXml).join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Đường đi qua CDN/nginx cũng nên biết feed sống được bao lâu.
      "Cache-Control": `public, max-age=0, s-maxage=${FEED_MAX_AGE}`,
    },
  });
}

function itemXml(post: {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: { name: string };
}): string {
  const url = absoluteUrl(`/${DEFAULT_LOCALE}/blogs/${post.slug}`);

  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category.name)}</category>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
}

/**
 * Năm ký tự bắt buộc của XML. `&` phải thay ĐẦU TIÊN, nếu không những lần thay
 * sau lại escape chính dấu `&` mình vừa sinh ra (`&lt;` thành `&amp;lt;`).
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
