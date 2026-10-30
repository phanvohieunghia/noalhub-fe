'use client'

import {useTranslations} from 'next-intl'

import {useUpdateQaOutlineLabel} from '@noalhub/api/qa'
import {InlineTextField} from '@noalhub/ui/inline-text-field'
import {toast} from '@noalhub/ui/toast'

/**
 * The name of an outline version, edited in place. It stands in for the static
 * step heading on both the outline and the question-set steps — they work on the
 * same version, so renaming it from either one is the same write.
 */
export function OutlineLabelField({
  datasetId,
  outlineId,
  label,
}: {
  datasetId: string
  outlineId: string
  label: string | null
}) {
  const t = useTranslations('admin.qa')
  const update = useUpdateQaOutlineLabel(outlineId, datasetId)

  return (
    <InlineTextField
      value={label ?? ''}
      placeholder={t('sources.untitled')}
      label={t('outlines.label')}
      onSubmit={async (next) => {
        try {
          // An empty label goes back to `null`, i.e. "Untitled".
          await update.mutateAsync(next === '' ? null : next)
        } catch (error) {
          toast.error(t('ws.outline.saveFailed'))
          throw error
        }
      }}
    />
  )
}
