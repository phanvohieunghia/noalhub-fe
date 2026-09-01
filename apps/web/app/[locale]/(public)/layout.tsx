import { getBlogCategories } from "@noalhub/api/blog/server";
import { Link } from "@noalhub/i18n/navigation";
import { IntlProvider } from "@noalhub/i18n/provider";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Khung của vùng **công khai** (blog). Thiếu file này thì blog thừa hưởng root
 * layout, mà root layout chỉ bọc `AuthProvider` + `QueryProvider` và **không có
 * header/footer nào**: bài viết nổi lơ lửng, không đường về `/blogs`, không nav,
 * không footer (`docs/blog-plan.md` §6.1).
 *
 * **Chuyên mục nằm ở nav chính** — đó là lý do nó tồn tại như một trục riêng
 * (§2.6). Thẻ thì KHÔNG lên nav, chỉ xuất hiện dưới mỗi bài: cho cả hai trục lên
 * nav là tự tạo ra hàng chục URL gần trùng nhau.
 */
export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // Nhắc lại ở mỗi nhóm route: `setRequestLocale` chỉ có hiệu lực trong nhánh
  // đang render, và thiếu nó là blog rơi khỏi static rendering (§3.1).
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  // Nav hỏng không được làm chết trang bài viết: backend sập thì bài vẫn phải
  // đọc được (nó có cache riêng). `error.tsx` của `/blogs` lo lỗi của NỘI DUNG,
  // còn đây chỉ là điều hướng.
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
