import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";

import type { BlogBlockNode, BlogDoc } from "@noalhub/api/blog";
import { Typography } from "@noalhub/ui/typography";

/*
 * The pieces the blog flow screens draw, kept out of `Blog.stories.tsx` so the
 * screens read as screens.
 *
 * Not a `*.stories.tsx`, so Storybook never indexes it — and it sits in
 * `src/internal/` for the same reason the flows do: the public build leaves that
 * directory out entirely (`.storybook/main.ts`).
 *
 * What is rebuilt and what is not:
 *
 * - `apps/web/components/blog/*` (the post card, the listing, the breadcrumb) is
 *   **rebuilt** here. The apps are built and deployed independently and nothing
 *   may import across them (AGENTS.md), and those components hang off
 *   `@noalhub/api/blog/server` — a `server-only` module that cannot even be
 *   imported from a browser bundle.
 * - `PostContent`, `TableOfContents` and `PaginationLinks` are **imported for
 *   real** from `@noalhub/ui`, because a package is exactly what both apps are
 *   allowed to share. Those parts of every screen below are the production
 *   components, not a drawing of them.
 *
 * The copy comes from the same `web.blog` messages the app reads, so the locale
 * toolbar switches these screens exactly like the app; only the sample posts
 * themselves come from `sb.flows.blog.sample`.
 */

/** The only host in `BLOG_IMAGE_HOSTS` that serves real pictures. */
const PHOTO =
  "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=1200&auto=format&fit=crop&q=80";

/**
 * A list item as the **listing** endpoint returns it — deliberately without
 * `content`: list items carry neither the document nor `contentText`, so twenty
 * posts do not weigh hundreds of KB. That is also why `readingMinutes` arrives
 * from the backend instead of being computed here (`docs/blog.md` §2.3a).
 */
export type SamplePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  cover?: boolean;
};

/**
 * Fixed dates rather than `new Date()`: a story whose output moves with the
 * clock cannot be compared against yesterday's screenshot, and `test-storybook`
 * would have a different DOM on every run.
 */
const DATES = [
  "2026-08-14T09:00:00.000Z",
  "2026-07-30T09:00:00.000Z",
  "2026-07-02T09:00:00.000Z",
  "2026-06-11T09:00:00.000Z",
  "2026-05-28T09:00:00.000Z",
  "2026-05-03T09:00:00.000Z",
];

/**
 * The sample posts, built in a hook rather than as a module-scope constant:
 * their text comes from `sb.flows.blog.sample`, so it depends on the selected
 * language — and at module scope there is no locale yet.
 */
export function useSamplePosts(count = 6): SamplePost[] {
  const t = useTranslations("sb.flows.blog.sample");

  return Array.from({ length: count }, (_, index) => ({
    id: `post-${index + 1}`,
    slug: `sample-post-${index + 1}`,
    title: t(`p${index + 1}Title`),
    excerpt: t(`p${index + 1}Excerpt`),
    publishedAt: DATES[index] ?? DATES[0]!,
    readingMinutes: 4 + index,
    cover: index < 3,
  }));
}

/**
 * The frame every blog screen sits in.
 *
 * Wider than the chat frame and scrollable: these are documents, not a chat
 * pane, and cropping a post at the fold would hide the one thing the reader came
 * to look at.
 */
