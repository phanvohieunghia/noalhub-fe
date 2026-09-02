import { getBlogCategories } from "@noalhub/api/blog/server";
import { Link } from "@noalhub/i18n/navigation";
import { IntlProvider } from "@noalhub/i18n/provider";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/layout/site-footer";

/**
 * The shell of the **public** area (the blog). Without this file the blog
 * inherits the root layout, which only wraps `AuthProvider` + `QueryProvider`
 * and has **no header or footer at all**: posts float free, with no way back to
 * `/blogs`, no nav and no footer (`docs/blog.md` §6.1).
 *
 * **Categories live in the main nav** — that is why they exist as their own axis
 * (§2.6). Tags do NOT reach the nav and appear only under each post: putting
 * both axes in the nav manufactures dozens of near-duplicate URLs.
 */
export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // Repeated in each route group: `setRequestLocale` only applies to the branch
  // being rendered, and missing it drops the blog out of static rendering
  // (§3.1).
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  // A broken nav must not kill the post page: if the backend is down the post
  // must still be readable (it has its own cache). `/blogs`'s `error.tsx`
  // handles CONTENT failures; this is only navigation.
  const categories = await getBlogCategories().catch(() => []);

  return (
    <IntlProvider namespace="web.blog">
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-border">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
            <Link href="/blogs" className="text-body-2 font-semibold">
              {t("blogBrand")}
            </Link>

            <nav aria-label={t("categoriesNav")} className="flex flex-wrap items-center gap-4 text-body-3">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/blogs/category/${category.slug}`}
                  className="opacity-70 transition-opacity hover:opacity-100"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-4">
              <Link href="/login" className="text-body-3 opacity-70 hover:opacity-100">
                {t("login")}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>

        <SiteFooter />
      </div>
    </IntlProvider>
  );
}
