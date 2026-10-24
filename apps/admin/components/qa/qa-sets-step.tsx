"use client";

import { useLocale, useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import {
  useApproveQaSets,
  useArchiveQaSets,
  useDeleteQaItem,
  useQaOutline,
  useQaSet,
  useQaSets,
  useRenameQaSets,
  useUpdateQaItem,
  type QaItemFull,
  type QaOutlineEntry,
  type QaReviewStatus,
  type QaSet,
} from "@noalhub/api/qa";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { AlertError } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { DropdownMenu, DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS, LUCIDE } from "@noalhub/ui/icons";
import { InlineTextField } from "@noalhub/ui/inline-text-field";
import { MetricsCard } from "@noalhub/ui/metrics-card";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Spinner } from "@noalhub/ui/spinner";
import { Toggle } from "@noalhub/ui/toggle";
import { toast } from "@noalhub/ui/toast";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { GenerateSetsButton } from "./generate-sets-button";
import { useFitHeight } from "./use-fit-height";
import { RunOutcome } from "./generation-progress";
import { useOutlineVersion } from "./use-outline-version";
import { PostContentPreview } from "./post-content-preview";
import { QaReviewQuestion } from "./qa-review-question";

type Section = {
  key: string;
  title: string;
  entry?: QaOutlineEntry;
  /** Version of the outline the sets came from; `null` for a hand-written set. */
  version: number | null;
  sets: QaSet[];
};

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const;

/**
 * Step 3: the questions the model drafted, one outline section at a time. Nothing is
 * listed at first — a single Generate button opens the run dialog (prompt, AI key and
 * model) and, once confirmed, drafts the first section. Each later run drafts the next
 * section, which then appears below with its questions. Every question is reviewed
 * here — approve, reject or delete; only approved ones move on to the final set.
 */
