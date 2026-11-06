'use client'

import {routes} from '@noalhub/core/routes'
import {DifficultyBadge} from '@noalhub/ui/difficulty'
import {useTranslations} from 'next-intl'
import {useRouter} from 'next/navigation'
import {useMemo, useState} from 'react'

import {
  QA_COUNT_OPTIONS,
  useBrowseQaDatasets,
  useFinishQaAttempt,
  useQaAttempts,
  useStartQaAttempt,
  type QaAttempt,
  type QaDifficulty,
  type QaItemKind,
  type QaDatasetSummary,
} from '@noalhub/api/qa'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {DropdownMenu, DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {ToastError} from '@noalhub/ui/toast'
import {Typography} from '@noalhub/ui/typography'
import {useTabletUp} from '@noalhub/ui/use-tablet-up'

import {useDebouncedValue} from './use-debounced-value'

const KINDS = ['theory', 'practice', 'recall', 'analysis'] as const
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
/** How many rows one "Load more" reveals. */
const PAGE_SIZE = 12
/** Past this many answers, picking an open attempt up asks whether to keep it. */
const CONFIRM_RESUME_AFTER = 10

/**
 * The way into the learner surface, as a master–detail pair.
 *
 * Left: one compact row per **dataset** (a bank of published questions; sets and
 * outlines never show up on this side), banks the learner is halfway through first.
 * Right: the bank under the cursor — what it holds, how many questions to take,
 * and the one button. From tablet width up that panel sits beside the list, so
 * looking at a bank and starting it is one place and no modal; on a phone there
 * is no room for two columns, so the same panel opens in a dialog instead.
 *
 * The button reads "Continue" whenever the backend reports an open attempt.
 * Starting is a decision, continuing is picking up something half-done.
 *
 * Search goes to the backend (title match, debounced 300ms). Kind and
 * difficulty filter **client-side** over what came back: the endpoint takes no
 * such filter, and the catalogue is small enough to hold in memory.
 */
export function LearnBrowse() {
  const t = useTranslations('web.learn')
  const router = useRouter()
  const tabletUp = useTabletUp()
  const [kind, setKind] = useState<QaItemKind | ''>('')
  const [difficulty, setDifficulty] = useState<QaDifficulty | ''>('')
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [picked, setPicked] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // The title search runs on the backend, one request per pause in typing.
  const needle = useDebouncedValue(search.trim())
  const datasets = useBrowseQaDatasets(needle)
  const attempts = useQaAttempts()

  // One open attempt per dataset (the backend guarantees it) → its progress by dataset id.
  const openByDataset = useMemo(() => {
    const map = new Map<string, QaAttempt>()
    for (const attempt of attempts.data ?? []) {
      if (attempt.status === 'in_progress' && !isAnsweredThrough(attempt)) {
        map.set(attempt.datasetId, attempt)
      }
    }
    return map
  }, [attempts.data])

  // Latest finished attempt per dataset, so a bank you already completed is not shown as new.
  const doneByDataset = useMemo(() => {
    const map = new Map<string, QaAttempt>()
    for (const attempt of attempts.data ?? []) {
      if (attempt.answeredCount === 0) continue
      if (openByDataset.get(attempt.datasetId)?.id === attempt.id) continue
      const prev = map.get(attempt.datasetId)
      const at = attempt.finishedAt ?? attempt.startedAt
      if (!prev || at > (prev.finishedAt ?? prev.startedAt)) {
        map.set(attempt.datasetId, attempt)
      }
    }
    return map
  }, [attempts.data, openByDataset])

  // Halfway-through banks lead, most recently started first; the rest keep the server's order.
  const rows = useMemo(() => {
    const filtered = (datasets.data?.items ?? []).filter(
      (row) =>
        (kind === '' || row.itemKinds.includes(kind)) &&
        (difficulty === '' || row.difficulties.includes(difficulty)),
    )
    const startedAt = (row: QaDatasetSummary) =>
      openByDataset.get(row.id)?.startedAt
    return filtered
      .map((row, index) => ({row, index}))
      .sort((a, b) => {
        const sa = startedAt(a.row)
        const sb = startedAt(b.row)
        if (sa && sb) return sa < sb ? 1 : -1
        if (sa || sb) return sa ? -1 : 1
        return a.index - b.index
      })
      .map(({row}) => row)
  }, [datasets.data, kind, difficulty, openByDataset])

  const shown = rows.slice(0, visible)
  // Nothing picked (or the pick was filtered away) → the first row, which is the
  // bank to pick back up whenever there is one.
  const current = rows.find((row) => row.id === picked) ?? rows[0] ?? null
  const filtering = kind !== '' || difficulty !== '' || needle !== ''

  // A filter change must start from the first page again, or "Showing 12 of 3"
  // is one keystroke away.
  const onFilter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setVisible(PAGE_SIZE)
    }

  const pick = (row: QaDatasetSummary) => {
    setPicked(row.id)
    if (!tabletUp) setDialogOpen(true)
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="min-w-0 space-y-5">
        <header className="flex items-start justify-between gap-3">
          <Typography variant="h2" as="h1">
            {t('browse.title')}
          </Typography>
          <DropdownMenu
            trigger={
              <Button
                variant="outline"
                size="icon"
                aria-label={t('browse.menu')}>
                <Icon icon={LUCIDE.menu} />
              </Button>
            }
            compact>
            <DropdownMenuItem
              icon={LUCIDE.history}
              onSelect={() => router.push(routes.practiceHistory)}>
              {t('history.open')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={LUCIDE.chartColumn}
              onSelect={() => router.push(routes.practiceStats)}>
              {t('browse.stats')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={LUCIDE.bookOpen}
              onSelect={() => router.push(`${routes.knowledge}?from=learn`)}>
              {t('browse.knowledge')}
            </DropdownMenuItem>
          </DropdownMenu>
        </header>

        {/* One row from `lg`: the search takes what is left, the two filters a fixed width. */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_13rem]">
          <Input
            label={t('browse.searchLabel')}
            hideLabel
            type="search"
            leadingIcon={ICONS.search}
            placeholder={t('browse.searchPlaceholder')}
            value={search}
            onChange={(event) => onFilter(setSearch)(event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:contents">
            <Select
              label={t('browse.filterKind')}
              hideLabel
              value={kind}
              onChange={(event) =>
                onFilter(setKind)(event.target.value as QaItemKind | '')
              }
              placeholder={t('browse.allKinds')}
              options={KINDS.map((value) => ({
                value,
                label: t(`kinds.${value}`),
              }))}
            />
            <Select
              label={t('browse.difficultyLabel')}
              hideLabel
              value={difficulty}
              onChange={(event) =>
                onFilter(setDifficulty)(event.target.value as QaDifficulty | '')
              }
              placeholder={t('browse.anyDifficulty')}
              options={DIFFICULTIES.map((value) => ({
                value,
                label: t(`difficulty.${value}`),
              }))}
            />
          </div>
        </div>

        {datasets.isPending ? (
          <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="hidden h-72 w-full rounded-xl md:block" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-6">
            <Typography variant="body-3" className="text-muted-foreground">
              {/* Empty here means no admin has PUBLISHED anything — say that,
                  rather than "no data", which reads like something broke. */}
              {datasets.data?.total === 0
                ? t('browse.emptyNone')
                : t('browse.emptyFilter')}
            </Typography>
            {filtering && datasets.data?.total !== 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setKind('')
                  setDifficulty('')
                  setSearch('')
                  setVisible(PAGE_SIZE)
                }}>
                {t('filters.reset')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-3">
              <Typography
                variant="body-4"
                className="text-muted-foreground"
                aria-live="polite">
                {t('browse.shownOf', {shown: shown.length, total: rows.length})}
              </Typography>
              <ul className="space-y-1.5">
                {shown.map((dataset) => (
                  <DatasetRow
                    key={dataset.id}
                    dataset={dataset}
                    attempt={openByDataset.get(dataset.id)}
                    done={doneByDataset.has(dataset.id)}
                    selected={tabletUp && current?.id === dataset.id}
                    onPick={() => pick(dataset)}
                  />
                ))}
              </ul>
              {shown.length < rows.length ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                  {t('browse.loadMore')}
                </Button>
              ) : null}
            </div>

            {tabletUp && current ? (
              <section
                aria-label={current.title}
                className="sticky top-20 min-w-0 space-y-4 rounded-xl border border-border bg-surface p-6">
                <DatasetDetail
                  key={current.id}
                  dataset={current}
                  attempt={openByDataset.get(current.id)}
                  lastDone={doneByDataset.get(current.id)}
                />
              </section>
            ) : null}
          </div>
        )}
      </div>

      {!tabletUp && dialogOpen && current ? (
        <Dialog open onClose={() => setDialogOpen(false)} title={current.title}>
          <DatasetDetail
            dataset={current}
            attempt={openByDataset.get(current.id)}
            lastDone={doneByDataset.get(current.id)}
            hideTitle
            onDiscarded={() => setDialogOpen(false)}
          />
        </Dialog>
      ) : null}
    </main>
  )
}

/** One bank in the list: state icon, title, and — if open — how far along. */
function DatasetRow({
  dataset,
  attempt,
  done,
  selected,
  onPick,
}: {
  dataset: QaDatasetSummary
  attempt?: QaAttempt
  done: boolean
  selected: boolean
  onPick: () => void
}) {
  const t = useTranslations('web.learn')
  const percent =
    attempt && attempt.itemCount > 0
      ? Math.min(
          100,
          Math.round((attempt.answeredCount / attempt.itemCount) * 100),
        )
      : 0
  const state = attempt ? 'open' : done ? 'done' : 'new'

  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-current={selected ? 'true' : undefined}
        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
          selected
            ? 'border-primary bg-primary/10'
            : 'border-border bg-surface hover:border-muted-foreground'
        }`}>
        <Icon
          icon={
            state === 'open'
              ? LUCIDE.clock
              : state === 'done'
                ? LUCIDE.circleCheck
                : LUCIDE.circleDashed
          }
          className={`size-4 shrink-0 ${
            state === 'open'
              ? 'text-primary'
              : state === 'done'
                ? 'text-success'
                : 'text-muted-foreground'
          }`}
        />
        <span className="min-w-0 flex-1 space-y-1">
          <Typography
            variant="title-2"
            as="span"
            className="line-clamp-2 block">
            {dataset.title}
          </Typography>
          {attempt ? (
            <span className="flex items-center gap-2">
              <span
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={attempt.itemCount}
                aria-valuenow={attempt.answeredCount}
                aria-label={t('attempt.progressLabel')}
                className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{width: `${percent}%`}}
                />
              </span>
              <Typography
                as="span"
                variant="body-4"
                className="text-muted-foreground tabular-nums">
                {attempt.answeredCount}/{attempt.itemCount}
              </Typography>
            </span>
          ) : (
            <Typography
              as="span"
              variant="body-4"
              className="block text-muted-foreground">
              {t('browse.itemCount', {count: dataset.itemCount})}
            </Typography>
          )}
        </span>
        <Icon
          icon={LUCIDE.chevronRight}
          className="size-4 shrink-0 text-muted-foreground"
        />
      </button>
    </li>
  )
}

/**
 * What a bank holds, and the one button. Shown beside the list on wider screens
 * and in a dialog on a phone; everything it shows is already in the list row, so
 * a route of its own would only add a round trip and a back button.
 *
 * Starting twice is safe (the backend hands back the attempt already open), so a
 * double click cannot strand the first one.
 */
function DatasetDetail({
  dataset,
  attempt,
  lastDone,
  hideTitle = false,
  onDiscarded,
}: {
  dataset: QaDatasetSummary
  attempt?: QaAttempt
  lastDone?: QaAttempt
  /** The dialog already draws the title in its own header. */
  hideTitle?: boolean
  onDiscarded?: () => void
}) {
  const t = useTranslations('web.learn')
  const df = useDateFormat()
  const router = useRouter()
  const start = useStartQaAttempt()
  const finish = useFinishQaAttempt()
  // Only sizes smaller than the bank are offered — "20" of 12 questions is just "all".
  const sizes = QA_COUNT_OPTIONS.filter((size) => size < dataset.itemCount)
  // `null` = all of them. Ten is a sitting; a bank smaller than that is taken whole.
  const [count, setCount] = useState<number | null>(
    sizes.includes(10) ? 10 : null,
  )
  // An open attempt already has its questions — the picker would be a lie.
  const resuming = attempt !== undefined

  // A run this far along is worth a second look: continue it, or drop it.
  const confirming =
    attempt !== undefined && attempt.answeredCount > CONFIRM_RESUME_AFTER

  const discard = () => {
    if (!attempt) return
    finish.mutate(attempt.id, {onSuccess: onDiscarded})
  }

  const begin = () =>
    start.mutate(
      {
        datasetId: dataset.id,
        count: resuming ? undefined : (count ?? undefined),
      },
      {onSuccess: () => router.push(routes.practiceSet(dataset.id))},
    )

  return (
    <>
      {hideTitle ? null : (
        <Typography variant="h3" as="h2">
          {dataset.title}
        </Typography>
      )}
      {dataset.description ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {dataset.description}
        </Typography>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">
          {t('browse.itemCount', {count: dataset.itemCount})}
        </Badge>
        {dataset.templateKeys.map((value) => (
          <Badge key={value} tone="neutral">
            {t(`shapes.${value}`)}
          </Badge>
        ))}
        {dataset.itemKinds.map((value) => (
          <Badge key={value} tone="neutral">
            {t(`kinds.${value}`)}
          </Badge>
        ))}
        {dataset.difficulties.map((value) => (
          <DifficultyBadge
            key={value}
            level={value}
            label={t(`difficulty.${value}`)}
          />
        ))}
      </div>

      <Typography
        variant="body-4"
        className="flex items-center gap-1.5 text-muted-foreground">
        <Icon
          icon={
            attempt
              ? LUCIDE.clock
              : lastDone
                ? LUCIDE.circleCheck
                : LUCIDE.circleDashed
          }
          className={`size-3.5 shrink-0 ${
            attempt
              ? 'text-primary'
              : lastDone
                ? 'text-success'
                : 'text-muted-foreground'
          }`}
        />
        <span>
          {attempt
            ? `${t('browse.inProgress')} · ${t('browse.answeredOf', {
                answered: attempt.answeredCount,
                total: attempt.itemCount,
              })}`
            : lastDone
              ? t.rich('browse.completedOn', {
                  date: () => (
                    <span className="whitespace-nowrap">
                      {df.date(lastDone.finishedAt ?? lastDone.startedAt)}
                    </span>
                  ),
                })
              : t('browse.notStarted')}
        </span>
      </Typography>

      {!resuming && sizes.length > 0 ? (
        <Select
          label={t('browse.countLabel')}
          value={count === null ? 'all' : String(count)}
          onChange={(event) =>
            setCount(
              event.target.value === 'all' ? null : Number(event.target.value),
            )
          }
          options={[
            ...sizes.map((value) => ({
              value: String(value),
              label: t('browse.countOption', {count: value}),
            })),
            {
              value: 'all',
              label: t('browse.countAll', {count: dataset.itemCount}),
            },
          ]}
        />
      ) : null}

      {start.isError || finish.isError ? (
        <ToastError message={t('dataset.startFailed')} />
      ) : null}

      <div className="space-y-2">
        <Button className="w-full" onClick={begin} loading={start.isPending}>
          {resuming
            ? t('browse.continue')
            : lastDone
              ? t('browse.startAgain')
              : t('dataset.start')}
        </Button>
        {confirming && attempt ? (
          <Button
            className="w-full"
            variant="outline"
            onClick={discard}
            loading={finish.isPending}>
            {t('dataset.discard')}
          </Button>
        ) : null}
        {confirming && attempt ? (
          <Typography variant="body-4" className="text-muted-foreground">
            {t('dataset.confirmResume', {
              answered: attempt.answeredCount,
              total: attempt.itemCount,
            })}
          </Typography>
        ) : resuming ? (
          <Typography variant="body-4" className="text-muted-foreground">
            {t('dataset.resumeHint')}
          </Typography>
        ) : null}
      </div>
    </>
  )
}

/** Every question of the attempt is answered — nothing left to continue. */
function isAnsweredThrough(attempt: QaAttempt) {
  return attempt.itemCount > 0 && attempt.answeredCount >= attempt.itemCount
}
