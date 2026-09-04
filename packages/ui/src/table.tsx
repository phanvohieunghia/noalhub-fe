"use client";

import { Icon, ICONS } from "./icons";

/**
 * A "bare" table: styling and a11y only — no state, no knowledge of pagination
 * or sorting. Built once here instead of copying markup into every admin
 * screen.
 *
 * `TableRoot` draws the frame (border + surface + rounded corners) and puts the
 * table in its own horizontal scroller, so a wide table scrolls inside that
 * frame rather than making the whole page slide sideways on small screens.
 */
export function TableRoot({
  caption,
  className = "",
  children,
}: {
  /** A description for screen readers; visually hidden since the page title already says it. */
  caption: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface ${className}`}
    >
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
        className="w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <table className="w-full border-collapse text-left text-body-3">
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
    </div>
  );
}

/**
 * The header band is tinted (`bg-muted`) rather than separated by a rule alone:
 * at a glance the eye needs to find where the data starts, and one hairline
 * across a wide table does not carry that far.
 */
export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border bg-muted">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TableRow({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr className={`transition-colors hover:bg-muted/60 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-body-4 font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
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
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center text-body-3 text-muted-foreground"
      >
        {children}
      </td>
    </tr>
  );
}

/** `false` = this column is not the one being sorted on. */
export type SortDirection = "asc" | "desc" | false;

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
  direction,
  onToggle,
  sortHint,
  className = "",
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"th">, "onToggle"> & {
  direction: SortDirection;
  onToggle: () => void;
  sortHint: string;
}) {
  const icon =
    direction === "asc" ? ICONS.sortAsc : direction === "desc" ? ICONS.sortDesc : ICONS.sortNone;

  return (
    <TableHeaderCell
      // `aria-sort` is what tells a screen reader the table is sorted at all;
      // the icon alone says nothing to it.
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
      className={`p-0 ${className}`}
      {...props}
    >
      <button
        type="button"
        onClick={onToggle}
        title={sortHint}
        // A `group` so the neutral icon can come forward on hover: at rest it
        // must stay quiet, or every unsorted header shouts as loudly as the one
        // column actually being sorted on.
        className={`group flex w-full items-center gap-1.5 px-4 py-3 text-left uppercase transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
          direction ? "text-foreground" : ""
        }`}
      >
        {children}
        <Icon
          icon={icon}
          className={`size-3.5 shrink-0 transition-opacity ${
            direction ? "opacity-100" : "opacity-40 group-hover:opacity-100"
          }`}
        />
        <span className="sr-only">{sortHint}</span>
      </button>
    </TableHeaderCell>
  );
}
