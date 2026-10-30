import {getDateFormat} from '@noalhub/i18n/date-format-server'
import {Link} from '@noalhub/i18n/navigation'
import {getTranslations} from 'next-intl/server'
import Image from 'next/image'

import type {BlogCategory, BlogPostListItem} from '@noalhub/api/blog'
import {Avatar} from '@noalhub/ui/avatar'
import {Icon} from '@noalhub/ui/icons'
import {Typography} from '@noalhub/ui/typography'

const CHIP =
  'inline-flex w-fit items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-body-4 text-foreground'

function Cover({
  post,
  sizes,
  className,
}: {
  post: BlogPostListItem
  sizes: string
  className: string
}) {
  return (
    <span className={`relative block overflow-hidden bg-muted ${className}`}>
      {post.coverImageUrl ? (
        <Image
          src={post.coverImageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : null}
    </span>
  )
}

/**
 * The home page body (Figma `Laptop 1280 — Home`): hero line, featured post,
 * three small posts, topic cards, a quote and the latest-posts grid.
 *
 * Posts and categories are real data; the hero copy, topic cards and quote are
 * editorial copy and live in `web.home`. The category filter chips are plain
 * links to the category pages (server-rendered, no client state).
 */
export async function HomeContent({
  posts,
  categories,
}: {
  posts: BlogPostListItem[]
  categories: BlogCategory[]
}) {
  const t = await getTranslations('web.home')
  const df = await getDateFormat()

  const [featured, ...rest] = posts
  const small = rest.slice(0, 3)
  const latest = posts.slice(0, 6)
  const minutes = (post: BlogPostListItem) =>
    t('readingTime', {minutes: post.readingMinutes})

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-8 pb-16 md:px-12 md:pt-10 md:pb-20 lg:gap-14 lg:px-25">
      <Typography
        variant="h1"
        as="h1"
        className="font-light! lg:text-[64px] lg:leading-[72px] lg:tracking-tight">
        {t('hero.line1')}
        <br />
        {t('hero.line2')}
      </Typography>

      {featured ? (
        <article className="flex flex-col-reverse overflow-hidden rounded-xl border border-border bg-surface md:min-h-85 md:flex-row">
          <div className="flex flex-1 flex-col justify-between gap-8 p-6 md:px-10 md:pt-10 md:pb-9">
            <div className="flex flex-col gap-4">
              <Link
                href={`/blogs/category/${featured.category.slug}`}
                className={CHIP}>
                {featured.category.name}
              </Link>
              <Typography variant="h3" as="h2">
                <Link
                  href={`/blogs/${featured.slug}`}
                  className="hover:underline">
                  {featured.title}
                </Link>
              </Typography>
              <Typography
                variant="body-3"
                className="line-clamp-3 text-muted-foreground">
                {featured.excerpt}
              </Typography>
            </div>
            <div className="flex items-center gap-2.5">
              <Avatar
                name={featured.author.displayName}
                src={featured.author.avatarUrl}
                size="sm"
              />
              <Typography
                as="span"
                variant="title-4"
                weight={600}
                className="flex-1">
                {featured.author.displayName}
              </Typography>
              <Typography
                as="span"
                variant="body-4"
                className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Icon icon="lucide:clock" className="size-4" />
                {minutes(featured)}
              </Typography>
            </div>
          </div>
          <Cover
            post={featured}
            sizes="(max-width: 768px) 100vw, 500px"
            className="aspect-video md:aspect-auto md:w-125"
          />
        </article>
      ) : (
        <Typography variant="body-3" className="text-muted-foreground">
          {t('empty')}
        </Typography>
      )}

      {small.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          {small.map((post, i) => (
            <article
              key={post.id}
              className="flex overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex flex-1 flex-col items-start gap-2 p-4">
                <Link
                  href={`/blogs/category/${post.category.slug}`}
                  className={CHIP}>
                  {post.category.name}
                </Link>
                <Typography variant="title-4" as="h3" className="font-semibold">
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="hover:underline">
                    {post.title}
                  </Link>
                </Typography>
                {i > 0 ? (
                  <Typography
                    variant="body-4"
                    className="line-clamp-2 text-muted-foreground">
                    {post.excerpt}
                  </Typography>
                ) : null}
              </div>
              {i === 0 && post.coverImageUrl ? (
                <Cover post={post} sizes="130px" className="w-32.5 shrink-0" />
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-5">
        <Typography variant="title-1" as="h2" className="font-semibold">
          {t('topics.heading')}
        </Typography>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex min-h-32.5 flex-col justify-center rounded-xl bg-brand-100 p-7 text-brand-900">
            <Typography variant="title-2">{t('topics.learning')}</Typography>
          </div>
          <div className="flex min-h-32.5 flex-col justify-center gap-1 rounded-xl bg-blush-100 p-7 text-brand-900">
            <Typography variant="body-2">{t('topics.productLead')}</Typography>
            <Typography variant="title-2">{t('topics.product')}</Typography>
          </div>
          <div className="flex min-h-32.5 flex-col justify-center gap-1 rounded-xl bg-neutral-400 p-7 text-brand-950">
            <Typography variant="body-2">{t('topics.slowLead')}</Typography>
            <Typography variant="title-2">{t('topics.slow')}</Typography>
          </div>
        </div>
      </section>

      <figure className="relative flex flex-col items-center gap-4 overflow-hidden rounded-xl bg-brand-50 px-6 pt-8 pb-7 text-brand-900 md:px-30">
        <span
          aria-hidden
          className="absolute -top-1 left-6 text-[120px] leading-25 font-semibold text-brand-300">
          “
        </span>
        <Typography as="blockquote" variant="body-1" className="text-center">
          {t('quote.text')}
        </Typography>
        <figcaption className="flex items-center gap-2.5">
          <Avatar name={t('quote.author')} size="sm" />
          <Typography as="span" variant="title-4" weight={600}>
            {t('quote.author')}
          </Typography>
          <Typography as="span" variant="body-4" className="text-neutral-600">
            • {t('quote.role')}
          </Typography>
        </figcaption>
      </figure>

      {latest.length > 0 ? (
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Typography
              variant="title-1"
              as="h2"
              className="w-full font-semibold sm:w-auto sm:flex-1">
              {t('latest.heading')}
            </Typography>
            <nav
              aria-label={t('latest.filters')}
              className="flex flex-wrap gap-2 text-body-4">
              <Link
                href="/blogs"
                className="rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground">
                {t('latest.all')}
              </Link>
              {categories.slice(0, 3).map((category) => (
                <Link
                  key={category.slug}
                  href={`/blogs/category/${category.slug}`}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-foreground transition-colors hover:bg-muted">
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => (
              <article key={post.id} className="flex flex-col gap-2.5">
                <div className="relative">
                  <Link
                    href={`/blogs/${post.slug}`}
                    tabIndex={-1}
                    aria-hidden
                    className="block">
                    <Cover
                      post={post}
                      sizes="(max-width: 1024px) 50vw, 360px"
                      className="h-37.5 rounded-lg"
                    />
                  </Link>
                  <Link
                    href={`/blogs/category/${post.category.slug}`}
                    className={`${CHIP} absolute bottom-2 left-2.5`}>
                    {post.category.name}
                  </Link>
                </div>
                <Typography variant="title-4" as="h3" className="font-semibold">
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="hover:underline">
                    {post.title}
                  </Link>
                </Typography>
                <Typography
                  variant="body-4"
                  className="flex items-center gap-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon="lucide:calendar" className="size-3.5" />
                    <time dateTime={post.publishedAt}>
                      {df.date(post.publishedAt)}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon icon="lucide:clock" className="size-3.5" />
                    {minutes(post)}
                  </span>
                </Typography>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
