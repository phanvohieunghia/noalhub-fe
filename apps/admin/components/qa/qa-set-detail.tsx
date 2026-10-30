'use client'

import {useTranslations} from 'next-intl'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'

import type {Message} from '@noalhub/api/message'
import {
  useArchiveQaSet,
  useDeleteQaItem,
  usePublishQaSet,
  useQaSet,
  useReorderQaItems,
  type QaItemFull,
} from '@noalhub/api/qa'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useMessage} from '@noalhub/i18n/use-message'
import {AlertError, AlertWarning} from '@noalhub/ui/alert'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Switch} from '@noalhub/ui/switch'
import {Toggle} from '@noalhub/ui/toggle'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'
import {QaItemForm} from './qa-item-form'
import {QaQuestionCard, type QaCardDensity} from './qa-question-card'

const VIEW_KEY = 'qa-set-view'

const VIEW_CLASSES: Record<QaCardDensity, string> = {
  full: 'space-y-3',
  compact: 'space-y-1.5',
  grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
}

function readView(): QaCardDensity {
  try {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'full' || saved === 'compact' || saved === 'grid')
      return saved
  } catch {
    // Storage can be blocked; the default view is fine.
  }
  return 'full'
}

/**
 * One set: its questions, their order, and the publish button.
 *
 * Two error codes come back from this screen and they must NOT share a
 * sentence: `QA_SET_CONFLICT` means someone else saved the set (reload),
 * `QA_ITEMS_REORDER_MISMATCH` means the list of questions changed underneath
 * you (reload, then reorder again). Merging them makes the reader guess.
 */
export function QaSetDetail({setId}: {setId: string}) {
  const t = useTranslations('admin.qa')
  const m = useMessage()
  const set = useQaSet(setId)
  const publish = usePublishQaSet(setId)
  const archive = useArchiveQaSet(setId)
  const reorder = useReorderQaItems(setId)
  const [actionError, setActionError] = useState<Message | string | null>(null)
  const [adding, setAdding] = useState(false)
  const [view, setViewState] = useState<QaCardDensity>(readView)
  // The order shown while a drop is being saved, so the card does not snap back
  // to the old slot until the refetch lands.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)
  // `distance: 4` keeps a click on a card's buttons from starting a drag; the
  // keyboard sensor makes the grip usable without a mouse (Space, arrows, Space).
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  )

  const setView = (next: QaCardDensity) => {
    setViewState(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Not remembering the view is harmless.
    }
  }

  if (set.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={set.error} onRetry={() => set.refetch()} />
      </main>
    )
  }

  if (set.isPending || !set.data) {
    return (
      <main className="w-full space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    )
  }

  const data = set.data
  const items = pendingOrder
    ? [...data.items].sort(
        (a, b) => pendingOrder.indexOf(a.id) - pendingOrder.indexOf(b.id),
      )
    : data.items

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await action()
    } catch (error) {
      setActionError(applyApiError(error, () => undefined, []))
    }
  }

  // One question moves per gesture, so one move goes up: "this one now sits after
  // that one". Only that row is written; a stale view (someone deleted the
  // neighbour) is a 409 instead of a silent shuffle.
  const saveMove = (next: string[], movedId: string) => {
    const at = next.indexOf(movedId)
    setPendingOrder(next)
    void run(() =>
      reorder.mutateAsync({
        version: data.version,
        moves: [{id: movedId, afterId: at <= 0 ? null : next[at - 1]}],
      }),
    ).finally(() => setPendingOrder(null))
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    saveMove(
      arrayMove(items, index, target).map((item) => item.id),
      items[index].id,
    )
  }

  const onDragEnd = ({active, over}: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((item) => item.id === active.id)
    const to = items.findIndex((item) => item.id === over.id)
    if (from === -1 || to === -1) return
    saveMove(
      arrayMove(items, from, to).map((item) => item.id),
      String(active.id),
    )
  }

  const locked = data.status !== 'draft'

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {data.title}
          </Typography>
          <Typography variant="body-3" className="mt-1 text-muted-foreground">
            {data.sectionTitle
              ? t('sets.fromSection', {section: data.sectionTitle})
              : t('sets.noSection')}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={data.status === 'published' ? 'success' : 'neutral'}>
            {t(`sets.status.${data.status}`)}
          </Badge>
          {data.status === 'draft' ? (
            <Button variant="outline" onClick={() => setAdding(true)}>
              <Icon icon={ICONS.add} />
              {t('sets.addQuestion')}
            </Button>
          ) : null}
          <Toggle
            variant="outline"
            aria-label={t('sets.viewMode')}
            value={view}
            onValueChange={setView}
            options={[
              {value: 'full', icon: LUCIDE.rows3, label: t('sets.viewFull')},
              {
                value: 'compact',
                icon: LUCIDE.list,
                label: t('sets.viewCompact'),
              },
              {
                value: 'grid',
                icon: LUCIDE.layoutGrid,
                label: t('sets.viewGrid'),
              },
            ]}
          />
          <Switch
            label={t('sets.publishedSwitch')}
            checked={data.status === 'published'}
            loading={publish.isPending || archive.isPending}
            onCheckedChange={(next) =>
              void run(() =>
                next
                  ? publish.mutateAsync(data.version)
                  : archive.mutateAsync(data.version),
              )
            }
          />
        </div>
      </div>

      {/* The publish refusal lists the offending questions by id — show it
          verbatim, because "some question is invalid" without saying which is
          a message nobody can act on. */}
      {actionError ? (
        <div className="mt-3">
          <AlertError message={m(actionError)} />
        </div>
      ) : null}

      {data.status !== 'draft' ? (
        <div className="mt-3">
          <AlertWarning message={t('sets.lockedShape')} />
        </div>
      ) : null}

      <div className="mt-4">
        {items.length === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {t('sets.noItems')}
          </Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}>
            <SortableContext
              items={items.map((item) => item.id)}
              disabled={locked}
              strategy={
                view === 'grid'
                  ? rectSortingStrategy
                  : verticalListSortingStrategy
              }>
              <div className={VIEW_CLASSES[view]}>
                {items.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    setId={setId}
                    item={item}
                    index={index}
                    total={items.length}
                    locked={locked}
                    density={view}
                    onMove={move}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {adding ? (
        <Dialog
          open
          onClose={() => setAdding(false)}
          size="lg"
          title={t('sets.addQuestion')}>
          <QaItemForm
            setId={setId}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </Dialog>
      ) : null}
    </main>
  )
}