export function BlogScreen({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border bg-background flex max-h-[38rem] w-[min(56rem,92vw)] flex-col gap-8 overflow-y-auto rounded-xl border p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export type Crumb = { label: string; current?: boolean };

/**
 * The breadcrumb trail.
 *
 * The crumbs are rendered as plain text rather than links: a real anchor inside
 * a story navigates the preview iframe away from the story it is illustrating.
 * The `aria-current="page"` on the last crumb is kept because it is what the
 * real component does, and it is what a screen reader announces.
 *
 * The app's version also emits `BreadcrumbList` JSON-LD from this same array —
 * one source, because structured data on a page with no visible breadcrumb is a
 * mismatch in Google's eyes (`docs/blog.md` §6.2).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = useTranslations("web.blog.breadcrumb");

  return (
    <nav aria-label={t("label")} className="text-body-3 opacity-70">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden>/</span> : null}
            <span
              {...(item.current ? { "aria-current": "page" as const } : {})}
              className={item.current ? undefined : "underline underline-offset-4"}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Author · date · reading time — the same line the card and the post header carry. */
export function PostMeta({
  publishedAt,
  minutes,
  className = "",
}: {
  publishedAt: string;
  minutes: number;
  className?: string;
}) {
  const t = useTranslations("web.blog.post");
  const s = useTranslations("sb.flows.blog.sample");
  const df = useDateFormat();

  return (
    <Typography
      variant="body-4"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 opacity-60 ${className}`}
    >
      <span>{s("author")}</span>
      <span aria-hidden>·</span>
      <time dateTime={publishedAt}>{df.date(publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{t("readingTime", { minutes })}</span>
    </Typography>
  );
}

/**
 * A cover image.
 *
 * `<img>` rather than `next/image`: the story only needs the aspect ratio and
 * the picture, and `next/image`'s loader would have to be configured per host
 * for a decoration. `alt=""` because the title sits right beside it — announcing
 * the picture again is noise, which is exactly what the real card does too.
 */
function Cover({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative block overflow-hidden rounded-lg bg-black/5 dark:bg-white/5 ${className}`}
    >
      <img src={PHOTO} alt="" className="size-full object-cover" />
    </span>
  );
}

/**
 * One card in a listing.
 *
 * `h2`, not `h3` or `h1`: a listing page has exactly ONE `h1` — its own title —
 * and every card sits directly beneath it (`docs/blog.md` §6.2).
 */
export function PostCard({ post }: { post: SamplePost }) {
  const s = useTranslations("sb.flows.blog.sample");

  return (
    <article className="flex flex-col gap-3">
      {post.cover ? <Cover className="aspect-[16/9]" /> : null}

      <div className="flex flex-col gap-2">
        <span className="text-body-4 w-fit font-medium tracking-wide uppercase opacity-60">
          {s("categoryName")}
        </span>

        <Typography variant="h5" as="h2" className="leading-snug">
          {post.title}
        </Typography>

        <Typography variant="body-3" className="leading-relaxed opacity-75">
          {post.excerpt}
        </Typography>

        <PostMeta publishedAt={post.publishedAt} minutes={post.readingMinutes} />
      </div>
    </article>
  );
}

/**
 * The post grid, **plus an empty state with words in it**.
 *
 * An empty list is still a **200**, never a 404: having no posts yet — a brand
 * new category, say — is a valid temporary state of the site, not a bad URL.
 * Only a category or tag that *does not exist* calls `notFound()` (§6.5).
 */
export function PostGrid({
  posts,
  emptyMessage,
}: {
  posts: SamplePost[];
  emptyMessage: string;
}) {
  if (posts.length === 0) {
    return (
      <Typography
        variant="body-3"
        className="border-border rounded-lg border border-dashed px-4 py-12 text-center opacity-60"
      >
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

/** A page header: `h1` plus one line of subtitle. */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      <Typography variant="h3" as="h1">
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body-3" className="opacity-70">
          {subtitle}
        </Typography>
      ) : null}
    </header>
  );
}

/**
 * The "Related posts" block closing every post — three from the **same
 * category**.
 *
 * By category rather than by tag: a post has exactly one category, which makes
 * this a deterministic query, while `tags` is an unordered set where the "first
 * tag" is merely whichever one the author typed first (§2.5, §2.6).
 */
export function RelatedPosts({ posts }: { posts: SamplePost[] }) {
  const t = useTranslations("web.blog.post");
  const df = useDateFormat();

  // The only post in a category has nothing to show — the real component drops
  // the whole block rather than leaving an empty heading hanging.
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="border-border border-t pt-8">
      <Typography
        variant="title-4"
        as="h2"
        id="related-heading"
        className="tracking-wide uppercase opacity-60"
      >
        {t("relatedHeading")}
      </Typography>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="flex flex-col gap-1">
            <span className="leading-snug font-medium underline underline-offset-4">
              {post.title}
            </span>
            <time dateTime={post.publishedAt} className="text-body-4 opacity-60">
              {df.date(post.publishedAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The tag chips under a post, and the whole tag index page. */
export function TagChips({ tags }: { tags: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className="border-border bg-surface text-body-4 rounded-full border px-3 py-1 opacity-80"
        >
          #{tag}
        </li>
      ))}
    </ul>
  );
}

export { Cover, PHOTO };

/**
 * The sample document the post screen renders — built in a hook for the same
 * reason as the posts above: its text depends on the locale, and module scope
 * has none.
 *
 * Only h2/h3 appear: `<h1>` belongs to the post title, so a document never
 * carries one (`BlogHeadingLevel`, §3.3). That is also what makes the table of
 * contents a two-level list rather than a three-level one.
 */
export function useSampleDoc(): BlogDoc {
  const t = useTranslations("sb.flows.blog.sample");

  const p = (key: string): BlogBlockNode => ({
    type: "paragraph",
    content: [{ type: "text", text: t(key) }],
  });
  const h = (level: 2 | 3, key: string): BlogBlockNode => ({
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text: t(key) }],
  });

  return {
    type: "doc",
    content: [
      p("docIntro"),
      h(2, "docH2A"),
      p("docBodyA"),
      h(3, "docH3A"),
      p("docBodyB"),
      h(2, "docH2B"),
      p("docBodyC"),
    ],
  };
}
