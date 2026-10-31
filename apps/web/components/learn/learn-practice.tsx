'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'

import {useBrowseQaItems, useQaAttempts} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {QaQuestion} from '@noalhub/ui/blog/qa-question'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Typography} from '@noalhub/ui/typography'

import {InfoTip} from './info-tip'

/**
 * The questions you are currently getting wrong, across every set and every
 * shape.
 *
 * "Currently" is exact: the backend takes your **latest** answer per question
 * and keeps the ones that were wrong. Answer it right later and it leaves this
 * list on its own.
 */
export function LearnPractice() {
  const t = useTranslations('web.learn')
  const wrong = useBrowseQaItems({wrongOnly: true})
  const attempts = useQaAttempts()

  const rows = wrong.data?.items ?? []
  // Two empty states that look the same and mean opposite things: nothing
  // answered yet, versus answered plenty and got them all right.
  const neverAnswered = (attempts.data?.length ?? 0) === 0

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          shape="circle"
          asChild
          className="-ml-2 shrink-0">
          <Link href="/learn" aria-label={t('attempt.backToBrowse')}>
            <Icon icon={LUCIDE.arrowLeft} />
          </Link>
        </Button>
        <Typography variant="h4" as="h1" className="min-w-0 flex-1 break-words">
          {t('practice.title')}
        </Typography>
        <InfoTip text={t('practice.intro')} />
      </div>

      <div className="mt-6 space-y-3">
        {wrong.isPending || attempts.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {neverAnswered
              ? t('practice.emptyNew')
              : t('practice.emptyAllRight')}
          </Typography>
        ) : (
          rows.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-border p-4">
              <Badge tone="neutral">{t(`kinds.${item.kind}`)}</Badge>
              <div className="mt-2">
                <QaQuestion doc={item.question} tagIds={item.tagIds} />
              </div>
              {/* No answer here: this list is questions to retry, and showing
                  the key would defeat the point of retrying. */}
            </article>
          ))
        )}
      </div>
    </main>
  )
}
