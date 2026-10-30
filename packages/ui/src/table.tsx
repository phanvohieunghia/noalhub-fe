'use client'

import {useLayoutEffect, useRef} from 'react'

import {Button} from './button'
import {DropdownMenu} from './dropdown-menu'
import {Icon, ICONS} from './icons'
import {Tooltip} from './tooltip'
import {Typography, type Weight} from './typography'

/**
 * A "bare" table: styling and a11y only — no state, no knowledge of pagination
 * or sorting. Built once here instead of copying markup into every admin
 * screen.
 *
 * `TableRoot` draws the frame (border + surface + rounded corners) and puts the
 * table in its own horizontal scroller, so a wide table scrolls inside that
 * frame rather than making the whole page slide sideways on small screens.
 *
 * By default the frame also ends at the bottom of the viewport: the rows scroll
 * under the sticky header and the footer (count + pager) stays put, so the page
 * itself never scrolls because of a long table. Pass `fit={false}` for a table
 * that should simply grow with the page.
 */
export function TableRoot({
  caption,
  className = '',
  scrollClassName = '',
  footer,
  fit = true,
  children,
}: {
  /** A description for screen readers; visually hidden since the page title already says it. */
  caption: string
  className?: string
  /** On the scroll region: a `max-h-*` here makes the rows scroll under a sticky header. */
  scrollClassName?: string
  /** Drawn inside the frame under the rows, behind a divider: the count and pager. */
  footer?: React.ReactNode
  /** Cap the frame at the viewport's bottom edge so only the rows scroll. Default `true`. */
  fit?: boolean
  children: React.ReactNode
}) {
  const frameRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!fit || !frame) return
    const resize = () => {
      const height = window.innerHeight - frame.getBoundingClientRect().top - 24
      frame.style.maxHeight = `${Math.max(height, 240)}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      frame.style.maxHeight = ''
    }
  })

  return (
    <div
      ref={frameRef}
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface ${className}`}>
      {/*
        `tabIndex` because this element scrolls: a scrollable region a keyboard
        cannot reach hides the right-hand columns from anyone not using a mouse
        (axe `scrollable-region-focusable`). `role="region"` + the caption text
        as its name is what keeps that new tab stop from being an unlabelled
        one.
      */}
      <div
        tabIndex={0}
        role="region"
        aria-label={caption}
        className={`min-h-0 w-full flex-1 overflow-auto overscroll-contain ${scrollClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}>
        <table className="w-full border-collapse text-left text-body-3">
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-border">{footer}</div>
      ) : null}
    </div>
  )
}

/**
 * The header row sits on the same surface as the rows, split off by one rule —
 * what the Figma `Table` does. The column names are `title-4` in the foreground
 * colour, so they stand out from the data without a tinted band.
 */
export function TableHead({children}: {children: React.ReactNode}) {
  return (
    <thead className="sticky top-0 z-10 border-b border-border bg-surface">
      {children}
    </thead>
  )
}

export function TableBody({children}: {children: React.ReactNode}) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

/** Anything inside a row that has its own click meaning; a click on it must not also activate the row. */
const INTERACTIVE =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [role="switch"], [role="menuitem"], [data-no-row-activate]'

/**
 * Props that make a `<tr>` the primary action. For the rare row that cannot be a
 * `TableRow` (dnd-kit needs its own `<tr>` ref); `TableRow` itself uses this too.
 *
 * A click activates only when it lands on the row's plain area: not on a link,
 * button or field inside it, and not at the end of a text selection.
 */
export function rowActivateProps(onActivate?: () => void) {
  if (!onActivate) return {}
  return {
    tabIndex: 0,
    onClick: (event: React.MouseEvent<HTMLTableRowElement>) => {
      if ((event.target as HTMLElement).closest(INTERACTIVE)) return
      if (window.getSelection()?.toString()) return
      onActivate()
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      // Only the row itself: Enter on a link or button inside must keep its own meaning.
      if (event.key === 'Enter' && event.target === event.currentTarget)
        onActivate()
    },
  }
}

/**
 * Pass `onActivate` to make the whole row the primary action (open / edit):
 * the row gets a pointer, becomes focusable and answers `Enter`. Clicks on a
 * link, button or checkbox inside keep their own meaning and do not activate it.
 * Secondary actions (duplicate, delete) live in a `TableRowActions` cell instead.
 */
export function TableRow({
  className = '',
  children,
  onActivate,
  ...props
}: React.ComponentPropsWithoutRef<'tr'> & {onActivate?: () => void}) {
  return (
    <tr
      className={`transition-colors hover:bg-muted/60 ${
        onActivate
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
          : ''
      } ${className}`}
      {...rowActivateProps(onActivate)}
      {...props}>
      {children}
    </tr>
  )
}

export function TableHeaderCell({
  className = '',
  children,
  ...props
}: React.ComponentPropsWithoutRef<'th'>) {
  return (
    <Typography
      as="th"
      variant="title-4"
      weight={600}
      scope="col"
      className={`px-4 py-[18px] whitespace-nowrap text-foreground ${className}`}
      {...props}>
      {children}
    </Typography>
  )
}

export function TableCell({
  weight,
  className = '',
  children,
  ...props
}: React.ComponentPropsWithoutRef<'td'> & {weight?: Weight}) {
  return (
    <Typography
      as="td"
      variant="body-3"
      weight={weight}
      className={`px-4 py-3 align-middle ${className}`}
      {...(props as React.HTMLAttributes<HTMLElement>)}>
      {children}
    </Typography>
  )
}

/**
 * A full-width cell for empty and error states. `colSpan` is required: guessing
 * the column count wrong skews the table, and there is no way to guess right
 * from in here.
 */
export function TableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number
  children: React.ReactNode
}) {
  return (
    <tr>
      <Typography
        as="td"
        variant="body-3"
        colSpan={colSpan}
        className="px-4 py-12 text-center text-muted-foreground">
        {children}
      </Typography>
    </tr>
  )
}

/** `false` = this column is not the one being sorted on. */
export type SortDirection = 'asc' | 'desc' | false

/**
 * A sortable column header: three states, cycling asc → desc → off.
 *
 * "Off" is a real state, not a rounding error — it hands the list back to the
 * server's default order, which is usually the most useful one. Without it the
 * user can never undo a sort short of reloading the page.
 *
 * Sorting is the SERVER's job: the callback is expected to move `sort`/`order`
 * into the query the list is fetched with, so the order holds across every
 * page. Sorting the rows already on screen would reorder one page out of many
 * and quietly lie about the rest — which is why this component takes a
 * `direction` and an `onToggle` and never touches the data itself.
 *
 * The icon is always rendered (a neutral one when the column is inactive) so
 * headers do not jump sideways as the sort moves between columns.
 *
 * `label` is the visible column name and `sortHint` the screen-reader
 * description of what a click does — both come in as props, since this package
 * must not pin an app's i18n namespace.
 */
export function TableSortHeaderCell({
  direction = false,
  onToggle,
  sortHint,
  className = '',
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'th'>, 'onToggle'> & {
  /** Omitted or `false` = not sorted on: the neutral up-down icon. Only `asc` / `desc` change the variant. */
  direction?: SortDirection
  onToggle: () => void
  sortHint: string
}) {
  const icon =
    direction === 'asc'
      ? ICONS.sortAsc
      : direction === 'desc'
        ? ICONS.sortDesc
        : ICONS.sortNone

  return (
    <TableHeaderCell
      // `aria-sort` is what tells a screen reader the table is sorted at all;
      // the icon alone says nothing to it.
      aria-sort={
        direction === 'asc'
          ? 'ascending'
          : direction === 'desc'
            ? 'descending'
            : 'none'
      }
      // `!`: the base header padding has the same specificity, and the button owns the padding here.
      className={`p-0! ${className}`}
      {...props}>
      <button
        type="button"
        onClick={onToggle}
        title={sortHint}
        // A `group` so the neutral icon can come forward on hover: at rest it
        // must stay quiet, or every unsorted header shouts as loudly as the one
        // column actually being sorted on.
        className="group flex w-full items-center gap-2 px-4 py-[18px] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        {children}
        <Icon
          icon={icon}
          className={`size-3.5 shrink-0 transition-opacity ${
            direction ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
          }`}
        />
        <span className="sr-only">{sortHint}</span>
      </button>
    </TableHeaderCell>
  )
}

/**
 * The header cell above a `TableRowActions` column: no visible text, but the
 * column still needs a name for screen readers.
 */
export function TableActionsHeaderCell({label}: {label: string}) {
  return (
    <TableHeaderCell className="w-12">
      <span className="sr-only">{label}</span>
    </TableHeaderCell>
  )
}

/**
 * The last cell of a row: a "more" button that opens the secondary actions
 * (`DropdownMenuItem`s passed as `children`).
 *
 * Clicks and keys stop here on purpose. React events bubble through portals, so
 * without this a pick from the menu would also fire the row's `onActivate`.
 */
export function TableRowActions({
  label,
  children,
}: {
  /** Accessible name of the trigger, e.g. "Row actions". */
  label: string
  children: React.ReactNode
}) {
  return (
    <TableCell
      className="w-12 text-right"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}>
      <DropdownMenu
        compact
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <Icon icon={ICONS.more} />
          </Button>
        }>
        {children}
      </DropdownMenu>
    </TableCell>
  )
}

/**
 * The floating bar shown while one or more rows are selected: the count, then
 * the actions on that selection. Bare on purpose — where it sits (usually
 * sticky under the table) is the screen's call, passed as `className`.
 *
 * Children are `TableBulkAction`s; put the destructive one last.
 */
export function TableBulkBar({
  label,
  toolbarLabel,
  className = '',
  children,
}: {
  /** The count, already translated: "4 selected". */
  label: string
  /** Accessible name of the toolbar, e.g. "Actions on selected rows". */
  toolbarLabel: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="toolbar"
      aria-label={toolbarLabel}
      className={`flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg ${className}`}>
      <Typography
        as="span"
        variant="title-4"
        role="status"
        className="text-foreground tabular-nums">
        {label}
      </Typography>
      <div
        role="separator"
        aria-orientation="vertical"
        className="h-6 w-px bg-border"
      />
      {children}
    </div>
  )
}

/**
 * One action in a `TableBulkBar`: an icon with a tooltip carrying its name.
 * `label` is both the tooltip text and the `aria-label`, since the icon alone
 * says nothing to a screen reader.
 */
export function TableBulkAction({
  label,
  icon,
  variant = 'ghost',
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  'children' | 'variant' | 'size'
> & {
  label: string
  icon: string
  variant?: 'ghost' | 'danger'
}) {
  return (
    <Tooltip label={label}>
      <Button variant={variant} size="icon" aria-label={label} {...props}>
        <Icon icon={icon} className="size-5" />
      </Button>
    </Tooltip>
  )
}
