'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {
  qaKeys,
  useQaDatasets,
  useQaFeedbacks,
  useReviewQaFeedback,
  type QaFeedback,
  type QaFeedbackStatus,
} from '@noalhub/api/qa'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useMessage} from '@noalhub/i18n/use-message'
import {Badge, type BadgeTone} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {LUCIDE} from '@noalhub/ui/icons'
import {Pagination} from '@noalhub/ui/pagination'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableActionsHeaderCell,
  TableRow,
  TableRowActions,
} from '@noalhub/ui/table'
import {Textarea} from '@noalhub/ui/textarea'
import {toast} from '@noalhub/ui/toast'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'
import {QaItemEditDialog} from './qa-item-edit-dialog'
import {docPlainText} from './qa-plain-doc'
import {AdminPageTitle} from '../admin-page-title'

const PAGE_SIZE = 20
const COLUMN_COUNT = 6

const STATUS_TONES: Record<QaFeedbackStatus, BadgeTone> = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'neutral',
}

/** Learners' reports about questions, waiting for an admin to look. */
export function QaFeedbacksContent() {
  const t = useTranslations('admin.qa.feedbacks')
  const tq = useTranslations('admin.qa')
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<QaFeedbackStatus | ''>('pending')
  const [datasetId, setDatasetId] = useState('')
  const [page, setPage] = useState(1)
  const datasets = useQaDatasets()
  const [editing, setEditing] = useState<QaFeedback | null>(null)
  const [reviewing, setReviewing] = useState<{
    feedback: QaFeedback
    next: QaFeedbackStatus
  } | null>(null)
  const feedbacks = useQaFeedbacks({
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
    datasetId: datasetId || undefined,
  })

  return (
    <main className="w-full p-6">
      <AdminPageTitle title={t('title')} hint={t('intro')} />

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Select
          label={t('dataset')}
          placeholder={t('allDatasets')}
          value={datasetId}
          onChange={(event) => {
            setDatasetId(event.target.value)
            setPage(1)
          }}
          options={(datasets.data ?? []).map((dataset) => ({
            value: dataset.id,
            label: dataset.title,
          }))}
        />
        <Select
          label={t('status')}
          hideLabel
          placeholder={t('allStatuses')}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as QaFeedbackStatus | '')
            setPage(1)
          }}
          options={(['pending', 'resolved', 'dismissed'] as const).map(
            (value) => ({value, label: t(`statuses.${value}`)}),
          )}
        />
      </div>

      {feedbacks.isError ? (
        <div className="mt-4">
          <AdminErrorState
            error={feedbacks.error}
            onRetry={() => feedbacks.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t('caption')}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('columns.question')}</TableHeaderCell>
                <TableHeaderCell>{t('columns.report')}</TableHeaderCell>
                <TableHeaderCell>{t('columns.reporter')}</TableHeaderCell>
                <TableHeaderCell>{t('columns.date')}</TableHeaderCell>
                <TableHeaderCell>{t('columns.status')}</TableHeaderCell>
                <TableActionsHeaderCell label={t('columns.actions')} />
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbacks.isPending ? (
                <SkeletonRows />
              ) : feedbacks.data.items.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t('empty')}
                </TableEmptyRow>
              ) : (
                feedbacks.data.items.map((feedback) => (
                  <FeedbackRow
                    key={feedback.id}
                    feedback={feedback}
                    onEdit={() => setEditing(feedback)}
                    onReview={(next) => setReviewing({feedback, next})}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
          {feedbacks.data ? (
            <Pagination
              page={feedbacks.data.page}
              limit={feedbacks.data.limit}
              total={feedbacks.data.total}
              onPageChange={setPage}
              isLoading={feedbacks.isFetching}
            />
          ) : null}
        </div>
      )}

      {editing?.item ? (
        <QaItemEditDialog
          key={editing.item.id}
          item={editing.item}
          shapeLabel={
            editing.questionType
              ? tq(
                  `templates.shapes.${editing.questionType}` as 'templates.shapes.multiple_choice',
                )
              : ''
          }
          sectionTitle={editing.sectionTitle ?? ''}
          onClose={() => {
            setEditing(null)
            void queryClient.invalidateQueries({queryKey: qaKeys.feedbacks()})
          }}
        />
      ) : null}

      {reviewing ? (
        <ReviewDialog
          key={reviewing.feedback.id}
          feedback={reviewing.feedback}
          next={reviewing.next}
          onClose={() => setReviewing(null)}
        />
      ) : null}
    </main>
  )
}

