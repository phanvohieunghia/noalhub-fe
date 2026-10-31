'use client'

import {useLocale, useTranslations} from 'next-intl'
import {useEffect, useMemo, useState} from 'react'

import {
  useQaItemSearch,
  useQaItemTags,
  useQaSet,
  type QaItemSearchRow,
} from '@noalhub/api/qa'
import {QaContent} from '@noalhub/ui/blog/qa-content'
import {BottomSheet} from '@noalhub/ui/bottom-sheet'
import {Button} from '@noalhub/ui/button'
import {Checkbox} from '@noalhub/ui/checkbox'
import type {BlogDoc} from '@noalhub/api/blog'
import {Dialog} from '@noalhub/ui/dialog'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {LearnAttemptHeader} from '@noalhub/ui/learn-attempt-header'
import {
  LearnQuestionBox,
  QaChoiceList,
  isCompactChoices,
} from '@noalhub/ui/qa-choice-list'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@noalhub/ui/popover'
import {Skeleton} from '@noalhub/ui/skeleton'
import {TaggedFrame, pickTagLabel} from '@noalhub/ui/tag-mark'

import {QaItemTagSelect} from './qa-item-tag-picker'
import {Toggle, type ToggleOption} from '@noalhub/ui/toggle'
import {toast} from '@noalhub/ui/toast'
import {Tooltip} from '@noalhub/ui/tooltip'
import {useTabletUp} from '@noalhub/ui/use-tablet-up'
import {ValueSlider} from '@noalhub/ui/value-slider'
import {useTheme} from '@noalhub/ui/theme/theme-provider'
import {Typography} from '@noalhub/ui/typography'

type ShapeKey = 'multiple_choice'

const THEME_MODES = ['light', 'dark'] as const
const DEVICES = ['mobile', 'tablet', 'laptop'] as const
type Device = (typeof DEVICES)[number]
const DEVICE_ICONS = {
  mobile: LUCIDE.smartphone,
  tablet: LUCIDE.tablet,
  laptop: LUCIDE.laptop,
} as const
/** The learner screen's size per device; the laptop takes whatever width the dialog gives. */
const DEVICE_FRAMES: Record<Device, string> = {
  // The padding is the device's, as on the real screen (`p-4 sm:p-6`): a phone is 16px whatever
  // the admin's window is — the window's own breakpoints say nothing about the frame inside it.
  mobile: 'h-[720px] max-w-[390px] p-4',
  tablet: 'h-[760px] max-w-[768px] p-6',
  laptop: 'h-[620px] max-w-full p-6',
}
/**
 * The window width (px) a device's view needs. The dialog grows with the device — a laptop
 * view widens it — so what limits a view is the window, not the dialog's current size.
 */
const DEVICE_MIN_VIEWPORT: Record<Device, number> = {
  mobile: 0,
  tablet: 880,
  laptop: 1100,
}
/**
 * Set sizes the slider can land on: every size while it is small, coarser as it grows — a
 * short set draws a cell per question, a long one sections, and that switch is the point.
 */
const TOTAL_VALUES = [
  ...Array.from({length: 20}, (_, i) => i + 1),
  ...Array.from({length: 8}, (_, i) => 30 + i * 10),
  ...Array.from({length: 10}, (_, i) => 150 + i * 50),
]
/** How far through the set the made-up learner is, in percent. */
const PERCENT_VALUES = Array.from({length: 21}, (_, i) => i * 5)

/**
 * A modal showing one question exactly as a learner sees it, per shape: choice
 * rows, a text field, or the flashcard self-grade buttons. Read-only: publishing
 * is decided per question type on the list, not here.
 *
 * The frame is the learner's own: the header and the answer cards are the very components
 * the web app renders (`LearnAttemptHeader`, `QaChoiceList` in `packages/ui`), so a change
 * to either shows up here without touching this file. The progress is made up — nobody is
 * answering here.
 */
