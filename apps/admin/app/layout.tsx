import { DEFAULT_LOCALE, isLocale } from "@noalhub/i18n/config";
import { IntlProvider } from "@noalhub/i18n/provider";

import { AdminLocaleSync } from "@/components/layout/locale-sync";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Open_Sans } from "next/font/google";

import "./globals.css";
import { THEME_INIT_SCRIPT } from "@noalhub/core/theme/script";
import { AuthProvider } from "@noalhub/ui/auth/auth-provider";
import { NavigationProgress } from "@noalhub/ui/navigation-progress";
import { QueryProvider } from "@noalhub/ui/query-provider";
import { ThemeProvider } from "@noalhub/ui/theme/theme-provider";

/** Xem chú thích ở `apps/web/app/root-html.tsx` — hai app dùng chung một font. */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/** Bản nghiêng cho variant `caption` — xem chú thích ở `apps/web/app/root-html.tsx`. */
const openSansItalic = Open_Sans({
  variable: "--font-open-sans-italic",
  subsets: ["latin", "vietnamese"],
  style: "italic",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("adminTitle"), description: t("adminDescription") };
}

/**
 * Admin **không** có segment `[locale]`: nó nằm sau đăng nhập, không được
 * index, không ai share link — URL phân biệt ngôn ngữ chẳng để làm gì
 * (`docs/i18n-plan.md` §3.2). Locale đến từ cookie, đọc ở `i18n/request.ts`.
 *
 * Vì vậy `<html lang>` phải hỏi next-intl chứ không đọc được từ params.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    // Xem chú thích ở `apps/web/app/root-html.tsx` — hai app cố ý giống hệt nhau
    // ở khối này, kể cả key localStorage.
    <html
      lang={isLocale(locale) ? locale : DEFAULT_LOCALE}
      suppressHydrationWarning
      className={`${openSans.variable} ${openSansItalic.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {/* Namespace của từng trang do layout con bọc thêm; ở đây chỉ có
                  `common`/`nav`/`validation` mà mọi trang đều dùng. */}
              <IntlProvider>
                {/* Trong `IntlProvider` vì nó đọc `common.states.loading`; một
                    lần cho cả app, không gắn vào header. */}
                <NavigationProgress />
                <AdminLocaleSync />
                {children}
              </IntlProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
