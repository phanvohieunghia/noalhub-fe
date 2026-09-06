import { useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Typography } from "@noalhub/ui/typography";

/*
 * The page furniture for the two flow maps (`Chat.stories.tsx`,
 * `Presence.stories.tsx`).
 *
 * These pages used to be plain MDX. MDX prose cannot be translated: decorators
 * wrap STORIES, so the `NextIntlClientProvider` (and with it the locale
 * toolbar) never reaches markdown written in the file. Rendering the page as a
 * story instead puts every word through `useTranslations`, and the toolbar
 * switches the diagrams exactly like it switches the components. The `.mdx`
 * files are now a `<Meta>` plus a `<Story>` embed.
 *
 * All copy lives in `apps/storybook/messages/{vi,en}.json` under `sb.flows` —
 * the namespace for STORY copy, as opposed to `packages/i18n`, which is for the
 * product's own strings.
 */

/**
 * The tiny subset of markdown the copy actually uses: `**bold**` and `code`.
 *
 * Why not ship a markdown renderer: the strings are one paragraph each, the two
 * marks below are all they contain, and the alternative — next-intl's rich text
 * tags — would put JSX callbacks in every call site for the same result.
 */
/**
 * Message lookup WITHOUT ICU parsing.
 *
 * The diagram labels are full of payload shapes — `{ id, conversationId, body }`
 * — and to ICU a `{` opens an argument, so `t()` on those strings throws and
 * next-intl renders the key instead. None of this copy takes parameters, so
 * `t.raw` is exactly right: it hands back the string as written.
 */
export function useFlowText(namespace: string) {
  const t = useTranslations(namespace);
  return (key: string) => String(t.raw(key));
}

export function RichText({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.9em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function DocPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-background text-foreground mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-3">
        <Typography variant="h2" as="h1">
          {title}
        </Typography>
        <Typography variant="body-2" className="text-muted-foreground max-w-2xl">
          <RichText>{lead}</RichText>
        </Typography>
      </header>
      {children}
    </article>
  );
}

