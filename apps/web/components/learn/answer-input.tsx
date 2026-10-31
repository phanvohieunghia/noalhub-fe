'use client'

import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'

import type {QaAnswerResult, QaItemPlay, QaResponse} from '@noalhub/api/qa'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {QaChoiceList, isCompactChoices} from '@noalhub/ui/qa-choice-list'
import {type QaOptionState} from '@noalhub/ui/qa-option-card'
import {Typography} from '@noalhub/ui/typography'

import {playSelect} from '@noalhub/core/sounds'

/** Milliseconds since `start` — module scope, so it is never mistaken for render-time work. */
function elapsedSince(start: number) {
  return Math.max(0, Date.now() - start)
}

/**
 * The three ways to answer, picked by the item's shape (`item.templateKey`) — not
 * by whether the item happens to have options.
 *
 * That distinction is the whole reason `templateKey` exists on the DTO (per item,
 * since a dataset mixes shapes): a
 * flashcard has no options either, and inferring from their absence would give
 * it a text box instead of "I knew it / I didn't".
 *
 * One tap makes an option active. A single-answer question sends on a second tap of
 * the active option (or Enter); a multi-answer question sends from its "Answer"
 * button (or Enter), since a second tap there takes the pick back. There is no
 * double click: it is not something a thumb does reliably.
 *
 * It stays mounted after the answer comes back (`result`), locked, so the
 * learner sees their own pick next to the verdict. Mount it with `key={item.id}`:
 * the picks are local state and must not leak into the next question.
 */
export function AnswerInput({
  item,
  result,
  disabled,
  onSubmit,
}: {
  item: QaItemPlay
  result: QaAnswerResult | null
  disabled?: boolean
  onSubmit: (response: QaResponse, durationMs: number) => void
}) {
  const t = useTranslations('web.learn')
  const [picked, setPicked] = useState<string[]>([])
  const [text, setText] = useState('')
  const shownAt = useRef(0)

  useEffect(() => {
    shownAt.current = Date.now()
  }, [])

  const {templateKey} = item
  const locked = result !== null || disabled === true
  const options = templateKey !== 'flashcard' ? (item.options ?? []) : []
  const compact = isCompactChoices(options)
  const single = templateKey === 'true_false' || templateKey === 'single_choice'

  const send = (response: QaResponse) =>
    onSubmit(response, elapsedSince(shownAt.current))

  const toggle = (id: string) => {
    playSelect(single || !picked.includes(id))
    setPicked((prev) =>
      single
        ? [id]
        : prev.includes(id)
          ? prev.filter((value) => value !== id)
          : [...prev, id],
    )
  }

  // 1–8 activates an option, Enter answers. Skipped while typing in a field or when
  // a button has focus — there Enter already means "press this".
  useEffect(() => {
    if (options.length === 0 || locked) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, button, [contenteditable]')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < options.length) {
        event.preventDefault()
        toggle(options[index].id)
      } else if (event.key === 'Enter' && picked.length > 0) {
        event.preventDefault()
        send({optionIds: picked})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (templateKey === 'flashcard') {
    if (result) return null
    return (
      <div className="space-y-3">
        {/* The back of the card only arrives with the answer, so this is
            recall-then-judge, not flip-then-judge — and the copy says so. */}
        <Typography variant="body-3" className="text-muted-foreground">
          {t('answer.selfPrompt')}
        </Typography>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={locked} onClick={() => send({known: true})}>
            <Icon icon={LUCIDE.circleCheck} />
            {t('answer.known')}
          </Button>
          <Button
            variant="outline"
            disabled={locked}
            onClick={() => send({known: false})}>
            <Icon icon={LUCIDE.circleX} />
            {t('answer.unknown')}
          </Button>
        </div>
        <Typography variant="body-4" className="text-muted-foreground">
          {t('answer.selfNote')}
        </Typography>
      </div>
    )
  }

  if (options.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        {/* Single choice needs no hint — one pick is the default. Several does. */}
        {single ? null : (
          <Typography
            variant="body-4"
            className="shrink-0 text-muted-foreground">
            {t('answer.multiHint')}
          </Typography>
        )}
        <QaChoiceList
          options={options}
          multi={!single}
          label={single ? t('answer.singleHint') : t('answer.multiHint')}
          compact={compact}
          disabled={locked}
          stateOf={(id) =>
            optionState({
              chosen: picked.includes(id),
              result,
              pickCount: picked.length,
            })
          }
          // Single-answer: tapping the active option again sends it.
          onPick={(id) =>
            single && picked.includes(id) ? send({optionIds: [id]}) : toggle(id)
          }
        />
        {single || locked ? null : (
          <Button
            className="shrink-0"
            disabled={picked.length === 0}
            onClick={() => send({optionIds: picked})}>
            {t('answer.submit')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!locked && text.trim() !== '') send({text})
      }}>
      <Input
        label={t('answer.text')}
        value={text}
        hint={t('answer.textHint')}
        disabled={locked}
        autoFocus
        onChange={(event) => setText(event.target.value)}
      />
    </form>
  )
}

/**
 * What one option looks like once the verdict is in.
 *
 * The result carries no answer key, so only the learner's own picks can be
 * coloured: all of them green when the answer is right, and red only when there
 * was a single pick — with several picks and a wrong verdict, which ones were
 * wrong is not something this screen knows, so they stay neutral.
 */
function optionState({
  chosen,
  result,
  pickCount,
}: {
  chosen: boolean
  result: QaAnswerResult | null
  pickCount: number
}): QaOptionState {
  if (!result) return chosen ? 'picked' : 'idle'
  if (!chosen) return 'dimmed'
  if (result.isCorrect) return 'right'
  return pickCount === 1 ? 'wrong' : 'chosen'
}
