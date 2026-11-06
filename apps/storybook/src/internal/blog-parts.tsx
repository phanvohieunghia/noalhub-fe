import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'

import type {BlogBlockNode, BlogDoc} from '@noalhub/api/blog'
import {BreadcrumbNav} from '@noalhub/ui/blog/breadcrumb-nav'
import type {LinkLike} from '@noalhub/ui/blog/link-like'
import {
  PostCard as PostCardView,
  type PostCardVariant,
} from '@noalhub/ui/blog/post-card'
import {PostGrid as PostGridView} from '@noalhub/ui/blog/post-grid'
import {RelatedPosts as RelatedPostsView} from '@noalhub/ui/blog/related-posts'
import {Typography} from '@noalhub/ui/typography'

/*
 * The pieces the blog flow screens draw, kept out of `Blog.stories.tsx` so the
 * screens read as screens.
 *
 * Not a `*.stories.tsx`, so Storybook never indexes it — and it sits in
 * `src/internal/` for the same reason the flows do: the public build leaves that
 * directory out entirely (`.storybook/main.ts`).
 *
 * The post card, the listing grid, the breadcrumb, the related-posts block,
 * `PostContent`, `TableOfContents` and `PaginationLinks` are the **real**
 * components from `@noalhub/ui`, the same ones `apps/web/components/blog/*`
 * renders. What stays here is what the app gets from its data layer: sample
 * posts, and a plain `<a>` standing in for the locale-aware `Link` (a real
 * navigation inside a story would send the preview iframe away from it).
 *
 * The copy comes from the same `web.blog` messages the app reads, so the locale
 * toolbar switches these screens exactly like the app; only the sample posts
 * themselves come from `sb.flows.blog.sample`.
 */

/** The only host in `BLOG_IMAGE_HOSTS` that serves real pictures. */
const PHOTO =
  'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=1200&auto=format&fit=crop&q=80'

/**
 * A list item as the **listing** endpoint returns it — deliberately without
 * `content`: list items carry neither the document nor `contentText`, so twenty
 * posts do not weigh hundreds of KB. That is also why `readingMinutes` arrives
 * from the backend instead of being computed here (`docs/blog.md` §2.3a).
 */
export type SamplePost = {
  id: string
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  readingMinutes: number
  cover?: boolean
}

/**
 * Fixed dates rather than `new Date()`: a story whose output moves with the
 * clock cannot be compared against yesterday's screenshot, and `test-storybook`
 * would have a different DOM on every run.
 */
const DATES = [
  '2026-08-14T09:00:00.000Z',
  '2026-07-30T09:00:00.000Z',
  '2026-07-02T09:00:00.000Z',
  '2026-06-11T09:00:00.000Z',
  '2026-05-28T09:00:00.000Z',
  '2026-05-03T09:00:00.000Z',
]

/**
 * The sample posts, built in a hook rather than as a module-scope constant:
 * their text comes from `sb.flows.blog.sample`, so it depends on the selected
 * language — and at module scope there is no locale yet.
 */
export function useSamplePosts(count = 6): SamplePost[] {
  const t = useTranslations('sb.flows.blog.sample')

  return Array.from({length: count}, (_, index) => ({
    id: `post-${index + 1}`,
    slug: `sample-post-${index + 1}`,
    title: t(`p${index + 1}Title`),
    excerpt: t(`p${index + 1}Excerpt`),
    publishedAt: DATES[index] ?? DATES[0]!,
    readingMinutes: 4 + index,
    cover: index < 3,
  }))
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
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`border-border bg-background flex max-h-[38rem] w-[min(56rem,92vw)] flex-col gap-8 overflow-y-auto rounded-xl border p-8 ${className}`}>
      {children}
    </div>
  )
}

export type Crumb = {label: string; current?: boolean}

/**
 * A plain anchor in place of the app's `Link`: it renders the real markup and
 * styles but does not navigate the preview away.
 */
const StoryLink: LinkLike = ({href: _href, children, ...props}) => (
  <a
    href="#"
    onClick={(event) => event.preventDefault()}
    {...props}>
    {children}
  </a>
)

