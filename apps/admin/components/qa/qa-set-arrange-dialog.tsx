'use client'

import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
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
  useQaSet,
  useReorderQaItems,
  type QaItemFull,
  type QaSetDetail,
} from '@noalhub/api/qa'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useMessage} from '@noalhub/i18n/use-message'
import {AlertError} from '@noalhub/ui/alert'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Toggle} from '@noalhub/ui/toggle'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'
import {QaQuestionCard, type QaCardDensity} from './qa-question-card'
import {computeMoves} from './qa-reorder-moves'

type Group = {key: string; anchor: string; ids: string[]}

/**
 * Group the way the server shows a set: sections by first appearance, each
 * section's questions together in their stored order (`orderBySection`).
 */
function toGroups(items: QaItemFull[]): Group[] {
  const groups = new Map<string, Group>()
  for (const item of items) {
    const anchor = item.sectionAnchor ?? ''
    const group = groups.get(anchor)
    if (group) group.ids.push(item.id)
    else groups.set(anchor, {key: anchor, anchor, ids: [item.id]})
  }
  return [...groups.values()]
}

const CONTAINER = 'section:'

const flatten = (groups: Group[]) => groups.flatMap((group) => group.ids)

const GRID =
  'grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'

/**
 * Re-order a set's questions in one window: every section is a block of small
 * rows that can be dragged freely inside it. Nothing is sent while dragging —
 * the order goes up in a single request when "Save order" is pressed.
 *
 * Dragging a question into another section moves it there: on save it takes that
 * section as its own (`sectionAnchor`), in the same request as the new order.
 */
