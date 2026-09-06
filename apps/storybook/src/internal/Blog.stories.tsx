import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { PostContent } from "@noalhub/ui/blog/post-content";
import { TableOfContents } from "@noalhub/ui/blog/table-of-contents";
import { Button } from "@noalhub/ui/button";
import { PaginationLinks } from "@noalhub/ui/pagination-links";
import { Typography } from "@noalhub/ui/typography";

import {
  BlogScreen,
  Breadcrumb,
  Cover,
  PostGrid,
  PostMeta,
  RelatedPosts,
  ScreenHeader,
  TagChips,
  useSampleDoc,
  useSamplePosts,
} from "./blog-parts";
import {
  DocPage,
  DocSection,
  Figure,
  FlowMap,
  KeyList,
  LegendItem,
  NoteList,
  SequenceDiagram,
  SourceNote,
  useFlowText,
  type FlowEdge,
  type FlowNode,
  type Lane,
  type Step,
} from "./flow-doc";

/*
 * The blog as its own flow, and the odd one out among the three.
 *
 * Chat and Presence are about a socket; this one is about a **cache**. The blog
 * is the only feature reading through `packages/api/src/blog/server.ts` — a
 * fourth layer next to `api.ts`, running in `apps/web`'s Server Components with
 * no token (`docs/data-layer.md` §7, `docs/blog.md` §4). Everything that can go
 * subtly wrong here goes wrong in the gap between "the row changed in Postgres"
 * and "the cached page changed", which is what the diagrams below trace.
 *
 * There are no rebuilt screens here, unlike `chat-parts.tsx`: the blog's real
 * components live in `@noalhub/ui` and already have stories under `UI/Blog`, so
 * the flow map links straight to those.
 */

