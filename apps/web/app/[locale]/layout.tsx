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
 * Root layout của toàn bộ phần có ngôn ngữ. Đây là nơi `<html lang>` nói đúng
 * thứ tiếng đang render — `lang` sai thì trình đọc màn hình đọc tiếng Anh bằng
 * giọng tiếng Việt, và Google coi trang là tiếng Việt bất kể nội dung.
 *
 * `generateStaticParams` cho phép Next dựng sẵn cả hai locale lúc build. Thiếu
 * nó thì mọi trang blog rơi khỏi SSG và nginx hết cache (§10).
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

  // `[locale]` bắt mọi đường dẫn không khớp route nào khác (`/unknown.txt`),
  // nên giá trị ở đây chưa chắc là locale — phải kiểm rồi mới dùng.
  if (!hasLocale(LOCALES, locale)) notFound();

  /*
   * BẮT BUỘC, và phải gọi trước mọi `getTranslations` trong cây: thiếu nó thì
   * next-intl phải đọc request để biết locale, và cả route rơi khỏi static
   * rendering — blog mất SSG, nginx mất cache (§3.1).
   */
  setRequestLocale(locale);

  return (
    <RootHtml lang={locale}>
      {/* Provider ở đây chỉ mang `common`/`nav`/`validation`. Mỗi nhóm route
          tự bọc thêm namespace của mình — xem `IntlProvider`. */}
      {/* `NavigationProgress` phải nằm TRONG `IntlProvider` — nó đọc
          `common.states.loading` cho dòng sr-only. Đặt một lần ở đây, không gắn
          vào từng header: `/dashboard`, `/profile`, `/friends` không có header
          nào (xem chú thích trong chính component). */}
      <IntlProvider>
        <NavigationProgress />
        <WebLocaleSync />
        {children}
      </IntlProvider>
    </RootHtml>
  );
}