function ItemCard({
  setId,
  item,
  index,
  total,
  locked,
  density,
  onMove,
}: {
  setId: string
  item: QaItemFull
  index: number
  total: number
  /** Once the set has left draft its question shape is locked — no editing. */
  locked: boolean
  density: QaCardDensity
  onMove: (index: number, delta: number) => void
}) {
  const t = useTranslations('admin.qa')
  const remove = useDeleteQaItem(setId)
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: item.id, disabled: locked})
  // The arrows stay on the full card as the precise, one-step alternative to a drag;
  // the denser views have no room for them and rely on the grip.
  const showArrows = !locked && density === 'full'

  return (
    <div
      ref={setNodeRef}
      style={{transform: CSS.Transform.toString(transform), transition}}
      className={isDragging ? 'relative z-10 opacity-80 shadow-lg' : ''}>
      <QaQuestionCard
        item={item}
        index={index}
        density={density}
        isLast={index === total - 1}
        dragHandle={
          locked ? undefined : (
            <Button
              variant="ghost"
              size="icon-sm"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={t('sets.dragItem', {index: index + 1})}
              className="cursor-grab touch-none active:cursor-grabbing">
              <Icon icon={ICONS.drag} />
            </Button>
          )
        }
        onMoveUp={showArrows ? () => onMove(index, -1) : undefined}
        onMoveDown={showArrows ? () => onMove(index, 1) : undefined}
        onRemove={locked ? undefined : () => remove.mutate(item.id)}
        removing={remove.isPending}
        onEdit={
          locked
            ? undefined
            : () => router.push(`/qa/sets/${setId}/items/${item.id}`)
        }
      />
    </div>
  )
}
