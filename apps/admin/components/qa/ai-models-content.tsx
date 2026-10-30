'use client'

import {useTranslations} from 'next-intl'
import {useMemo, useState} from 'react'

import {
  aiProviderNameSchema,
  useAiModels,
  useCreateAiModel,
  useDeleteAiModel,
  useUpdateAiModel,
  type AiModel,
  type AiProviderName,
} from '@noalhub/api/qa'
import type {Message} from '@noalhub/api/message'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useMessage} from '@noalhub/i18n/use-message'
import {AlertError} from '@noalhub/ui/alert'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {DropdownMenuItem} from '@noalhub/ui/dropdown-menu'
import {ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {
  TableActionsHeaderCell,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
} from '@noalhub/ui/table'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'

const COLUMN_COUNT = 5
const PROVIDERS = aiProviderNameSchema.options

/**
 * The catalogue of models a key can be assigned (`ai_models`).
 *
 * The context window and output ceiling are the provider's figures and feed the
 * checks that block a call before it is billed, so this screen is where they get
 * corrected when a provider changes them — no deploy needed.
 *
 * `provider` and `name` are read-only once a row exists: the same model through
 * another provider is a different row, not an edit. A model a key still uses
 * cannot be deleted (the backend answers `AI_MODEL_IN_USE`); switch it off to
 * retire it — keys on it then stop running until they are given another model.
 */
export function AiModelsContent() {
  const t = useTranslations('admin.qa')
  const models = useAiModels()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AiModel | null>(null)
  const [deleting, setDeleting] = useState<AiModel | null>(null)

  const rows = useMemo(
    () => [...(models.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [models.data],
  )

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {t('models.title')}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t('models.intro')}
          </Typography>
        </div>
        <Button onClick={() => setAdding(true)}>{t('models.add')}</Button>
      </div>

      {models.isError ? (
        <div className="mt-4">
          <AdminErrorState
            error={models.error}
            onRetry={() => models.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t('models.caption')}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('models.columns.label')}</TableHeaderCell>
                <TableHeaderCell>
                  {t('models.columns.provider')}
                </TableHeaderCell>
                <TableHeaderCell>{t('models.columns.limits')}</TableHeaderCell>
                <TableHeaderCell>{t('models.columns.status')}</TableHeaderCell>
                <TableActionsHeaderCell label={t('actionsColumn')} />
              </TableRow>
            </TableHead>
            <TableBody>
              {models.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t('models.empty')}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <ModelRow
                    key={row.id}
                    row={row}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {adding ? <ModelDialog onClose={() => setAdding(false)} /> : null}
      {editing ? (
        <ModelDialog row={editing} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? (
        <DeleteDialog row={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </main>
  )
}

function ModelRow({
  row,
  onEdit,
  onDelete,
}: {
  row: AiModel
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useTranslations('admin.qa')
  const toggle = useUpdateAiModel(row.id)

  return (
    <TableRow
      className={row.enabled ? undefined : 'opacity-50'}
      onActivate={onEdit}>
      <TableCell weight={500}>
        {row.label}
        <Typography variant="body-4" as="div" className="font-mono opacity-60">
          {row.name}
        </Typography>
      </TableCell>
      <TableCell className="opacity-70">{row.provider}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge icon={LUCIDE.layers}>
            {t('models.context', {count: row.contextWindow})}
          </Badge>
          <Badge icon={LUCIDE.arrowUpFromLine}>
            {t('models.output', {count: row.maxOutputTokens})}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {row.enabled ? null : (
            <Badge tone="neutral">{t('models.disabled')}</Badge>
          )}
          {/* Shown as a badge, not hidden: a key cannot run on it, and why. */}
          {row.supportsStructuredOutput ? null : (
            <Badge tone="neutral">{t('models.noStructured')}</Badge>
          )}
        </div>
      </TableCell>
      <TableRowActions label={t('actionsColumn')}>
        <DropdownMenuItem icon={ICONS.edit} onSelect={onEdit}>
          {t('models.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={row.enabled ? LUCIDE.ban : LUCIDE.circleCheck}
          disabled={toggle.isPending}
          onSelect={() => toggle.mutate({enabled: !row.enabled})}>
          {row.enabled ? t('models.disable') : t('models.enable')}
        </DropdownMenuItem>
        <DropdownMenuItem icon={ICONS.delete} tone="danger" onSelect={onDelete}>
          {t('models.delete')}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  )
}

/** Create (no `row`) and edit (`row`) share one form; `provider`/`name` lock on edit. */
function ModelDialog({row, onClose}: {row?: AiModel; onClose: () => void}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const create = useCreateAiModel()
  const update = useUpdateAiModel(row?.id ?? '')
  const [formError, setFormError] = useState<Message | string | null>(null)

  const [provider, setProvider] = useState<AiProviderName | ''>(
    row?.provider ?? '',
  )
  const [name, setName] = useState(row?.name ?? '')
  const [label, setLabel] = useState(row?.label ?? '')
  const [contextWindow, setContextWindow] = useState(
    row ? String(row.contextWindow) : '',
  )
  const [maxOutputTokens, setMaxOutputTokens] = useState(
    row ? String(row.maxOutputTokens) : '',
  )
  const [structured, setStructured] = useState(
    row?.supportsStructuredOutput ?? true,
  )
  const [enabled, setEnabled] = useState(row?.enabled ?? true)
  const [touched, setTouched] = useState(false)

  const context = Number(contextWindow)
  const output = Number(maxOutputTokens)
  const isCount = (n: number) => Number.isInteger(n) && n >= 1
  const contextInvalid = !isCount(context)
  // The backend rejects an output ceiling above the window; say so before the click.
  const outputInvalid = !isCount(output) || output > context
  const valid =
    label.trim() !== '' &&
    !contextInvalid &&
    !outputInvalid &&
    (row !== undefined || (provider !== '' && name.trim() !== ''))

  const save = async () => {
    setTouched(true)
    setFormError(null)
    if (!valid) return
    try {
      if (row) {
        await update.mutateAsync({
          label,
          contextWindow: context,
          maxOutputTokens: output,
          supportsStructuredOutput: structured,
          enabled,
        })
      } else {
        await create.mutateAsync({
          provider: provider as AiProviderName,
          name: name.trim(),
          label,
          contextWindow: context,
          maxOutputTokens: output,
          supportsStructuredOutput: structured,
          enabled,
        })
      }
      onClose()
    } catch (error) {
      // AI_MODEL_DUPLICATE and VALIDATION_FAILED arrive with a readable message.
      setFormError(applyApiError(error, () => undefined, []))
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={
        row ? t('models.editTitle', {label: row.label}) : t('models.addTitle')
      }>
      <div className="space-y-4">
        <Select
          label={t('models.fields.provider')}
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value as AiProviderName)
          }
          disabled={row !== undefined}
          placeholder={t('models.fields.providerPlaceholder')}
          error={
            touched && provider === ''
              ? t('models.fields.providerPlaceholder')
              : undefined
          }
          options={PROVIDERS.map((value) => ({value, label: value}))}
        />
        <Input
          label={t('models.fields.name')}
          hint={t('models.fields.nameHint')}
          value={name}
          disabled={row !== undefined}
          maxLength={64}
          onChange={(event) => setName(event.target.value)}
          error={
            touched && name.trim() === '' ? t('models.fields.name') : undefined
          }
        />
        <Input
          label={t('models.fields.label')}
          value={label}
          maxLength={120}
          onChange={(event) => setLabel(event.target.value)}
          error={
            touched && label.trim() === ''
              ? t('models.fields.label')
              : undefined
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('models.fields.contextWindow')}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={contextWindow}
            onChange={(event) => setContextWindow(event.target.value)}
            error={
              touched && contextInvalid
                ? t('models.fields.numberInvalid')
                : undefined
            }
          />
          <Input
            label={t('models.fields.maxOutputTokens')}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            hint={t('models.fields.maxOutputHint')}
            value={maxOutputTokens}
            onChange={(event) => setMaxOutputTokens(event.target.value)}
            error={
              touched && outputInvalid
                ? t('models.fields.maxOutputInvalid')
                : undefined
            }
          />
        </div>
        <Typography
          variant="body-3"
          as="label"
          className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={structured}
            onChange={(event) => setStructured(event.target.checked)}
          />
          {t('models.fields.structured')}
        </Typography>
        <Typography
          variant="body-3"
          as="label"
          className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          {t('models.fields.enabled')}
        </Typography>
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc('actions.cancel')}
          </Button>
          <Button
            onClick={() => void save()}
            loading={create.isPending || update.isPending}>
            {tc('actions.save')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function DeleteDialog({row, onClose}: {row: AiModel; onClose: () => void}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const remove = useDeleteAiModel()
  const [formError, setFormError] = useState<Message | string | null>(null)

  const confirm = async () => {
    setFormError(null)
    try {
      await remove.mutateAsync(row.id)
      onClose()
    } catch (error) {
      // A key still on this model lands here as AI_MODEL_IN_USE; the backend
      // message says to switch it off instead.
      setFormError(applyApiError(error, () => undefined, []))
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('models.deleteTitle', {label: row.label})}>
      <div className="space-y-4">
        <Typography variant="body-3">{t('models.deleteBody')}</Typography>
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc('actions.cancel')}
          </Button>
          <Button
            className="text-danger"
            variant="outline"
            onClick={() => void confirm()}
            loading={remove.isPending}>
            {t('models.delete')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          {Array.from({length: COLUMN_COUNT}).map((_, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