export function QaLearnerPreview({
  item,
  onClose,
  controls,
}: {
  item: QaItemSearchRow
  onClose: () => void
  /** Extra controls under the device switch — the type preview's "what if" example picker. */
  controls?: React.ReactNode
}) {
  const t = useTranslations('admin.qa')
  const set = useQaSet(item.setId)
  const locale = useLocale()
  const tags = useQaItemTags()
  // Starts from the tags the question really carries. Ticking more is what-if only —
  // nothing here is saved; it lets an admin see how another tag would sit on the question.
  const [picked, setPicked] = useState<readonly string[]>(item.tagIds)
  const [device, setDevice] = useState<Device>('mobile')
  // The learner screen can be seen in either theme, whatever the admin's own is. It starts on
  // the admin's current one.
  const {resolved} = useTheme()
  const [theme, setTheme] = useState<'light' | 'dark'>(resolved)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const tabletUp = useTabletUp()
  // What-if for the progress bar only: how big the set is and how far along the learner is.
  const [total, setTotal] = useState<number>(20)
  const [percent, setPercent] = useState(50)
  const answered = Math.min(total - 1, Math.floor((total * percent) / 100))
  // The window width, followed as it is resized: it decides which device views are possible.
  const [viewport, setViewport] = useState(Infinity)
  useEffect(() => {
    const measure = () => setViewport(window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  // A bigger device than the screen can hold would be shown squeezed — not the view that was
  // asked for — so say so instead of pretending.
  const pickDevice = (next: Device) => {
    if (viewport < DEVICE_MIN_VIEWPORT[next]) {
      // A fixed id: tapping again re-shows the one toast instead of stacking another.
      toast.warning(t('items.deviceTooSmall'), {id: 'device-too-small'})
      return
    }
    setDevice(next)
  }
  // What-if answer picks, so the cards can be seen in their picked state. Never sent anywhere.
  const [chosen, setChosen] = useState<readonly string[]>([])
  const activeTags = (tags.data ?? []).filter((tag) => tag.active)
  const shown = activeTags.filter((tag) => picked.includes(tag.id))

  const shape = t(
    `templates.shapes.${item.type}` as `templates.shapes.${ShapeKey}`,
  )
  const isChoice = Boolean(item.options)
  const isMulti = item.type === 'multiple_choice'
  const isFlashcard = item.type === 'flashcard'
  const options = item.options ?? []
  const compact = isCompactChoices(options)

  // The folded-away options, shared by the popover and the bottom sheet.
  const optionSections = (
    <>
      <ToolSection title={t('items.sections.progress')}>
        <div className="grid w-full gap-x-8 gap-y-4 sm:grid-cols-2">
          <ValueSlider
            values={TOTAL_VALUES}
            value={total}
            onValueChange={setTotal}
            label={t('items.previewTotal')}
            valueLabel={t('items.previewTotalOption', {count: total})}
          />
          <ValueSlider
            values={PERCENT_VALUES}
            value={percent}
            onValueChange={setPercent}
            label={t('items.previewStage')}
            valueLabel={t('items.previewAnsweredOption', {
              answered,
              total,
              percent,
            })}
          />
        </div>
      </ToolSection>
      {activeTags.length > 0 ? (
        <ToolSection title={t('items.previewTags')}>
          <QaItemTagSelect
            value={picked}
            onChange={setPicked}
            ariaLabel={t('items.previewTags')}
            activeOnly
            className="w-full sm:w-72"
          />
        </ToolSection>
      ) : null}
      {controls ? (
        <ToolSection
          scroll
          title={t('items.sections.example')}
          className="lg:col-span-2">
          {controls}
        </ToolSection>
      ) : null}
    </>
  )

  return (
    <Dialog
      open
      // The dialog widens for a laptop view and narrows again for the others.
      size={device === 'laptop' ? 'wide' : 'xl'}
      title={t('items.previewTitle')}
      // What the preview is, one hover away — right beside the title it explains.
      titleExtra={
        <Tooltip label={t('items.previewIntro', {shape})} side="bottom">
          <button
            type="button"
            aria-label={t('items.previewIntro', {shape})}
            className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <Icon icon={LUCIDE.info} className="size-4" />
          </button>
        </Tooltip>
      }
      onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* The screen being previewed is what matters, so the controls stay out of its way: the two
            that are changed all the time (device, theme) sit in one slim row, and everything else
            opens from "Options" — a popover over the page from tablet width up (nothing below
            moves), a bottom sheet on a phone, where a floating box is hard to reach. */}
        <Popover open={tabletUp && optionsOpen} onOpenChange={setOptionsOpen}>
          <PopoverAnchor asChild>
            <div className="flex items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-2.5 sm:gap-x-6 sm:p-3">
              <ToolGroup
                inline
                label={t('items.deviceLabel')}
                value={device}
                onChange={pickDevice}
                options={DEVICES.map((value) => ({
                  value,
                  icon: DEVICE_ICONS[value],
                  label: t(`items.devices.${value}`),
                  dimmed: viewport < DEVICE_MIN_VIEWPORT[value],
                }))}
              />
              <ToolGroup
                inline
                label={t('items.themeLabel')}
                value={theme}
                onChange={setTheme}
                options={THEME_MODES.map((value) => ({
                  value,
                  icon: value === 'dark' ? LUCIDE.moon : LUCIDE.sun,
                  label: t(`items.themes.${value}`),
                }))}
              />
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  aria-expanded={optionsOpen}
                  onClick={tabletUp ? undefined : () => setOptionsOpen(true)}>
                  <Icon icon={LUCIDE.slidersHorizontal} />
                  <span className="max-sm:sr-only">
                    {t('items.previewOptions')}
                  </span>
                  <Icon
                    icon={optionsOpen ? LUCIDE.chevronUp : LUCIDE.chevronDown}
                    className="max-sm:hidden"
                  />
                </Button>
              </PopoverTrigger>
            </div>
          </PopoverAnchor>
          <PopoverContent className="grid w-[min(56rem,calc(100vw-2rem))] gap-x-8 gap-y-4 lg:grid-cols-2">
            {optionSections}
          </PopoverContent>
        </Popover>
        <BottomSheet
          open={!tabletUp && optionsOpen}
          onClose={() => setOptionsOpen(false)}
          title={t('items.previewOptions')}>
          <div className="flex flex-col gap-6">{optionSections}</div>
        </BottomSheet>

        {/* The learner's screen at the device's width and a fixed height, the way `LearnAttempt`
            lays it out: header, progress, then the question and the answers filling what is left. */}
        <div
          className={`${theme} relative mx-auto flex w-full flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm transition-[max-width,height] ${DEVICE_FRAMES[device]}`}>
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
            <LearnAttemptHeader
              title={set.data?.title ?? ''}
              answered={answered}
              total={total}
              position={answered + 1}
              contained
              wide={device !== 'mobile'}
              className="mb-6"
              labels={{
                back: t('items.previewBack'),
                showHeader: t('items.previewShowHeader'),
                hideHeader: t('items.previewHideHeader'),
                progress: t('items.previewProgress'),
                report: t('items.previewReport'),
                position: ({current, total}) =>
                  t('items.previewPosition', {current, total}),
              }}
              onBack={() => {}}
              onReport={() => {}}
            />

            <article className="flex min-h-0 flex-1 flex-col gap-5">
              <LearnQuestionBox>
                <TaggedFrame tags={shown} locale={locale}>
                  <QaContent doc={item.question} />
                </TaggedFrame>
              </LearnQuestionBox>

              {isChoice ? (
                <div className="flex min-h-0 flex-1 flex-col gap-5">
                  {isMulti ? (
                    <Typography
                      variant="body-4"
                      className="shrink-0 text-muted-foreground">
                      {t('items.previewMultiHint')}
                    </Typography>
                  ) : null}
                  <QaChoiceList
                    options={options}
                    multi={isMulti}
                    compact={compact}
                    stateOf={(id) => (chosen.includes(id) ? 'picked' : 'idle')}
                    onPick={(id) =>
                      setChosen((now) =>
                        !isMulti
                          ? [id]
                          : now.includes(id)
                            ? now.filter((value) => value !== id)
                            : [...now, id],
                      )
                    }
                  />
                </div>
              ) : null}

              {isFlashcard ? (
                <div className="space-y-3">
                  <Typography
                    variant="body-3"
                    className="text-muted-foreground">
                    {t('items.previewFlashHint')}
                  </Typography>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button disabled>
                      <Icon icon={LUCIDE.circleCheck} />
                      {t('items.previewKnewIt')}
                    </Button>
                    <Button variant="outline" disabled>
                      <Icon icon={LUCIDE.circleX} />
                      {t('items.previewDidntKnow')}
                    </Button>
                  </div>
                  <Typography
                    variant="body-4"
                    className="text-muted-foreground">
                    {t('items.previewFlashNote')}
                  </Typography>
                </div>
              ) : null}

              {!isChoice && !isFlashcard ? (
                <Input
                  label={t('items.previewAnswer')}
                  hint={t('items.previewAnswerHint')}
                  disabled
                  readOnly
                />
              ) : null}
            </article>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/** How many of the type's newest questions are looked through for a good example. */
const SAMPLE_POOL = 100

/** Characters of text in a rich-text node, plus a bonus per picture — a rough "how much is in it". */
function weight(node: unknown): number {
  if (!node || typeof node !== 'object') return 0
  const {text, content, type} = node as {
    text?: string
    content?: unknown[]
    type?: string
  }
  const own =
    typeof text === 'string'
      ? text.length + (text.match(/!\[[^\]]*\]\(/g)?.length ?? 0) * 200
      : 0
  const image = type === 'image' ? 200 : 0
  return (
    own +
    image +
    (Array.isArray(content)
      ? content.reduce<number>((sum, child) => sum + weight(child), 0)
      : 0)
  )
}

/**
 * The example for a type: a placeholder like "test / A B C D" says nothing about how the
 * screen holds up, so prefer the question with the most going on (a picture, long text,
 * many or long options, tags) among the newest few.
 */
function richest(items: QaItemSearchRow[]): QaItemSearchRow | undefined {
  const score = (row: QaItemSearchRow) =>
    weight(row.question) +
    (row.options ?? []).reduce((sum, option) => sum + option.text.length, 0) +
    (row.options?.length ?? 0) * 20 +
    row.tagIds.length * 100
  return items.reduce<QaItemSearchRow | undefined>(
    (best, row) => (!best || score(row) > score(best) ? row : best),
    undefined,
  )
}

/** A thin vertical rule between groups of a row of controls, level with the choices. */
function Divider() {
  return (
    <span aria-hidden className="mb-0.5 h-8 w-px shrink-0 self-end bg-border" />
  )
}

/** One titled group of the preview's folded-away options. */
function ToolSection({
  title,
  children,
  className = '',
  scroll = false,
}: {
  title: string
  children: React.ReactNode
  className?: string
  /** Keep the controls on one row instead of wrapping; a child that should scroll sideways brings its own scrolling box. */
  scroll?: boolean
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-2.5 ${className}`}>
      <Typography
        variant="body-4"
        as="h3"
        className="font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </Typography>
      <div
        className={`flex items-end gap-y-3 ${
          // A scrolling row is a run of small controls with rules between them, so it sits
          // tighter than the roomy wrapping groups.
          scroll ? 'flex-nowrap gap-x-4' : 'flex-wrap gap-x-8'
        }`}>
        {children}
      </div>
    </section>
  )
}

/** One control of the preview: its name above, icon-only choices below (each named by its tooltip). */
function ToolGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  inline = false,
}: {
  label: string
  value: T
  onChange: (next: T) => void
  options: readonly ToggleOption<T>[]
  /** The name beside the choices instead of above them — for a slim row. */
  inline?: boolean
}) {
  return (
    <div
      className={
        inline
          ? 'flex shrink-0 items-center gap-2'
          : 'flex shrink-0 flex-col items-start gap-1.5'
      }>
      <Typography
        variant="body-4"
        as="span"
        // In a slim row on a phone the icons speak for themselves; the name stays for readers.
        className={`font-medium ${inline ? 'max-sm:sr-only' : ''}`}>
        {label}
      </Typography>
      <Toggle
        variant="filter"
        aria-label={label}
        value={value}
        onValueChange={onChange}
        options={options}
      />
    </div>
  )
}

type ImageNode = Extract<BlogDoc['content'][number], {type: 'image'}>

/** The first picture found anywhere in a rich-text doc. */
function findImage(node: unknown): ImageNode | null {
  if (!node || typeof node !== 'object') return null
  const {type, content} = node as {type?: string; content?: unknown[]}
  if (type === 'image') return node as ImageNode
  if (!Array.isArray(content)) return null
  for (const child of content) {
    const found = findImage(child)
    if (found) return found
  }
  return null
}

type Source = 'real' | 'sample'
type Length = 'short' | 'long'
const COUNT_OPTIONS = [
  {value: '2', icon: LUCIDE.dice2},
  {value: '3', icon: LUCIDE.dice3},
  {value: '4', icon: LUCIDE.dice4},
  {value: '5', icon: LUCIDE.dice5},
] as const

/**
 * The preview of a question *type*: opens the modal on one question of that type —
 * the one with the most in it — or, on request, on a made-up example whose parts the
 * admin picks: with or without a picture, a short or long question, short or long
 * answers, and 2 to 5 of them. The example reuses the real question's set and tags;
 * only the texts are invented, and a picture is borrowed from a real question (the
 * image hosts are allow-listed, so there is no URL to invent). Nothing is saved.
 */
export function QaTypePreview({
  type,
  onClose,
}: {
  type: string
  onClose: () => void
}) {
  const t = useTranslations('admin.qa')
  const search = useQaItemSearch({type, limit: SAMPLE_POOL})
  const pool = search.data?.items
  const base = useMemo(() => richest(pool ?? []), [pool])
  const image = useMemo(() => {
    for (const row of pool ?? []) {
      const found = findImage(row.question)
      if (found) return found
    }
    return null
  }, [pool])

  const [source, setSource] = useState<Source>('real')
  const [withImage, setWithImage] = useState<'yes' | 'no'>('no')
  const [question, setQuestion] = useState<Length>('short')
  const [answers, setAnswers] = useState<Length>('short')
  const [count, setCount] =
    useState<(typeof COUNT_OPTIONS)[number]['value']>('4')

  const hasOptions = Boolean(base?.options)
  // True/false is always two answers; the picker would only mislead there.
  const countable = hasOptions && type !== 'true_false'

  const item = useMemo(() => {
    if (!base || source === 'real') return base
    const NUMBERS = [1, 2, 3, 4, 5] as const
    const doc: BlogDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text:
                question === 'long'
                  ? t('items.sample.questionLong')
                  : t('items.sample.questionShort'),
            },
          ],
        },
        ...(withImage === 'yes' && image ? [image] : []),
      ],
    } as BlogDoc
    const texts = NUMBERS.map((n) =>
      answers === 'long'
        ? t(`items.sample.answerLong${n}`)
        : t(`items.sample.answerShort${n}`),
    )
    const options = base.options
      ? texts
          .slice(0, countable ? Number(count) : base.options.length)
          .map((text, index) => ({
            id: `sample-${index}`,
            text,
          }))
      : null
    return {...base, question: doc, options}
  }, [base, source, question, answers, count, withImage, image, countable, t])

  if (item && base) {
    const lengths = (
      long: string,
      short: string,
    ): readonly ToggleOption<Length>[] => [
      {value: 'short', icon: LUCIDE.minus, label: short},
      {value: 'long', icon: LUCIDE.alignJustify, label: long},
    ]
    const controls = (
      <>
        <ToolGroup
          label={t('items.sample.source')}
          value={source}
          onChange={setSource}
          options={[
            {
              value: 'real',
              icon: LUCIDE.database,
              label: t('items.sample.real'),
            },
            {
              value: 'sample',
              icon: LUCIDE.flaskConical,
              label: t('items.sample.example'),
            },
          ]}
        />
        {source === 'sample' ? (
          <>
            {/* Sets the choice of example apart from the settings that only apply to a made-up one. */}
            <Divider />
            {/* Only this run scrolls sideways; the choice of example and the rule stay put. */}
            <div className="flex min-w-0 flex-1 items-end gap-x-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {image ? (
                <>
                  <ToolGroup
                    label={t('items.sample.picture')}
                    value={withImage}
                    onChange={setWithImage}
                    options={[
                      {
                        value: 'no',
                        icon: LUCIDE.imageOff,
                        label: t('items.sample.noPicture'),
                      },
                      {
                        value: 'yes',
                        icon: LUCIDE.image,
                        label: t('items.sample.withPicture'),
                      },
                    ]}
                  />
                </>
              ) : null}
              <ToolGroup
                label={t('items.sample.questionLength')}
                value={question}
                onChange={setQuestion}
                options={lengths(
                  t('items.sample.long'),
                  t('items.sample.short'),
                )}
              />
              {hasOptions ? (
                <>
                  <ToolGroup
                    label={t('items.sample.answerLength')}
                    value={answers}
                    onChange={setAnswers}
                    options={lengths(
                      t('items.sample.long'),
                      t('items.sample.short'),
                    )}
                  />
                </>
              ) : null}
              {countable ? (
                <>
                  <ToolGroup
                    label={t('items.sample.answerCount')}
                    value={count}
                    onChange={setCount}
                    options={COUNT_OPTIONS.map(({value, icon}) => ({
                      value,
                      icon,
                      label: value,
                    }))}
                  />
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </>
    )
    return (
      <QaLearnerPreview
        key={base.id}
        item={item}
        onClose={onClose}
        controls={controls}
      />
    )
  }

  return (
    <Dialog open size="lg" title={t('items.previewTitle')} onClose={onClose}>
      {search.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Typography variant="body-3" className="text-muted-foreground">
          {t(search.isError ? 'items.previewFailed' : 'items.previewEmpty')}
        </Typography>
      )}
    </Dialog>
  )
}
