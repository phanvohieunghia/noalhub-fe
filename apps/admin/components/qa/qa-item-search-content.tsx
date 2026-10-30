'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useState} from 'react'

import {
  useQaItemSearch,
  useQaQuestionTypes,
  useSetQaItemPublished,
  type QaItemFull,
  type QaItemSearchRow,
} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Pagination} from '@noalhub/ui/pagination'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Switch} from '@noalhub/ui/switch'
import {ToastError} from '@noalhub/ui/toast'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'
import {PostContentPreview} from './post-content-preview'
import {QaLearnerPreview} from './qa-learner-preview'

/** Shapes the backend registry knows — `qa-templates.ts`, keyed by template. */
const SHAPES = [
  'multiple_choice',
  'single_choice',
  'true_false',
  'short_answer',
  'fill_blank',
  'flashcard',
] as const

const PAGE_SIZE = 20

/**
 * The questions of one type: every question across every set, newest first, each with
 * its published switch and a preview of what a learner sees.
 */
export function QaItemSearchContent({type}: {type: string}) {
  const t = useTranslations('admin.qa')
  const [page, setPage] = useState(1)
  const [previewing, setPreviewing] = useState<QaItemSearchRow | null>(null)
  const setPublished = useSetQaItemPublished()
  const types = useQaQuestionTypes()
  const heading =
    types.data?.find((row) => row.key === type)?.label ?? shapeLabel(type, t)

  const search = useQaItemSearch({
    type,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })
  const total = search.data?.total ?? 0

  return (
    <main className="flex w-full flex-col gap-4 p-6">
      <div className="flex max-w-160 flex-col gap-1">
        <Link
          href="/qa/items"
          className="w-fit text-body-4 text-muted-foreground hover:text-foreground">
          ← {t('items.title')}
        </Link>
        <Typography variant="h4" as="h1">
          {heading}
        </Typography>
      </div>

      {search.isError ? (
        <AdminErrorState
          error={search.error}
          onRetry={() => search.refetch()}
        />
      ) : search.isPending ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-32 w-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t('items.noResults')}
        </Typography>
      ) : (
        <>
          <Typography variant="body-4" className="text-muted-foreground">
            {t('items.found', {count: total})}
          </Typography>
          <ul className="flex flex-col gap-4">
            {search.data.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-5 pb-5 pt-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Badge>{shapeLabel(item.type, t)}</Badge>
                  <Badge>{t(`items.kinds.${item.kind}`)}</Badge>
                  {item.difficulty ? (
                    <Badge>{t(`items.difficulty.${item.difficulty}`)}</Badge>
                  ) : null}
                  <div className="flex-1" />
                  <Switch
                    label={t('items.publishedSwitch')}
                    checked={item.published}
                    loading={
                      setPublished.isPending &&
                      setPublished.variables?.id === item.id
                    }
                    onCheckedChange={(published) =>
                      setPublished.mutate({id: item.id, published})
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewing(item)}>
                    {t('items.previewUi')}
                  </Button>
                </div>
                <div className="text-body-2">
                  <PostContentPreview doc={item.question} />
                </div>
                <Typography variant="body-4" className="text-muted-foreground">
                  {answerSummary(item, t)}
                </Typography>
              </li>
            ))}
          </ul>
          {setPublished.isError ? (
            <ToastError message={t('items.publishFailed')} />
          ) : null}
          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            isLoading={search.isFetching}
          />
        </>
      )}
      {previewing ? (
        <QaLearnerPreview
          item={previewing}
          onClose={() => setPreviewing(null)}
        />
      ) : null}
    </main>
  )
}

function shapeLabel(
  type: string,
  t: ReturnType<typeof useTranslations<'admin.qa'>>,
): string {
  return (SHAPES as readonly string[]).includes(type)
    ? t(`templates.shapes.${type as (typeof SHAPES)[number]}`)
    : type
}

/**
 * One line under the question saying what a correct answer looks like — enough
 * to scan a list without opening each question. A choice question lists how many
 * options it has and which are right; a short answer lists what is accepted.
 */
function answerSummary(
  item: QaItemFull,
  t: ReturnType<typeof useTranslations<'admin.qa'>>,
): string {
  const key = item.answerKey
  if (item.options && key && 'optionIds' in key) {
    const correct = item.options
      .filter((option) => key.optionIds.includes(option.id))
      .map((option) => option.text)
      .join(' · ')
    return t('items.summaryChoice', {count: item.options.length, correct})
  }
  if (key && 'accepted' in key) {
    return t('items.summaryAccepted', {answers: key.accepted.join(' · ')})
  }
  return ''
}