/** A section: small kicker, heading, then whatever the section shows. */
export function DocSection({
  step,
  title,
  hint,
  children,
}: {
  /** Section number — language-neutral, so it needs no translation. */
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <span className="text-primary text-body-4 font-semibold tabular-nums">
            {String(step).padStart(2, "0")}
          </span>
          <Typography variant="h4" as="h2">
            {title}
          </Typography>
        </div>
        {hint ? (
          <Typography variant="body-4" className="text-muted-foreground">
            {hint}
          </Typography>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

const clampZoom = (value: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(value.toFixed(2))));

/**
 * Drag-to-pan for a scroll container: the pointer drags the CONTENT, so the
 * scroll offsets move opposite to the pointer.
 *
 * Pointer events (not mouse) so a trackpad, a pen and a touch drag all take the
 * same path, and `setPointerCapture` keeps the drag alive when the pointer
 * leaves the container mid-move. A drag that crosses `DRAG_SLOP` swallows the
 * click that ends it — otherwise letting go over a node box would navigate away
 * from a diagram the reader was only repositioning.
 */
const DRAG_SLOP = 4;

function usePan() {
  const ref = useRef<HTMLDivElement>(null);
  const origin = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Left button / touch / pen only: a right-click is the context menu.
    if (event.button !== 0 || !ref.current) return;
    origin.current = {
      x: event.clientX,
      y: event.clientY,
      left: ref.current.scrollLeft,
      top: ref.current.scrollTop,
    };
    moved.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = origin.current;
    if (!start || !ref.current) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP) moved.current = true;
    ref.current.scrollLeft = start.left - dx;
    ref.current.scrollTop = start.top - dy;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    origin.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    dragging,
    scrollProps: {
      ref,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture: (event: React.MouseEvent) => {
        if (!moved.current) return;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}

/**
 * The viewer around a diagram: a fixed-size preview, and a full-screen overlay
 * with zoom controls.
 *
 * Why a fixed size instead of `w-full`: an SVG stretched to the container
 * scales its type with the container, so the same diagram rendered its labels
 * at a different size on every screen. Rendering at the intrinsic `width` of
 * the viewBox pins every label to the px size written in the diagram — one
 * fixed, smaller type size everywhere — and hands the "I need it bigger" job to
 * the zoom instead. `max-w-full` still lets it shrink on a narrow screen.
 *
 * The overlay is `@noalhub/ui`'s `Dialog` at `size="fullscreen"` (focus trap,
 * `Esc`, scroll lock) rather than a hand-rolled modal. The preview is NOT a
 * `<button>`: `FlowMap` draws its boxes as links, and a button may not contain
 * them — so the open is a click on the background of the preview, with the
 * expand button as the keyboard and screen-reader route.
 *
 * Zoomed in, the diagram outgrows the overlay: `usePan` makes the canvas
 * draggable so it can be moved by hand instead of only by the scrollbars.
 */
function DiagramViewer({
  width,
  title,
  children,
}: {
  width: number;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("sb.flows.common");
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { dragging, scrollProps } = usePan();

  const openViewer = () => {
    setZoom(1);
    setOpen(true);
  };

  return (
    <>
      <div className="group relative">
        <div
          className="overflow-x-auto"
          // A click that lands on a node link must navigate, not open the
          // overlay — anything else on the canvas enlarges it.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) return;
            openViewer();
          }}
        >
          <div style={{ width }} className="max-w-full cursor-zoom-in">
            {children}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("expand")}
          onClick={openViewer}
          className="bg-background absolute top-0 right-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Icon icon={LUCIDE.maximize2} />
        </Button>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size="fullscreen"
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("zoomOut")}
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            >
              <Icon icon={LUCIDE.zoomOut} />
            </Button>
            <span className="text-muted-foreground text-body-4 w-12 text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("zoomIn")}
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            >
              <Icon icon={LUCIDE.zoomIn} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("zoomReset")}
              disabled={zoom === 1}
              onClick={() => setZoom(1)}
            >
              <Icon icon={LUCIDE.rotateCcw} />
            </Button>
          </>
        }
      >
        <div
          {...scrollProps}
          className={`flex flex-1 touch-none overflow-auto ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          // `safe` centring: a plain `center` pushes the overflow off the left
          // edge of a scroll container, where it can never be scrolled back.
          style={{ justifyContent: "safe center" }}
        >
          <div style={{ width: width * zoom }} className="shrink-0">
            {children}
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** The card a diagram sits in, with its caption underneath. */
export function Figure({
  legend,
  caption,
  title,
  width,
  children,
}: {
  legend?: React.ReactNode;
  caption: string;
  /** Names the diagram in the full-screen overlay. */
  title: string;
  /** The diagram's intrinsic width — the viewBox width, in px. */
  width: number;
  children: React.ReactNode;
}) {
  return (
    <figure className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5">
      {legend ? <div className="flex flex-wrap gap-4">{legend}</div> : null}
      <DiagramViewer width={width} title={title}>
        {children}
      </DiagramViewer>
      <figcaption className="text-muted-foreground text-body-4 max-w-3xl">
        <RichText>{caption}</RichText>
      </figcaption>
    </figure>
  );
}

/** One entry of the line-style legend: a sample stroke plus what it means. */
export function LegendItem({
  kind,
  label,
}: {
  kind: "request" | "push" | "accent";
  label: string;
}) {
  return (
    <span className="text-muted-foreground text-body-4 inline-flex items-center gap-2">
      <svg width="28" height="8" aria-hidden focusable="false">
        <path
          d="M1 4 H27"
          fill="none"
          strokeWidth={kind === "accent" ? 2 : 1.4}
          strokeDasharray={kind === "push" ? "5 4" : undefined}
          stroke={
            kind === "accent" ? "var(--primary)" : "var(--muted-foreground)"
          }
        />
      </svg>
      {label}
    </span>
  );
}

/**
 * The keyspace block: one card per Redis key, its shape and what it is for.
 *
 * A table would need a header row in two languages to say "key / shape /
 * purpose" three times over; the cards carry the same three facts with the key
 * itself as the heading.
 */
export function KeyList({
  keys,
}: {
  keys: { name: string; shape: string; purpose: string }[];
}) {
  return (
    <dl className="grid gap-3 md:grid-cols-3">
      {keys.map(({ name, shape, purpose }) => (
        <div
          key={name}
          className="border-border bg-surface flex flex-col gap-2 rounded-lg border p-4"
        >
          <dt className="bg-muted text-foreground self-start rounded px-1.5 py-0.5 font-mono text-[0.8rem]">
            {name}
          </dt>
          <dd className="flex flex-col gap-1">
            <Typography variant="body-4" className="text-foreground">
              <RichText>{shape}</RichText>
            </Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              <RichText>{purpose}</RichText>
            </Typography>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The numbered cards under a diagram — the caveats, one per card. */
export function NoteList({ notes }: { notes: string[] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {notes.map((note, index) => (
        <li
          key={index}
          className="border-border bg-surface flex gap-3 rounded-lg border p-4"
        >
          <span className="bg-muted text-muted-foreground text-body-4 flex size-6 shrink-0 items-center justify-center rounded-full font-medium">
            {index + 1}
          </span>
          <Typography variant="body-3" className="text-muted-foreground">
            <RichText>{note}</RichText>
          </Typography>
        </li>
      ))}
    </ol>
  );
}

/* ----------------------------------------------------------------- diagrams */

export type FlowNode = {
  /** Story id — the box links to the screen it names. */
  href: string;
  x: number;
  y: number;
  label: string;
  note: string;
  /** The entry point of the flow. */
  primary?: boolean;
  /** A dead end, or the state everything funnels back to. */
  end?: boolean;
};

export type FlowEdge = {
  d: string;
  label?: string;
  /** A second line under `label`, for a transition with two causes. */
  label2?: string;
  /** Where the label sits; `rotate` turns it along a vertical run. */
  labelX?: number;
  labelY?: number;
  anchor?: "start" | "middle" | "end";
  rotate?: boolean;
};

const NODE_WIDTH = 190;
const NODE_HEIGHT = 52;

/**
 * The state map. Boxes are links, so this diagram is also the page's index of
 * screens — which is why there is no second list of them anywhere.
 *
 * No `role="img"`: that role makes everything inside presentational, and these
 * boxes are real links. The `<title>` gives the graphic its accessible name.
 */
export function FlowMap({
  viewBox,
  title,
  nodes,
  edges,
}: {
  viewBox: string;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}) {
  return (
    <svg viewBox={viewBox} className="w-full" fontFamily="inherit">
      <title>{title}</title>
      <defs>
        <marker
          id="flow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)" />
        </marker>
      </defs>

      <style>{`
        .flow-node rect { transition: stroke .15s; }
        .flow-node:hover rect, .flow-node:focus-visible rect { stroke: var(--primary); stroke-width: 2; }
        .flow-node { cursor: pointer; }
      `}</style>

      <g
        stroke="var(--muted-foreground)"
        strokeWidth="1.25"
        fill="none"
        markerEnd="url(#flow-arrow)"
      >
        {edges.map((edge) => (
          <path key={edge.d} d={edge.d} />
        ))}
      </g>

      <g fontSize="10.5" fill="var(--muted-foreground)">
        {edges
          .filter((edge) => edge.label)
          .map((edge) => (
            <g key={edge.d + edge.label}>
              <text
                x={edge.labelX}
                y={edge.labelY}
                textAnchor={edge.anchor ?? "start"}
                transform={
                  edge.rotate
                    ? `rotate(-90 ${edge.labelX} ${edge.labelY})`
                    : undefined
                }
              >
                {edge.label}
              </text>
              {edge.label2 ? (
                <text
                  x={edge.labelX}
                  y={(edge.labelY ?? 0) + 14}
                  textAnchor={edge.anchor ?? "start"}
                >
                  {edge.label2}
                </text>
              ) : null}
            </g>
          ))}
      </g>

      {nodes.map(({ href, x, y, label, note, primary, end }) => (
        <a
          key={href + x + y}
          className="flow-node"
          style={{ textDecoration: "none" }}
          // `./` is required: this renders inside `iframe.html`, so a bare
          // `?path=…` resolves to `iframe.html?path=…` and opens the story
          // stripped of the Storybook shell.
          href={`./?path=/story/${href}`}
          target="_top"
        >
          <rect
            x={x}
            y={y}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={10}
            fill={primary ? "var(--primary)" : "var(--background)"}
            stroke={end || primary ? "var(--primary)" : "var(--border)"}
            strokeWidth={end ? 2 : 1}
          />
          <text
            x={x + NODE_WIDTH / 2}
            y={y + 23}
            textAnchor="middle"
            fontSize="13.5"
            fontWeight="500"
            fill={primary ? "var(--primary-foreground)" : "var(--foreground)"}
          >
            {label}
          </text>
          <text
            x={x + NODE_WIDTH / 2}
            y={y + 39}
            textAnchor="middle"
            fontSize="10.5"
            fill={
              primary ? "var(--primary-foreground)" : "var(--muted-foreground)"
            }
          >
            {note}
          </text>
        </a>
      ))}
    </svg>
  );
}

export type Lane = { x: number; label: string; note: string };

export type Step = {
  from: number;
  to: number;
  label: string;
  /** BE → FE: a response or a push, drawn dashed. */
  back?: boolean;
  /** The step a reader must not skim past. */
  accent?: boolean;
};

/**
 * The lane diagram. Lifelines left to right, one step per row, the FE/BE
 * boundary drawn as a divider so it is visible at a glance which hop leaves the
 * browser.
 */
export function SequenceDiagram({
  title,
  lanes,
  steps,
  divider,
  frontendLabel,
  backendLabel,
  width,
}: {
  title: string;
  lanes: Lane[];
  steps: Step[];
  divider: number;
  frontendLabel: string;
  backendLabel: string;
  width: number;
}) {
  const height = 108 + steps.length * 46 + 40;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={title}
      fontFamily="inherit"
    >
      <defs>
        <marker
          id="seq-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-foreground)" />
        </marker>
        <marker
          id="seq-arrow-accent"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--primary)" />
        </marker>
      </defs>

      <path
        d={`M${divider} 8 V${height - 20}`}
        stroke="var(--border)"
        strokeWidth="1"
        strokeDasharray="6 5"
      />
      <g
        fontSize="10"
        fill="var(--muted-foreground)"
        letterSpacing="0.14em"
      >
        <text x={divider - 14} y="20" textAnchor="end">
          {frontendLabel}
        </text>
        <text x={divider + 14} y="20" textAnchor="start">
          {backendLabel}
        </text>
      </g>

      {lanes.map(({ x, label, note }) => (
        <g key={label}>
          <rect
            x={x - 66}
            y={30}
            width={132}
            height={38}
            rx={9}
            fill="var(--background)"
            stroke="var(--border)"
          />
          <text
            x={x}
            y={note ? 47 : 54}
            textAnchor="middle"
            fontSize="13"
            fontWeight="500"
            fill="var(--foreground)"
          >
            {label}
          </text>
          {note ? (
            <text
              x={x}
              y={61}
              textAnchor="middle"
              fontSize="10.5"
              fill="var(--muted-foreground)"
            >
              {note}
            </text>
          ) : null}
          <path
            d={`M${x} 68 V${height - 20}`}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        </g>
      ))}

      {steps.map(({ from, to, label, back, accent }, index) => {
        const y = 108 + index * 46;
        const x1 = lanes[from]!.x;
        const x2 = lanes[to]!.x;
        // A lane talking to itself — a background loop, not a hop. Drawn as a
        // stub out to the right and back, since `H` to the same x draws nothing.
        const self = from === to;

        return (
          <g key={label}>
            <text x="4" y={y + 4} fontSize="11" fill="var(--muted-foreground)">
              {index + 1}
            </text>
            <text
              x={self ? x1 + 52 : Math.min(x1, x2)}
              y={y - 8}
              fontSize="11.5"
              fill={accent ? "var(--primary)" : "var(--muted-foreground)"}
            >
              {label}
            </text>
            <path
              d={
                self
                  ? `M${x1} ${y - 9} H${x1 + 26} Q${x1 + 38} ${y - 9} ${x1 + 38} ${y} Q${x1 + 38} ${y + 9} ${x1 + 26} ${y + 9} H${x1}`
                  : `M${x1} ${y} H${x2}`
              }
              stroke={accent ? "var(--primary)" : "var(--muted-foreground)"}
              strokeWidth={accent ? 1.6 : 1.25}
              strokeDasharray={back ? "5 4" : undefined}
              markerEnd={
                accent ? "url(#seq-arrow-accent)" : "url(#seq-arrow)"
              }
              fill="none"
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The closing note every flow page carries: what this page is, and what it is
 * not.
 *
 * The default says "these screens are rebuilt, not imported" — true for Chat and
 * Presence, which redraw the layout from primitives. Blog links to the real
 * `UI/Blog` components instead, so it passes its own pair of keys rather than
 * carrying a caveat that does not apply to it.
 */
export function SourceNote({
  sectionKey = "sourceSection",
  textKey = "source",
}: {
  sectionKey?: string;
  textKey?: string;
} = {}) {
  const t = useTranslations("sb.flows.common");

  return (
    <section className="border-border text-muted-foreground flex flex-col gap-2 rounded-lg border border-dashed p-4">
      <span className="text-body-4 font-medium tracking-[0.14em] uppercase">
        {t(sectionKey)}
      </span>
      <Typography variant="body-4" className="text-muted-foreground">
        <RichText>{t(textKey)}</RichText>
      </Typography>
    </section>
  );
}
