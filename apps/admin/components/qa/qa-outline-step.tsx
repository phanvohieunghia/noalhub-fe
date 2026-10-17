"use client";

import { useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { BlogDoc } from "@noalhub/api/blog";
import {
  CHARS_PER_TOKEN,
  OUTLINE_CHAR_WARN,
  useQaOutline,
  useQaOutlines,
  useQaSources,
  useSetCurrentOutline,
  useUpdateQaOutline,
  type QaOutline,
} from "@noalhub/api/qa";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { MetricsCard, type MetricItem } from "@noalhub/ui/metrics-card";
import {
  blogDocToMarkdown,
  markdownToBlogDoc,
} from "@noalhub/ui/blog/markdown-editor";
import { TiptapEditor } from "@noalhub/ui/blog/tiptap-editor";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Spinner } from "@noalhub/ui/spinner";
import { toast } from "@noalhub/ui/toast";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { AnalyzeButton } from "./analyze-button";
import { RunOutcome } from "./generation-progress";
import { EditorShell } from "./qa-editor-shell";
import { docStats } from "./qa-plain-doc";
import { QaOutlineDrawer } from "./qa-outline-drawer";
import { QaResizeHandle } from "./qa-resize-handle";
import { TableOfContents } from "./table-of-contents";

/**
 * Runs `done` once the smooth scroll has settled. A fixed delay cannot work: the
 * scroll lasts longer the further the heading is, so the animation would play
 * while it is still travelling and be over before the heading arrives.
 */
function afterScroll(node: HTMLElement, done: () => void) {
  const started = performance.now();
  let last = node.getBoundingClientRect().top;
  let stableSince = started;
  const tick = (now: number) => {
    const top = node.getBoundingClientRect().top;
    if (Math.abs(top - last) > 0.5) stableSince = now;
    last = top;
    // Settled for 120ms, or give up after 3s rather than never flashing.
    if (now - stableSince >= 120 || now - started > 3000) done();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Bounce + tint so the reader's eye finds the heading they just jumped to. Runs
 * through the Web Animations API (no stylesheet to keep in sync). Reduced motion
 * keeps only the tint.
 */
function flashHeading(node: HTMLElement) {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tint = "color-mix(in srgb, var(--primary) 30%, transparent)";
  const frame = (offset: number, y: number, bg: string): Keyframe => ({
    offset,
    transform: `translateY(${still ? 0 : y}px)`,
    backgroundColor: bg,
  });
  node.animate(
    [
      frame(0, 0, "transparent"),
      frame(0.2, -8, tint),
      frame(0.4, 0, tint),
      frame(0.55, -4, tint),
      frame(0.7, 0, tint),
      frame(1, 0, "transparent"),
    ],
    { duration: 1200, easing: "ease-out" },
  );
}

/**
 * Step 2: the current outline version in an editor, with its section list beside
 * it. The list is derived and read-only — the backend recomputes it from the
 * content on every write, because a section IS a heading in the document.
 */
const OUTLINE_WIDTH = { initial: 240, min: 240, max: 560 } as const;

export function OutlineStep({
  datasetId,
  generationId,
  generating,
  onStarted,
}: {
  datasetId: string;
  /** The run started from this screen, if any — see `QaDatasetDetail`. */
  generationId?: string;
  generating: boolean;
  onStarted: (generationId: string) => void;
}) {
  const t = useTranslations("admin.qa");
  const outlines = useQaOutlines(datasetId);
  const sources = useQaSources(datasetId);
  const current = outlines.data?.items.find((outline) => outline.isCurrent);
  const detail = useQaOutline(current?.id);
  const setCurrent = useSetCurrentOutline(datasetId);

  if (generating) {
    return <OutlineGenerating chapters={sources.data?.length} />;
  }

  if (outlines.isPending || (!!current && detail.isPending)) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!current || !detail.data) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("ws.outline.empty")}
        </Typography>
        <AnalyzeButton
          datasetId={datasetId}
          disabled={(sources.data?.length ?? 0) === 0}
          onStarted={onStarted}
        />
        <RunOutcome generationId={generationId} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {outlines.data?.versionWarning ? (
        <AlertWarning
          message={t("outlines.versionWarning", {
            count: outlines.data.versionCount,
          })}
        />
      ) : null}
      <RunOutcome generationId={generationId} />
      <OutlineWorkbench
        key={detail.data.id}
        datasetId={datasetId}
        outline={detail.data}
        onStarted={onStarted}
        versionPicker={
          <div className="w-36">
            <Select
              label={t("ws.meta.versionLabel")}
              hideLabel
              size="sm"
              value={current.id}
              disabled={setCurrent.isPending}
              onChange={(event) => setCurrent.mutate(event.target.value)}
              options={(outlines.data?.items ?? []).map((outline) => ({
                value: outline.id,
                label: outline.isCurrent
                  ? `${t("outlines.versionShort", { version: outline.version })} · ${t("ws.outline.active")}`
                  : t("outlines.versionShort", { version: outline.version }),
              }))}
            />
          </div>
        }
      />
    </div>
  );
}