function FeedbackRow({
  feedback,
  onEdit,
  onReview,
}: {
  feedback: QaFeedback
  onEdit: () => void
  onReview: (next: QaFeedbackStatus) => void
}) {
  const t = useTranslations('admin.qa.feedbacks')
  const df = useDateFormat()

  return (
    <TableRow>
      <TableCell className="max-w-md">
        <Typography variant="body-4" className="text-muted-foreground">
          {[feedback.datasetTitle, feedback.sectionTitle]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        <Typography variant="body-3" className="line-clamp-3">
          {docPlainText(feedback.item?.question ?? null) ||
            t('deletedQuestion')}
        </Typography>
      </TableCell>
      <TableCell className="max-w-xs">
        <Badge tone="info" size="sm">
          {t(`reasons.${feedback.reason}`)}
        </Badge>
        {feedback.note ? (
          <Typography variant="body-3" className="mt-1 whitespace-pre-wrap">
            {feedback.note}
          </Typography>
        ) : null}
        {feedback.adminNote ? (
          <Typography
            variant="body-4"
            className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {t('adminNote', {note: feedback.adminNote})}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        {feedback.reporter
          ? (feedback.reporter.displayName ?? feedback.reporter.email)
          : t('deletedUser')}
      </TableCell>
      <TableCell>{df.date(feedback.createdAt)}</TableCell>
      <TableCell>
        <Badge tone={STATUS_TONES[feedback.status]} size="sm">
          {t(`statuses.${feedback.status}`)}
        </Badge>
      </TableCell>
      <TableRowActions label={t('columns.actions')}>
        {feedback.item ? (
          <DropdownMenuItem icon={LUCIDE.squarePen} onSelect={onEdit}>
            {t('edit')}
          </DropdownMenuItem>
        ) : null}
        {feedback.status === 'pending' ? (
          <>
            <DropdownMenuItem
              icon={LUCIDE.circleCheck}
              onSelect={() => onReview('resolved')}>
              {t('resolve')}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={LUCIDE.ban}
              onSelect={() => onReview('dismissed')}>
              {t('dismiss')}
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            icon={LUCIDE.rotateCcw}
            onSelect={() => onReview('pending')}>
            {t('reopen')}
          </DropdownMenuItem>
        )}
      </TableRowActions>
    </TableRow>
  )
}

function ReviewDialog({
  feedback,
  next,
  onClose,
}: {
  feedback: QaFeedback
  next: QaFeedbackStatus
  onClose: () => void
}) {
  const t = useTranslations('admin.qa.feedbacks')
  const m = useMessage()
  const review = useReviewQaFeedback()
  const [adminNote, setAdminNote] = useState(feedback.adminNote ?? '')
  const [error, setError] = useState<string | undefined>()

  const confirm = async () => {
    try {
      await review.mutateAsync({
        id: feedback.id,
        status: next,
        adminNote: adminNote || undefined,
      })
      toast.success(t('saved'))
      onClose()
    } catch (err) {
      setError(m(applyApiError(err, () => undefined, [])))
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t(`dialog.${next}`)}
      icon={LUCIDE.flag}>
      <Textarea
        label={t('adminNoteLabel')}
        hint={t('adminNoteHint')}
        value={adminNote}
        maxLength={1000}
        showCount
        error={error}
        onChange={(event) => setAdminNote(event.target.value)}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button loading={review.isPending} onClick={() => void confirm()}>
          {t('confirm')}
        </Button>
      </div>
    </Dialog>
  )
}

function SkeletonRows() {
  return Array.from({length: 4}, (_, i) => (
    <TableRow key={i}>
      {Array.from({length: COLUMN_COUNT}, (_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ))
}