const meta: Meta = {
  title: "Flows/Blog",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

/**
 * The blog page: the post lifecycle, then the publish chain, then the cache tags
 * that join the two. A story rather than MDX so the locale toolbar reaches the
 * prose — see `flow-doc.tsx`.
 */
export const Overview: Story = {
  parameters: { layout: "fullscreen" },
  render: function BlogOverviewPage() {
    const t = useTranslations("sb.flows.blog");
    const tc = useTranslations("sb.flows.common");
    const n = useFlowText("sb.flows.blog.nodes");
    const e = useFlowText("sb.flows.blog.edges");
    const l = useFlowText("sb.flows.blog.lanes");
    const s = useFlowText("sb.flows.blog.steps");
    const sl = useFlowText("sb.flows.blog.slugLanes");
    const ss = useFlowText("sb.flows.blog.slugSteps");
    const tag = useFlowText("sb.flows.blog.tags");
    const notes = useFlowText("sb.flows.blog.notes");

    /*
     * The boxes link to the `UI/Blog` stories — the real components, not a
     * rebuild. Only three of the six states have a component of their own; the
     * rest point at the closest screen the reader can actually look at, which is
     * still better than a box that goes nowhere.
     */
    const nodes: FlowNode[] = [
      { href: "ui-blog-tiptapeditor--empty", x: 30, y: 60, label: n("draft"), note: n("draftNote"), primary: true },
      { href: "flows-blog--list", x: 300, y: 60, label: n("published"), note: n("publishedNote") },
      { href: "flows-blog--post", x: 560, y: 60, label: n("public"), note: n("publicNote") },
      { href: "flows-blog--not-found", x: 300, y: 210, label: n("unpublished"), note: n("unpublishedNote") },
      { href: "flows-blog--error-state", x: 560, y: 210, label: n("archived"), note: n("archivedNote"), end: true },
      { href: "flows-blog--post", x: 30, y: 210, label: n("oldSlug"), note: n("oldSlugNote"), end: true },
    ];

    const edges: FlowEdge[] = [
      { d: "M220 86 H292", label: e("publish"), labelX: 226, labelY: 78 },
      { d: "M490 86 H552", label: e("webhook"), labelX: 521, labelY: 44, anchor: "middle" },
      // Two separate vertical runs between Published and Unpublished rather than
      // one line with two arrowheads: the pair is a round trip, and a single
      // double-ended arrow reads as "these are the same state".
      { d: "M370 112 V202", label: e("unpublish"), labelX: 356, labelY: 157, anchor: "middle", rotate: true },
      { d: "M420 210 V120", label: e("republish"), labelX: 434, labelY: 165, anchor: "middle", rotate: true },
      { d: "M490 236 H552", label: e("archive"), labelX: 494, labelY: 228 },
      // Published → Archived without passing through Unpublished: archiving is a
      // soft delete and does not require unpublishing first.
      { d: "M470 112 V166 Q470 180 484 180 H642 Q656 180 656 194 V202", label: e("archiveDirect"), labelX: 560, labelY: 174, anchor: "middle" },
      // A rename does not move the post — it forks an old slug off it. The elbow
      // leaves from the LEFT of Published so the label owns the empty run above
      // the "Old slug" box.
      { d: "M330 112 V150 Q330 164 316 164 H139 Q125 164 125 178 V202", label: e("renameA"), label2: e("renameB"), labelX: 222, labelY: 136, anchor: "middle" },
      // …and the old slug still answers, at the bottom, all the way back to the
      // live page. Drawn as the longest edge on purpose: that is the point.
      { d: "M125 262 V318 Q125 332 139 332 H750 Q764 332 764 318 V100 Q764 86 750 86", label: e("redirect"), labelX: 400, labelY: 348, anchor: "middle" },
    ];

    /*
     * Four frontend lanes, which is one more than the other flow pages need:
     * `apps/admin` and `apps/web` are two different browsers' worth of frontend
     * here, and the ISR cache is a third participant that neither of them is.
     * Collapsing the cache into `web` would hide the only step that matters.
     */
    const lanes: Lane[] = [
      { x: 100, label: l("editor"), note: l("editorNote") },
      { x: 258, label: l("reader"), note: l("readerNote") },
      { x: 416, label: l("web"), note: l("webNote") },
      { x: 574, label: l("isr"), note: l("isrNote") },
      { x: 742, label: l("api"), note: l("apiNote") },
      { x: 900, label: l("db"), note: l("dbNote") },
    ];

    const steps: Step[] = [
      { from: 0, to: 4, label: s("1") },
      { from: 4, to: 5, label: s("2") },
      { from: 4, to: 0, label: s("3"), back: true },
      // The webhook is BE → FE, which is why it is dashed: it is the one hop in
      // this flow the frontend does not initiate.
      { from: 4, to: 2, label: s("4"), back: true, accent: true },
      { from: 2, to: 3, label: s("5"), accent: true },
      { from: 2, to: 4, label: s("6"), back: true },
      { from: 1, to: 2, label: s("7") },
      { from: 2, to: 3, label: s("8") },
      { from: 2, to: 4, label: s("9") },
      { from: 4, to: 5, label: s("10") },
      { from: 4, to: 2, label: s("11"), back: true },
      { from: 2, to: 3, label: s("12") },
      { from: 2, to: 1, label: s("13"), back: true, accent: true },
    ];

    const slugLanes: Lane[] = [
      { x: 110, label: sl("reader"), note: sl("readerNote") },
      { x: 300, label: sl("web"), note: sl("webNote") },
      { x: 500, label: sl("api"), note: sl("apiNote") },
      { x: 690, label: sl("db"), note: sl("dbNote") },
    ];

    const slugSteps: Step[] = [
      { from: 0, to: 1, label: ss("1") },
      { from: 1, to: 2, label: ss("2") },
      { from: 2, to: 3, label: ss("3") },
      { from: 2, to: 1, label: ss("4"), back: true, accent: true },
      { from: 1, to: 0, label: ss("5"), back: true, accent: true },
      { from: 0, to: 1, label: ss("6") },
      { from: 1, to: 0, label: ss("7"), back: true },
    ];

    return (
      <DocPage title={t("title")} lead={t("lead")}>
        <DocSection step={1} title={tc("flowSection")} hint={tc("clickHint")}>
          <Figure caption={t("flowCaption")} title={tc("flowSection")} width={780}>
            <FlowMap viewBox="0 0 780 366" title={t("title")} nodes={nodes} edges={edges} />
          </Figure>
        </DocSection>

        <DocSection step={2} title={tc("seqSection")}>
          <Figure
            caption={t("seqCaption")}
            title={tc("seqSection")}
            width={990}
            legend={
              <>
                <LegendItem kind="request" label={tc("legendRequest")} />
                <LegendItem kind="push" label={tc("legendPush")} />
                <LegendItem kind="accent" label={tc("legendAccent")} />
              </>
            }
          >
            <SequenceDiagram
              title={tc("seqSection")}
              lanes={lanes}
              steps={steps}
              divider={660}
              frontendLabel={tc("frontend")}
              backendLabel={tc("backend")}
              width={990}
            />
          </Figure>
        </DocSection>

        <DocSection step={3} title={tc("slugSection")}>
          <Figure
            caption={t("slugCaption")}
            title={tc("slugSection")}
            width={790}
            legend={
              <>
                <LegendItem kind="request" label={tc("legendRequest")} />
                <LegendItem kind="push" label={tc("legendPush")} />
                <LegendItem kind="accent" label={tc("legendAccent")} />
              </>
            }
          >
            <SequenceDiagram
              title={tc("slugSection")}
              lanes={slugLanes}
              steps={slugSteps}
              divider={400}
              frontendLabel={tc("frontend")}
              backendLabel={tc("backend")}
              width={790}
            />
          </Figure>
        </DocSection>

        {/* `KeyList` was written for the Redis keyspace, and a cache tag has the
            same three facts: the name, where it is attached, and when it is
            cleared. Reusing it beats a table that would need a header row
            translated twice over. */}
        <DocSection step={4} title={tc("cacheSection")} hint={t("cacheCaption")}>
          <KeyList
            keys={[
              { name: tag("listName"), shape: tag("listShape"), purpose: tag("listPurpose") },
              { name: tag("postName"), shape: tag("postShape"), purpose: tag("postPurpose") },
              { name: tag("categoryName"), shape: tag("categoryShape"), purpose: tag("categoryPurpose") },
              { name: tag("tagName"), shape: tag("tagShape"), purpose: tag("tagPurpose") },
              { name: tag("categoriesName"), shape: tag("categoriesShape"), purpose: tag("categoriesPurpose") },
              { name: tag("tagsName"), shape: tag("tagsShape"), purpose: tag("tagsPurpose") },
              { name: tag("sitemapName"), shape: tag("sitemapShape"), purpose: tag("sitemapPurpose") },
            ]}
          />
        </DocSection>

        <DocSection step={5} title={tc("notesSection")}>
          <NoteList
            notes={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((key) => notes(key))}
          />
        </DocSection>

        <SourceNote sectionKey="docsSection" textKey="blogSource" />
      </DocPage>
    );
  },
};

/* ------------------------------------------------------------------ screens */

/**
 * `/blogs` — the listing, page 1 of 3.
 *
 * The route is **dynamic**, and that is not a misconfiguration: reading
 * `searchParams.page` opts it out of static rendering, so `export const
 * revalidate` on the page does nothing. The caching that matters happens one
 * level down, on the `fetch` inside `server.ts` (`docs/blog.md` §4.5).
 */
export const List: Story = {
  parameters: { layout: "centered" },
  render: function BlogListScreen() {
    const t = useTranslations("web.blog");
    const posts = useSamplePosts(6);

    return (
      <BlogScreen>
        <Breadcrumb items={[{ label: t("breadcrumb.blog"), current: true }]} />
        <ScreenHeader title={t("list.title")} subtitle={t("list.subtitle")} />
        <PostGrid posts={posts} emptyMessage={t("list.empty")} />
        {/*
          The real `PaginationLinks`, imported from `@noalhub/ui` — the point of
          this screen. Pagination has to be actual `<a href>`: Googlebot runs JS
          but does not click buttons, so a button-based pager leaves no crawl
          path past page 1 (§4.5).
        */}
        <PaginationLinks
          basePath="/blogs"
          page={1}
          limit={10}
          total={26}
          label={t("list.pagination")}
        />
      </BlogScreen>
    );
  },
};

/**
 * No posts yet — still a **200**, never a 404. An empty listing is a valid
 * temporary state of the site; only a URL that does not exist is a 404 (§6.5).
 */
export const ListEmpty: Story = {
  parameters: { layout: "centered" },
  render: function BlogListEmptyScreen() {
    const t = useTranslations("web.blog");

    return (
      <BlogScreen className="max-h-none">
        <Breadcrumb items={[{ label: t("breadcrumb.blog"), current: true }]} />
        <ScreenHeader title={t("list.title")} subtitle={t("list.subtitle")} />
        <PostGrid posts={[]} emptyMessage={t("list.empty")} />
      </BlogScreen>
    );
  },
};

/**
 * `/blogs/[slug]` — the post itself, and the only screen here rendered by the
 * **real** renderer: `TableOfContents` and `PostContent` are imported from
 * `@noalhub/ui`, not redrawn.
 *
 * Both walk the same document and `collectHeadings` assigns the ids, so an
 * anchor and its entry in the table of contents cannot drift apart (§3.3).
 */
export const Post: Story = {
  parameters: { layout: "centered" },
  render: function BlogPostScreen() {
    const t = useTranslations("web.blog");
    const s = useTranslations("sb.flows.blog.sample");
    const posts = useSamplePosts(4);
    const post = posts[0]!;
    const doc = useSampleDoc();

    return (
      <BlogScreen>
        <Breadcrumb
          items={[
            { label: t("breadcrumb.blog") },
            { label: s("categoryName") },
            { label: post.title, current: true },
          ]}
        />

        <header className="flex flex-col gap-4">
          {/* Exactly ONE <h1> per page; headings inside the content are h2/h3 (§6.2). */}
          <Typography variant="h2" as="h1" className="leading-tight">
            {post.title}
          </Typography>
          <PostMeta publishedAt={post.publishedAt} minutes={post.readingMinutes} />
          <Cover className="aspect-[16/9] w-full" />
        </header>

        <TableOfContents doc={doc} />
        <PostContent doc={doc} />

        <section className="flex flex-col gap-3">
          <Typography
            variant="title-4"
            as="h2"
            className="tracking-wide uppercase opacity-60"
          >
            {t("post.tagsHeading")}
          </Typography>
          <TagChips tags={[s("tag1"), s("tag2"), s("tag3"), s("tag4")]} />
        </section>

        <RelatedPosts posts={posts.slice(1)} />
      </BlogScreen>
    );
  },
};

/**
 * `/blogs/category/[slug]` — the axis that **is** indexed, and the axis that
 * gives a post its three-level breadcrumb (Blog → category → title). Without it
 * the trail has two levels and says almost nothing (§2.6, §6.2).
 */
export const CategoryPage: Story = {
  parameters: { layout: "centered" },
  render: function BlogCategoryScreen() {
    const t = useTranslations("web.blog");
    const s = useTranslations("sb.flows.blog.sample");
    const posts = useSamplePosts(3);

    return (
      <BlogScreen>
        <Breadcrumb
          items={[{ label: t("breadcrumb.blog") }, { label: s("categoryName"), current: true }]}
        />
        <ScreenHeader
          title={s("categoryName")}
          subtitle={t("category.metaDescription", { name: s("categoryName") })}
        />
        <PostGrid posts={posts} emptyMessage={t("category.empty")} />
        <PaginationLinks
          basePath={`/blogs/category/${s("categorySlug")}`}
          page={1}
          limit={10}
          total={3}
          label={t("category.pagination", { name: s("categoryName") })}
        />
      </BlogScreen>
    );
  },
};

/**
 * `/blogs/tag/[tag]` — the same listing, but **`noindex, follow`**.
 *
 * Tags are cross-links, not navigation: a post carries several, so tag pages
 * overlap each other and the category pages heavily. Letting Google index all of
 * them competes with the pages that should rank. `follow` stays on so the links
 * out of here still pass (§2.6, §6.5).
 */
export const TagPage: Story = {
  parameters: { layout: "centered" },
  render: function BlogTagScreen() {
    const t = useTranslations("web.blog");
    const s = useTranslations("sb.flows.blog.sample");
    const posts = useSamplePosts(2);

    return (
      <BlogScreen>
        <Breadcrumb
          items={[
            { label: t("breadcrumb.blog") },
            { label: t("tag.indexTitle") },
            { label: `#${s("tag1")}`, current: true },
          ]}
        />
        <ScreenHeader
          title={`#${s("tag1")}`}
          subtitle={t("tag.metaDescription", { name: s("tag1") })}
        />
        <PostGrid posts={posts} emptyMessage={t("tag.empty")} />
      </BlogScreen>
    );
  },
};

/** `/blogs/tag` — the tag index, `noindex` as well, and cached for an hour (§4.4). */
export const TagIndex: Story = {
  parameters: { layout: "centered" },
  render: function BlogTagIndexScreen() {
    const t = useTranslations("web.blog");
    const s = useTranslations("sb.flows.blog.sample");

    return (
      <BlogScreen className="max-h-none">
        <Breadcrumb
          items={[{ label: t("breadcrumb.blog") }, { label: t("tag.indexTitle"), current: true }]}
        />
        <ScreenHeader title={t("tag.indexTitle")} subtitle={t("tag.indexSubtitle")} />
        <ul className="flex flex-wrap gap-3">
          {[
            { name: s("tag1"), count: 12 },
            { name: s("tag2"), count: 7 },
            { name: s("tag3"), count: 5 },
            { name: s("tag4"), count: 2 },
          ].map(({ name, count }) => (
            <li
              key={name}
              className="border-border bg-surface flex items-baseline gap-2 rounded-lg border px-3 py-2"
            >
              <span className="text-body-3 underline underline-offset-4">#{name}</span>
              <span className="text-body-4 opacity-60">
                {s("tagCount", { count })}
              </span>
            </li>
          ))}
        </ul>
      </BlogScreen>
    );
  },
};

/**
 * The blog 404 — what a **draft, an unpublished post and a slug that never
 * existed** all look like. The backend deliberately does not distinguish them,
 * or the 404 becomes a channel for probing draft slugs (§2.1).
 *
 * The latest posts are here so the page is a way onward rather than a dead end.
 * In the app this content is a **Client** Component: `not-found.tsx` gets no
 * `params`, so any server-side i18n call there would have to read the request —
 * and one such call drops the whole `blogs/` segment out of static rendering
 * (`docs/i18n.md` §10).
 */
export const NotFound: Story = {
  parameters: { layout: "centered" },
  render: function BlogNotFoundScreen() {
    const t = useTranslations("web.blog");
    const posts = useSamplePosts(3);

    return (
      <BlogScreen>
        <header className="flex flex-col gap-3">
          <Typography variant="h3" as="h1">
            {t("notFound.title")}
          </Typography>
          <Typography variant="body-3" className="opacity-70">
            {t("notFound.message")}
          </Typography>
          <span className="text-body-3 w-fit underline underline-offset-4">
            {t("notFound.backToList")}
          </span>
        </header>

        <section aria-labelledby="latest-heading" className="flex flex-col gap-4">
          <Typography
            variant="title-4"
            as="h2"
            id="latest-heading"
            className="tracking-wide uppercase opacity-60"
          >
            {t("notFound.latestHeading")}
          </Typography>
          <PostGrid posts={posts} emptyMessage="" />
        </section>
      </BlogScreen>
    );
  },
};

/**
 * `error.tsx` — a **non-404** failure on the read path. Keeping the two apart is
 * the point: `server.ts` returns `null` on 404 so the route can call
 * `notFound()`, and throws on everything else. Merge them and either Google
 * drops real posts because the API blipped once, or it keeps retrying a URL that
 * does not exist (§6.4).
 *
 * The button is wired to `unstable_retry`, not `reset`: `reset` only clears the
 * error state and re-renders with the very data that failed, so a retry built on
 * it produces the same error however many times it is pressed.
 */
export const ErrorState: Story = {
  parameters: { layout: "centered" },
  render: function BlogErrorScreen() {
    const t = useTranslations("web.blog.error");

    return (
      <BlogScreen className="max-h-none">
        <div className="flex flex-col items-start gap-4">
          <Typography variant="h3" as="h1">
            {t("title")}
          </Typography>
          <Typography variant="body-3" className="opacity-70">
            {t("message")}
          </Typography>
          <div className="flex flex-wrap items-center gap-3">
            <Button>{t("retry")}</Button>
            <span className="text-body-3 underline underline-offset-4">
              {t("backToList")}
            </span>
          </div>
        </div>
      </BlogScreen>
    );
  },
};
