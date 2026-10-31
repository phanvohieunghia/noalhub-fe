'use client'

import {MarkdownContent} from '@noalhub/ui/blog/markdown-content'
import {PostContent} from '@noalhub/ui/blog/post-content'
import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {memo, useEffect, useRef, useState} from 'react'

import {
  useBrowseQaDatasets,
  useQaKnowledge,
  type QaKnowledge,
} from '@noalhub/api/qa'
import {BottomSheet} from '@noalhub/ui/bottom-sheet'
import {Button} from '@noalhub/ui/button'
import {DropdownMenu, DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {ScrollToTopButton} from '@noalhub/ui/scroll-to-top-button'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Typography} from '@noalhub/ui/typography'

import {KnowledgeSearchBar, useArticleSearch} from './knowledge-search'

/** How long the pinned bar stays once scrolling stops. */
const IDLE_HIDE_MS = 2000

/**
 * Whether a pinned bar is showing: always at the very top, hidden on the way
 * down, back on the way up, and hidden again after `IDLE_HIDE_MS` of stillness.
 */
function useAutoHideBar() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let last = window.scrollY
    let timer = 0
    const onScroll = () => {
      const y = window.scrollY
      window.clearTimeout(timer)
      if (y <= 8) {
        setVisible(true)
      } else {
        if (y > last) setVisible(false)
        else if (y < last) {
          setVisible(true)
          timer = window.setTimeout(() => setVisible(false), IDLE_HIDE_MS)
        }
      }
      last = y
    }
    window.addEventListener('scroll', onScroll, {passive: true})
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [])

  return visible
}

function BackHeader({
  href,
  title,
  actions,
  pinned = false,
  overlay,
}: {
  href: string
  title: string
  actions?: React.ReactNode
  /** Pin to the top and fade away while reading — see `useAutoHideBar`. */
  pinned?: boolean
  /** Covers the bar (and keeps it on screen) while set — the search field. */
  overlay?: React.ReactNode
}) {
  const t = useTranslations('web.learn')
  const visible = useAutoHideBar() || overlay !== undefined
  return (
    <header
      className={
        pinned
          ? // Pulled out over the page padding so the bar spans edge to edge; from `md`
            // it sits under the app header (h-16), which is hidden on phones.
            `sticky top-0 z-20 -mx-4 -mt-4 flex items-center gap-2 bg-background/70 px-4 py-2 shadow-[0_8px_16px_-8px_color-mix(in_srgb,var(--color-foreground)_25%,transparent)] md:shadow-none backdrop-blur-md transition-[opacity,translate] duration-300 sm:-mx-6 sm:-mt-6 sm:px-6 md:top-16 ${
              visible
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-full opacity-0'
            }`
          : 'flex items-center gap-2'
      }>
      <Button
        variant="ghost"
        size="icon"
        shape="circle"
        asChild
        aria-label={t('knowledge.back')}
        className="-ml-2 shrink-0">
        <Link href={href}>
          <Icon icon={LUCIDE.arrowLeft} />
        </Link>
      </Button>
      <Typography variant="h4" as="h1" className="min-w-0 flex-1 truncate">
        {title}
      </Typography>
      {actions}
      {overlay ? (
        <div className="absolute inset-0 flex items-center bg-background px-4 sm:px-6">
          {overlay}
        </div>
      ) : null}
    </header>
  )
}