/** Row widths of the placeholder text, so the lines do not form a flat wall. */
const SKELETON_BLOCKS = [
  { title: "w-64", lines: ["w-full", "w-full", "w-3/5"] },
  { title: "w-80", lines: ["w-full", "w-full", "w-3/4"] },
  { title: "w-72", lines: ["w-full", "w-1/2"] },
] as const;
const SKELETON_ROWS = [
  "w-36",
  "w-28 ml-3",
  "w-44",
  "w-32 ml-3",
  "w-32 ml-3",
  "w-28 ml-3",
  "w-40",
];

/**
 * The outline step while a run is writing the next version. The same two-column
 * frame as the workbench, with the content swapped for placeholders, so the
 * layout does not jump when the real editor takes its place.
 */
function OutlineGenerating({ chapters }: { chapters?: number }) {
  const t = useTranslations("admin.qa");
  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]"
      aria-busy="true"
    >
      <section className="flex flex-col gap-4 self-start rounded-lg border border-border bg-surface p-4">
        <Typography variant="title-3" as="h2">
          {t("ws.outline.editor")}
        </Typography>
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2.5 text-primary"
        >
          <Spinner size="sm" />
          <div className="flex flex-col text-foreground">
            <Typography variant="title-4">
              {t("ws.outline.generatingTitle", { count: chapters ?? 0 })}
            </Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              {t("ws.outline.generatingHint")}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col gap-5 rounded-md border border-border bg-background px-4 py-3">
          {SKELETON_BLOCKS.map((block, index) => (
            <div key={index} className="flex flex-col gap-2.5">
              <Skeleton className={`h-6 ${block.title}`} />
              {block.lines.map((width, line) => (
                <Skeleton key={line} className={`h-3.5 ${width}`} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <aside className="flex flex-col gap-1.5 self-start rounded-lg border border-border bg-surface p-3">
        <Typography
          variant="caption"
          className="px-1 pb-1 uppercase text-muted-foreground"
        >
          {t("ws.outline.generatingHeading")}
        </Typography>
        {SKELETON_ROWS.map((width, index) => (
          <div key={index} className="px-2.5 py-2.5">
            <Skeleton className={`h-3.5 ${width}`} />
          </div>
        ))}
      </aside>
    </div>
  );
}

function OutlineWorkbench({
  datasetId,
  outline,
  onStarted,
  versionPicker,
}: {
  datasetId: string;
  outline: QaOutline;
  onStarted: (generationId: string) => void;
  /** The version switcher, shown beside the editor title. */
  versionPicker: React.ReactNode;
}) {
  const t = useTranslations("admin.qa");
  const update = useUpdateQaOutline(outline.id, datasetId);
  // The outline is edited as rich text and converted back to markdown on Save.
  const [doc, setDoc] = useState<BlogDoc>(() =>
    outline.contentFormat === "markdown"
      ? markdownToBlogDoc(outline.content)
      : outline.content,
  );
  const [dirty, setDirty] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState<number>(
    OUTLINE_WIDTH.initial,
  );
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => docStats(doc), [doc]);

  // The sidebar lists the last saved outline while the document may have moved
  // on, so match by title first and fall back to position among the headings.
  // Scroll-spy: the entry whose heading last crossed the top of the editor's
  // scroller. `scroll` does not bubble, so one capturing listener on the document
  // covers the page, the inline editor and the full-screen one alike.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const outlineRef = useRef(outline.outline);
  useEffect(() => {
    outlineRef.current = outline.outline;
  }, [outline.outline]);
  useEffect(() => {
    let frame = 0;
    const measure = (scroller: Element | Document) => {
      const editor =
        scroller instanceof Element
          ? scroller.querySelector(".ProseMirror")
          : document.querySelector(".ProseMirror");
      if (!editor) return;
      const headings = Array.from(
        editor.querySelectorAll<HTMLElement>("h2, h3, h4"),
      );
      if (headings.length === 0) return;
      const top =
        scroller instanceof Element ? scroller.getBoundingClientRect().top : 0;
      const atEnd =
        scroller instanceof Element
          ? scroller.scrollTop + scroller.clientHeight >=
            scroller.scrollHeight - 2
          : false;
      let current = 0;
      headings.forEach((node, position) => {
        if (node.getBoundingClientRect().top - top <= 80) current = position;
      });
      if (atEnd) current = headings.length - 1;
      const title = headings[current].textContent?.trim();
      const entries = outlineRef.current;
      const byTitle = entries.findIndex(
        (entry) => entry.title.trim() === title,
      );
      const index =
        byTitle >= 0 ? byTitle : current < entries.length ? current : null;
      setActiveIndex(index);
    };
    const onScroll = (event: Event) => {
      const target = event.target;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        measure(target instanceof Element ? target : document),
      );
    };
    document.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const scrollToEntry = (index: number, title: string) => {
    const headings = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(
        ".ProseMirror h2, .ProseMirror h3, .ProseMirror h4",
      ) ?? [],
    );
    const target =
      headings.find((node) => node.textContent?.trim() === title.trim()) ??
      headings[index];
    if (!target) return;
    // The stylesheet's 5rem margin is for anchors under a sticky header; here the
    // scroller is the editor itself, so land the heading at its top edge.
    target.style.scrollMarginTop = "0.5rem";
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    afterScroll(target, () => flashHeading(target));
  };

  const save = async () => {
    setError(null);
    try {
      // The editor works on a Tiptap doc, but the outline is stored as markdown.
      await update.mutateAsync({
        contentFormat: "markdown",
        content: blogDocToMarkdown(doc),
      });
      setDirty(false);
      toast.success(t("ws.outline.saved"));
    } catch {
      // Deliberately does not reload: the editor keeps what is on screen so the
      // author can copy it out before pulling the other version in.
      setError(t("ws.outline.saveFailed"));
    }
  };

  // ⌘S / Ctrl+S saves instead of opening the browser's "save page" dialog.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && !update.isPending) void save();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const readMinutes = Math.max(1, Math.ceil(stats.words / 230));
  const wordsValue = stats.words.toLocaleString("en-US");
  const charsValue = stats.characters.toLocaleString("en-US");
  const tokensValue = Math.ceil(
    stats.characters / CHARS_PER_TOKEN,
  ).toLocaleString("en-US");
  const statItems: MetricItem[] = [
    {
      key: "words",
      icon: LUCIDE.fileText,
      iconClass: "text-primary",
      value: wordsValue,
      label: t("ws.outline.metrics.words"),
    },
    {
      key: "characters",
      icon: LUCIDE.type,
      iconClass: "text-brand-500",
      value: charsValue,
      label: t("ws.outline.metrics.characters"),
    },
    {
      key: "tokens",
      icon: LUCIDE.zap,
      iconClass: "text-success",
      value: tokensValue,
      label: t("ws.outline.metrics.tokens"),
    },
    {
      key: "readTime",
      icon: LUCIDE.clock,
      iconClass: "text-warning",
      value: `~${readMinutes}`,
      label: t("ws.outline.metrics.readTime"),
      detail: t("ws.outline.metrics.minutes", { count: readMinutes }),
    },
  ];
  const statusLabel = update.isPending
    ? t("ws.outline.statusSaving")
    : dirty
      ? t("ws.outline.statusUnsaved")
      : t("ws.outline.statusSaved");

  return (
    <div
      ref={rootRef}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_var(--outline-w)]"
      style={{ "--outline-w": `${outlineWidth}px` } as CSSProperties}
    >
      {stats.characters > OUTLINE_CHAR_WARN ? (
        <div className="lg:col-span-2">
          <AlertWarning
            message={t("ws.outline.longWarning", {
              chars: charsValue,
              tokens: tokensValue,
            })}
          />
        </div>
      ) : null}
      <EditorShell
        fullscreenTitle={t("ws.outline.editor")}
        title={
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
            <Typography variant="title-3" as="h2">
              {t("ws.outline.editor")}
            </Typography>
            {versionPicker}
            <Tooltip label={statusLabel}>
              <span
                role="status"
                tabIndex={0}
                aria-label={statusLabel}
                className={`hidden size-5 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex ${
                  dirty || update.isPending ? "text-warning" : "text-success"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-current"
                />
              </span>
            </Tooltip>
          </div>
        }
        onSave={() => void save()}
        saving={update.isPending}
        canSave={dirty}
        error={error}
        fill
        meta={
          <MetricsCard
            title={t("ws.outline.metrics.title")}
            items={statItems}
            className="hidden lg:flex"
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <AnalyzeButton
              compact
              datasetId={datasetId}
              onStarted={onStarted}
            />
            <Tooltip label={`${t("ws.outline.saveChanges")} (⌘S)`}>
              {/* The span takes the hover: a disabled button swallows pointer events. */}
              <span className="inline-flex">
                <Button
                  size="icon-md"
                  disabled={!dirty || update.isPending}
                  aria-label={t("ws.outline.saveChanges")}
                  aria-keyshortcuts="Meta+S Control+S"
                  onClick={() => void save()}
                >
                  <Icon icon={LUCIDE.save} />
                </Button>
              </span>
            </Tooltip>
          </div>
        }
        renderEditor={({ className, fullscreen }) => (
          <TiptapEditor
            value={doc}
            onChange={(value) => {
              setDoc(value);
              setDirty(true);
            }}
            contentClassName={className}
            fullscreen={fullscreen}
          />
        )}
      />

      <QaOutlineDrawer label={t("ws.outline.openDrawer")}>
        <QaResizeHandle
          width={outlineWidth}
          min={OUTLINE_WIDTH.min}
          max={OUTLINE_WIDTH.max}
          label={t("outlines.resize")}
          onChange={setOutlineWidth}
        />
        <TableOfContents
          entries={outline.outline}
          version={outline.version}
          isCurrent={outline.isCurrent}
          onSelect={scrollToEntry}
          activeIndex={activeIndex}
          className="h-full overflow-y-auto"
        />
      </QaOutlineDrawer>
      {update.isError ? (
        <AlertError message={t("ws.outline.saveFailed")} />
      ) : null}
    </div>
  );
}
