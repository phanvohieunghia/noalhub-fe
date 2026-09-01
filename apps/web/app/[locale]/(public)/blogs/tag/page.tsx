import { Link } from "@noalhub/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getBlogTags } from "@noalhub/api/blog/server";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { Typography } from "@noalhub/ui/typography";

/**
 * Dynamic vì cùng lý do với `sitemap.ts` và `rss.xml`: bản prerender lúc build
 * là bản **rỗng**, và nó sống tới hết `revalidate` sau mỗi lần deploy. Cache nằm
 * ở tầng `fetch` (`blog-tags`, 3600 giây).
 */
export const dynamic = "force-dynamic";

/**
 * Chỉ mục thẻ. Là trang **thật** (danh sách thẻ + số bài), khác `/blogs/category`
 * trần vốn chỉ redirect — nhưng vẫn `noindex`, vì nó là mục lục của các trang
 * noindex (`docs/blog-plan.md` §6.5).
 *
 * `follow` vẫn bật: Google không index trang này nhưng vẫn đi theo link vào các
 * bài bên trong.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blogs/tag">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "web.blog.tag" });

  return {
    title: t("indexTitle"),
    description: t("indexDescription"),
    alternates: { canonical: `/${locale}/blogs/tag` },
    robots: { index: false, follow: true },
  };
}

export default async function TagIndexPage({ params }: PageProps<"/[locale]/blogs/tag">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("web.blog");

  // Chỉ mục thẻ là trang `noindex` và chỉ để điều hướng, nên hiện danh sách rỗng
  // khi backend trục trặc là đánh đổi đúng; nội dung thật thì `error.tsx` lo.
  const tags = await getBlogTags().catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.blog"), href: "/blogs" }, { label: t("tag.indexTitle") }]}
      />

      <header className="flex flex-col gap-2">
        <Typography variant="h3" as="h1">
          {t("tag.indexTitle")}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("tag.indexSubtitle")}
        </Typography>
      </header>

      {tags.length === 0 ? (
        <Typography
          variant="body-3"
          className="rounded-lg border border-dashed border-black/15 px-4 py-12 text-center opacity-60 dark:border-white/20"
        >
          {t("tag.indexEmpty")}
        </Typography>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                href={`/blogs/tag/${tag.slug}`}
                className="flex items-center gap-1.5 rounded-full bg-black/8 px-3 py-1.5 text-body-3 transition-opacity hover:opacity-80 dark:bg-white/12"
              >
                <span>#{tag.name}</span>
                <span className="tabular-nums opacity-50">{tag.postCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
