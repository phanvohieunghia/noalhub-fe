'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

import {
  useArchiveQaSets,
  useDeleteQaSet,
  useDeleteQaSets,
  useQaDatasets,
  useQaSets,
  type QaSet,
  type QaSetStatus,
} from '@noalhub/api/qa'
import type {Message} from '@noalhub/api/message'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useMessage} from '@noalhub/i18n/use-message'
import {Badge, type BadgeTone} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Checkbox} from '@noalhub/ui/checkbox'
import {Dialog} from '@noalhub/ui/dialog'
import {DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {ICONS} from '@noalhub/ui/icons'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {
  TableActionsHeaderCell,
  TableBody,
  TableBulkAction,
  TableBulkBar,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
  TableSortHeaderCell,
} from '@noalhub/ui/table'
import {TablePagination} from '@noalhub/ui/table-pagination'
import {Typography} from '@noalhub/ui/typography'
import {ToastError} from '@noalhub/ui/toast'

import {AdminErrorState} from '../admin-error-state'

const COLUMN_COUNT = 7
const PAGE_SIZES = [10, 25, 50] as const

type SortKey = 'title' | 'dataset' | 'section' | 'status' | 'items'
type SortState = {key: SortKey; dir: 'asc' | 'desc'} | null

const SORT_VALUES: Record<
  SortKey,
  (row: QaSet, datasets: Map<string, string>) => string | number
> = {
  title: (row) => row.title,
  dataset: (row, datasets) => datasets.get(row.datasetId) ?? '',
  section: (row) => row.sectionTitle ?? '',
  status: (row) => row.status,
  items: (row) => row.itemCount,
}

const STATUS_TONES: Record<QaSetStatus, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
}

/**
 * Every set, at every status.
 *
 * The filter defaults to "all" rather than "published", and that is the
 * difference between this surface and the learner's: there, `published` is part
 * of the WHERE clause and not an option at all.
 *
 * A freshly generated set showing as `draft` is correct, not "still
 * processing" — the model never publishes, a person does.
 */
