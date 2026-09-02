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

/** See the note in `apps/web/app/root-html.tsx` — both apps share one font. */
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

/** The italic face for the `caption` variant — see the note in `apps/web/app/root-html.tsx`. */
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
 * Admin has **no** `[locale]` segment: it sits behind login, is never indexed
 * and nobody shares its links — language-distinguishing URLs would buy nothing
 * (`docs/i18n.md` §3.2). The locale comes from the cookie, read in
 * `i18n/request.ts`.
 *
 * So `<html lang>` has to ask next-intl; it cannot be read from params.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    // See the note in `apps/web/app/root-html.tsx` — both apps are deliberately
    // identical in this block, down to the localStorage key.
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
              {/* Per-page namespaces are added by child layouts; here there is
                  only `common`/`nav`/`validation`, which every page uses. */}
              <IntlProvider>
                {/* Inside `IntlProvider` because it reads
                    `common.states.loading`; mounted once for the whole app, not
                    attached to a header. */}
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
