'use client'

import {useTranslations} from 'next-intl'
import {useEffect, useMemo, useRef, useState} from 'react'

import {
  useAddToQaFinalSet,
  useDeleteQaItem,
  useQaFinalEntries,
  useQaFinalSummary,
  useQaOutline,
  useUpdateQaItem,
  type QaFinalEntry,
} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {DropdownMenu, DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Toggle} from '@noalhub/ui/toggle'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'
import {ToastError} from '@noalhub/ui/toast'

import {QaItemEditDialog} from './qa-item-edit-dialog'
import {QaReviewQuestion} from './qa-review-question'
import {useFitHeight} from './use-fit-height'
import {TruncatedTooltip} from './truncated-tooltip'
import {useOutlineVersion} from './use-outline-version'

/**
 * Step 4: the questions that were approved, and what of them is already in the
 * final set — the copies learners actually see. Grouped by section (outline
 * heading) by default, with a toggle for one flat list; the approved-but-not-yet-
 * added questions are flagged "New" once the set exists, and can be added one by
 * one or all at once.
 */
export function QaFinalStep({datasetId}: {datasetId: string}) {
  const t = useTranslations('admin.qa')
  // The counts and the questions are separate requests: the questions arrive a page at
  // a time as the list is scrolled to its end, the counts (and so every heading's number)
  // arrive at once. A section's questions come together, so a heading goes in wherever the
  // section changes in what has loaded. Questions are grouped by their own
  // `sectionAnchor` and named from the outline.
  const summary = useQaFinalSummary(datasetId)
  const entriesQuery = useQaFinalEntries(datasetId)
  const {latest} = useOutlineVersion(datasetId)
  const outline = useQaOutline(latest?.id)
  const anchorTitles = useMemo(
    () =>
      new Map((outline.data?.outline ?? []).map((e) => [e.anchor, e.title])),
    [outline.data],
  )
  const loaded = useMemo(
    () => entriesQuery.data?.pages.flatMap((page) => page.entries) ?? [],
    [entriesQuery.data],
  )
  const sections = useMemo(
    () => sectionsOf(loaded, anchorTitles, summary.data?.sections ?? []),
    [loaded, anchorTitles, summary.data],
  )
  const add = useAddToQaFinalSet(datasetId)
  const [editing, setEditing] = useState<{
    entry: QaFinalEntry
    section: string
  } | null>(null)
  const [view, setView] = useState<'full' | 'hover'>('full')
  const [groupBy, setGroupBy] = useState<'section' | 'flat'>('section')
  // Group keys whose questions are folded away.
  const [folded, setFolded] = useState<Set<string>>(new Set())
  // Groups opened or closed at least once keep their questions mounted, so the height
  // can animate both ways; a group that was never touched while closed draws nothing.
  const [mounted, setMounted] = useState<Set<string>>(new Set())
  const toggleFold = (key: string) => {
    if (!folded.has(key)) {
      setMounted((prev) => new Set(prev).add(key))
      setFolded((prev) => new Set(prev).add(key))
      return
    }
    // Opening: mount the questions folded first, then unfold a moment later so the
    // height grows from 0 instead of appearing at full size. A timeout rather than
    // `requestAnimationFrame`, which a hidden tab never runs.
    setMounted((prev) => new Set(prev).add(key))
    setTimeout(
      () =>
        setFolded((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        }),
      30,
    )
  }
  const listRef = useFitHeight<HTMLDivElement>()
  // A sentinel below the last loaded question asks for the next page once it comes within
  // reach of the scroller; the observer is rebuilt after every page, so a sentinel that is
  // still in view (a short page, folded groups) asks again.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const {hasNextPage, isFetchingNextPage, fetchNextPage} = entriesQuery
  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = listRef.current
    if (!hasNextPage || isFetchingNextPage || !sentinel || !root) return
    const observer = new IntersectionObserver(
      (hits) => {
        if (hits.some((hit) => hit.isIntersecting)) void fetchNextPage()
      },
      {root, rootMargin: '600px 0px'},
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, loaded.length, listRef])

  if (summary.isPending || entriesQuery.isPending)
    return <Skeleton className="h-64 w-full" />
  if (summary.isError || entriesQuery.isError)
    return <ToastError message={t('ws.sets.loadFailed')} />

  const {hasFinal, added: inDatabase, waiting, total} = summary.data

  if (total === 0) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <Typography variant="body-3" className="text-muted-foreground">
          {t('ws.final.empty')}
        </Typography>
      </section>
    )
  }

  const questionActions = (entry: QaFinalEntry, section: string) => (
    <>
      {entry.state === 'new' && hasFinal ? (
        <Badge tone="warning" size="sm">
          {t('ws.final.newTag')}
        </Badge>
      ) : null}
      <Button
        variant="outline"
        size="icon-md"
        aria-label={t('ws.final.edit')}
        onClick={() => setEditing({entry, section})}>
        <Icon icon={ICONS.edit} />
      </Button>
      {entry.state === 'new' && hasFinal ? (
        <Button
          size="icon-md"
          aria-label={t('ws.final.add')}
          loading={add.isPending}
          onClick={() => add.mutate([entry.item.id])}>
          <Icon icon={ICONS.add} />
        </Button>
      ) : null}
      <EntryMenu item={entry.item} />
    </>
  )

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <Typography variant="title-3" as="h2" className="flex-1">
          {hasFinal
            ? t('ws.final.headingCreated', {count: inDatabase})
            : t('ws.final.headingNew', {count: total})}
        </Typography>
        <Toggle
          variant="outline"
          aria-label={t('ws.sets.viewMode')}
          value={view}
          onValueChange={setView}
          options={[
            {
              value: 'full',
              icon: LUCIDE.listChecks,
              label: t('ws.sets.viewFull'),
            },
            {
              value: 'hover',
              icon: LUCIDE.mousePointerClick,
              label: t('ws.sets.viewHover'),
            },
          ]}
        />
        <Toggle
          variant="outline"
          aria-label={t('ws.sets.groupBy')}
          value={groupBy}
          onValueChange={setGroupBy}
          options={[
            {
              value: 'section',
              icon: LUCIDE.listTree,
              label: t('ws.sets.groupBySection'),
            },
            {
              value: 'flat',
              icon: LUCIDE.rows3,
              label: t('ws.final.groupFlat'),
            },
          ]}
        />
        {!hasFinal ? (
          <Tooltip label={t('ws.final.create')}>
            <Button
              size="icon-md"
              aria-label={t('ws.final.create')}
              loading={add.isPending}
              onClick={() => add.mutate(undefined)}>
              {add.isPending ? null : <Icon icon={LUCIDE.packageCheck} />}
            </Button>
          </Tooltip>
        ) : waiting > 0 ? (
          <Tooltip label={t('ws.final.addNew', {count: waiting})}>
            <Button
              size="icon-md"
              aria-label={t('ws.final.addNew', {count: waiting})}
              loading={add.isPending}
              onClick={() => add.mutate(undefined)}>
              {add.isPending ? null : <Icon icon={LUCIDE.packagePlus} />}
            </Button>
          </Tooltip>
        ) : null}
      </div>

      {add.isError ? <ToastError message={t('ws.final.saveFailed')} /> : null}

      <div
        ref={listRef}
        // `-mx-1 px-1`: the scroller clips sideways too, which cut the headings' shadow.
        className="-mx-1 flex max-h-[var(--fit-h,70vh)] min-h-0 flex-col gap-3 overflow-y-auto px-1 pb-1">
        {groupBy === 'flat'
          ? loaded.map((entry, index) => {
              const tags = sectionTagOf(sections, entry)
              return (
                <QaReviewQuestion
                  key={entry.item.id}
                  item={entry.item}
                  index={index}
                  shapeLabel={shapeOf(t, entry.templateKey)}
                  tags={tags}
                  revealOnHover={view === 'hover'}
                  actions={questionActions(entry, tags[0] ?? '')}
                />
              )
            })
          : sections.map((group, groupIndex) => {
              const key = group.key
              const isFolded = folded.has(key)
              // A folded group nobody has touched draws nothing; one that has been
              // opened keeps its questions mounted so the height can animate both ways.
              const shown = !isFolded || mounted.has(key) ? group.entries : []
              const title = group.title || t('ws.sets.noSection')
              const before = sections
                .slice(0, groupIndex)
                .reduce((sum, g) => sum + g.entries.length, 0)
              const fresh = group.waiting
              return (
                // The heading sticks only inside its own group, so the next
                // group's heading takes its place when it scrolls up.
                <div key={key} className="flex flex-col">
                  <div className="sticky top-0 z-10 rounded-lg border border-border bg-surface py-1 pr-3 pl-1.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-expanded={!isFolded}
                        aria-label={title}
                        onClick={() => toggleFold(key)}>
                        <Icon
                          icon={
                            isFolded ? ICONS.chevronRight : ICONS.chevronDown
                          }
                          animate="snappy"
                          className="size-4 shrink-0"
                        />
                      </Button>
                      {/* One line only; the tooltip shows the full title, only when it is cut. */}
                      <TruncatedTooltip label={title}>
                        <div className="min-w-0 flex-1">
                          <Typography variant="title-4" className="truncate">
                            {title}
                          </Typography>
                        </div>
                      </TruncatedTooltip>
                      {hasFinal && fresh > 0 ? (
                        <Badge tone="warning" size="sm">
                          {t('ws.final.newCount', {count: fresh})}
                        </Badge>
                      ) : null}
                      <Typography
                        variant="body-4"
                        className="text-muted-foreground">
                        {group.total}
                      </Typography>
                    </div>
                  </div>
                  <div
                    aria-hidden={isFolded}
                    inert={isFolded}
                    className={`grid min-h-0 transition-[grid-template-rows] ease-[ease] ${
                      isFolded ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                    }`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="flex flex-col gap-3 pt-3">
                        {shown.map((entry, index) => (
                          <QaReviewQuestion
                            key={entry.item.id}
                            item={entry.item}
                            index={before + index}
                            shapeLabel={shapeOf(t, entry.templateKey)}
                            revealOnHover={view === 'hover'}
                            actions={questionActions(entry, group.title)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        {hasNextPage ? (
          <div ref={sentinelRef} aria-hidden="true" className="h-px shrink-0" />
        ) : null}
      </div>

      {editing ? (
        <QaItemEditDialog
          key={editing.entry.item.id}
          item={editing.entry.item}
          shapeLabel={shapeOf(t, editing.entry.templateKey)}
          sectionTitle={editing.section}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  )
}

/** Reject or delete one question — the same menu as the review step. */
function EntryMenu({item}: {item: QaFinalEntry['item']}) {
  const t = useTranslations('admin.qa')
  const update = useUpdateQaItem(item.setId)
  const remove = useDeleteQaItem(item.setId)

  return (
    <DropdownMenu
      compact
      trigger={
        <Button
          variant="outline"
          size="icon-md"
          aria-label={t('ws.sets.actions')}>
          <Icon icon={ICONS.more} />
        </Button>
      }>
      <DropdownMenuItem
        icon={ICONS.close}
        disabled={update.isPending}
        onSelect={() =>
          update.mutate({id: item.id, input: {reviewStatus: 'rejected'}})
        }>
        {t('ws.sets.reject')}
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={ICONS.delete}
        tone="danger"
        disabled={remove.isPending}
        onSelect={() => remove.mutate(item.id)}>
        {t('ws.sets.delete')}
      </DropdownMenuItem>
    </DropdownMenu>
  )
}

function shapeOf(
  t: ReturnType<typeof useTranslations<'admin.qa'>>,
  key: string,
): string {
  return key
    ? t(`templates.shapes.${key}` as 'templates.shapes.multiple_choice')
    : ''
}

/** One heading with the final-set questions of it that have loaded so far. */
type FinalSection = {
  key: string
  title: string
  /** All of the section's questions, loaded or not — from the summary. */
  total: number
  /** How many of them are approved but not yet in the final set. */
  waiting: number
  entries: QaFinalEntry[]
}

/**
 * Groups the questions loaded so far under their section. The server sends a section's
 * questions together and in display order, so a section is one run: a new run is a new
 * heading, and the order is the one the pages came in. `counts` carries each section's
 * full size, which the loaded part may not reach yet.
 */
function sectionsOf(
  entries: QaFinalEntry[],
  titles: Map<string, string>,
  counts: {sectionAnchor: string | null; total: number; waiting: number}[],
): FinalSection[] {
  const sizes = new Map(counts.map((c) => [c.sectionAnchor ?? '', c]))
  const out: FinalSection[] = []
  for (const entry of entries) {
    const anchor = entry.item.sectionAnchor ?? ''
    const last = out[out.length - 1]
    if (last && last.key === (anchor === '' ? 'none' : anchor)) {
      last.entries.push(entry)
      continue
    }
    out.push({
      key: anchor === '' ? 'none' : anchor,
      title: titles.get(anchor) ?? anchor,
      total: sizes.get(anchor)?.total ?? 0,
      waiting: sizes.get(anchor)?.waiting ?? 0,
      entries: [entry],
    })
  }
  return out
}

/** The section a question belongs to, as a tag — used on the flat list. */
function sectionTagOf(sections: FinalSection[], entry: QaFinalEntry): string[] {
  const section = sections.find((g) => g.entries.includes(entry))
  return section?.title ? [section.title] : []
}
