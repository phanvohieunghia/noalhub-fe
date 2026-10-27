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
  useQaSources,
  useUpdateQaOutline,
  type QaOutline,
} from "@noalhub/api/qa";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { ICONS, Icon, LUCIDE } from "@noalhub/ui/icons";
import { MetricsCard, type MetricItem } from "@noalhub/ui/metrics-card";
import {
  blogDocToMarkdown,
  markdownToBlogDoc,
} from "@noalhub/ui/blog/markdown-editor";
import { TiptapEditor } from "@noalhub/ui/blog/tiptap-editor";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Spinner } from "@noalhub/ui/spinner";
import { toast } from "@noalhub/ui/toast";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { AnalyzeButton } from "./analyze-button";
import { RunOutcome } from "./generation-progress";
import { EditorShell } from "./qa-editor-shell";
import { OutlineLabelField } from "./outline-label-field";
import { docStats } from "./qa-plain-doc";
import { QaOutlineDrawer } from "./qa-outline-drawer";
import { QaResizeHandle } from "./qa-resize-handle";
import {
  OutlineVersionMenu,
  OutlineVersionSelect,
  PENDING_VERSION,
  useOutlineVersion,
} from "./use-outline-version";
import { TableOfContents } from "./table-of-contents";
import { findOutlineHeading, useOutlineScrollSpy } from "./use-outline-scroll-spy";

const WARNING_AUTO_CLOSE_MS = 3000;

/**
 * Info icon beside the metrics that carries the "document too long" warning in a
 * tooltip. It opens by itself when it first mounts so the warning is not missed,
 * then falls back to hover / focus.
 */