export function SetsStep({
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
  // The outline version the sections come from and new questions are generated against.
  // Opens on the newest; the picker only changes which one is used.
  const { outlines, items: versions, latest } = useOutlineVersion(datasetId);
  const current = latest;
  const detail = useQaOutline(current?.id);
  const sets = useQaSets({ datasetId });
  const [closed, setClosed] = useState<Set<string>>(new Set());
  // Sections toggled at least once: their body stays mounted so collapsing can animate.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Section | null>(null);
  const approveAll = useApproveQaSets();
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [view, setView] = useState<"full" | "hover">("full");
  const listRef = useFitHeight<HTMLDivElement>();

  if (outlines.isPending || sets.isPending || (!!current && detail.isPending)) {
    return <Skeleton className="h-64 w-full" />;
  }

  // Every live set is listed — drafts and published final sets alike, archived ones
  // never — whichever outline version it came from; a seeded or hand-written set may
  // have none. Sections of the current outline come first, in
  // outline order; only those that hold questions are drawn.
  const draftSets = (sets.data ?? []).filter(
    (set) => set.status !== "archived",
  );
  const sections: Section[] = [];
  const byKey = new Map<string, Section>();
  const ensure = (
    key: string,
    title: string,
    version: number | null,
    entry?: QaOutlineEntry,
  ): Section => {
    let section = byKey.get(key);
    if (!section) {
      section = { key, title, entry, version, sets: [] };
      byKey.set(key, section);
      sections.push(section);
    }
    return section;
  };
  for (const entry of detail.data?.outline ?? [])
    ensure(
      `${current?.id}:${entry.anchor}`,
      entry.title,
      current?.version ?? null,
      entry,
    );
  // Every generation stays listed: the same section drafted against two outline
  // versions is two sections, each tagged with its version.
  for (const set of draftSets) {
    const key = `${set.outlineId ?? "none"}:${set.sectionAnchor ?? set.id}`;
    const version =
      versions.find((outline) => outline.id === set.outlineId)?.version ?? null;
    ensure(key, set.sectionTitle ?? set.title, version).sets.push(set);
  }

  // Most recently changed first: a section is as fresh as its freshest set.
  const touchedAt = (section: Section) =>
    Math.max(
      ...section.sets.map((set) => Date.parse(set.updatedAt ?? set.createdAt)),
    );
  const generated = sections
    .filter((section) => section.sets.length > 0)
    .sort((a, b) => touchedAt(b) - touchedAt(a));
  const pending = sections.filter(
    (section) => section.sets.length === 0 && section.entry,
  );
  const next = pending[0]?.entry;
  // Not an order to follow: the dialog lists the whole outline and any section can be
  // picked, again too. The first section without questions is only the suggestion.
  const generateNext = current ? (
    <GenerateSetsButton
      datasetId={datasetId}
      outlineId={current.id}
      sections={detail.data?.outline ?? []}
      defaultAnchor={next?.anchor}
      label={generated.length === 0 ? undefined : t("ws.sets.more")}
      iconOnly
      onStarted={onStarted}
    />
  ) : null;

  // Before the first section is drafted the empty state stands in for the list; while
  // that first run is writing, the header bar is already there with only the action —
  // the count, view and fold controls appear once there is data to act on.
  const firstRun = generated.length === 0 && generating;
  if (generated.length === 0 && !generating) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-12">
        <Icon icon={LUCIDE.sparkles} className="size-6" />
        <Typography
          variant="body-3"
          className="text-center text-muted-foreground"
        >
          {t("ws.sets.empty")}
        </Typography>
        {/* The outline version is picked inside the dialog. */}
        {generateNext}
        <RunOutcome generationId={generationId} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Typography variant="title-3" as="h2">
            {t("ws.sets.heading")}
          </Typography>
          {firstRun ? null : (
            <Badge size="sm">
              {t("ws.sets.setCount", { count: draftSets.length })}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {firstRun ? null : (
            <>
              <Toggle
                variant="outline"
                aria-label={t("ws.sets.viewMode")}
                value={view}
                onValueChange={setView}
                options={[
                  {
                    value: "full",
                    icon: LUCIDE.listChecks,
                    label: t("ws.sets.viewFull"),
                  },
                  {
                    value: "hover",
                    icon: LUCIDE.mousePointerClick,
                    label: t("ws.sets.viewHover"),
                  },
                ]}
              />
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <div className="inline-flex divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface">
                <Tooltip label={t("ws.sets.expandAll")}>
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="size-7! rounded-none!"
                    aria-label={t("ws.sets.expandAll")}
                    onClick={() => setClosed(new Set())}
                  >
                    <Icon icon={LUCIDE.chevronsUpDown} />
                  </Button>
                </Tooltip>
                <Tooltip label={t("ws.sets.collapseAll")}>
                  <Button
                    variant="ghost"
                    size="icon-md"
                    className="size-7! rounded-none!"
                    aria-label={t("ws.sets.collapseAll")}
                    onClick={() =>
                      setClosed(
                        new Set(generated.map((section) => section.key)),
                      )
                    }
                  >
                    <Icon icon={LUCIDE.chevronsDownUp} />
                  </Button>
                </Tooltip>
              </div>
            </>
          )}
          {generateNext}
        </div>
      </div>
      {firstRun ? <SetsGenerating /> : null}
      <RunOutcome generationId={generationId} />
      {firstRun ? null : (
        <div
          ref={listRef}
          className="flex max-h-[var(--fit-h,70vh)] min-h-0 flex-col gap-2 overflow-y-auto"
        >
          {/* Inside the scroller: outside it the placeholder pushed the list down and
            the earlier sets could not be reached while a run was going. */}
          {generating ? (
            <div className="shrink-0">
              <SetsGenerating inline />
            </div>
          ) : null}
          {generated.map((section) => {
            const group = section.sets;
            const total = group.reduce((sum, set) => sum + set.itemCount, 0);
            const approved = group.reduce(
              (sum, set) => sum + set.approvedCount,
              0,
            );
            const expanded = !closed.has(section.key);
            return (
              <div
                key={section.key}
                className="flex max-h-[var(--fit-h,70vh)] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-muted"
              >
                <div className="flex shrink-0 items-center gap-3 pr-3">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={section.title}
                    onClick={() => {
                      setOpened((prev) => new Set(prev).add(section.key));
                      setClosed((prev) => {
                        const nextClosed = new Set(prev);
                        if (expanded) nextClosed.add(section.key);
                        else nextClosed.delete(section.key);
                        return nextClosed;
                      });
                    }}
                    className="py-3 pl-4"
                  >
                    <Icon
                      icon={expanded ? ICONS.chevronDown : ICONS.chevronRight}
                      animate="snappy"
                      className="size-4 shrink-0"
                    />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <SectionTitleField
                        sets={group}
                        title={group[0]?.title ?? section.title}
                      />
                    </div>
                    {section.version !== null ? (
                      <Badge
                        size="sm"
                        className="shrink-0 self-start sm:self-center"
                      >
                        {t("outlines.versionShort", {
                          version: section.version,
                        })}
                      </Badge>
                    ) : null}
                    <SectionMetrics
                      createdAt={group
                        .map((set) => set.createdAt)
                        .reduce((a, b) => (a < b ? a : b))}
                      total={total}
                      approved={approved}
                    />
                  </div>
                  {approved < total ? (
                    <Tooltip label={t("ws.sets.approveSection")}>
                      <Button
                        variant="outline"
                        size="icon-md"
                        aria-label={t("ws.sets.approveSection")}
                        disabled={approveAll.isPending}
                        loading={approvingKey === section.key}
                        onClick={() => {
                          setApprovingKey(section.key);
                          approveAll.mutate(
                            group.map((set) => set.id),
                            {
                              onSettled: () => setApprovingKey(null),
                            },
                          );
                        }}
                      >
                        {approvingKey === section.key ? null : <Icon icon={ICONS.check} />}
                      </Button>
                    </Tooltip>
                  ) : null}
                  <Tooltip label={t("ws.sets.removeSection")}>
                    <Button
                      variant="outline"
                      size="icon-md"
                      aria-label={t("ws.sets.removeSection")}
                      onClick={() => setRemoving(section)}
                    >
                      <Icon icon={ICONS.delete} />
                    </Button>
                  </Tooltip>
                </div>
                <div
                  aria-hidden={!expanded}
                  inert={!expanded}
                  className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    {/* Mount lazily so collapsed sections do not fetch, then keep mounted to animate out. */}
                    {expanded || opened.has(section.key) ? (
                      <div
                        data-qa-scroll
                        className="flex max-h-[calc(var(--fit-h,70vh)-4rem)] min-h-0 flex-col gap-3 overflow-y-auto border-t border-border p-3"
                      >
                        {group.map((set) => (
                          <ReviewSet
                            key={set.id}
                            set={set}
                            revealOnHover={view === "hover"}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {removing ? (
        <RemoveSectionDialog
          section={removing}
          onClose={() => setRemoving(null)}
        />
      ) : null}
    </section>
  );
}

/** The section name, edited in place: written onto every set of the section. */
function SectionTitleField({ sets, title }: { sets: QaSet[]; title: string }) {
  const t = useTranslations("admin.qa");
  const rename = useRenameQaSets();
  return (
    <InlineTextField
      value={title}
      placeholder={t("sources.untitled")}
      label={t("ws.sets.sectionTitle")}
      onSubmit={async (next) => {
        if (next === "") throw new Error("empty");
        try {
          await rename.mutateAsync({
            sets: sets.map((set) => ({ id: set.id, version: set.version })),
            title: next,
          });
        } catch (error) {
          toast.error(t("ws.sets.renameFailed"));
          throw error;
        }
      }}
    />
  );
}

function RemoveSectionDialog({
  section,
  onClose,
}: {
  section: Section;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const archive = useArchiveQaSets();
  const [failed, setFailed] = useState(0);

  const confirm = async () => {
    const failedIds = await archive.mutateAsync(
      section.sets.map((set) => ({ id: set.id, version: set.version })),
    );
    // Stay open on a partial failure so the count is read, not silently lost.
    if (failedIds.length === 0) onClose();
    else setFailed(failedIds.length);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("ws.sets.removeTitle", { title: section.title })}
    >
      <div className="space-y-4">
        <Typography variant="body-3" className="opacity-70">
          {t("ws.sets.removeIntro")}
        </Typography>
        {failed > 0 ? (
          <AlertError message={t("ws.sets.removeFailed", { count: failed })} />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={archive.isPending}
            onClick={() => void confirm()}
          >
            {t("ws.sets.removeConfirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Row widths of the placeholder question card. A run drafts one section at a time, so one card. */
const SKELETON_CARDS = [
  { title: "w-3/5", options: ["w-full", "w-full", "w-full", "w-full"] },
] as const;

/**
 * The questions step while a run is writing the next section. The same frame as the
 * real list — a section card holding question cards — with the content swapped for
 * placeholders, so nothing jumps when the questions arrive. `inline` is the run
 * that comes after earlier sections: only the new section card, below them.
 */
function SetsGenerating({ inline = false }: { inline?: boolean }) {
  const t = useTranslations("admin.qa");
  const body = (
    <div className="flex flex-col gap-3" aria-busy="true">
      {/* Inline, the step tile already carries the spinner: the banner would only
          cost a row above the sets, so it stays screen-reader only. */}
      {inline ? (
        <span role="status" className="sr-only">
          {t("ws.sets.generatingTitle")}
        </span>
      ) : (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2.5 text-primary"
        >
          <Spinner size="sm" />
          <div className="flex flex-col text-foreground">
            <Typography variant="title-4">
              {t("ws.sets.generatingTitle")}
            </Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              {t("ws.sets.generatingHint")}
            </Typography>
          </div>
        </div>
      )}
      {/* The same frame as a drafted section: header row, then the question cards. */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-muted">
        <div className="flex items-center gap-3 py-3 pr-3 pl-4">
          <Skeleton className="size-4 shrink-0" />
          <Skeleton className="h-5 w-2/5" />
          <span className="flex-1" />
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="size-9 shrink-0 rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-3">
          {SKELETON_CARDS.map((card, index) => (
            <div
              key={index}
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4"
            >
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className={`h-5 ${card.title}`} />
              {card.options.map((width, option) => (
                <Skeleton key={option} className={`h-9 ${width}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (inline) return body;
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <Typography variant="title-3" as="h2">
        {t("ws.sets.generatingHeading")}
      </Typography>
      {body}
    </section>
  );
}

function ReviewSet({
  set,
  revealOnHover,
}: {
  set: QaSet;
  revealOnHover: boolean;
}) {
  const t = useTranslations("admin.qa");
  const detail = useQaSet(set.id);
  const update = useUpdateQaItem(set.id);
  const remove = useDeleteQaItem(set.id);

  // A set can hold hundreds of questions after a chunked run, so only the rows near the
  // viewport are mounted. The scroll element is the section body that holds every set of
  // the section (marked `data-qa-scroll`); `scrollMargin` is where this list starts inside
  // it, because the intro card sits above and other sets may sit above that.
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const itemCount = detail.data?.items.length ?? 0;
  const hasHeader = !!(detail.data?.description || detail.data?.intro);

  useLayoutEffect(() => {
    const list = listRef.current;
    const scroller = list?.closest<HTMLElement>("[data-qa-scroll]") ?? null;
    setScrollEl(scroller);
    if (!list || !scroller) return;
    setScrollMargin(
      list.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop,
    );
  }, [itemCount, hasHeader]);

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => scrollEl,
    estimateSize: () => 180,
    gap: 12,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => detail.data?.items[index]?.id ?? index,
  });

  // The shape is the set's own: one prompt can now produce several.
  const shape = set.questionType
    ? t(
        `templates.shapes.${set.questionType}` as "templates.shapes.multiple_choice",
      )
    : "";

  if (detail.isPending) return <Skeleton className="h-32 w-full" />;
  if (detail.isError) return <AlertError message={t("ws.sets.loadFailed")} />;

  const review = (item: QaItemFull, reviewStatus: QaReviewStatus) =>
    update.mutate({ id: item.id, input: { reviewStatus } });

  return (
    <>
      {detail.data.description || detail.data.intro ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <Typography variant="title-4">{detail.data.title}</Typography>
          {detail.data.description ? (
            <Typography variant="body-3" className="text-muted-foreground">
              {detail.data.description}
            </Typography>
          ) : null}
          {detail.data.intro ? (
            <PostContentPreview doc={detail.data.intro} />
          ) : null}
        </div>
      ) : null}
      <div
        ref={listRef}
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const item = detail.data.items[row.index];
          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <QaReviewQuestion
                item={item}
                index={row.index}
                shapeLabel={shape}
                revealOnHover={revealOnHover}
                actions={
                  <>
                    <Badge tone={STATUS_TONE[item.reviewStatus]} size="sm">
                      {t(`ws.sets.${item.reviewStatus}`)}
                    </Badge>
                    <DropdownMenu
                      compact
                      trigger={
                        <Button
                          variant="outline"
                          size="icon-md"
                          aria-label={t("ws.sets.actions")}
                        >
                          <Icon icon={ICONS.more} />
                        </Button>
                      }
                    >
                      {item.reviewStatus !== "approved" ? (
                        <DropdownMenuItem
                          icon={ICONS.check}
                          disabled={update.isPending}
                          onSelect={() => review(item, "approved")}
                        >
                          {t("ws.sets.approve")}
                        </DropdownMenuItem>
                      ) : null}
                      {item.reviewStatus !== "rejected" ? (
                        <DropdownMenuItem
                          icon={ICONS.close}
                          disabled={update.isPending}
                          onSelect={() => review(item, "rejected")}
                        >
                          {t("ws.sets.reject")}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        icon={ICONS.delete}
                        tone="danger"
                        disabled={remove.isPending}
                        onSelect={() => remove.mutate(item.id)}
                      >
                        {t("ws.sets.delete")}
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </>
                }
              />
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * Icon + figure chips for one section, with the full breakdown in a hover card — the
 * same pattern as the outline metrics, so the two steps read alike.
 */
function SectionMetrics({
  createdAt,
  total,
  approved,
}: {
  createdAt: string;
  total: number;
  approved: number;
}) {
  const t = useTranslations("admin.qa");
  const locale = useLocale();
  const df = useDateFormat();
  const short = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(createdAt));

  return (
    <MetricsCard
      title={t("ws.sets.metrics.title")}
      className="flex"
      items={[
        {
          key: "created",
          icon: LUCIDE.calendarClock,
          iconClass: "text-primary",
          value: short,
          label: t("ws.sets.metrics.created"),
          detail: df.dateTime(createdAt),
        },
        {
          key: "questions",
          icon: LUCIDE.listChecks,
          iconClass: "text-brand-500",
          value: String(total),
          label: t("ws.sets.metrics.questions"),
        },
        {
          key: "approved",
          icon: LUCIDE.circleCheck,
          iconClass:
            approved === total && total > 0 ? "text-success" : "text-warning",
          value: `${approved}/${total}`,
          label: t("ws.sets.metrics.approved"),
          detail: t("ws.sets.approvedOf", { approved, total }),
        },
      ]}
    />
  );
}
