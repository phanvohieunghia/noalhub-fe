'use client'

import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {ApiError} from '@noalhub/api/errors'
import {
  QA_FEEDBACK_REASONS,
  submitQaFeedbackSchema,
  useSubmitQaFeedback,
  type QaFeedbackReason,
} from '@noalhub/api/qa'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useMessage} from '@noalhub/i18n/use-message'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {Drawer} from '@noalhub/ui/drawer'
import {LUCIDE} from '@noalhub/ui/icons'
import {Select} from '@noalhub/ui/select'
import {Textarea} from '@noalhub/ui/textarea'
import {toast} from '@noalhub/ui/toast'
import {Typography} from '@noalhub/ui/typography'

import {useTabletUp} from '@noalhub/ui/use-tablet-up'

const NOTE_MAX = 1000
/**
 * The report form, a full-screen drawer from the right on a phone and a modal from tablet up, for the question on screen; an admin reviews what comes in. The
 * caller mounts it only while open and keys it by item id, so a half-written report
 * never carries over to the next question.
 */
export function QuestionFeedbackDialog({
  itemId,
  onClose,
}: {
  itemId: string
  onClose: () => void
}) {
  const t = useTranslations('web.learn.feedback')
  const m = useMessage()
  const [reason, setReason] = useState<QaFeedbackReason>('wrong_answer')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()
  const submit = useSubmitQaFeedback(itemId)

  const close = onClose
  const tabletUp = useTabletUp()

  const send = async () => {
    const parsed = submitQaFeedbackSchema.safeParse({
      reason,
      note: note || undefined,
    })
    if (!parsed.success) {
      setError(m(parsed.error.issues[0]?.message))
      return
    }
    try {
      await submit.mutateAsync(parsed.data)
      toast.success(t('sent'))
      close()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'QA_FEEDBACK_DUPLICATE') {
        toast.info(t('duplicate'))
        close()
        return
      }
      const shown = applyApiError(err, () => undefined, [])
      setError(m(shown))
    }
  }

  const form = (
    <>
      <Typography variant="body-3" className="text-muted-foreground">
        {t('intro')}
      </Typography>
      <Select
        label={t('reasonLabel')}
        value={reason}
        onChange={(event) => setReason(event.target.value as QaFeedbackReason)}
        options={QA_FEEDBACK_REASONS.map((value) => ({
          value,
          label: t(`reasons.${value}`),
        }))}
      />
      <Textarea
        label={t('noteLabel')}
        hint={reason === 'other' ? undefined : t('noteOptional')}
        placeholder={t('notePlaceholder')}
        value={note}
        maxLength={NOTE_MAX}
        showCount
        error={error}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={close}>
          {t('cancel')}
        </Button>
        <Button loading={submit.isPending} onClick={() => void send()}>
          {t('submit')}
        </Button>
      </div>
    </>
  )

  return tabletUp ? (
    <Dialog
      open
      onClose={close}
      title={t('title')}
      icon={LUCIDE.flag}
      blurOverlay>
      {form}
    </Dialog>
  ) : (
    <Drawer open onClose={close} title={t('title')} side="right" fullWidth>
      {form}
    </Drawer>
  )
}
