"use client";

import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Typography } from "@noalhub/ui/typography";

/* One row = one 8px-padded line. */
const ROW =
  "relative flex w-full gap-2 rounded-md px-2.5 py-2 text-left transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const tone = (active: boolean) =>
  active ? "bg-muted text-primary" : "text-foreground";
/* `transition-colors` makes the highlight glide from row to row while scrolling. */

type ItemProps = {
  title: string;
  active: boolean;
  onSelect: () => void;
} & (
  | {
      kind: "chapter";
      open: boolean;
      expandable: boolean;
      onToggle: () => void;
    }
  | {
      kind: "section";
      /** 1 = directly under a chapter, 2 = under another section. */
      depth: 1 | 2;
      /** The last row of a branch ends its line at the tick. */
      last: boolean;
      /** Depth 2 only: the parent section has later siblings, so its line runs on through this row. */
      trail?: boolean;
    }
);

/**
 * A row of the table of contents. A `chapter` leads with a folder that is also its
 * toggle (open folder while expanded; a page icon when it has no children); a `section` hangs under it on a branch line.
 */
export function TableOfContentsItem(props: ItemProps) {
  const { title, active, onSelect } = props;

  if (props.kind === "section") {
    const deep = props.depth === 2;
    return (
      <button
        type="button"
        onClick={onSelect}
        data-active={active}
        aria-current={active ? "location" : undefined}
        className={`${ROW} items-center text-body-3 ${deep ? "pl-[78px]" : "pl-[54px]"} ${tone(active)}`}
      >
        {props.trail ? (
          <span aria-hidden className="absolute inset-y-0 left-10 w-px bg-border" />
        ) : null}
        <span
          aria-hidden
          className={`absolute w-px bg-border ${deep ? "left-16" : "left-10"} top-0 ${props.last ? "h-[19px]" : "h-full"}`}
        />
        {/* The tick sits on the first text line, so a wrapped title does not drag it down. */}
        <span
          aria-hidden
          className={`absolute top-[19px] h-px w-2.5 bg-border ${deep ? "left-16" : "left-10"}`}
        />
        <Typography variant="body-3" as="span" className="min-w-0 flex-1 break-words">
          {title}
        </Typography>
      </button>
    );
  }

  const { open, expandable, onToggle } = props;
  // Only a chapter with sections under it is a folder; one without is a plain page, so the
  // icon alone says whether there is anything to open.
  const glyph = (
    <Icon
      icon={!expandable ? LUCIDE.fileText : open ? LUCIDE.folderOpen : LUCIDE.folder}
      animate="snappy"
      className="size-4"
    />
  );
  return (
    <div data-active={active} className={`${ROW} items-start gap-1.5 ${tone(active)}`}>
      {/* The folder is the toggle: closed it is a shut folder, open it is an open one. */}
      {expandable ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className={`mt-0.5 shrink-0 rounded-sm text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            active ? "hover:bg-surface" : "hover:bg-border"
          }`}
        >
          {glyph}
        </button>
      ) : (
        <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground">
          {glyph}
        </span>
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "location" : undefined}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <Typography variant="title-4" as="span" className="min-w-0 break-words">
          {title}
        </Typography>
      </button>
    </div>
  );
}
