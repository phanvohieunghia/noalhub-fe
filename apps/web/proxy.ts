import { routing } from "@noalhub/i18n/routing";
import createMiddleware from "next-intl/middleware";

/**
 * Từ Next 16, `middleware.ts` đổi tên thành `proxy.ts` — cùng một cơ chế, chỉ
 * khác tên file và tên hàm export (`docs/01-app/01-getting-started/16-proxy.md`).
 *
 * Việc duy nhất ở đây: redirect `/` → `/vi`, chèn tiền tố locale cho đường dẫn
 * chưa có, và gắn cookie `NOALHUB_LOCALE` theo thứ tự ưu tiên ở §4.2 (URL →
 * cookie → `Accept-Language` → `vi`).
 */
export const proxy = createMiddleware(routing);

export const config = {
  /*
   * Loại trừ, theo đúng thứ tự lý do:
   * - `api`, `_next`, `_vercel`: không phải trang.
   * - `auth/callback`: `redirect_uri` đã ghim ở backend và ở console của
   *   Google/GitHub. Thêm tiền tố locale vào đây là hỏng đăng nhập OAuth.
   * - Mọi đường dẫn có dấu chấm: file tĩnh (`favicon.ico`, `robots.txt`,
   *   `sitemap.xml`, và cả `blogs/rss.xml` — feed chỉ có một bản tiếng Việt,
   *   §8).
   */
  matcher: "/((?!api|_next|_vercel|auth/callback|.*\\..*).*)",
};
