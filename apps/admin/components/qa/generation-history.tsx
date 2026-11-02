'use client'

import Link from 'next/link'
import {useFormatter, useTranslations} from 'next-intl'
import {useState} from 'react'

import {
  isGenerationRunning,
  useQaGenerationHistory,
  useRetryQaChunks,
  useRetryQaGeneration,
  type QaChunkSummary,
  type QaGenerationListItem,
} from '@noalhub/api/qa'
import {Badge, type BadgeTone} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Skeleton} from '@noalhub/ui/skeleton'
import {toast} from '@noalhub/ui/toast'
import {Typography} from '@noalhub/ui/typography'

import {useAiRunChoice} from './ai-run-picker'

const STATUS_TONE: Record<QaGenerationListItem['status'], BadgeTone> = {
  queued: 'info',
  running: 'info',
  succeeded: 'success',
  partial: 'warning',
  failed: 'danger',
}

const CHUNK_STATUS_TONE: Record<QaChunkSummary['status'], BadgeTone> = {
  pending: 'neutral',
  running: 'info',
  succeeded: 'success',
  failed: 'danger',
}

/** Only a question-set run that did not fully work can be re-run from here. */
function isRetryableRun(run: QaGenerationListItem): boolean {
  return (
    run.kind === 'qa' && (run.status === 'partial' || run.status === 'failed')
  )
}

/**
 * The run-level retry (a **new** run) is the fallback for what chunk retry cannot reach:
 * runs from before chunks were recorded, and sections the model silently dropped from a
 * chunk that itself succeeded. It is never offered for a chunk that failed — those go
 * through chunk retry, which counts tries; a second door would walk around the cap.
 */
function allowsRunRetry(run: QaGenerationListItem): boolean {
  if (!isRetryableRun(run)) return false
  if (run.chunks.length === 0) return true
  const anyFailed = run.chunks.some((chunk) => chunk.status === 'failed')
  return !anyFailed && Object.keys(run.sectionErrors ?? {}).length > 0
}

/**
 * One run, with what it left behind: which sections worked, which did not and why, and
 * the sets it already produced.
 *
 * Shown for `partial` as **both** halves on purpose. A run that lost three chapters
 * out of ten reads as total failure if only the error is drawn, and as success if
 * only the count is — the person then either retries all ten (paying again) or never
 * notices three are missing.
 */
