'use client'

import {useTranslations} from 'next-intl'
import {useState} from 'react'

import type {Message} from '@noalhub/api/message'
import {
  useDeleteQaOutline,
  useQaOutlines,
  useSetCurrentQaOutline,
  type QaOutlineSummary,
} from '@noalhub/api/qa'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useMessage} from '@noalhub/i18n/use-message'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {DropdownMenu, DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {ICONS, Icon, LUCIDE} from '@noalhub/ui/icons'
import {Select} from '@noalhub/ui/select'
import {Typography} from '@noalhub/ui/typography'
import {ToastError} from '@noalhub/ui/toast'

/**
 * Which outline version a step looks at. Versions are history: there is no "active"
 * one to switch, so a step simply opens on the newest and the picker only changes what
 * it is showing (a version nothing depends on can be deleted — see `OutlineVersionMenu`). Until something is picked, the newest is followed — a
 * version generated while the page is open takes over by itself.
 */
/** Picker value for the version a run is still writing; it has no row on the server yet. */
export const PENDING_VERSION = 'pending'

export function useOutlineVersion(datasetId: string) {
  const outlines = useQaOutlines(datasetId)
  const [picked, setPicked] = useState<string | null>(null)
  const items = outlines.data?.items ?? []

  let latest: QaOutlineSummary | undefined
  for (const item of items)
    if (!latest || item.version > latest.version) latest = item

  const selected = items.find((item) => item.id === picked) ?? latest
  return {outlines, items, latest, selected, picked, select: setPicked}
}

/** The version picker. Purely a viewer: choosing one changes nothing on the server. */
export function OutlineVersionSelect({
  items,
  value,
  onChange,
  className = 'w-28',
  pendingVersion,
}: {
  items: QaOutlineSummary[]
  /** The version number a running generation will produce; adds it as a pickable entry. */
  pendingVersion?: number
  value: string | undefined
  onChange: (id: string) => void
  className?: string
}) {
  const t = useTranslations('admin.qa')
  // Nothing to choose between — an empty dropdown reads as a broken control.
  if (items.length === 0 && pendingVersion === undefined) return null
  return (
    <div className={className}>
      <Select
        label={t('ws.meta.versionLabel')}
        hideLabel
        size="sm"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        options={[
          ...(pendingVersion === undefined
            ? []
            : [
                {
                  value: PENDING_VERSION,
                  label: `${t('outlines.versionShort', {version: pendingVersion})}…`,
                },
              ]),
          ...items.map((outline) => ({
            value: outline.id,
            // A named version shows its name; "v*" is only the fallback.
            label: `${outline.isCurrent ? '✓ ' : ''}${
              outline.label?.trim() ||
              t('outlines.versionShort', {version: outline.version})
            }`,
          })),
        ]}
      />
    </div>
  )
}

const versionName = (outline: QaOutlineSummary, fallback: string) =>
  outline.label?.trim() || fallback

/**
 * Actions on the version on screen, behind a "⋯" so the one destructive action does not
 * sit one slip away from the picker. Today that is delete; the backend refuses a version question sets were
 * generated from, a run is using, or the dataset's last one; the 409 message is shown
 * in the dialog rather than hidden behind a disabled button, because "why can't I" is
 * only knowable server-side.
 */
export function OutlineVersionMenu({
  datasetId,
  outline,
  versionCount,
  onDeleted,
}: {
  datasetId: string
  outline: QaOutlineSummary
  versionCount: number
  /** Called after the delete so the caller can drop a stale pick. */
  onDeleted?: () => void
}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const remove = useDeleteQaOutline(datasetId)
  const setCurrent = useSetCurrentQaOutline(datasetId)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<Message | string | null>(null)
  const only = versionCount <= 1
  const name = versionName(
    outline,
    t('outlines.versionShort', {version: outline.version}),
  )

  const close = () => {
    setOpen(false)
    setError(null)
  }
  const confirm = async () => {
    setError(null)
    try {
      await remove.mutateAsync(outline.id)
      close()
      onDeleted?.()
    } catch (err) {
      setError(applyApiError(err, () => undefined, []))
    }
  }

  return (
    <>
      <DropdownMenu
        compact
        trigger={
          <Button
            variant="ghost"
            size="icon-md"
            aria-label={t('outlines.versionActions')}>
            <Icon icon={ICONS.more} />
          </Button>
        }>
        <DropdownMenuItem
          icon={LUCIDE.eye}
          disabled={outline.isCurrent || setCurrent.isPending}
          onSelect={() => setCurrent.mutate(outline.id)}>
          <span className="flex flex-col">
            {t('outlines.showToLearners')}
            {outline.isCurrent ? (
              <span className="text-body-4 text-muted-foreground">
                {t('outlines.shownHint')}
              </span>
            ) : null}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={ICONS.delete}
          tone="danger"
          disabled={only}
          onSelect={() => setOpen(true)}>
          <span className="flex flex-col">
            {t('outlines.deleteVersion')}
            {only ? (
              <span className="text-body-4 text-muted-foreground">
                {t('outlines.deleteLastHint')}
              </span>
            ) : null}
          </span>
        </DropdownMenuItem>
      </DropdownMenu>
      {setCurrent.isError ? (
        <ToastError message={t('outlines.showFailed')} />
      ) : null}
      {open ? (
        <Dialog open onClose={close} title={t('outlines.deleteTitle', {name})}>
          <div className="space-y-4">
            <Typography variant="body-3">{t('outlines.deleteBody')}</Typography>
            {error ? <ToastError message={m(error)} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>
                {tc('actions.cancel')}
              </Button>
              <Button
                className="text-danger"
                variant="outline"
                onClick={() => void confirm()}
                loading={remove.isPending}>
                {t('outlines.deleteConfirm')}
              </Button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </>
  )
}