export function QaSetsContent() {
  const t = useTranslations('admin.qa')
  const [status, setStatus] = useState<QaSetStatus | ''>('')
  const sets = useQaSets(status === '' ? {} : {status})
  // A set only carries its dataset's id; the dataset's own title is the label shown.
  const datasetList = useQaDatasets()
  const datasetTitles = new Map(
    (datasetList.data ?? []).map((d) => [d.id, d.title]),
  )
  const [removing, setRemoving] = useState<{
    row: QaSet
    mode: RemoveMode
  } | null>(null)

  const [sort, setSort] = useState<SortState>(null)
  // The list endpoint returns every set and paging is client-side, so sorting the
  // whole list here holds across pages — unlike sorting one page of a server list.
  const rows = (() => {
    const data = sets.data ?? []
    if (!sort) return data
    const value = SORT_VALUES[sort.key]
    const sign = sort.dir === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const x = value(a, datasetTitles)
      const y = value(b, datasetTitles)
      const cmp =
        typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y), undefined, {numeric: true})
      return cmp * sign
    })
  })()
  // asc → desc → off (back to newest first, the server's order).
  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev?.key !== key
        ? {key, dir: 'asc'}
        : prev.dir === 'asc'
          ? {key, dir: 'desc'}
          : null,
    )
    setPage(1)
  }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)
  // Client-side: the list endpoint returns every set. A shrinking list (a delete, a
  // filter) can leave `page` past the end, so it is clamped rather than reset.
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  // Selection only counts rows still listed: a filter change or a refetch drops the rest.
  const selectedIds = rows
    .filter((row) => selected.has(row.id))
    .map((row) => row.id)
  const pageSelected = pageRows.filter((row) => selected.has(row.id)).length
  const allSelected = pageRows.length > 0 && pageSelected === pageRows.length
  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <main className="w-full p-6">
      <div className="max-w-2xl">
        <Typography variant="h4" as="h1">
          {t('sets.title')}
        </Typography>
      </div>

      <div className="mt-4 max-w-xs">
        <Select
          label={t('sets.filterStatus')}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as QaSetStatus | '')
            setPage(1)
          }}
          placeholder={t('sets.allStatuses')}
          options={(['draft', 'published', 'archived'] as const).map(
            (value) => ({
              value,
              label: t(`sets.status.${value}`),
            }),
          )}
        />
      </div>

      {sets.isError ? (
        <div className="mt-4">
          <AdminErrorState error={sets.error} onRetry={() => sets.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot
            caption={t('sets.caption')}
            footer={
              sets.data && rows.length > 0 ? (
                <TablePagination
                  summary={t('sets.footer', {
                    selected: selectedIds.length,
                    total: rows.length,
                  })}
                  page={currentPage}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  pageSizes={PAGE_SIZES}
                  perPageLabel={t('sets.perPageLabel')}
                  formatPageSize={(size) => t('sets.perPage', {count: size})}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              ) : undefined
            }>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-10">
                  <Checkbox
                    size="sm"
                    aria-label={t('sets.selectAll')}
                    checked={
                      allSelected
                        ? true
                        : pageSelected > 0
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={(on) =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        for (const row of pageRows) {
                          if (on === true) next.add(row.id)
                          else next.delete(row.id)
                        }
                        return next
                      })
                    }
                  />
                </TableHeaderCell>
                <TableSortHeaderCell
                  direction={sort?.key === 'title' ? sort.dir : false}
                  onToggle={() => toggleSort('title')}
                  sortHint={t('sets.sortHint', {
                    column: t('sets.columns.title'),
                  })}>
                  {t('sets.columns.title')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={sort?.key === 'dataset' ? sort.dir : false}
                  onToggle={() => toggleSort('dataset')}
                  sortHint={t('sets.sortHint', {
                    column: t('sets.columns.dataset'),
                  })}>
                  {t('sets.columns.dataset')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={sort?.key === 'section' ? sort.dir : false}
                  onToggle={() => toggleSort('section')}
                  sortHint={t('sets.sortHint', {
                    column: t('sets.columns.section'),
                  })}>
                  {t('sets.columns.section')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={sort?.key === 'status' ? sort.dir : false}
                  onToggle={() => toggleSort('status')}
                  sortHint={t('sets.sortHint', {
                    column: t('sets.columns.status'),
                  })}>
                  {t('sets.columns.status')}
                </TableSortHeaderCell>
                <TableSortHeaderCell
                  direction={sort?.key === 'items' ? sort.dir : false}
                  onToggle={() => toggleSort('items')}
                  sortHint={t('sets.sortHint', {
                    column: t('sets.columns.items'),
                  })}>
                  {t('sets.columns.items')}
                </TableSortHeaderCell>
                <TableActionsHeaderCell label={t('actionsColumn')} />
              </TableRow>
            </TableHead>
            <TableBody>
              {sets.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t('sets.empty')}
                </TableEmptyRow>
              ) : (
                pageRows.map((row) => (
                  <SetRow
                    key={row.id}
                    row={row}
                    datasetTitle={datasetTitles.get(row.datasetId)}
                    selected={selected.has(row.id)}
                    onSelect={(on) => toggle(row.id, on)}
                    onRemove={(mode) => setRemoving({row, mode})}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
          {selectedIds.length > 0 ? (
            <TableBulkBar
              className="sticky bottom-4 mx-auto mt-3"
              label={t('sets.selected', {count: selectedIds.length})}
              toolbarLabel={t('sets.bulkActions')}>
              <TableBulkAction
                label={t('sets.deleteSelected')}
                icon={ICONS.delete}
                variant="danger"
                onClick={() => setBulkDeleting(true)}
              />
            </TableBulkBar>
          ) : null}
        </div>
      )}
      {bulkDeleting ? (
        <BulkDeleteDialog
          ids={selectedIds}
          onClose={(done) => {
            setBulkDeleting(false)
            if (done) setSelected(new Set())
          }}
        />
      ) : null}
      {removing ? (
        <RemoveDialog
          row={removing.row}
          mode={removing.mode}
          onClose={() => setRemoving(null)}
        />
      ) : null}
    </main>
  )
}

function SetRow({
  row,
  datasetTitle,
  selected,
  onSelect,
  onRemove,
}: {
  row: QaSet
  /** The title of the dataset the set came from; `undefined` while the datasets load. */
  datasetTitle: string | undefined
  selected: boolean
  onSelect: (on: boolean) => void
  onRemove: (mode: RemoveMode) => void
}) {
  const t = useTranslations('admin.qa')
  const df = useDateFormat()
  const router = useRouter()
  const href = `/qa/sets/${row.id}`

  return (
    <TableRow onActivate={() => router.push(href)}>
      <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
        <Checkbox
          size="sm"
          aria-label={t('sets.selectRow', {title: row.title})}
          checked={selected}
          onCheckedChange={(on) => onSelect(on === true)}
        />
      </TableCell>
      <TableCell weight={500}>
        <Link href={href} className="hover:underline">
          {row.title}
        </Link>
        <Typography
          variant="body-4"
          as="span"
          className="block text-muted-foreground">
          {df.date(row.createdAt)}
        </Typography>
      </TableCell>
      <TableCell
        className="text-muted-foreground"
        onClick={(event) => event.stopPropagation()}>
        {datasetTitle ? (
          <Link
            href={`/qa/datasets/${row.datasetId}`}
            className="hover:underline">
            {datasetTitle}
          </Link>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {row.sectionTitle ?? '—'}
      </TableCell>
      <TableCell>
        <Badge tone={STATUS_TONES[row.status]}>
          {t(`sets.status.${row.status}`)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {t('sets.itemCount', {count: row.itemCount})}
      </TableCell>
      <TableRowActions label={t('actionsColumn')}>
        <DropdownMenuItem
          icon={ICONS.externalLink}
          onSelect={() => router.push(href)}>
          {t('sets.open')}
        </DropdownMenuItem>
        {row.status !== 'archived' ? (
          <DropdownMenuItem
            icon={ICONS.close}
            onSelect={() => onRemove('archive')}>
            {t('sets.remove')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          icon={ICONS.delete}
          tone="danger"
          onSelect={() => onRemove('delete')}>
          {t('sets.deleteForever')}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  )
}

function BulkDeleteDialog({
  ids,
  onClose,
}: {
  ids: string[]
  onClose: (done: boolean) => void
}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const remove = useDeleteQaSets()
  const [failed, setFailed] = useState(0)

  const confirm = async () => {
    const failedIds = await remove.mutateAsync(ids)
    // Stay open on a partial failure so the count is read, not silently lost.
    if (failedIds.length === 0) onClose(true)
    else setFailed(failedIds.length)
  }

  return (
    <Dialog
      open
      onClose={() => onClose(failed > 0 && failed < ids.length)}
      title={t('sets.bulkDeleteTitle', {count: ids.length})}>
      <div className="space-y-4">
        <Typography variant="body-3">{t('sets.deleteBody')}</Typography>
        {failed > 0 ? (
          <ToastError message={t('sets.bulkDeleteFailed', {count: failed})} />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() => void confirm()}>
            {t('sets.deleteForever')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

type RemoveMode = 'archive' | 'delete'

/** `archive` takes the set off the learner surface; `delete` erases it for good. */
function RemoveDialog({
  row,
  mode,
  onClose,
}: {
  row: QaSet
  mode: RemoveMode
  onClose: () => void
}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const archive = useArchiveQaSets()
  const remove = useDeleteQaSet()
  const [formError, setFormError] = useState<Message | string | null>(null)

  const confirm = async () => {
    setFormError(null)
    try {
      if (mode === 'delete') {
        await remove.mutateAsync(row.id)
      } else {
        const failedIds = await archive.mutateAsync([
          {id: row.id, version: row.version},
        ])
        if (failedIds.length > 0) {
          setFormError(t('sets.removeFailed'))
          return
        }
      }
      onClose()
    } catch (error) {
      // 409 QA_SET_IN_USE once learners have attempted the set; shown as-is.
      setFormError(applyApiError(error, () => undefined, []))
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t(mode === 'delete' ? 'sets.deleteTitle' : 'sets.removeTitle', {
        title: row.title,
      })}>
      <div className="space-y-4">
        <Typography variant="body-3">
          {t(mode === 'delete' ? 'sets.deleteBody' : 'sets.removeBody')}
        </Typography>
        {formError ? <ToastError message={m(formError)} /> : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc('actions.cancel')}
          </Button>
          <Button
            variant="danger"
            loading={archive.isPending || remove.isPending}
            onClick={() => void confirm()}>
            {t(mode === 'delete' ? 'sets.deleteForever' : 'sets.remove')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          {Array.from({length: COLUMN_COUNT}).map((_, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
