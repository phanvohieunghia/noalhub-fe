import { LOCALES } from "@noalhub/i18n/config";
import { IntlProvider } from "@noalhub/i18n/provider";
import { NavigationProgress } from "@noalhub/ui/navigation-progress";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { WebLocaleSync } from "@/components/auth/locale-sync";

import { RootHtml, rootMetadata } from "../root-html";

/**
 * The root layout for everything that has a language. This is where
 * `<html lang>` states the language actually being rendered — a wrong `lang`
 * makes a screen reader read English in a Vietnamese voice, and makes Google
 * treat the page as Vietnamese regardless of its content.
 *
 * `generateStaticParams` lets Next prebuild both locales. Without it every blog
 * page falls out of SSG and nginx loses its cache (§10).
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return { ...rootMetadata, description: t("siteDescription") };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // `[locale]` catches every path that matches no other route
  // (`/unknown.txt`), so this value is not necessarily a locale — validate
  // before using it.
  if (!hasLocale(LOCALES, locale)) notFound();

  /*
   * REQUIRED, and it must run before any `getTranslations` in the tree: without
   * it next-intl has to read the request to learn the locale, and the whole
   * route drops out of static rendering — the blog loses SSG and nginx loses its
   * cache (§3.1).
   */
  setRequestLocale(locale);

  return (
    <RootHtml lang={locale}>
      {/* The provider here carries only `common`/`nav`/`validation`. Each route
          group wraps its own namespace — see `IntlProvider`. */}
      {/* `NavigationProgress` must live INSIDE `IntlProvider` — it reads
          `common.states.loading` for its sr-only line. Mounted once here rather
          than attached to each header: `/dashboard`, `/profile` and `/friends`
          have no header at all (see the note in the component itself). */}
      <IntlProvider>
        <NavigationProgress />
        <WebLocaleSync />
        {children}
      </IntlProvider>
    </RootHtml>
  );
}
