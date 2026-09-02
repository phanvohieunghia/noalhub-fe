/**
 * A "bare" table: styling and a11y only — no state, no knowledge of pagination
 * or sorting. Built once here instead of copying markup into every admin
 * screen.
 *
 * `TableRoot` wraps it in `overflow-x-auto` so a wide table scrolls inside its
 * own frame rather than making the whole page slide sideways on small screens.
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
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-left text-body-3">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-black/10 dark:border-white/15">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-black/6 dark:divide-white/10">{children}</tbody>;
}

export function TableRow({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={`transition-colors hover:bg-black/3 dark:hover:bg-white/5 ${className}`}
      {...props}
    >
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
      className={`px-3 py-2 text-body-4 font-medium uppercase tracking-wide opacity-60 ${className}`}
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
    <td className={`px-3 py-2.5 align-middle ${className}`} {...props}>
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
      <td colSpan={colSpan} className="px-3 py-10 text-center text-body-3 opacity-60">
        {children}
      </td>
    </tr>
  );
}