function LongDocWarning({ message }: { message: string }) {
  const [auto, setAuto] = useState(true);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAuto(false), WARNING_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Tooltip label={message} side="bottom" open={auto || hovered} onOpenChange={setHovered}>
      <span
        role="img"
        tabIndex={0}
        aria-label={message}
        className="flex size-6 items-center justify-center rounded-full text-warning outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon icon={ICONS.info} className="size-5" />
      </span>
    </Tooltip>
  );
}

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
  const sources = useQaSources(datasetId);
  // Opens on the newest version; the picker only changes which one is on screen.
  const { outlines, latest, selected, picked, select } =
    useOutlineVersion(datasetId);
  const detail = useQaOutline(selected?.id);

  // A run in flight is one more entry in the picker, not a takeover of the step: the
  // finished versions stay reachable, and only the pending one shows the placeholders.
  const viewingPending =
    generating && (picked === null || picked === PENDING_VERSION);
  const pendingVersion = generating ? (latest?.version ?? 0) + 1 : undefined;
  const handleStarted = (id: string) => {
    select(PENDING_VERSION);
    onStarted(id);
  };

  if (viewingPending) {
    return (
      <OutlineGenerating
        chapters={sources.data?.length}
        versionPicker={
          <OutlineVersionSelect
            items={outlines.data?.items ?? []}
            value={PENDING_VERSION}
            pendingVersion={pendingVersion}
            onChange={select}
            className="w-28"
          />
        }
      />
    );
  }

  if (outlines.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Empty only when there is nothing to show at all: a version that is still loading
  // keeps the workbench on screen.
  if (!selected || (!detail.data && !detail.isPending)) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("ws.outline.empty")}
        </Typography>
        <AnalyzeButton
          datasetId={datasetId}
          disabled={(sources.data?.length ?? 0) === 0}
          onStarted={handleStarted}
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
        datasetId={datasetId}
        // The badge in the section list marks the newest version.
        outline={
          detail.data
            ? { ...detail.data, isCurrent: detail.data.id === latest?.id }
            : undefined
        }
        onStarted={handleStarted}
        versionPicker={
          <>
            <OutlineVersionSelect
              items={outlines.data?.items ?? []}
              pendingVersion={pendingVersion}
              value={selected.id}
              onChange={select}
              className="w-28"
            />
          </>
        }
        versionMenu={
          <OutlineVersionMenu
            datasetId={datasetId}
            outline={selected}
            versionCount={outlines.data?.items.length ?? 0}
            onDeleted={() => select(null)}
          />
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
function OutlineGenerating({
  chapters,
  versionPicker,
}: {
  chapters?: number;
  versionPicker: React.ReactNode;
}) {
  const t = useTranslations("admin.qa");
  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]"
      aria-busy="true"
    >
      <section className="flex flex-col gap-4 self-start rounded-lg border border-border bg-surface p-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
          <Typography variant="title-3" as="h2">
            {t("ws.outline.editor")}
          </Typography>
          {versionPicker}
        </div>
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2.5 text-primary"
        >
          <Spinner size="sm" />
          <div className="flex flex-col text-foreground">
            <Typography variant="title-4">
              {t("ws.outline.generatingTitle", { count: chapters ?? 0 })}
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

function toDoc(outline: QaOutline | undefined): BlogDoc {
  if (!outline) return markdownToBlogDoc("");
  return outline.contentFormat === "markdown"
    ? markdownToBlogDoc(outline.content)
    : outline.content;
}

/** Placeholder for the editor while a version loads; same box as the real one. */
function EditorSkeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-busy="true" className={`flex flex-col gap-3 p-4 ${className}`}>
      <Skeleton className="h-8 w-2/3" />
      {SKELETON_BLOCKS.map((block, index) => (
        <div key={index} className="mt-3 flex flex-col gap-2">
          <Skeleton className={`h-5 ${block.title}`} />
          {block.lines.map((width, line) => (
            <Skeleton key={line} className={`h-3.5 ${width}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder for the section list while a version loads. */
function TocSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3 p-3">
      {SKELETON_ROWS.map((width, index) => (
        <Skeleton key={index} className={`h-4 ${width}`} />
      ))}
    </div>
  );
}

function OutlineWorkbench({
  datasetId,
  outline,
  onStarted,
  versionPicker,
  versionMenu,
}: {
  datasetId: string;
  /** `undefined` while a version is loading: the editor and section list show placeholders. */
  outline: QaOutline | undefined;
  onStarted: (generationId: string) => void;
  /** The version switcher, shown beside the editor title. */
  versionPicker: React.ReactNode;
  /** Actions on that version, shown beside Save so the destructive one is not by the picker. */
  versionMenu: React.ReactNode;
}) {
  const t = useTranslations("admin.qa");
  const [loadedId, setLoadedId] = useState<string | undefined>(outline?.id);
  const update = useUpdateQaOutline(loadedId ?? "", datasetId);
  // The outline is edited as rich text and converted back to markdown on Save.
  const [doc, setDoc] = useState<BlogDoc>(() => toDoc(outline));
  const [dirty, setDirty] = useState(false);
  // A different version arrived: swap the document in place. Adjusting state while
  // rendering (rather than remounting the workbench) is what keeps the header, the
  // picker and the layout on screen across a switch.
  if (outline && outline.id !== loadedId) {
    setLoadedId(outline.id);
    setDoc(toDoc(outline));
    setDirty(false);
  }
  const loading = !outline || outline.id !== loadedId;
  const [outlineWidth, setOutlineWidth] = useState<number>(
    OUTLINE_WIDTH.initial,
  );
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => docStats(doc), [doc]);

  const activeIndex = useOutlineScrollSpy(outline?.outline);

  const scrollToEntry = (index: number) => {
    const headings = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(
        ".ProseMirror h2, .ProseMirror h3, .ProseMirror h4",
      ) ?? [],
    );
    const target = findOutlineHeading(headings, outline?.outline ?? [], index);
    if (!target) return;
    // The stylesheet's 5rem margin is for anchors under a sticky header; here the
    // scroller is the editor itself, so land the heading at its top edge.
    target.style.scrollMarginTop = "0.5rem";
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    afterScroll(target, () => flashHeading(target));
  };

  // Counts saves so the editor can drop the change highlights of what was just saved.
  const [savedCount, setSavedCount] = useState(0);

  const save = async () => {
    if (loading) return;
    setError(null);
    try {
      // The editor works on a Tiptap doc, but the outline is stored as markdown.
      await update.mutateAsync({
        contentFormat: "markdown",
        content: blogDocToMarkdown(doc),
      });
      setDirty(false);
      setSavedCount((count) => count + 1);
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
      value: loading ? "—" : wordsValue,
      label: t("ws.outline.metrics.words"),
    },
    {
      key: "characters",
      icon: LUCIDE.type,
      iconClass: "text-brand-500",
      value: loading ? "—" : charsValue,
      label: t("ws.outline.metrics.characters"),
    },
    {
      key: "tokens",
      icon: LUCIDE.zap,
      iconClass: "text-success",
      value: loading ? "—" : tokensValue,
      label: t("ws.outline.metrics.tokens"),
    },
    {
      key: "readTime",
      icon: LUCIDE.clock,
      iconClass: "text-warning",
      value: loading ? "—" : `~${readMinutes}`,
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
      <EditorShell
        fullscreenTitle={outline?.label ?? t("ws.outline.editor")}
        title={
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
            {outline ? (
              <OutlineLabelField
                datasetId={datasetId}
                outlineId={outline.id}
                label={outline.label}
              />
            ) : (
              <Typography variant="title-3" as="h2">
                {t("ws.outline.editor")}
              </Typography>
            )}
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
        canSave={dirty && !loading}
        error={error}
        fill
        meta={
          <div className="hidden items-center gap-2 lg:flex">
            {!loading && stats.characters > OUTLINE_CHAR_WARN ? (
              <LongDocWarning
                message={t("ws.outline.longWarning", {
                  chars: stats.characters,
                  tokens: tokensValue,
                })}
              />
            ) : null}
            <MetricsCard
              title={t("ws.outline.metrics.title")}
              items={statItems}
              className="hidden lg:flex"
            />
          </div>
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
                  disabled={!dirty} loading={update.isPending}
                  aria-label={t("ws.outline.saveChanges")}
                  aria-keyshortcuts="Meta+S Control+S"
                  onClick={() => void save()}
                >
                  <Icon icon={LUCIDE.save} />
                </Button>
              </span>
            </Tooltip>
            {versionMenu}
          </div>
        }
        renderEditor={({ className, fullscreen }) =>
          loading ? (
            <EditorSkeleton className={className} />
          ) : (
            <TiptapEditor
              // The editor reads `value` on mount only; a cached version swaps in
              // without passing through the skeleton, so remount per version.
              key={loadedId}
              value={doc}
              onChange={(value) => {
                setDoc(value);
                setDirty(true);
              }}
              contentClassName={className}
              fullscreen={fullscreen}
              savedKey={savedCount}
            />
          )
        }
      />

      <QaOutlineDrawer label={t("ws.outline.openDrawer")}>
        <QaResizeHandle
          width={outlineWidth}
          min={OUTLINE_WIDTH.min}
          max={OUTLINE_WIDTH.max}
          label={t("outlines.resize")}
          onChange={setOutlineWidth}
        />
        {outline && !loading ? (
          <TableOfContents
            entries={outline.outline}
            version={outline.version}
            isCurrent={outline.isCurrent}
            onSelect={scrollToEntry}
            activeIndex={activeIndex}
            className="h-full overflow-y-auto"
          />
        ) : (
          <TocSkeleton />
        )}
      </QaOutlineDrawer>
      {update.isError ? (
        <AlertError message={t("ws.outline.saveFailed")} />
      ) : null}
    </div>
  );
}
