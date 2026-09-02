import { Link } from "@noalhub/i18n/navigation";
import { getDateFormat } from "@noalhub/i18n/date-format-server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { getBlogSitemapEntries, getPublishedPost, getRelatedPosts } from "@noalhub/api/blog/server";
import { LOCALES } from "@noalhub/i18n/config";
import { readingMinutes } from "@noalhub/core/blog/reading-time";
import {
  absoluteUrl,
  postMetaDescription,
  postMetaTitle,
  postOgImage,
} from "@noalhub/core/blog/seo";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { TableOfContents } from "@noalhub/ui/blog/table-of-contents";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { JsonLd } from "@/components/blog/json-ld";
import { RelatedPosts } from "@/components/blog/related-posts";
import { Typography } from "@noalhub/ui/typography";

type Props = PageProps<"/[locale]/blogs/[slug]">;

/** The §5.2 webhook clears the tag sooner; this number is the safety net when it misses. */
export const revalidate = 300;

/**
 * ⚠️ `generateStaticParams` **must never redden the build**.
 *
 * `publish.yml` builds the image on a GitHub runner and passes only
 * `NEXT_PUBLIC_*`; `API_INTERNAL_URL` is a compose runtime variable and
 * therefore **does not exist** at build time → `server.ts` falls back to the
 * public URL and `next build` calls the production API from the runner. A
 * backend that is down, mid-deploy, or a DuckDNS hiccup at that moment turns the
 * frontend build red — with the error surfacing in a feature unrelated to posts
 * (`docs/blog.md` §4.4a).
 *
 * Almost nothing is lost in exchange: every deploy is a new container with an
 * empty ISR cache, so build-time prerendering only saves the **first** visit to
 * each post after each deploy. `dynamicParams` defaults to `true`, so a post
 * missing from the list still renders on demand and is then cached.
 */
export async function generateStaticParams() {
  try {
    const entries = await getBlogSitemapEntries();
    // The locale × slug product. Forget `locale` and every post falls out of
    // SSG even with a correct slug list — Next does not expand a missing segment
    // on its own
    // (`docs/i18n.md` §8).
    return LOCALES.flatMap((locale) => entries.map((entry) => ({ locale, slug: entry.slug })));
  } catch {
    return [];
  }
}

/**
 * ⚠️ This must `try/catch` itself: `error.tsx` is a client error boundary and
 * therefore **cannot** catch anything here — a failure in `generateMetadata`
 * breaks the whole route (§6.4). Return minimal metadata and let the page
 * function below decide between 404 and 500.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "web.blog.post" });

  const post = await getPublishedPost(slug).catch(() => null);
  if (!post) return { title: t("fallbackTitle"), robots: { index: false } };

  const description = postMetaDescription(post);
  const ogImage = postOgImage(post);

  return {
    title: postMetaTitle(post),
    description,
    /*
     * NO `languages`/`hreflang` here, unlike every other public route: post
     * content is Vietnamese in both locales (`docs/i18n.md` §8.1). Declaring
     * `hreflang` as if a translation existed is something Google flags as an
     * error.
     */
    alternates: {
      // `canonicalUrl` is only set when the post is republished from another source (§2.3).
      canonical: post.seo.canonicalUrl ?? `/${locale}/blogs/${post.slug}`,
    },
    robots: { index: !post.seo.noindex, follow: true },
    openGraph: {
      type: "article",
      title: postMetaTitle(post),
      description,
      url: `/${locale}/blogs/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author.displayName],
      // `article:section` is singular and `article:tag` is plural — matching the
      // shape of the two axes: one category, many tags (§2.6, §6.2).
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.name),
      locale: locale === "vi" ? "vi_VN" : "en_US",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("web.blog");
  const df = await getDateFormat();

  const post = await getPublishedPost(slug);

  // A 404 means it does not exist OR is unpublished. The backend deliberately
  // does not distinguish the two, or this becomes a channel for probing draft
  // slugs (§2.1).
  if (!post) notFound();

  // An old slug: the backend consults `blog_post_slugs` and still returns the
  // post, but the body carries the NEW slug. Redirect permanently to the
  // canonical URL so old backlinks consolidate in one place (§2.4).
  //
  // A note on the status code: Next's `permanentRedirect` answers **308**, not
  // the 301 §2.4 mentions. Do not "fix" that — Next does not let you choose the
  // code, and Google states plainly that 308 is handled exactly like 301 (the
  // only difference is that 308 preserves the HTTP method, which is irrelevant
  // for a page read with GET).
  // `permanentRedirect` comes from `next/navigation`, not next-intl's
  // `redirect`: the latter has no permanent variant. In exchange the locale
  // prefix has to be added by hand — forget it and an old link throws readers
  // back to `/vi` whichever version they were reading.
  if (post.slug !== slug) permanentRedirect(`/${locale}/blogs/${post.slug}`);

  const related = post.category
    ? await getRelatedPosts(post.category.slug, post.slug).catch(() => [])
    : [];

  const minutes = readingMinutes(post.contentText);

  return (
    <article className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: t("breadcrumb.blog"), href: "/blogs" },
          ...(post.category
            ? [{ label: post.category.name, href: `/blogs/category/${post.category.slug}` }]
            : []),
          { label: post.title },
        ]}
      />

      <header className="flex flex-col gap-4">
        {/* Exactly ONE <h1> per page; headings inside the content are h2/h3 (§6.2). */}
        <Typography variant="h2" as="h1" className="leading-tight">
          {post.title}
        </Typography>

        <Typography
          variant="body-3"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 opacity-60"
        >
          <span>{post.author.displayName}</span>
          <span aria-hidden>·</span>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>{df.date(post.publishedAt)}</time>
          ) : null}
          <span aria-hidden>·</span>
          <span>{t("post.readingTime", { minutes })}</span>
        </Typography>

        {post.coverImageUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
            {/* `priority`: the cover image is almost always the post page's LCP. */}
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        ) : null}
      </header>

      <TableOfContents doc={post.content} />

      <PostContent doc={post.content} />

      {post.tags.length > 0 ? (
        <section aria-labelledby="tags-heading" className="flex flex-wrap items-center gap-2">
          <Typography variant="h2" id="tags-heading" className="sr-only">
            {t("post.tagsHeading")}
          </Typography>
          {post.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/blogs/tag/${tag.slug}`}
              className="rounded-full bg-black/8 px-3 py-1 text-body-4 opacity-80 transition-opacity hover:opacity-100 dark:bg-white/12"
            >
              #{tag.name}
            </Link>
          ))}
        </section>
      ) : null}

      <RelatedPosts posts={related} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: postMetaDescription(post),
          datePublished: post.publishedAt ?? post.updatedAt,
          dateModified: post.updatedAt,
          author: { "@type": "Person", name: post.author.displayName },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": absoluteUrl(`/blogs/${post.slug}`),
          },
          ...(postOgImage(post) ? { image: [postOgImage(post)] } : {}),
          ...(post.category ? { articleSection: post.category.name } : {}),
          ...(post.tags.length ? { keywords: post.tags.map((tag) => tag.name).join(", ") } : {}),
          wordCount: post.contentText.trim().split(/\s+/).filter(Boolean).length,
        }}
      />
    </article>
  );
}
