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

import "./tailwind.css";

/** Every namespace of both locales, so any story can pick either language. */
const messages = {
  vi: {
  "admin.login": viAdminLogin,
  "admin.overview": viAdminOverview,
  "admin.posts": viAdminPosts,
  "admin.users": viAdminUsers,
  "common": viCommon,
  "nav": viNav,
  "validation": viValidation,
  "web.auth": viWebAuth,
  "web.blog": viWebBlog,
  "web.chat": viWebChat,
  "web.dashboard": viWebDashboard,
  "web.friends": viWebFriends,
  "web.profile": viWebProfile,
  },
  en: {
  "admin.login": enAdminLogin,
  "admin.overview": enAdminOverview,
  "admin.posts": enAdminPosts,
  "admin.users": enAdminUsers,
  "common": enCommon,
  "nav": enNav,
  "validation": enValidation,
  "web.auth": enWebAuth,
  "web.blog": enWebBlog,
  "web.chat": enWebChat,
  "web.dashboard": enWebDashboard,
  "web.friends": enWebFriends,
  "web.profile": enWebProfile,
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
    a11y: { test: "todo" },
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
    locale: "vi",
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