/** The breadcrumb trail — every crumb but the current one is a link, as in the app. */
export function Breadcrumb({items}: {items: Crumb[]}) {
  const t = useTranslations('web.blog.breadcrumb')

  return (
    <BreadcrumbNav
      Link={StoryLink}
      label={t('label')}
      items={items.map((item) => ({
        label: item.label,
        href: item.current ? undefined : '#',
      }))}
    />
  )
}

/** Author · date · reading time — the same line the card and the post header carry. */
export function PostMeta({
  publishedAt,
  minutes,
  className = '',
}: {
  publishedAt: string
  minutes: number
  className?: string
}) {
  const t = useTranslations('web.blog.post')
  const s = useTranslations('sb.flows.blog.sample')
  const df = useDateFormat()

  return (
    <Typography
      variant="body-4"
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 opacity-60 ${className}`}>
      <span>{s('author')}</span>
      <span aria-hidden>·</span>
      <time dateTime={publishedAt}>{df.date(publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{t('readingTime', {minutes})}</span>
    </Typography>
  )
}

/**
 * A cover image. `<img>` rather than `next/image`: the story only needs the
 * picture, and `next/image`'s loader would have to be configured per host.
 */
function Cover({className = ''}: {className?: string}) {
  return (
    <span
      className={`bg-muted relative block overflow-hidden rounded-lg ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PHOTO} alt="" className="size-full object-cover" />
    </span>
  )
}

export function PostCard({
  post,
  variant = 'default',
}: {
  post: SamplePost
  variant?: PostCardVariant
}) {
  const t = useTranslations('web.blog.post')
  const s = useTranslations('sb.flows.blog.sample')
  const df = useDateFormat()

  return (
    <PostCardView
      variant={variant}
      Link={StoryLink}
      href="#"
      categoryHref="#"
      categoryName={s('categoryName')}
      title={post.title}
      description={post.excerpt}
      cover={
        post.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={PHOTO} alt="" className="size-full object-cover" />
        ) : null
      }
      author={s('author')}
      date={df.date(post.publishedAt)}
      dateTime={post.publishedAt}
      readingTime={t('readingTime', {minutes: post.readingMinutes})}
    />
  )
}

export function PostGrid({
  posts,
  emptyMessage,
  variant = 'default',
}: {
  posts: SamplePost[]
  emptyMessage: string
  variant?: PostCardVariant
}) {
  return (
    <PostGridView
      emptyMessage={emptyMessage}
      layout={variant === 'row' ? 'rows' : 'grid'}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} variant={variant} />
      ))}
    </PostGridView>
  )
}

/** A page header: `h1` plus one line of subtitle. */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
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
  )
}

export function RelatedPosts({posts}: {posts: SamplePost[]}) {
  const t = useTranslations('web.blog.post')
  const df = useDateFormat()

  return (
    <RelatedPostsView
      Link={StoryLink}
      heading={t('relatedHeading')}
      posts={posts.map((post) => ({
        id: post.id,
        href: '#',
        title: post.title,
        date: df.date(post.publishedAt),
        dateTime: post.publishedAt,
      }))}
    />
  )
}

/** The tag chips under a post, and the whole tag index page. */
export function TagChips({tags}: {tags: string[]}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li
          key={tag}
          className="border-border bg-surface text-body-4 rounded-full border px-3 py-1 opacity-80">
          #{tag}
        </li>
      ))}
    </ul>
  )
}

export {Cover, PHOTO}

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
  const t = useTranslations('sb.flows.blog.sample')

  const p = (key: string): BlogBlockNode => ({
    type: 'paragraph',
    content: [{type: 'text', text: t(key)}],
  })
  const h = (level: 2 | 3, key: string): BlogBlockNode => ({
    type: 'heading',
    attrs: {level},
    content: [{type: 'text', text: t(key)}],
  })

  return {
    type: 'doc',
    content: [
      p('docIntro'),
      h(2, 'docH2A'),
      p('docBodyA'),
      h(3, 'docH3A'),
      p('docBodyB'),
      h(2, 'docH2B'),
      p('docBodyC'),
    ],
  }
}
