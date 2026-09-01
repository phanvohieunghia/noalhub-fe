import type adminLogin from "../messages/vi/admin.login.json";
import type adminOverview from "../messages/vi/admin.overview.json";
import type adminPosts from "../messages/vi/admin.posts.json";
import type adminUsers from "../messages/vi/admin.users.json";
import type common from "../messages/vi/common.json";
import type nav from "../messages/vi/nav.json";
import type validation from "../messages/vi/validation.json";
import type webAuth from "../messages/vi/web.auth.json";
import type webBlog from "../messages/vi/web.blog.json";
import type webChat from "../messages/vi/web.chat.json";
import type webDashboard from "../messages/vi/web.dashboard.json";
import type webFriends from "../messages/vi/web.friends.json";
import type webProfile from "../messages/vi/web.profile.json";

/**
 * Cây message, lấy hình dạng từ bản **`vi`** — nó là bản gốc, mọi locale khác
 * phải khớp nó (script `check-messages` bắt buộc điều đó ở CI).
 *
 * Khai ở đây để gõ sai khoá là **lỗi TypeScript**, không phải một chuỗi lạ hiện
 * lên giao diện lúc chạy (`docs/i18n-plan.md` §9).
 *
 * File này chỉ có tác dụng khi được **import** — augmentation của TypeScript
 * không tự áp cho project. Mỗi app import nó một lần ở `i18n/app-config.ts`.
 */
export type AppMessages = {
  common: typeof common;
  nav: typeof nav;
  validation: typeof validation;
  web: {
    auth: typeof webAuth;
    blog: typeof webBlog;
    chat: typeof webChat;
    dashboard: typeof webDashboard;
    friends: typeof webFriends;
    profile: typeof webProfile;
  };
  admin: {
    login: typeof adminLogin;
    overview: typeof adminOverview;
    posts: typeof adminPosts;
    users: typeof adminUsers;
  };
};

/**
 * CHỈ khai `Messages`, không khai `Locale`.
 *
 * Khai `Locale` thì `setRequestLocale`/`getTranslations` chỉ nhận `"vi" | "en"`,
 * trong khi `params.locale` mà Next đưa xuống mọi page luôn là `string` (segment
 * động bắt cả `/unknown.txt`). Hệ quả là mỗi page phải `hasLocale()` một lần
 * nữa dù `app/[locale]/layout.tsx` đã `notFound()` cho giá trị rác — kiểm hai
 * lần cho cùng một thứ, đổi lấy đúng một chỗ an toàn hơn.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: AppMessages;
  }
}
