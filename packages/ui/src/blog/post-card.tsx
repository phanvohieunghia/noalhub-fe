import {Typography} from '../typography'
import type {LinkLike} from './link-like'

export type PostCardVariant = 'default' | 'row'

/**
 * One card in a listing. `h2`, not `h1`: a listing page has exactly ONE `h1` —
 * its own title — and every card sits directly beneath it (`docs/blog.md` §6.2).
 *
 * Everything the app derives (links, formatted date, reading time) comes in
 * ready-made, so the same markup serves the real site and Storybook.
 */
export function PostCard({
  Link,
  href,
  categoryHref,
  categoryName,
  title,
  description,
  cover,
  author,
  date,
  dateTime,
  readingTime,
  featured = false,
  variant = 'default',
}: {
  Link: LinkLike
  href: string
  categoryHref: string
  categoryName: string
  title: string
  description: string
  /** The picture, already sized to fill its frame (`next/image` in the app). */
  cover?: React.ReactNode
  author: string
  date: string
  dateTime: string
  readingTime: string
  /** The lead post of a listing: cover beside the text, set larger. */
  featured?: boolean
  /**
   * Visual direction. `default` is the grid card; `row` is the single-column
   * editorial row used by the main listing.
   */
  variant?: PostCardVariant
}) {
  if (variant !== 'default') {
    return (
      <VariantCard
        Link={Link}
        href={href}
        categoryHref={categoryHref}
        categoryName={categoryName}
        title={title}
        description={description}
        cover={cover}
        author={author}
        date={date}
        dateTime={dateTime}
        readingTime={readingTime}
      />
    )
  }

  return (
    <article
      className={
        featured
          ? 'group grid items-center gap-6 md:grid-cols-2 md:gap-10'
          : 'group flex h-full flex-col gap-4'
      }>
      {cover ? (
        <Link href={href} tabIndex={-1} aria-hidden className="block">
          <span
            className={`bg-muted relative block overflow-hidden rounded-xl ${
              featured ? 'aspect-[4/3]' : 'aspect-[16/10]'
            }`}>
            <span className="absolute inset-0 transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]">
              {cover}
            </span>
          </span>
        </Link>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Link
          href={categoryHref}
          className="bg-muted text-foreground hover:bg-muted/60 text-body-4 w-fit rounded-full px-2.5 py-0.5 font-medium transition-colors">
          {categoryName}
        </Link>

        {/* h2: a listing page has exactly ONE h1, the page title (§6.2). */}
        <Typography
          variant={featured ? 'h3' : 'h5'}
          as="h2"
          className={`leading-snug text-balance ${featured ? 'font-serif font-normal' : ''}`}>
          <Link
            href={href}
            className="decoration-1 underline-offset-4 hover:underline">
            {title}
          </Link>
        </Typography>

        <Typography
          variant="body-3"
          className={`text-muted-foreground leading-relaxed ${
            featured ? 'line-clamp-4' : 'line-clamp-3'
          }`}>
          {description}
        </Typography>

        <Typography
          variant="body-4"
          className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <span>{author}</span>
          <span aria-hidden>·</span>
          <time dateTime={dateTime}>{date}</time>
          <span aria-hidden>·</span>
          <span>{readingTime}</span>
        </Typography>
      </div>
    </article>
  )
}

type VariantProps = {
  Link: LinkLike
  href: string
  categoryHref: string
  categoryName: string
  title: string
  description: string
  cover?: React.ReactNode
  author: string
  date: string
  dateTime: string
  readingTime: string
}

function Meta({
  author,
  date,
  dateTime,
  readingTime,
}: Pick<VariantProps, 'author' | 'date' | 'dateTime' | 'readingTime'>) {
  return (
    <Typography
      variant="body-4"
      className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-foreground font-medium">{author}</span>
      <span aria-hidden>·</span>
      <time dateTime={dateTime}>{date}</time>
      <span aria-hidden>·</span>
      <span>{readingTime}</span>
    </Typography>
  )
}

function VariantCard(p: VariantProps) {
  const {Link, href, cover, title, description} = p

  {
    return (
      <article className="group grid gap-5 sm:grid-cols-[1fr_220px] sm:items-center sm:gap-8 md:grid-cols-[1fr_280px]">
        <div className="flex min-w-0 flex-col gap-3 sm:order-1">
          <Link
            href={p.categoryHref}
            className="text-primary hover:text-primary/80 text-body-4 w-fit font-semibold transition-colors">
            {p.categoryName}
          </Link>
          <Typography
            variant="h3"
            as="h2"
            className="font-serif leading-tight font-normal text-balance">
            <Link href={href} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </Typography>
          <Typography
            variant="body-2"
            className="text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </Typography>
          <Meta {...p} />
        </div>
        {cover ? (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden
            className="block sm:order-2">
            <span className="bg-muted relative block aspect-[16/10] overflow-hidden rounded-xl sm:aspect-[4/3]">
              <span className="absolute inset-0 transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]">
                {cover}
              </span>
            </span>
          </Link>
        ) : null}
      </article>
    )
  }
}
