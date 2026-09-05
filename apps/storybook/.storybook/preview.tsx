import type { Decorator, Preview } from "@storybook/nextjs";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { withThemeByClassName } from "@storybook/addon-themes";

import viAdminLogin from "../../../packages/i18n/messages/vi/admin.login.json";
import viAdminOverview from "../../../packages/i18n/messages/vi/admin.overview.json";
import viAdminPosts from "../../../packages/i18n/messages/vi/admin.posts.json";
import viAdminUsers from "../../../packages/i18n/messages/vi/admin.users.json";
import viCommon from "../../../packages/i18n/messages/vi/common.json";
import viNav from "../../../packages/i18n/messages/vi/nav.json";
import viValidation from "../../../packages/i18n/messages/vi/validation.json";
import viWebAuth from "../../../packages/i18n/messages/vi/web.auth.json";
import viWebBlog from "../../../packages/i18n/messages/vi/web.blog.json";
import viWebChat from "../../../packages/i18n/messages/vi/web.chat.json";
import viWebDashboard from "../../../packages/i18n/messages/vi/web.dashboard.json";
import viWebFriends from "../../../packages/i18n/messages/vi/web.friends.json";
import viWebProfile from "../../../packages/i18n/messages/vi/web.profile.json";

import enAdminLogin from "../../../packages/i18n/messages/en/admin.login.json";
import enAdminOverview from "../../../packages/i18n/messages/en/admin.overview.json";
import enAdminPosts from "../../../packages/i18n/messages/en/admin.posts.json";
import enAdminUsers from "../../../packages/i18n/messages/en/admin.users.json";
import enCommon from "../../../packages/i18n/messages/en/common.json";
import enNav from "../../../packages/i18n/messages/en/nav.json";
import enValidation from "../../../packages/i18n/messages/en/validation.json";
import enWebAuth from "../../../packages/i18n/messages/en/web.auth.json";
import enWebBlog from "../../../packages/i18n/messages/en/web.blog.json";
import enWebChat from "../../../packages/i18n/messages/en/web.chat.json";
import enWebDashboard from "../../../packages/i18n/messages/en/web.dashboard.json";
import enWebFriends from "../../../packages/i18n/messages/en/web.friends.json";
import enWebProfile from "../../../packages/i18n/messages/en/web.profile.json";

/**
 * Chữ demo của chính story (nhãn nút mẫu, tên người mẫu, nội dung bài mẫu).
 * Không nằm trong `packages/i18n` vì đó là chỗ cho chữ của SẢN PHẨM — chi tiết
 * ở `messages/README.md`. Nạp chung vào provider nên toolbar ngôn ngữ đổi luôn
 * cả phần này.
 */
import sbVi from "../messages/vi.json";
import sbEn from "../messages/en.json";

import "./tailwind.css";

/**
 * Every namespace of both locales, so any story can pick either language.
 *
 * The dot in `web.auth` is a PATH, not a key: next-intl refuses a literal key
 * containing "." (`INVALID_KEY`), and the apps never hand it one — `assign()`
 * in `packages/i18n/src/messages.ts` nests each namespace before it reaches the
 * provider. Storybook has to nest it too, or every story that reads a message
 * throws at render.
 */
const messages = {
  vi: {
    sb: sbVi,
    common: viCommon,
    nav: viNav,
    validation: viValidation,
    admin: {
      login: viAdminLogin,
      overview: viAdminOverview,
      posts: viAdminPosts,
      users: viAdminUsers,
    },
    web: {
      auth: viWebAuth,
      blog: viWebBlog,
      chat: viWebChat,
      dashboard: viWebDashboard,
      friends: viWebFriends,
      profile: viWebProfile,
    },
  },
  en: {
    sb: sbEn,
    common: enCommon,
    nav: enNav,
    validation: enValidation,
    admin: {
      login: enAdminLogin,
      overview: enAdminOverview,
      posts: enAdminPosts,
      users: enAdminUsers,
    },
    web: {
      auth: enWebAuth,
      blog: enWebBlog,
      chat: enWebChat,
      dashboard: enWebDashboard,
      friends: enWebFriends,
      profile: enWebProfile,
    },
  },
} as const;

type Locale = keyof typeof messages;

/** Wraps every story in the same i18n provider the apps use. */
const withI18n: Decorator = (Story, context) => {
  const locale = (context.globals.locale as Locale) ?? "vi";

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <Story />
    </NextIntlClientProvider>
  );
};

const preview: Preview = {
  // Every component gets its auto-generated Docs page (props table from the
  // TypeScript types + the JSDoc above them) without repeating the tag in each
  // story file.
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // "error" makes an axe violation fail the story in `test-storybook`, which is
    // the whole point of running it in CI. The default scaffold ships "todo",
    // which reports violations and then passes anyway.
    a11y: { test: "error" },
    // Both apps are App Router. Without this, `@storybook/nextjs` mocks the
    // Pages Router and every `next/navigation` hook (`usePathname`,
    // `useSearchParams`, `useRouter`) throws when the story renders.
    nextjs: { appDirectory: true },
  },
  globalTypes: {
    locale: {
      description: "Ngôn ngữ hiển thị",
      toolbar: {
        icon: "globe",
        items: [
          { value: "vi", title: "Tiếng Việt" },
          { value: "en", title: "English" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: "en",
  },
  decorators: [
    withI18n,
    // The apps toggle dark mode with a `dark` class on `<html>`; mirror that
    // here so the tokens in `theme.css` switch exactly the same way.
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
      parentSelector: "html",
    }),
  ],
};

export default preview;