/** Every published bank, by title; opening one reads its source like an article. */
export function LearnKnowledge() {
  const t = useTranslations('web.learn')
  const datasets = useBrowseQaDatasets()
  const rows = datasets.data?.items ?? []

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
      <BackHeader href="/learn" title={t('knowledge.title')} />
      <Typography variant="body-3" className="text-muted-foreground">
        {t('knowledge.intro')}
      </Typography>

      {datasets.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t('knowledge.empty')}
        </Typography>
      ) : (
        <ul className="space-y-3">
          {rows.map((dataset) => (
            <li key={dataset.id}>
              <Link
                href={`/learn/knowledge/${dataset.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                <Typography
                  variant="title-3"
                  as="p"
                  className="min-w-0 flex-1 truncate">
                  {dataset.title}
                </Typography>
                <Icon
                  icon={LUCIDE.chevronRight}
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

type Heading = {id: string; text: string; level: number}

/** A heading counts as "reached" once its top passes this line (px from the viewport top). */
const ACTIVE_OFFSET = 96
/** From `md` the app header (4rem) sits above the pinned bar, so the line sits lower. */
const activeOffset = () => (window.innerWidth >= 768 ? 136 : ACTIVE_OFFSET)

/** Glide to a heading, leaving it just below the sticky header. */
function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top =
    el.getBoundingClientRect().top + window.scrollY - activeOffset() + 8
  window.scrollTo({top, behavior: 'smooth'})
}

/** Put `#id` in the address bar without adding a history entry per section. */
function setHash(id: string) {
  window.history.replaceState(null, '', `#${id}`)
}

/**
 * The headings of whatever got rendered inside `ref`, read from the DOM — the
 * article can be a Tiptap doc, markdown, or several source chunks, and the DOM
 * is the one shape they share. Headings without an id get one so the list can
 * link to them. `deps` re-reads when the content changes.
 */
function useArticleHeadings(
  ref: React.RefObject<HTMLElement | null>,
  deps: unknown,
) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const found: Heading[] = []
    root
      .querySelectorAll<HTMLElement>('h1, h2, h3, h4')
      .forEach((el, index) => {
        if (!el.id) el.id = `knowledge-h-${index}`
        const text = el.textContent?.trim()
        if (text) found.push({id: el.id, text, level: Number(el.tagName[1])})
      })
    setHeadings(found)
    // Headings only get their ids now, so the browser could not honour a `#id` the
    // page was opened with — glide there ourselves.
    const target = decodeURIComponent(window.location.hash.slice(1))
    if (target && found.some((heading) => heading.id === target)) {
      scrollToHeading(target)
    }
  }, [ref, deps])

  useEffect(() => {
    if (headings.length === 0) return
    let frame = 0
    const update = () => {
      frame = 0
      let current = headings[0].id
      for (const heading of headings) {
        const el = document.getElementById(heading.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= activeOffset())
          current = heading.id
        else break
      }
      setActiveId(current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, {passive: true})
    return () => {
      window.removeEventListener('scroll', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [headings])

  return {headings, activeId}
}

function KnowledgeToc({
  headings,
  activeId,
  onPick,
}: {
  headings: Heading[]
  activeId: string | null
  onPick?: () => void
}) {
  const t = useTranslations('web.learn')
  const navRef = useRef<HTMLElement>(null)
  const top = Math.min(...headings.map((heading) => heading.level))

  // Keep the highlighted entry inside the sidebar's own scroll box. Done by hand:
  // `scrollIntoView` would drag the page along with it.
  useEffect(() => {
    const nav = navRef.current
    const box = nav?.closest<HTMLElement>('[data-toc-scroll]')
    const item = nav?.querySelector<HTMLElement>('[aria-current]')
    if (!box || !item) return
    const boxRect = box.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const margin = 24
    if (itemRect.top < boxRect.top + margin) {
      box.scrollTo({top: box.scrollTop + itemRect.top - boxRect.top - margin})
    } else if (itemRect.bottom > boxRect.bottom - margin) {
      box.scrollTo({
        top: box.scrollTop + itemRect.bottom - boxRect.bottom + margin,
      })
    }
  }, [activeId])

  return (
    <nav ref={navRef} aria-label={t('knowledge.toc')} className="space-y-2">
      <Typography variant="title-4" as="h2" className="text-muted-foreground">
        {t('knowledge.toc')}
      </Typography>
      <ul className="space-y-0.5 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault()
                onPick?.()
                // A short wait for the sheet to start sliding out: gliding in the same
                // frame as its exit animation makes the scroll stutter.
                setHash(heading.id)
                window.setTimeout(
                  () => scrollToHeading(heading.id),
                  onPick ? 100 : 0,
                )
              }}
              aria-current={heading.id === activeId ? 'location' : undefined}
              style={{paddingLeft: `${0.75 + (heading.level - top) * 0.75}rem`}}
              className={`-ml-px block border-l py-1 pr-2 text-body-4 transition-colors hover:text-foreground ${
                heading.id === activeId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * The article itself. Memoised on purpose: the page around it re-renders on every
 * change of the active heading (each scroll), every search keystroke and every sheet
 * open, and re-parsing a long markdown document each time is what made those janky.
 */
const KnowledgeBody = memo(function KnowledgeBody({
  data,
}: {
  data: QaKnowledge | undefined
}) {
  const t = useTranslations('web.learn')
  const sources = (data?.sources ?? []).filter((row) => row.content)

  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (data.outline) {
    // The version an admin chose to show; the raw sources are only the fallback.
    return data.outline.contentFormat === 'doc' ? (
      <PostContent doc={data.outline.content} />
    ) : (
      <MarkdownContent markdown={data.outline.content} />
    )
  }
  if (sources.length === 0) {
    return (
      <Typography variant="body-3" className="text-muted-foreground">
        {t('knowledge.noSource')}
      </Typography>
    )
  }
  return sources.map((source) => (
    <article key={source.id} className="space-y-3">
      {source.title ? (
        <Typography variant="h3" as="h2">
          {source.title}
        </Typography>
      ) : null}
      <MarkdownContent markdown={source.content ?? ''} />
    </article>
  ))
})

/** One bank's source text, read top to bottom. */
export function LearnKnowledgeDetail({datasetId}: {datasetId: string}) {
  const t = useTranslations('web.learn')
  const knowledge = useQaKnowledge(datasetId)
  const articleRef = useRef<HTMLDivElement>(null)
  const {headings, activeId} = useArticleHeadings(articleRef, knowledge.data)
  const [tocOpen, setTocOpen] = useState(false)
  const hasToc = headings.length > 1
  const search = useArticleSearch(articleRef)

  const searchButton = (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0"
      aria-label={t('knowledge.search')}
      onClick={search.start}>
      <Icon icon={ICONS.search} />
    </Button>
  )

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 p-4 sm:p-6">
      <BackHeader
        pinned
        href="/learn/knowledge"
        title={knowledge.data?.title ?? t('knowledge.title')}
        overlay={
          search.open ? <KnowledgeSearchBar search={search} /> : undefined
        }
        actions={
          <>
            {/* A wrapper hides it: `Button` sets its own `display`, which beats `hidden`. */}
            {hasToc ? (
              <div className="hidden lg:block">{searchButton}</div>
            ) : (
              searchButton
            )}
            {hasToc ? (
              // Phones fold both tools into one menu; from `lg` the contents sit
              // beside the article, so only search is left to reach.
              <DropdownMenu
                compact
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 lg:hidden"
                    aria-label={t('knowledge.tools')}>
                    <Icon icon={LUCIDE.tableOfContents} />
                  </Button>
                }>
                <DropdownMenuItem
                  icon={LUCIDE.tableOfContents}
                  onSelect={() => setTocOpen(true)}>
                  {t('knowledge.toc')}
                </DropdownMenuItem>
                <DropdownMenuItem icon={ICONS.search} onSelect={search.start}>
                  {t('knowledge.search')}
                </DropdownMenuItem>
              </DropdownMenu>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-8 lg:flex-row-reverse lg:items-start">
        {hasToc ? (
          <aside
            data-toc-scroll
            className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] md:top-36 md:max-h-[calc(100dvh-10rem)] w-60 shrink-0 overflow-y-auto lg:block">
            <KnowledgeToc headings={headings} activeId={activeId} />
          </aside>
        ) : null}
        <div ref={articleRef} className="min-w-0 flex-1 space-y-6">
          <KnowledgeBody data={knowledge.data} />
        </div>
      </div>

      <BottomSheet
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        title={t('knowledge.toc')}>
        <KnowledgeToc
          headings={headings}
          activeId={activeId}
          onPick={() => setTocOpen(false)}
        />
      </BottomSheet>

      <ScrollToTopButton label={t('knowledge.toTop')} />
    </main>
  )
}