export function GenerationRunCard({
  run,
  onRetried,
}: {
  run: QaGenerationListItem
  /** Hands over the id of the new run so the caller can follow it. */
  onRetried?: (generationId: string) => void
}) {
  const t = useTranslations('admin.qa')
  const format = useFormatter()
  const retry = useRetryQaGeneration()

  const sent = run.sectionAnchors ?? []
  const lost = Object.entries(run.sectionErrors ?? {})
  const ok = Math.max(sent.length - lost.length, 0)
  const titleOf = (anchor: string) => run.sectionTitles[anchor] ?? anchor

  // A `failed` run has no `sectionErrors`: the backend re-runs every section it sent.
  const redo = run.status === 'partial' ? lost.length : sent.length

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" tone={STATUS_TONE[run.status]}>
          {t(`generation.history.status.${run.status}`)}
        </Badge>
        <Typography variant="body-3">
          {t(`generation.history.kind.${run.kind}`)}
        </Typography>
        <Typography variant="body-4" className="text-muted-foreground">
          {format.dateTime(new Date(run.createdAt), {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
          {' · '}
          {run.model}
        </Typography>
      </div>

      {run.kind === 'qa' &&
      sent.length > 0 &&
      !isGenerationRunning(run.status) ? (
        <Typography variant="body-3">
          {run.status === 'failed'
            ? t('generation.history.sectionsNone', {total: sent.length})
            : t('generation.history.sectionsOk', {ok, total: sent.length})}
        </Typography>
      ) : null}

      {run.status === 'failed' && run.error ? (
        <Typography variant="body-4" className="text-danger">
          {run.error}
        </Typography>
      ) : null}

      {lost.length > 0 ? (
        <div className="space-y-1">
          <Typography variant="body-4" className="text-muted-foreground">
            {t('generation.history.sectionsMissing', {count: lost.length})}
          </Typography>
          <ul className="list-disc space-y-0.5 pl-5">
            {lost.map(([anchor, reason]) => (
              <li key={anchor}>
                <Typography variant="body-4">
                  <span className="font-medium">{titleOf(anchor)}</span>
                  {': '}
                  {reason}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {run.chunks.length > 0 && showChunks(run) ? (
        <ChunkList run={run} />
      ) : null}

      {run.kind === 'qa' && !isGenerationRunning(run.status) ? (
        <div className="space-y-1">
          <Typography variant="body-4" className="text-muted-foreground">
            {run.sets.length > 0
              ? t('generation.history.setsMade', {count: run.sets.length})
              : t('generation.history.noSets')}
          </Typography>
          {run.sets.length > 0 ? (
            <ul className="space-y-0.5">
              {run.sets.map((set) => (
                <li key={set.id}>
                  <Link
                    href={`/qa/sets/${set.id}`}
                    className="text-body-4 underline underline-offset-2">
                    {set.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {run.chunks.some((chunk) => chunk.canRetry) ? (
        <ChunkRetryControls run={run} onRetried={onRetried} />
      ) : null}

      {allowsRunRetry(run) && redo > 0 ? (
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            loading={retry.isPending}
            onClick={() =>
              retry.mutate(run.id, {
                onSuccess: (result) => onRetried?.(result.generationId),
                onError: () => toast.error(t('generation.retryFailed')),
              })
            }>
            {run.status === 'partial'
              ? t('generation.history.retryMissing', {count: redo})
              : t('generation.history.retryAll', {count: redo})}
          </Button>
          {/* Retrying is billed like a new run — said next to the button, not after. */}
          <Typography variant="body-4" className="text-muted-foreground">
            {t('generation.history.retryCost')}
          </Typography>
        </div>
      ) : null}
    </div>
  )
}

/** The chunk list is noise on a run that went fine at the first try. */
function showChunks(run: QaGenerationListItem): boolean {
  return run.chunks.some(
    (chunk) => chunk.status === 'failed' || chunk.attempts.length > 1,
  )
}

/**
 * Every chunk of the run with **all its tries nested**: chunk 7, try 1 failed, try 2
 * worked. A retry that fixed the chunk must read as fixed here — the run row itself only
 * knows the latest outcome, so this is where "what did it cost to get here" lives.
 */
function ChunkList({run}: {run: QaGenerationListItem}) {
  const t = useTranslations('admin.qa')
  const titleOf = (anchor: string) => run.sectionTitles[anchor] ?? anchor

  return (
    <ul className="space-y-1.5">
      {run.chunks.map((chunk) => (
        <li
          key={chunk.position}
          className="space-y-1 rounded-md bg-muted/50 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" tone={CHUNK_STATUS_TONE[chunk.status]}>
              {t(`generation.history.chunkStatus.${chunk.status}`)}
            </Badge>
            <Typography variant="body-4" className="font-medium">
              {t('generation.history.chunkTitle', {
                position: chunk.position,
              })}
            </Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              {chunk.anchors.map(titleOf).join(' · ')}
            </Typography>
          </div>
          <ul className="space-y-0.5 pl-3">
            {chunk.attempts.map((attempt) => {
              const from = chunk.attempts.find(
                (row) => row.id === attempt.retryOfChunkId,
              )
              return (
                <li key={attempt.id}>
                  <Typography variant="body-4">
                    <span className="font-medium">
                      {t('generation.history.attemptTitle', {
                        attempt: attempt.attempt,
                      })}
                    </span>
                    {from
                      ? ` (${t('generation.history.attemptRetryOf', {
                          from: from.attempt,
                        })})`
                      : ''}
                    {' — '}
                    {t(`generation.history.chunkStatus.${attempt.status}`)}
                    {attempt.keyError
                      ? ` · ${t('generation.history.attemptKeyError')}`
                      : ''}
                    {attempt.error ? `: ${attempt.error}` : ''}
                  </Typography>
                </li>
              )
            })}
          </ul>
          {chunk.status === 'failed' && chunk.retriesLeft === 0 ? (
            <Typography variant="body-4" className="text-danger">
              {t('generation.history.noRetriesLeft')}
            </Typography>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

/**
 * Re-run the failed chunks inside the same run.
 *
 * The key can only be changed when **every** chunk being re-run failed because of its
 * key — the backend refuses a mixed selection, so offering the picker for one would only
 * move the error to after the click. A healthy key is never swapped: a chunk that failed
 * on its content gains nothing from another model, and the run would end up with chunks
 * from two.
 */
function ChunkRetryControls({
  run,
  onRetried,
}: {
  run: QaGenerationListItem
  onRetried?: (generationId: string) => void
}) {
  const t = useTranslations('admin.qa')
  const retry = useRetryQaChunks()
  const choice = useAiRunChoice()
  const [changeKey, setChangeKey] = useState(false)

  const retryable = run.chunks.filter((chunk) => chunk.canRetry)
  const mayChangeKey = retryable.every((chunk) => chunk.keyChangeAllowed)
  const sendingKey = mayChangeKey && changeKey
  // Picking "change key" without a usable one would send a call that cannot work.
  const blocked = sendingKey && !choice.ready

  return (
    <div className="space-y-2">
      {mayChangeKey ? (
        <div className="space-y-2">
          <Typography variant="body-4" className="text-muted-foreground">
            {t('generation.history.keyHint')}
          </Typography>
          {sendingKey ? choice.fields : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChangeKey((value) => !value)}>
            {sendingKey
              ? t('generation.history.keepKey')
              : t('generation.history.changeKey')}
          </Button>
        </div>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        loading={retry.isPending}
        disabled={blocked}
        onClick={() =>
          retry.mutate(
            {
              id: run.id,
              positions: retryable.map((chunk) => chunk.position),
              ...(sendingKey && choice.credential
                ? {credentialId: choice.credential.id}
                : {}),
            },
            {
              onSuccess: (result) => onRetried?.(result.generationId),
              onError: () => toast.error(t('generation.retryFailed')),
            },
          )
        }>
        {t('generation.history.retryChunks', {count: retryable.length})}
      </Button>
      <Typography variant="body-4" className="text-muted-foreground">
        {t('generation.history.retryChunksCost', {
          left: Math.min(...retryable.map((chunk) => chunk.retriesLeft)),
        })}
      </Typography>
    </div>
  )
}

/**
 * Every run of a dataset, read from the database — so a `partial`/`failed` run is
 * still here after a reload, and its retry button with it.
 *
 * Starts on the runs that need attention. A history that opens as a wall of successful
 * runs hides the one failed row the person came looking for.
 */
export function GenerationHistory({
  datasetId,
  onRetried,
}: {
  datasetId: string
  onRetried?: (generationId: string) => void
}) {
  const t = useTranslations('admin.qa')
  const history = useQaGenerationHistory(datasetId)
  const [showAll, setShowAll] = useState(false)

  if (history.isPending) return <Skeleton className="h-16 w-full" />
  if (history.isError || !history.data) return null

  const runs = history.data
  const needsAttention = runs.filter(
    (run) => run.status === 'partial' || run.status === 'failed',
  )
  // Nothing ever ran: the page's empty state already says so.
  if (runs.length === 0) return null

  const visible = showAll ? runs : needsAttention

  return (
    <section className="space-y-2 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Typography variant="title-3" as="h2">
            {t('generation.history.title')}
          </Typography>
          {needsAttention.length > 0 ? (
            <Badge size="sm" tone="warning">
              {t('generation.history.needsAttention', {
                count: needsAttention.length,
              })}
            </Badge>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll((value) => !value)}>
          {showAll
            ? t('generation.history.onlyProblems')
            : t('generation.history.showAll', {count: runs.length})}
        </Button>
      </div>

      {visible.length === 0 ? (
        <Typography variant="body-4" className="text-muted-foreground">
          {t('generation.history.allGood')}
        </Typography>
      ) : (
        <div className="space-y-2">
          {visible.map((run) => (
            <GenerationRunCard key={run.id} run={run} onRetried={onRetried} />
          ))}
        </div>
      )}
    </section>
  )
}
