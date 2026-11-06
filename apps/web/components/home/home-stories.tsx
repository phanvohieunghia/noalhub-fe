'use client'

import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useGSAP} from '@gsap/react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {useRef, useState} from 'react'

import {Avatar} from '@noalhub/ui/avatar'
import {PostCover} from '@noalhub/ui/blog/post-cover'
import {DuotoneImage} from '@noalhub/ui/duotone-image'
import {Icon} from '@noalhub/ui/icons'
import {Typography} from '@noalhub/ui/typography'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** A post with everything the server already formatted (dates, reading time). */
export type HomeStory = {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImageUrl: string | null
  category: {slug: string; name: string}
  author: {displayName: string; avatarUrl: string | null}
  dateLabel: string
  dateTime: string
  minutesLabel: string
}

export type HomeStoriesCopy = {
  heading: string
  filtersLabel: string
  all: string
  viewAll: string
  read: string
  /** A template with a `{name}` slot — a function cannot cross from the server. */
  by: string
}

/** A category chip: the brand tint, no outline — it separates from the card by tone. */
const CHIP =
  'inline-flex w-fit items-center rounded-full bg-tint px-2.5 py-0.5 text-body-4 text-accent'

/**
 * The home's post list (`docs/reference/gas-for-africa/04-blog-cards-scroll.jpg`):
 * two staggered columns of small cards sitting straight on the coloured field, and
 * beside them one tall panel that holds the post in focus. Hovering or tabbing to a
 * card puts that post in the panel; the panel stays put (sticky) while the cards
 * scroll past it.
 *
 * The cards are real links (the title stretches over the whole card), so the panel
 * is a preview, never the only way in. On a phone the panel comes first and the
 * cards follow in one column.
 *
 * Motion: cards rise in as they reach the viewport, and the second column drifts at
 * its own pace while scrolling, so the two stay out of step like in the reference.
 * Both are off with reduced motion.
 */
export function HomeStories({
  posts,
  categories,
  copy,
}: {
  posts: HomeStory[]
  categories: {slug: string; name: string}[]
  copy: HomeStoriesCopy
}) {
  const root = useRef<HTMLElement>(null)
  const [activeId, setActiveId] = useState(posts[0]?.id)
  const active = posts.find((post) => post.id === activeId) ?? posts[0]

  useGSAP(
    () => {
      const motion = gsap.matchMedia()

      motion.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-story]').forEach((card) => {
          gsap.from(card, {
            y: 36,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {trigger: card, start: 'top 90%', once: true},
          })
        })
      })

      motion.add(
        '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        () => {
          gsap.fromTo(
            '[data-column="b"]',
            {yPercent: 0},
            {
              yPercent: -6,
              ease: 'none',
              scrollTrigger: {
                trigger: root.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6,
              },
            },
          )
        },
      )
    },
    {scope: root},
  )

  if (!active) return null

  const columns = [
    posts.filter((_, i) => i % 2 === 0),
    posts.filter((_, i) => i % 2 === 1),
  ]

  return (
    <section ref={root} className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-wrap items-center gap-3 px-1">
        <Typography
          variant="title-1"
          as="h2"
          className="w-full font-semibold text-brand-50 sm:w-auto sm:flex-1">
          {copy.heading}
        </Typography>
        <nav
          aria-label={copy.filtersLabel}
          className="flex flex-wrap gap-2 text-body-4">
          <Link
            href={routes.blog}
            className="rounded-full bg-surface px-3.5 py-1.5 text-surface-foreground">
            {copy.all}
          </Link>
          {categories.slice(0, 3).map((category) => (
            <Link
              key={category.slug}
              href={routes.blogCategory(category.slug)}
              className="rounded-full bg-brand-50/15 px-3.5 py-1.5 text-brand-50 transition-colors hover:bg-brand-50/25">
              {category.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid items-start gap-3 md:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* The preview comes first in the DOM for a phone, last on a laptop. */}
        <aside
          aria-live="polite"
          className="overflow-hidden rounded-3xl bg-surface p-5 text-surface-foreground md:p-6 lg:sticky lg:top-8 lg:order-2">
          <div key={active.id} className="flex flex-col gap-4 story-swap">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={routes.blogCategory(active.category.slug)}
                className={CHIP}>
                {active.category.name}
              </Link>
              <time
                dateTime={active.dateTime}
                className="text-body-4 text-muted-foreground">
                {active.dateLabel}
              </time>
            </div>
            <Typography variant="h3" as="h3" className="truncate">
              <Link
                href={routes.blogPost(active.slug)}
                title={active.title}
                className="hover:underline">
                {active.title}
              </Link>
            </Typography>
            <Typography
              variant="body-3"
              className="line-clamp-3 min-h-[calc(3*1.6em)] text-muted-foreground">
              {active.excerpt}
            </Typography>
            <div className="flex items-center gap-2.5">
              <Avatar
                name={active.author.displayName}
                src={active.author.avatarUrl}
                size="sm"
              />
              <Typography
                as="span"
                variant="title-4"
                weight={600}
                className="min-w-0 flex-1 truncate">
                {copy.by.replace('{name}', active.author.displayName)}
              </Typography>
              <Typography
                as="span"
                variant="body-4"
                className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Icon icon="lucide:clock" className="size-4" />
                {active.minutesLabel}
              </Typography>
            </div>
            {active.coverImageUrl ? (
              <DuotoneImage
                src={active.coverImageUrl}
                alt=""
                className="aspect-[4/5] rounded-t-2xl rounded-b-[6rem]"
              />
            ) : (
              <div className="relative isolate block aspect-[4/5] overflow-hidden rounded-t-2xl rounded-b-[6rem]">
                <PostCover
                  post={active}
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </aside>

        <div className="grid gap-3 md:grid-cols-2 md:gap-6 lg:order-1">
          {columns.map((column, c) => (
            <div
              key={c}
              data-column={c === 0 ? 'a' : 'b'}
              className={`flex flex-col gap-3 md:gap-6 ${
                c === 1 ? 'md:pt-16' : ''
              }`}>
              {column.map((post) => (
                <article
                  key={post.id}
                  data-story
                  onMouseEnter={() => setActiveId(post.id)}
                  onFocus={() => setActiveId(post.id)}
                  className={`relative flex flex-col gap-3 rounded-2xl bg-surface p-5 text-surface-foreground transition-shadow ${
                    post.id === active.id ? 'ring-2 ring-ring' : ''
                  }`}>
                  <Typography
                    variant="title-3"
                    as="h3"
                    className="font-semibold">
                    <Link
                      href={routes.blogPost(post.slug)}
                      aria-label={`${copy.read}: ${post.title}`}
                      className="after:absolute after:inset-0 after:content-['']">
                      {post.title}
                    </Link>
                  </Typography>
                  <Typography
                    variant="body-4"
                    className="line-clamp-3 text-muted-foreground">
                    {post.excerpt}
                  </Typography>
                  <div className="flex items-center gap-2.5">
                    <span className={CHIP}>{post.category.name}</span>
                    <time
                      dateTime={post.dateTime}
                      className="text-body-4 text-muted-foreground">
                      {post.dateLabel}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          href={routes.blog}
          className="inline-flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 text-body-3 font-semibold text-surface-foreground">
          {copy.viewAll}
          <Icon icon="lucide:arrow-right" className="size-4" />
        </Link>
      </div>
    </section>
  )
}
