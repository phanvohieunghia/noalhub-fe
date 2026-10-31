'use client'

import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {useQaQuestionTypes, useUpdateQaQuestionType} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Switch} from '@noalhub/ui/switch'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'
import {QaTypePreview} from './qa-learner-preview'
import {AdminPageTitle} from '../admin-page-title'

/**
 * The question-type catalogue: one row per type, not per question. The name and
 * description come from the backend, where the type's key is stored; a row also
 * says how many questions the type holds, and opening it shows a modal preview of
 * one question of that type — the type itself has no example of its own.
 */
export function QaItemTypesContent() {
  const t = useTranslations('admin.qa')
  const types = useQaQuestionTypes()
  const update = useUpdateQaQuestionType()
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'grid'>('grid')

  return (
    <main className="flex w-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex max-w-160 flex-col gap-1">
          <AdminPageTitle title={t('items.title')} hint={t('items.intro')} />
        </div>
        <div
          role="group"
          aria-label={t('items.viewLabel')}
          className="flex shrink-0 gap-1">
          {(['list', 'grid'] as const).map((mode) => (
            <Button
              key={mode}
              size="icon-md"
              variant={view === mode ? 'primary' : 'ghost'}
              aria-label={t(
                mode === 'list' ? 'items.viewList' : 'items.viewGrid',
              )}
              aria-pressed={view === mode}
              onClick={() => setView(mode)}>
              <Icon
                icon={mode === 'list' ? LUCIDE.layoutList : LUCIDE.layoutGrid}
              />
            </Button>
          ))}
        </div>
      </div>

      {types.isError ? (
        <AdminErrorState error={types.error} onRetry={() => types.refetch()} />
      ) : types.isPending ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <ul
          className={
            view === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
              : 'flex flex-col gap-4'
          }>
          {types.data.map((row) => (
            <li
              key={row.key}
              className="flex h-full items-start gap-3 rounded-lg border border-border bg-surface px-5 pb-5 pt-4 shadow-sm transition-colors focus-within:border-primary hover:border-primary">
              <button
                type="button"
                onClick={() => setPreviewing(row.key)}
                className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-2 text-left outline-none">
                <Typography variant="h6" as="h2">
                  {row.label}
                </Typography>
                {row.description ? (
                  <Typography
                    variant="body-4"
                    className="text-muted-foreground">
                    {row.description}
                  </Typography>
                ) : null}
                <div className="flex gap-2">
                  <Badge>{t('items.countQuestions', {count: row.total})}</Badge>
                  <Badge>
                    {t('items.countPublished', {count: row.published})}
                  </Badge>
                </div>
              </button>
              {/* Outside the button: a switch inside a button is invalid markup and
                  would open the preview on every toggle. On means every question of
                  the type is published; a partly published type reads as off. */}
              {/* The tooltip trigger is a span, not the switch: the trigger stamps its own
                  `data-state` on its child, which on the switch would replace
                  `checked` and drop the track colour. */}
              <Tooltip label={stateLabel(row, t)} side="left">
                <span className="inline-flex">
                  <Switch
                    aria-label={t('items.publishedSwitch')}
                    checked={row.total > 0 && row.published === row.total}
                    disabled={row.total === 0}
                    loading={
                      update.isPending && update.variables?.id === row.id
                    }
                    onCheckedChange={(published) =>
                      update.mutate({id: row.id, input: {published}})
                    }
                  />
                </span>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
      {previewing ? (
        <QaTypePreview type={previewing} onClose={() => setPreviewing(null)} />
      ) : null}
    </main>
  )
}

/** What the switch means right now, shown on hover instead of a permanent label. */
function stateLabel(
  row: {total: number; published: number},
  t: ReturnType<typeof useTranslations<'admin.qa'>>,
): string {
  if (row.total === 0) return t('items.stateEmpty')
  if (row.published === row.total) return t('items.published')
  if (row.published === 0) return t('items.unpublished')
  return t('items.statePartial', {published: row.published, total: row.total})
}