export function QaSetArrangeDialog({
  setId,
  title,
  anchorTitles,
  onClose,
}: {
  setId: string
  title: string
  anchorTitles: Map<string, string>
  onClose: () => void
}) {
  const t = useTranslations('admin.qa')
  const set = useQaSet(setId)

  return (
    <Dialog
      open
      onClose={onClose}
      size="inset"
      title={t('ws.sets.arrangeTitle', {title})}>
      {set.isError ? (
        <AdminErrorState error={set.error} onRetry={() => set.refetch()} />
      ) : set.isPending || !set.data ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <ArrangeBody
          set={set.data}
          anchorTitles={anchorTitles}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

function ArrangeBody({
  set,
  anchorTitles,
  onClose,
}: {
  set: QaSetDetail
  anchorTitles: Map<string, string>
  onClose: () => void
}) {
  const t = useTranslations('admin.qa')
  const tc = useTranslations('common')
  const m = useMessage()
  const reorder = useReorderQaItems(set.id)
  const [initial] = useState(() => toGroups(set.items))
  const [groups, setGroups] = useState(initial)
  const [view, setView] = useState<Exclude<QaCardDensity, 'full'>>('compact')
  const [error, setError] = useState<Message | string | null>(null)
  // Folded sections, so a question can travel from the first chapter to the last.
  const [folded, setFolded] = useState<Set<string>>(new Set())
  const toggleFold = (key: string) =>
    setFolded((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })
  const byId = new Map(set.items.map((item) => [item.id, item]))
  const startOrder = flatten(initial)
  const dirty =
    flatten(groups).some((id, index) => id !== startOrder[index]) ||
    groups.some((group) =>
      group.ids.some(
        (id) => (byId.get(id)?.sectionAnchor ?? '') !== group.anchor,
      ),
    )

  // `distance: 4` keeps a click from being read as the start of a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  )

  // A droppable id for a whole section, so an empty one (or the space after the
  // last row) can still take a question.
  const groupOf = (id: string | number, from: Group[]) =>
    from.find((group) =>
      String(id).startsWith(CONTAINER)
        ? group.key === String(id).slice(CONTAINER.length)
        : group.ids.includes(String(id)),
    )

  // Crossing into another section moves the question there while it is still being
  // dragged, so the rows part to make room and the drop lands where it looks.
  const onDragOver = ({active, over}: DragOverEvent) => {
    if (!over) return
    setGroups((current) => {
      const source = groupOf(active.id, current)
      const target = groupOf(over.id, current)
      if (!source || !target || source === target) return current
      const at = target.ids.indexOf(String(over.id))
      return current.map((group) => {
        if (group === source)
          return {...group, ids: group.ids.filter((id) => id !== active.id)}
        if (group !== target) return group
        const ids = [...group.ids]
        ids.splice(at === -1 ? ids.length : at, 0, String(active.id))
        return {...group, ids}
      })
    })
  }

  const onDragEnd = ({active, over}: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setGroups((current) =>
      current.map((group) => {
        const from = group.ids.indexOf(String(active.id))
        const to = group.ids.indexOf(String(over.id))
        return from === -1 || to === -1
          ? group
          : {...group, ids: arrayMove(group.ids, from, to)}
      }),
    )
  }

  const save = async () => {
    setError(null)
    try {
      // Only the questions that were really dragged, each with the one above it now;
      // the rest keep their place. A stale set (or a deleted neighbour) is a 409, not a silent shuffle.
      const moves = computeMoves(
        startOrder,
        groups,
        (id) => byId.get(id)?.sectionAnchor ?? '',
      )
      if (moves.length > 0)
        await reorder.mutateAsync({version: set.version, moves})
      onClose()
    } catch (caught) {
      setError(applyApiError(caught, () => undefined, []))
    }
  }

  // Where each section starts in the whole set, so numbering runs on across sections.
  const starts = groups.map((_, i) =>
    groups.slice(0, i).reduce((sum, g) => sum + g.ids.length, 0),
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="body-3" className="text-muted-foreground">
          {t('ws.sets.arrangeHint')}
        </Typography>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-md"
            aria-label={t('ws.sets.expandAll')}
            onClick={() => setFolded(new Set())}>
            <Icon icon={LUCIDE.chevronsUpDown} />
          </Button>
          <Button
            variant="outline"
            size="icon-md"
            aria-label={t('ws.sets.collapseAll')}
            onClick={() =>
              setFolded(new Set(groups.map((group) => group.key)))
            }>
            <Icon icon={LUCIDE.chevronsDownUp} />
          </Button>
          <Toggle
            variant="outline"
            aria-label={t('sets.viewMode')}
            value={view}
            onValueChange={setView}
            options={[
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
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}>
          {groups.map((group, groupIndex) => {
            const start = starts[groupIndex]
            return (
              <SectionBlock key={group.key} id={group.key}>
                <button
                  type="button"
                  aria-expanded={!folded.has(group.key)}
                  onClick={() => toggleFold(group.key)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted">
                  <Icon
                    icon={
                      folded.has(group.key)
                        ? ICONS.chevronRight
                        : ICONS.chevronDown
                    }
                    className="size-4 shrink-0"
                  />
                  <Typography variant="title-4" className="min-w-0 truncate">
                    {anchorTitles.get(group.anchor) || t('ws.sets.noSection')}
                  </Typography>
                  <Typography
                    variant="body-4"
                    className="shrink-0 text-muted-foreground">
                    {group.ids.length}
                  </Typography>
                </button>
                {/* Folded, not unmounted: a question dropped onto a folded heading is
                    still part of the drag until it ends. */}
                <FoldBody open={!folded.has(group.key)}>
                  <SortableContext
                    items={group.ids}
                    strategy={
                      view === 'grid'
                        ? rectSortingStrategy
                        : verticalListSortingStrategy
                    }>
                    <DropZone
                      grid={view === 'grid'}
                      empty={group.ids.length === 0}>
                      {group.ids.map((id, index) => {
                        const item = byId.get(id)
                        return item ? (
                          <SortableCard
                            key={id}
                            item={item}
                            index={start + index}
                            density={view}
                          />
                        ) : null
                      })}
                    </DropZone>
                  </SortableContext>
                </FoldBody>
              </SectionBlock>
            )
          })}
        </DndContext>
      </div>

      {error ? <AlertError message={m(error)} /> : null}

      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={onClose}>
          {tc('actions.cancel')}
        </Button>
        <Button
          variant="outline"
          disabled={!dirty}
          onClick={() => setGroups(initial)}>
          {t('ws.sets.arrangeReset')}
        </Button>
        <Button
          disabled={!dirty}
          loading={reorder.isPending}
          onClick={() => void save()}>
          {t('ws.sets.arrangeSave')}
        </Button>
      </div>
    </div>
  )
}

/**
 * The whole section — heading and rows — is the drop target, so a folded section
 * (only its heading showing) can still take a question: it lands at the end.
 */
function SectionBlock({id, children}: {id: string; children: React.ReactNode}) {
  const {setNodeRef, isOver} = useDroppable({id: `${CONTAINER}${id}`})
  return (
    <section
      ref={setNodeRef}
      className={`rounded-md ${isOver ? 'bg-muted/60' : ''}`}>
      {children}
    </section>
  )
}

/**
 * Height animates by way of the grid-rows trick (0fr ↔ 1fr), so the content needs no
 * measuring. It is clipped only while folded or moving: a card being dragged out of
 * its section must not be cut off at the section's edge.
 */
function FoldBody({
  open,
  children,
}: {
  open: boolean
  children: React.ReactNode
}) {
  const [settled, setSettled] = useState(open)
  return (
    <div
      inert={!open}
      aria-hidden={!open}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget) setSettled(open)
      }}
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}>
      <div
        className={`min-h-0 pt-2 ${open && settled ? '' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  )
}

function DropZone({
  grid,
  empty,
  children,
}: {
  grid: boolean
  empty: boolean
  children: React.ReactNode
}) {
  const t = useTranslations('admin.qa')
  return (
    <div
      className={`${grid ? GRID : 'space-y-1.5'} ${
        empty ? 'rounded-md border border-dashed border-border p-3' : ''
      }`}>
      {empty ? (
        <Typography variant="body-4" className="text-muted-foreground">
          {t('ws.sets.arrangeEmpty')}
        </Typography>
      ) : (
        children
      )}
    </div>
  )
}

function SortableCard({
  item,
  index,
  density,
}: {
  item: QaItemFull
  /** Position in the whole set, so the number follows the question as it moves. */
  index: number
  density: Exclude<QaCardDensity, 'full'>
}) {
  const t = useTranslations('admin.qa')
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: item.id})

  return (
    <div
      ref={setNodeRef}
      style={{transform: CSS.Transform.toString(transform), transition}}
      className={isDragging ? 'relative z-10 opacity-80 shadow-lg' : ''}>
      <QaQuestionCard
        item={item}
        index={index}
        density={density}
        dragHandle={
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
        }
      />
    </div>
  )
}
