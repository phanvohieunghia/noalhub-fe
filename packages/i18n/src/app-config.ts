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
 * The message tree, shaped from the **`vi`** files — `vi` is the source
 * version and every other locale must match it (the `check-messages` script
 * enforces that in CI).
 *
 * Declared here so that a mistyped key is a **TypeScript error** rather than a
 * stray string appearing in the UI at runtime (`docs/i18n.md` §9).
 *
 * This file only takes effect when it is **imported** — TypeScript module
 * augmentation is not applied project-wide on its own. Each app imports it once
 * from `i18n/app-config.ts`.
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
 * Declares `Messages` ONLY, deliberately not `Locale`.
 *
 * Declaring `Locale` would narrow `setRequestLocale`/`getTranslations` to
 * `"vi" | "en"`, while the `params.locale` Next hands to every page is always a
 * `string` (the dynamic segment also catches `/unknown.txt`). Every page would
 * then need another `hasLocale()` check even though `app/[locale]/layout.tsx`
 * already calls `notFound()` on garbage — the same thing verified twice, for
 * exactly one extra safe spot.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: AppMessages;
  }
}
