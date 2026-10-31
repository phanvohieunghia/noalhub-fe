'use client'

import {useLocale, useTranslations} from 'next-intl'

import {useQaItemTags} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {DropdownMenu, DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {pickTagLabel} from '@noalhub/ui/tag-mark'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

/**
 * The multi-select dropdown itself: the chosen tags as chips on the trigger, and a
 * list that stays open while you tick. Shared by the question form and the preview.
 *
 * A switched-off tag is still listed while it is chosen (unless `activeOnly`): hiding
 * it would make the box vanish from under a question that has it, and saving would
 * silently drop it. It is disabled for NEW attachment, and ticking it off is the way to
 * remove it.
 */
export function QaItemTagSelect({
  value,
  onChange,
  ariaLabel,
  activeOnly = false,
  className = '',
}: {
  value: readonly string[]
  onChange: (ids: string[]) => void
  ariaLabel: string
  /** Offer only tags that are switched on — for a what-if where nothing is saved. */
  activeOnly?: boolean
  className?: string
}) {
  const t = useTranslations('admin.qa')
  const locale = useLocale()
  const tags = useQaItemTags()

  const visible = (tags.data ?? []).filter((tag) =>
    activeOnly ? tag.active : tag.active || value.includes(tag.id),
  )
  if (tags.isPending) return <Skeleton className="h-10 w-full" />

  const selected = visible.filter((tag) => value.includes(tag.id))
  const labelOf = (tag: (typeof visible)[number]) =>
    pickTagLabel(tag.meta.label, locale, tag.key)

  return (
    <div className="group relative">
      <DropdownMenu
        align="start"
        compact
        className="w-(--radix-dropdown-menu-trigger-width) min-w-52"
        trigger={
          <button
            type="button"
            aria-label={ariaLabel}
            className={`flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-surface py-1.5 pl-3 pr-10 text-left text-body-3 outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">
                  {t('items.tagsPlaceholder')}
                </span>
              ) : (
                selected.map((tag) => (
                  <Badge key={tag.id} size="sm">
                    {labelOf(tag)}
                  </Badge>
                ))
              )}
            </span>
            <Icon
              icon={ICONS.chevronDown}
              // Gives way to the clear button while the pointer is over a filled box.
              className={`absolute right-3 size-4 shrink-0 ${
                selected.length > 0
                  ? 'group-focus-within:invisible group-hover:invisible'
                  : ''
              }`}
            />
          </button>
        }>
        {visible.map((tag) => {
          const checked = value.includes(tag.id)
          const label = labelOf(tag)
          return (
            <DropdownMenuItem
              key={tag.id}
              icon={checked ? LUCIDE.check : LUCIDE.circle}
              disabled={!tag.active && !checked}
              className={checked ? '' : '[&>svg]:opacity-0'}
              // A multi-select: ticking one must not close the list.
              onSelect={(event) => {
                event.preventDefault()
                onChange(
                  checked
                    ? value.filter((id) => id !== tag.id)
                    : [...value, tag.id],
                )
              }}>
              {tag.active ? label : `${label} (${t('tags.disabled')})`}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenu>
      {/* Beside the trigger, not inside it: a button cannot hold a button. Shown in place of the
          caret while the box is hovered or focused and something is chosen. */}
      {selected.length > 0 ? (
        <button
          type="button"
          aria-label={t('items.tagsClear')}
          title={t('items.tagsClear')}
          onClick={() => onChange([])}
          className="absolute top-1/2 right-2 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none group-focus-within:flex group-hover:flex hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <Icon icon={ICONS.close} className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

/**
 * Which tags a question carries. Only the ids are saved (`qa_items.tag_ids`); where and
 * how a tag is drawn is the tag's own business (`meta`), so nothing here touches the
 * question text.
 */
export function QaItemTagPicker({
  value,
  onChange,
  className = '',
}: {
  value: readonly string[]
  onChange: (ids: string[]) => void
  className?: string
}) {
  const t = useTranslations('admin.qa')
  const tags = useQaItemTags()

  const hasAny = (tags.data ?? []).some(
    (tag) => tag.active || value.includes(tag.id),
  )
  if (!tags.isPending && !hasAny) return null

  return (
    <fieldset className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Typography variant="body-3" weight={500} as="legend">
          {t('items.tagsLabel')}
        </Typography>
        <Tooltip label={t('items.tagsHint')} side="top">
          <button
            type="button"
            aria-label={t('items.tagsHint')}
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <Icon icon={LUCIDE.info} className="size-4" />
          </button>
        </Tooltip>
      </div>
      <QaItemTagSelect
        value={value}
        onChange={onChange}
        ariaLabel={t('items.tagsLabel')}
      />
    </fieldset>
  )
}
