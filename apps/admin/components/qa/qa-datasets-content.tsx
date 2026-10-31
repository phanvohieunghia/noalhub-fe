'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

import {
  useCreateQaDataset,
  useDeleteQaDataset,
  useQaDatasets,
  type QaDataset,
  type QaDatasetStatus,
} from '@noalhub/api/qa'
import type {Message} from '@noalhub/api/message'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useMessage} from '@noalhub/i18n/use-message'
import {Badge, type BadgeTone} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {Skeleton} from '@noalhub/ui/skeleton'
import {
  TableBody,
  TableCell,
  TableActionsHeaderCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
} from '@noalhub/ui/table'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'
import {ToastError} from '@noalhub/ui/toast'

import {AdminErrorState} from '../admin-error-state'
import {AdminPageTitle} from '../admin-page-title'

const COLUMN_COUNT = 5

/**
 * `status` is the FURTHEST STAGE REACHED, not the current state, and it only
 * moves forward — deleting the last source does not take "outlined" back to
 * "ready". The labels say "has an outline", never "is being outlined", because
 * the column answers "how far did this get", not "what is happening now".
 */
const STATUS_TONES: Record<QaDatasetStatus, BadgeTone> = {
  draft: 'neutral',
  ready: 'info',
  outlined: 'success',
  archived: 'warning',
}

export function QaDatasetsContent() {
  const t = useTranslations('admin.qa')
  const datasets = useQaDatasets()
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<QaDataset | null>(null)

  const rows = datasets.data ?? []

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <AdminPageTitle
            title={t('datasets.title')}
            hint={t('datasets.intro')}
          />
        </div>
        <Button onClick={() => setCreating(true)}>{t('datasets.add')}</Button>
      </div>

      {datasets.isError ? (
        <div className="mt-4">
          <AdminErrorState
            error={datasets.error}
            onRetry={() => datasets.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t('datasets.caption')}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('datasets.columns.title')}</TableHeaderCell>
                <TableHeaderCell>
                  {t('datasets.columns.status')}
                </TableHeaderCell>
                <TableHeaderCell>{t('datasets.columns.chars')}</TableHeaderCell>
                <TableHeaderCell>
                  {t('datasets.columns.updated')}
                </TableHeaderCell>
                <TableActionsHeaderCell label={t('actionsColumn')} />
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t('datasets.empty')}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <DatasetRow
                    key={row.id}
                    row={row}
                    onDelete={() => setDeleting(row)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {creating ? <CreateDialog onClose={() => setCreating(false)} /> : null}
      {deleting ? (
        <DeleteDialog row={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </main>
  )
}

function DatasetRow({row, onDelete}: {row: QaDataset; onDelete: () => void}) {
  const t = useTranslations('admin.qa')
  const df = useDateFormat()
  const router = useRouter()

  return (
    <TableRow onActivate={() => router.push(`/qa/datasets/${row.id}`)}>
      <TableCell weight={500}>
        <Link href={`/qa/datasets/${row.id}`} className="hover:underline">
          {row.title}
        </Link>
        {row.description ? (
          <Typography variant="body-4" as="span" className="block opacity-60">
            {row.description}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        <Badge tone={STATUS_TONES[row.status]}>
          {t(`datasets.status.${row.status}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Tooltip label={t('datasets.chars', {count: row.sourceCharCount})}>
            <Badge icon={LUCIDE.type} className="tabular-nums">
              {row.sourceCharCount.toLocaleString('en-US')}
            </Badge>
          </Tooltip>
          {row.sourceCharWarning ? (
            <Badge tone="warning">{t('datasets.large')}</Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap opacity-70">
        {df.date(row.updatedAt)}
      </TableCell>
      <TableRowActions label={t('actionsColumn')}>
        <DropdownMenuItem icon={ICONS.delete} tone="danger" onSelect={onDelete}>
          {t('datasets.delete')}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  )
}

function CreateDialog({onClose}: {onClose: () => void}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const create = useCreateQaDataset()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<Message | string | null>(null)

  const save = async () => {
    setFormError(null)
    try {
      await create.mutateAsync({
        title,
        description: description === '' ? null : description,
      })
      onClose()
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []))
    }
  }

  return (
    <Dialog open onClose={onClose} title={t('datasets.addTitle')}>
      <div className="space-y-4">
        <Input
          label={t('datasets.fields.title')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label={t('datasets.fields.description')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {formError ? <ToastError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc('actions.cancel')}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={title === ''}
            loading={create.isPending}>
            {tc('actions.save')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function DeleteDialog({row, onClose}: {row: QaDataset; onClose: () => void}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const remove = useDeleteQaDataset()
  const [formError, setFormError] = useState<Message | string | null>(null)

  const confirm = async () => {
    setFormError(null)
    try {
      await remove.mutateAsync(row.id)
      onClose()
    } catch (error) {
      // Once a set has been generated the backend answers 409
      // QA_DATASET_IN_USE; its message is shown as-is.
      setFormError(applyApiError(error, () => undefined, []))
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('datasets.deleteTitle', {title: row.title})}>
      <div className="space-y-4">
        <Typography variant="body-3">{t('datasets.deleteBody')}</Typography>
        {formError ? <ToastError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc('actions.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => void confirm()}
            loading={remove.isPending}>
            {t('datasets.delete')}
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
