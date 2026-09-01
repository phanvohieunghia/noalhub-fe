import type { MetadataRoute } from "next";

import { absoluteUrl } from "@noalhub/core/blog/seo";

/**
 * Chỉ vùng blog được crawl.
 *
 * ⚠️ `/` nằm trong `disallow` là **có chủ ý**, không phải sót: trang chủ hiện
 * vẫn ở trong route group `(protected)`, tức là đứng sau `AuthGuard` — crawler
 * vào đó chỉ thấy màn hình chờ rồi bị đá sang `/login`. Cho phép index một URL
 * như vậy là tự nộp một trang rỗng cho Google. Làm landing công khai cho `/` là
 * một đợt riêng; ngày đó thì sửa cả dòng này lẫn `sitemap.ts`
 * (`docs/blog-plan.md` §6.1).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/blogs",
      disallow: [
        "/",
        "/chat",
        "/friends",
        "/dashboard",
        "/profile",
        "/login",
        "/register",
        "/reset-password",
        "/forgot-password",
        "/auth",
        // Webhook nội bộ (§5.2). nginx đã `deny all` đường công khai; dòng này
        // chỉ để crawler tử tế khỏi thử.
        "/api",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
