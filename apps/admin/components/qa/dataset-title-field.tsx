'use client'

import {useTranslations} from 'next-intl'

import {useQaDatasets, useUpdateQaDataset} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {LUCIDE} from '@noalhub/ui/icons'
import {InlineTextField} from '@noalhub/ui/inline-text-field'
import {Skeleton} from '@noalhub/ui/skeleton'
import {toast} from '@noalhub/ui/toast'
import {Tooltip} from '@noalhub/ui/tooltip'

/**
 * A dataset's title, editable in place, with its source size beside it. Lives in
 * the breadcrumb (it replaces the "Details" crumb on the dataset page), so it is
 * sized to read as one.
 */
export function DatasetTitleField({datasetId}: {datasetId: string}) {
  const t = useTranslations('admin.qa')
  const datasets = useQaDatasets()
  const update = useUpdateQaDataset(datasetId)
  const dataset = datasets.data?.find((row) => row.id === datasetId)

  if (!dataset) return <Skeleton className="h-5 w-40" />

  return (
    <span className="flex items-center gap-3">
      <InlineTextField
        value={dataset.title}
        placeholder={t('datasets.fields.title')}
        label={t('datasets.fields.title')}
        className="-ml-2 text-body-3! font-medium"
        onSubmit={async (title) => {
          // The title is required: an empty one just snaps back.
          if (title === '') throw new Error('empty title')
          try {
            await update.mutateAsync({title})
          } catch (error) {
            toast.error(t('datasets.saveFailed'))
            throw error
          }
        }}
      />
      <Tooltip label={t('ws.characters', {count: dataset.sourceCharCount})}>
        <Badge icon={LUCIDE.type} className="tabular-nums">
          {dataset.sourceCharCount.toLocaleString('en-US')}
        </Badge>
      </Tooltip>
    </span>
  )
}
