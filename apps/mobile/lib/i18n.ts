import * as Localization from "expo-localization";
import { useLocale, useTranslations } from "use-intl";
import { create } from "zustand";
import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { isMessage, type Message } from "@noalhub/api/message";
import { secureStorageAdapter } from "./storage";

// Vietnamese messages
import viCommon from "@noalhub/i18n/messages/vi/common.json";
import viValidation from "@noalhub/i18n/messages/vi/validation.json";
import viNav from "@noalhub/i18n/messages/vi/nav.json";
import viWebAuth from "@noalhub/i18n/messages/vi/web.auth.json";
import viWebChat from "@noalhub/i18n/messages/vi/web.chat.json";
import viWebFriends from "@noalhub/i18n/messages/vi/web.friends.json";
import viWebProfile from "@noalhub/i18n/messages/vi/web.profile.json";
import viWebBlog from "@noalhub/i18n/messages/vi/web.blog.json";
import viWebDashboard from "@noalhub/i18n/messages/vi/web.dashboard.json";
import viWebLearn from "@noalhub/i18n/messages/vi/web.learn.json";

// English messages
import enCommon from "@noalhub/i18n/messages/en/common.json";
import enValidation from "@noalhub/i18n/messages/en/validation.json";
import enNav from "@noalhub/i18n/messages/en/nav.json";
import enWebAuth from "@noalhub/i18n/messages/en/web.auth.json";
import enWebChat from "@noalhub/i18n/messages/en/web.chat.json";
import enWebFriends from "@noalhub/i18n/messages/en/web.friends.json";
import enWebProfile from "@noalhub/i18n/messages/en/web.profile.json";
import enWebBlog from "@noalhub/i18n/messages/en/web.blog.json";
import enWebDashboard from "@noalhub/i18n/messages/en/web.dashboard.json";
import enWebLearn from "@noalhub/i18n/messages/en/web.learn.json";

export type SupportedLocale = "vi" | "en";
export const DEFAULT_LOCALE: SupportedLocale = "vi";

const LOCALE_STORAGE_KEY = "nh.locale";

export const messages: Record<SupportedLocale, Record<string, any>> = {
  vi: {
    common: viCommon,
    validation: viValidation,
    nav: viNav,
    web: {
      auth: viWebAuth,
      chat: viWebChat,
      friends: viWebFriends,
      profile: viWebProfile,
      blog: viWebBlog,
      dashboard: viWebDashboard,
      learn: viWebLearn,
    },
  },
  en: {
    common: enCommon,
    validation: enValidation,
    nav: enNav,
    web: {
      auth: enWebAuth,
      chat: enWebChat,
      friends: enWebFriends,
      profile: enWebProfile,
      blog: enWebBlog,
      dashboard: enWebDashboard,
      learn: enWebLearn,
    },
  },
};

/**
 * Resolves initial locale based on stored preference or device settings.
 */
export function getInitialLocale(): SupportedLocale {
  const stored = secureStorageAdapter.get(LOCALE_STORAGE_KEY);
  if (stored === "vi" || stored === "en") {
    return stored;
  }

  const deviceLocales = Localization.getLocales();
  const primaryLanguageCode = deviceLocales[0]?.languageCode;
  if (primaryLanguageCode === "vi") {
    return "vi";
  }
  if (primaryLanguageCode === "en") {
    return "en";
  }

  return DEFAULT_LOCALE;
}

function saveLocale(locale: SupportedLocale): void {
  secureStorageAdapter.set(LOCALE_STORAGE_KEY, locale);
}

/**
 * The active locale. The root layout feeds it to `IntlProvider`, so changing it
 * re-renders every screen in the new language without a restart. Storage is the
 * device-side cache; `user.language` on the backend is the source of truth
 * (docs/i18n.md §4.2), synced once per sign-in in the root layout.
 */
export const useLocaleStore = create<{
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => {
    saveLocale(locale);
    set({ locale });
  },
}));

/** Mobile counterpart of `useDateFormat()` in `@noalhub/i18n` (that one needs next-intl). */
export function useDateFormat() {
  const locale = useLocale();
  return {
    locale,
    formatDate: (value?: string | null) => formatDate(locale, value),
    formatDateTime: (value?: string | null) => formatDateTime(locale, value),
  };
}

/**
 * Translates messages produced by the data layer (ApiError, Zod, MessageError)
 * as specified in docs/i18n.md §7.3.
 */
export function useMessage() {
  const t = useTranslations();

  return (message?: Message | string | null): string | undefined => {
    if (!message) return undefined;
    const key = isMessage(message) ? message.key : message;
    const values = isMessage(message) ? message.values : undefined;

    const translate = t as unknown as {
      (key: string, values?: Record<string, string | number>): string;
      has: (key: string) => boolean;
    };

    return translate.has(key) ? translate(key, values) : key;
  };
}
