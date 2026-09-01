import type { MetadataRoute } from "next";

import { absoluteUrl } from "@noalhub/core/blog/seo";
import { LOCALES } from "@noalhub/i18n/config";

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

/** Mọi route (trừ `/auth/callback`) giờ nằm sau tiền tố locale. */
const PRIVATE_PATHS = [
  "/chat",
  "/friends",
  "/dashboard",
  "/profile",
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Nhánh công khai duy nhất, một mục cho mỗi ngôn ngữ.
      allow: LOCALES.map((locale) => `/${locale}/blogs`),
      disallow: [
        "/",
        // Đường dẫn riêng tư phải liệt kê **theo từng locale**: `/chat` trần
        // không còn tồn tại, và một dòng `/chat` không chặn được `/vi/chat`.
        ...LOCALES.flatMap((locale) => PRIVATE_PATHS.map((path) => `/${locale}${path}`)),
        // `/auth/callback` cố ý nằm ngoài `[locale]` (OAuth redirect_uri).
        "/auth",
        // Webhook nội bộ (§5.2). nginx đã `deny all` đường công khai; dòng này
        // chỉ để crawler tử tế khỏi thử.
        "/api",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
