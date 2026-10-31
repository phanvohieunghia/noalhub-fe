'use client'

import {DifficultyBadge} from '@noalhub/ui/difficulty'
import {useTranslations} from 'next-intl'
import {useRef} from 'react'

import type {QaItemFull} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {HoverFlyout} from '@noalhub/ui/hover-flyout'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'

import {PostContentPreview} from './post-content-preview'
import {docToText} from './qa-plain-doc'
import {Typography} from '@noalhub/ui/typography'

/** How much of a question is drawn: everything, one line, or a short tile for a grid. */
export type QaCardDensity = 'full' | 'compact' | 'grid'

/**
 * One question of a set, read-only: kind and difficulty on top, the numbered
 * question, then every option as a row with its letter. The correct one is the
 * row with a success border and a "Correct answer" tag.
 *
 * The card only draws. What the buttons do — move, remove, edit — is decided by
 * the page, which passes the handlers in; a button without a handler is not
 * drawn, so the same card can be shown locked once the set has left draft.
 *
 * The correct answers are found by matching ids against `answerKey`, never by
 * looking for a `correct` flag — `options` does not carry one, on purpose: one
 * truth, one place to write it.
 */
export function QaQuestionCard({
  item,
  index,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEdit,
  removing = false,
  density = 'full',
  dragHandle,
}: {
  item: QaItemFull
  /** Zero-based position in the set; shown one-based in front of the question. */
  index: number
  /** The last question cannot move down. */
  isLast?: boolean
  /** Each button is drawn only when its handler is given; omit them all to lock the card. */
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
  onEdit?: () => void
  removing?: boolean
  density?: QaCardDensity
  /** The grip that starts a drag; the page owns the drag logic, the card only places it. */
  dragHandle?: React.ReactNode
}) {
  const t = useTranslations('admin.qa')

  const correctIds =
    item.answerKey && 'optionIds' in item.answerKey
      ? item.answerKey.optionIds
      : []
  const accepted =
    item.answerKey && 'accepted' in item.answerKey
      ? item.answerKey.accepted
      : []

  const actions = (
    <>
      {onMoveUp ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('sets.moveUp')}
          disabled={index === 0}
          onClick={onMoveUp}>
          ↑
        </Button>
      ) : null}
      {onMoveDown ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('sets.moveDown')}
          disabled={isLast}
          onClick={onMoveDown}>
          ↓
        </Button>
      ) : null}
      {onRemove ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={removing}
          onClick={onRemove}>
          {t('sets.removeItem')}
        </Button>
      ) : null}
      {onEdit ? (
        <Button
          variant="outline"
          size="icon-md"
          aria-label={t('sets.editItem')}
          onClick={onEdit}>
          <Icon icon={ICONS.edit} />
        </Button>
      ) : null}
    </>
  )

  if (density !== 'full') {
    const text = docToText(item.question)
    const body =
      text !== null ? (
        <ClampedHover text={text}>
          <Typography
            variant="body-3"
            as="span"
            className={
              density === 'grid' ? 'line-clamp-2 text-body-4!' : 'line-clamp-1'
            }>
            <TextWithImages text={text} />
          </Typography>
        </ClampedHover>
      ) : (
        <div
          className={
            density === 'grid'
              ? 'max-h-10 overflow-hidden'
              : 'max-h-6 overflow-hidden'
          }>
          <PostContentPreview doc={item.question} tagIds={item.tagIds} />
        </div>
      )
    const number = (
      <Typography
        variant="body-3"
        as="span"
        weight={600}
        className="shrink-0 tabular-nums">
        {index + 1}.
      </Typography>
    )

    if (density === 'compact') {
      return (
        <article className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
          {dragHandle}
          {number}
          <Badge size="sm" className="shrink-0">
            {t(`items.kinds.${item.kind}`)}
          </Badge>
          <div className="min-w-0 flex-1">{body}</div>
          {actions}
        </article>
      )
    }

    return (
      <article className="flex h-full flex-col gap-1 rounded-md border border-border bg-surface p-2">
        <div className="flex items-center gap-1">
          {dragHandle}
          {number}
          <Badge size="sm">{t(`items.kinds.${item.kind}`)}</Badge>
          <div className="flex-1" />
          {actions}
        </div>
        <div className="min-w-0 flex-1">{body}</div>
      </article>
    )
  }

  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        {dragHandle}
        <Badge size="sm">{t(`items.kinds.${item.kind}`)}</Badge>
        {item.difficulty ? (
          <DifficultyBadge
            level={item.difficulty}
            label={t(`items.difficulty.${item.difficulty}`)}
          />
        ) : null}
        <div className="flex-1" />
        {actions}
      </div>

      <div className="flex gap-1">
        <Typography variant="title-3" as="span" weight={600} aria-hidden="true">
          {index + 1}.
        </Typography>
        <div className="min-w-0 flex-1">
          <PostContentPreview doc={item.question} tagIds={item.tagIds} />
        </div>
      </div>

      {item.options?.map((option, optionIndex) => {
        const isCorrect = correctIds.includes(option.id)
        return (
          <div
            key={option.id}
            className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-body-3 bg-muted ${
              isCorrect ? 'border-success' : 'border-transparent'
            }`}>
            <Typography variant="body-3" as="span" weight={600}>
              {String.fromCharCode(65 + optionIndex)}
            </Typography>
            <Typography variant="body-3" as="span" className="min-w-0 flex-1">
              {option.text}
            </Typography>
            {isCorrect ? (
              <Typography
                variant="body-4"
                as="span"
                className="shrink-0 text-success">
                {t('sets.correctAnswer')}
              </Typography>
            ) : null}
          </div>
        )
      })}

      {accepted.length > 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t('sets.accepted', {answers: accepted.join(' · ')})}
        </Typography>
      ) : null}

      {item.explanation ? (
        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-3">
          <Typography
            variant="body-4"
            as="span"
            className="text-muted-foreground">
            {t('sets.explanation')}
          </Typography>
          <PostContentPreview doc={item.explanation} />
        </div>
      ) : null}
    </article>
  )
}

const IMAGE = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g

/**
 * A plain-text question may carry markdown images. At this size each one is a small
 * placeholder chip; the pictures are in the hover card (`ClampedHover`), which only
 * mounts them when open, so a screen of 100+ tiles does not fetch 100+ images.
 */
function TextWithImages({text}: {text: string}) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(IMAGE)) {
    const at = match.index ?? 0
    if (at > last) parts.push(text.slice(last, at))
    const [, alt] = match
    parts.push(
      <span
        key={at}
        className="mx-0.5 inline-flex items-center gap-0.5 rounded bg-muted px-1 align-middle text-body-4 text-muted-foreground">
        <Icon icon={LUCIDE.image} className="size-3" />
        {alt}
      </span>,
    )
    last = at + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

/**
 * Hovering a tile's text opens ONE card with the whole question, pictures included —
 * the same surface card as everywhere else, not a dark tooltip. It opens only when
 * there is something more to see: the text is cut off by `line-clamp`, or it holds an
 * image. The card's content mounts only while open, so images load on hover.
 */
function ClampedHover({
  text,
  children,
}: {
  text: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const hasImage = new RegExp(IMAGE.source).test(text)
  return (
    <HoverFlyout
      side="top"
      align="start"
      contentClassName="w-[min(24rem,calc(100vw-2rem))] p-3"
      canOpen={() => {
        const box = ref.current?.firstElementChild
        return hasImage || (!!box && box.scrollHeight > box.clientHeight)
      }}
      trigger={<div ref={ref}>{children}</div>}>
      <FullText text={text} />
    </HoverFlyout>
  )
}

function FullText({text}: {text: string}) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(IMAGE)) {
    const at = match.index ?? 0
    if (at > last) parts.push(text.slice(last, at))
    const [, alt, src] = match
    parts.push(
      // eslint-disable-next-line @next/next/no-img-element -- an author's own URL, any origin
      <img
        key={at}
        src={src}
        alt={alt}
        className="my-1 block max-h-60 max-w-full rounded"
      />,
    )
    last = at + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <div className="text-body-3 whitespace-pre-wrap">{parts}</div>
}
